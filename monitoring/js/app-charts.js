import { state, getVisibleDailyData, chartPalette } from './app-core.js';
import { getChannelDaily } from './app-kpi.js';
function formatDateLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

function getChartSeries() {
  const source = state.chartChannel === "all" ? getVisibleDailyData() : getChannelDaily(state.chartChannel).slice(-state.periodDays);
  const points = source;
  if (state.chartMode === "traffic") {
    return {
      points,
      left: points.map((p) => p.spend),
      right: points.map((p) => p.clicks),
      leftLabel: "Расход",
      rightLabel: "Клики",
      leftFormatter: (val) => Math.round(val / 1000) + "k",
      rightFormatter: (val) => Math.round(val)
    };
  }

  const converted = points.map((p, index) => {
    const wave = 0.17 + Math.sin(index / 2.7) * 0.03;
    const conv = Math.max(1, Math.round(p.clicks * wave));
    const cpa = conv ? (p.spend / conv) : 0;
    return { ...p, conv, cpa };
  });

  return {
    points: converted,
    left: converted.map((p) => p.conv),
    right: converted.map((p) => p.cpa),
    leftLabel: "Конверсии",
    rightLabel: "CPA",
    leftFormatter: (val) => Math.round(val),
    rightFormatter: (val) => Math.round(val) + "₽"
  };
}

function drawChart() {
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  const cssW = canvas.clientWidth || 900;
  const cssH = canvas.clientHeight || 260;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = cssW, h = cssH;
  const pad = { l: 52, r: 52, t: 22, b: 34 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  const chart = getChartSeries();
  const points = chart.points;
  const leftSeries = chart.left;
  const rightSeries = chart.right;
  const maxLeft = Math.max(...leftSeries) * 1.08;
  const maxRight = Math.max(...rightSeries) * 1.12;

  const palette = chartPalette();

  // bg
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);

  // grid
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  const gridY = 5;
  for (let i = 0; i <= gridY; i++) {
    const y = pad.t + (plotH * i) / gridY;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + plotW, y);
    ctx.stroke();
  }

  // axes labels
  ctx.fillStyle = palette.axis;
  ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  // left axis (spend, k)
  for (let i = 0; i <= gridY; i++) {
    const y = pad.t + (plotH * i) / gridY;
    const val = maxLeft - (maxLeft * i) / gridY;
    ctx.fillText(chart.leftFormatter(val), 10, y);
  }

  // right axis (clicks)
  ctx.textAlign = "right";
  for (let i = 0; i <= gridY; i++) {
    const y = pad.t + (plotH * i) / gridY;
    const val = maxRight - (maxRight * i) / gridY;
    ctx.fillText(chart.rightFormatter(val), w - 10, y);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // x labels
  for (let i = 0; i < points.length; i += 2) {
    const x = pad.l + (plotW * i) / (points.length - 1);
    ctx.fillText(formatDateLabel(points[i].date), x - 12, h - 10);
  }

  const xAt = (i) => pad.l + (plotW * i) / (points.length - 1);
  const yLeft = (v) => pad.t + plotH - (plotH * v) / maxLeft;
  const yRight = (v) => pad.t + plotH - (plotH * v) / maxRight;

  // spend bars
  const barW = (plotW / points.length) * 0.55;
  ctx.fillStyle = palette.bars;
  for (let i = 0; i < points.length; i++) {
    const x = xAt(i) - barW / 2;
    const y = yLeft(leftSeries[i]);
    const bh = pad.t + plotH - y;
    ctx.fillRect(x, y, barW, bh);
  }

  // clicks line
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = xAt(i);
    const y = yRight(rightSeries[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // points
  ctx.fillStyle = palette.line;
  for (let i = 0; i < points.length; i++) {
    const x = xAt(i);
    const y = yRight(rightSeries[i]);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // legend
  ctx.fillStyle = palette.legend;
  ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const channelLabel = state.chartChannel === "all"
    ? "все каналы"
    : state.chartChannel === "search" ? "поиск" : "РСЯ";

  ctx.fillText(`▮ ${chart.leftLabel} (${channelLabel})`, pad.l, 16);
  ctx.fillStyle = palette.line;
  ctx.fillText(`— ${chart.rightLabel} (правая шкала)`, pad.l + 210, 16);
}

export { formatDateLabel, getChartSeries, drawChart };
