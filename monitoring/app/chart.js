import { state } from './store.js';
import { getChannelDaily, getVisibleDailyData } from './metrics.js';
import { chartPalette } from './theme.js';
import { formatDateLabel } from './utils.js';

function getChartSeries() {
  const points = state.chartChannel === 'all' ? getVisibleDailyData() : getChannelDaily(state.chartChannel).slice(-state.periodDays);
  if (state.chartMode === 'traffic') {
    return {
      points,
      left: points.map((p) => p.spend),
      right: points.map((p) => p.clicks),
      leftLabel: 'Расход',
      rightLabel: 'Клики',
      leftFormatter: (val) => `${Math.round(val / 1000)}k`,
      rightFormatter: (val) => Math.round(val)
    };
  }
  const converted = points.map((p, i) => {
    const conv = Math.max(1, Math.round(p.clicks * (0.17 + Math.sin(i / 2.7) * 0.03)));
    return { ...p, conv, cpa: conv ? p.spend / conv : 0 };
  });
  return {
    points: converted,
    left: converted.map((p) => p.conv),
    right: converted.map((p) => p.cpa),
    leftLabel: 'Конверсии',
    rightLabel: 'CPA',
    leftFormatter: (val) => Math.round(val),
    rightFormatter: (val) => `${Math.round(val)}₽`
  };
}

export function drawChart() {
  const canvas = document.getElementById('chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cssW = canvas.clientWidth || 900;
  const cssH = canvas.clientHeight || 260;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pad = { l: 52, r: 52, t: 22, b: 34 };
  const plotW = cssW - pad.l - pad.r;
  const plotH = cssH - pad.t - pad.b;
  const chart = getChartSeries();
  const maxLeft = Math.max(...chart.left) * 1.08;
  const maxRight = Math.max(...chart.right) * 1.12;
  const palette = chartPalette();

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.strokeStyle = palette.grid;
  for (let i = 0; i <= 5; i += 1) {
    const y = pad.t + (plotH * i) / 5;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + plotW, y);
    ctx.stroke();
  }

  ctx.fillStyle = palette.axis;
  ctx.font = '12px ui-sans-serif';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 5; i += 1) {
    const y = pad.t + (plotH * i) / 5;
    ctx.textAlign = 'left';
    ctx.fillText(chart.leftFormatter(maxLeft - (maxLeft * i) / 5), 10, y);
    ctx.textAlign = 'right';
    ctx.fillText(chart.rightFormatter(maxRight - (maxRight * i) / 5), cssW - 10, y);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < chart.points.length; i += 2) {
    const x = pad.l + (plotW * i) / (chart.points.length - 1);
    ctx.fillText(formatDateLabel(chart.points[i].date), x - 12, cssH - 10);
  }

  const xAt = (i) => pad.l + (plotW * i) / (chart.points.length - 1);
  const yLeft = (v) => pad.t + plotH - (plotH * v) / maxLeft;
  const yRight = (v) => pad.t + plotH - (plotH * v) / maxRight;
  const barW = (plotW / chart.points.length) * 0.55;

  ctx.fillStyle = palette.bars;
  chart.left.forEach((v, i) => ctx.fillRect(xAt(i) - barW / 2, yLeft(v), barW, pad.t + plotH - yLeft(v)));
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  chart.right.forEach((v, i) => (i ? ctx.lineTo(xAt(i), yRight(v)) : ctx.moveTo(xAt(i), yRight(v))));
  ctx.stroke();
  ctx.fillStyle = palette.line;
  chart.right.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(xAt(i), yRight(v), 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = palette.legend;
  const channelLabel = state.chartChannel === 'all' ? 'все каналы' : state.chartChannel === 'search' ? 'поиск' : 'РСЯ';
  ctx.fillText(`▮ ${chart.leftLabel} (${channelLabel})`, pad.l, 16);
  ctx.fillStyle = palette.line;
  ctx.fillText(`— ${chart.rightLabel} (правая шкала)`, pad.l + 210, 16);
}
