import { demo, state } from './store.js';
import { getDailyMetric, getVisibleDailyData, enrichPoint } from './metrics.js';
import { chartPalette } from './theme.js';
import { formatDateLabel, formatInt, formatMoney, formatPct, setDelta } from './utils.js';

export function renderKPI() {
  const totals = getVisibleDailyData().reduce((acc, point, i) => {
    const p = enrichPoint(point, i);
    acc.spend += p.spend;
    acc.impressions += p.impressions;
    acc.clicks += p.clicks;
    acc.conversions += p.conversions;
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks ? totals.spend / totals.clicks : 0;
  const cr = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
  const cpa = totals.conversions ? totals.spend / totals.conversions : 0;

  document.getElementById('kpiSpend').textContent = formatMoney(totals.spend, 0);
  document.getElementById('kpiBalance').textContent = formatMoney(demo.totals.balance, 2);
  document.getElementById('kpiImpr').textContent = formatInt(totals.impressions);
  document.getElementById('kpiCtr').textContent = formatPct(ctr, 2);
  document.getElementById('kpiClicks').textContent = formatInt(totals.clicks);
  document.getElementById('kpiCpc').textContent = formatMoney(cpc, 2);
  document.getElementById('kpiConv').textContent = formatInt(totals.conversions);
  document.getElementById('kpiCr').textContent = formatPct(cr, 2);
  document.getElementById('kpiCpa').textContent = formatMoney(cpa, 2);

  [['deltaSpend', demo.deltas.spend], ['deltaImpr', demo.deltas.impressions], ['deltaCtr', demo.deltas.ctr],
    ['deltaClicks', demo.deltas.clicks], ['deltaCpc', demo.deltas.cpc], ['deltaConv', demo.deltas.conv],
    ['deltaCr', demo.deltas.cr], ['deltaCpa', demo.deltas.cpa]].forEach(([id, val]) => setDelta(document.getElementById(id), val));

  document.querySelectorAll('.kpiCard').forEach((card) => {
    const delta = card.querySelector('.delta');
    card.classList.toggle('kpiCritical', Boolean(delta && delta.classList.contains('bad')));
  });
  document.getElementById('lastUpdateTag').textContent = `Обновлено: ${new Date().toLocaleString('ru-RU')}`;
}

function renderSparkline(svgId, metric) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const series = getDailyMetric(metric, 7).map((p) => p.value);
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  const points = series.map((value, index) => {
    const x = (index / (series.length - 1 || 1)) * 120;
    const y = 32 - ((value - min) / span) * 28 - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  svg.innerHTML = `<polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
}

export function renderSparklines() {
  [['sparkSpend', 'spend'], ['sparkImpressions', 'impressions'], ['sparkCtr', 'ctr'], ['sparkClicks', 'clicks'],
    ['sparkCpc', 'cpc'], ['sparkConversions', 'conversions'], ['sparkCr', 'cr'], ['sparkCpa', 'cpa']].forEach(
    ([id, metric]) => renderSparkline(id, metric)
  );
}

export function drawKpiDetailChart(metric) {
  const canvas = document.getElementById('kpiDetailChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const points = getDailyMetric(metric, 14);
  const values = points.map((p) => p.value);
  const cssW = canvas.clientWidth || 900;
  const cssH = canvas.clientHeight || 260;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pad = { l: 52, r: 24, t: 20, b: 34 };
  const plotW = cssW - pad.l - pad.r;
  const plotH = cssH - pad.t - pad.b;
  const max = Math.max(...values) * 1.1;
  const min = Math.min(...values) * 0.95;
  const span = max - min || 1;
  const xAt = (i) => pad.l + (plotW * i) / (values.length - 1 || 1);
  const yAt = (v) => pad.t + plotH - ((v - min) / span) * plotH;

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = chartPalette().bg;
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.strokeStyle = chartPalette().grid;
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.t + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + plotW, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#6d5efc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v, i) => (i ? ctx.lineTo(xAt(i), yAt(v)) : ctx.moveTo(xAt(i), yAt(v))));
  ctx.stroke();
  ctx.fillStyle = '#6d5efc';
  values.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(xAt(i), yAt(v), 2.8, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = chartPalette().axis;
  ctx.font = '12px ui-sans-serif';
  for (let i = 0; i < points.length; i += 2) ctx.fillText(formatDateLabel(points[i].date), xAt(i) - 12, cssH - 10);
}

export function bindPeriodControl({ drawChart }) {
  const periodSelect = document.getElementById('periodPreset');
  if (!periodSelect) return;
  periodSelect.value = String(state.periodDays);
  periodSelect.addEventListener('change', () => {
    state.periodDays = Number(periodSelect.value) || 14;
    renderKPI();
    renderSparklines();
    drawChart();
    if (document.getElementById('kpiModal')?.classList.contains('open')) drawKpiDetailChart(state.activeKpiMetric);
  });
}

export function bindKpiCards() {
  const modal = document.getElementById('kpiModal');
  const close = document.getElementById('kpiModalClose');
  const title = document.getElementById('kpiModalTitle');
  if (!modal || !close || !title) return;

  const labels = { spend: 'Расход', impressions: 'Показы', ctr: 'CTR', clicks: 'Клики', cpc: 'CPC', conversions: 'Конверсии', cr: 'CR', cpa: 'CPA' };
  const openModal = (metric) => {
    state.activeKpiMetric = metric;
    title.textContent = `Динамика: ${labels[metric] || 'Показатель'} (14 дней)`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    drawKpiDetailChart(metric);
  };

  document.querySelectorAll('.kpiCard[data-metric]').forEach((card) => {
    const metric = card.dataset.metric || 'spend';
    card.addEventListener('click', () => openModal(metric));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(metric);
      }
    });
  });

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };
  close.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
}
