import { demo, state } from './store.js';
import { formatInt, formatMoney, formatPct, setDelta } from './utils.js';

export function aggregateByName(part) {
  return demo.campaigns.filter((c) => c.name.includes(part)).reduce((acc, c) => {
    acc.spend += c.spend;
    acc.impressions += c.impr;
    acc.clicks += c.clicks;
    acc.conversions += c.conv;
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
}

export function renderChannelKpi(channel) {
  const container = document.getElementById('channelKpiGrid');
  if (!container) return;
  const totals = aggregateByName(channel === 'search' ? 'Поиск' : 'РСЯ');
  const d = demo.channelDeltas[channel];
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks ? totals.spend / totals.clicks : 0;
  const cr = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
  const cpa = totals.conversions ? totals.spend / totals.conversions : 0;
  const cards = [
    { label: 'Расход', value: formatMoney(totals.spend, 0), delta: d.spend },
    { label: 'CTR', value: formatPct(ctr, 2), delta: d.ctr },
    { label: 'CR', value: formatPct(cr, 2), delta: d.cr },
    { label: 'CPA', value: formatMoney(cpa, 2), delta: d.cpa },
    { label: 'Клики', value: formatInt(totals.clicks), delta: d.clicks },
    { label: 'Показы', value: formatInt(totals.impressions), delta: d.impressions },
    { label: 'Конверсии', value: formatInt(totals.conversions), delta: d.conversions },
    { label: 'CPC', value: formatMoney(cpc, 2), delta: d.cpc }
  ];
  container.innerHTML = cards.map((card) => `
    <div class="kpiCard"><div class="kpiTop"><div><div class="kpiLabel">${card.label}</div></div>
      <span class="delta" data-delta="${card.delta}"></span></div><div class="kpiValue mono">${card.value}</div></div>`).join('');
  container.querySelectorAll('[data-delta]').forEach((el) => setDelta(el, Number(el.dataset.delta)));
}

export function renderChannelButtons() {
  document.querySelectorAll('.channelBtn').forEach((btn) => {
    const channel = btn.dataset.channel || 'search';
    const totals = aggregateByName(channel === 'search' ? 'Поиск' : 'РСЯ');
    const delta = demo.channelDeltas[channel] || {};
    btn.innerHTML = `<span class="channelBtnTitle">${channel === 'search' ? 'Поиск' : 'РСЯ'}</span>
      <span class="channelBtnMeta"><span>Расход ${formatMoney(totals.spend, 0)} ${delta.spend >= 0 ? '▲' : '▼'} ${Math.abs(delta.spend ?? 0).toFixed(1)}%</span>
      <span>Клики ${formatInt(totals.clicks)} ${delta.clicks >= 0 ? '▲' : '▼'} ${Math.abs(delta.clicks ?? 0).toFixed(1)}%</span>
      <span>Конверсии ${formatInt(totals.conversions)} ${delta.conversions >= 0 ? '▲' : '▼'} ${Math.abs(delta.conversions ?? 0).toFixed(1)}%</span></span>`;
  });
}

export function renderChannelSwitch() {
  const grid = document.getElementById('channelKpiGrid');
  document.querySelectorAll('.channelBtn').forEach((btn) => {
    const active = btn.dataset.channel === state.selectedChannelKpi;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-expanded', active ? 'true' : 'false');
  });
  if (!grid) return;
  if (!state.selectedChannelKpi) {
    grid.classList.add('hidden');
    grid.innerHTML = '';
    return;
  }
  grid.classList.remove('hidden');
  renderChannelKpi(state.selectedChannelKpi);
}

export function bindChannelControls(drawChart) {
  document.querySelectorAll('.channelBtn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const clicked = btn.dataset.channel || 'search';
      state.selectedChannelKpi = state.selectedChannelKpi === clicked ? null : clicked;
      renderChannelSwitch();
    });
  });
  const chartChannel = document.getElementById('chartChannel');
  if (chartChannel) {
    chartChannel.value = state.chartChannel;
    chartChannel.addEventListener('change', () => {
      state.chartChannel = chartChannel.value;
      drawChart();
    });
  }
  const chartMode = document.getElementById('chartMode');
  if (chartMode) {
    chartMode.value = state.chartMode;
    chartMode.addEventListener('change', () => {
      state.chartMode = chartMode.value;
      drawChart();
    });
  }
}
