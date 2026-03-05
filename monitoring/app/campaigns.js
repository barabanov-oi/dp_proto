import { demo, state } from './store.js';
import {
  buildFlags,
  calcCpa,
  calcCpc,
  calcCr,
  calcCtr,
  cellClass,
  createTrendElement,
  formatInt,
  formatMoney,
  formatPct,
  scoreFlags,
  statusFromFlags
} from './utils.js';

function applyFilter(rows) {
  if (state.filter === 'all') return rows;
  if (state.filter === 'warn') return rows.filter((r) => r.status.cls === 'warn' || r.status.cls === 'bad');
  if (state.filter === 'bad') return rows.filter((r) => r.status.cls === 'bad');
  return rows;
}

function applySort(rows) {
  const copy = [...rows];
  if (state.sortBy === 'severity') return copy.sort((a, b) => (b.sevScore - a.sevScore) || (b.spend - a.spend));
  if (state.sortBy === 'spend_desc') return copy.sort((a, b) => b.spend - a.spend);
  if (state.sortBy === 'cpa_desc') return copy.sort((a, b) => b.cpa - a.cpa);
  if (state.sortBy === 'cr_asc') return copy.sort((a, b) => a.cr - b.cr);
  if (state.sortBy === 'ctr_asc') return copy.sort((a, b) => a.ctr - b.ctr);
  return copy;
}

function appendDetailRow(tbody, rowData, trend) {
  const detailsTr = document.createElement('tr');
  detailsTr.className = 'campaignDetails hidden';
  const detailsTd = document.createElement('td');
  detailsTd.colSpan = 9;
  const metricItems = [
    { metric: 'ctr', label: 'CTR', value: formatPct(rowData.ctr, 2), trend: trend.ctr ?? 0, inverse: false },
    { metric: 'cpc', label: 'CPC', value: formatMoney(rowData.cpc, 2), trend: trend.cpc ?? 0, inverse: true },
    { metric: 'cr', label: 'CR', value: formatPct(rowData.cr, 2), trend: trend.cr ?? 0, inverse: false },
    { metric: 'cpa', label: 'CPA', value: formatMoney(rowData.cpa, 2), trend: trend.cpa ?? 0, inverse: true }
  ];

  const metricFlags = new Map(rowData.flags.map((flag) => [flag.metric, flag]));
  const cards = metricItems.filter((item) => metricFlags.has(item.metric)).map((item) => {
    const flag = metricFlags.get(item.metric);
    return `<div class="detailMetricCard ${flag.level}"><span class="detailMetricLabel">${item.label}</span>
      <span class="detailMetricValue mono">${item.value}</span><small class="detailMetricWarning">⚠ ${flag.text}: требуется проверка.</small></div>`;
  }).join('');

  detailsTd.innerHTML = `<div class="campaignDetailsWrap"><div class="campaignDetailsHead"><b>Критичные показатели</b>
    <button type="button" class="btn btnTiny">Обзор</button></div><div class="detailMetrics">${cards || '<div class="detailMetricEmpty">Отклонений по контролируемым показателям не обнаружено.</div>'}</div></div>`;
  detailsTr.appendChild(detailsTd);
  tbody.appendChild(detailsTr);

  detailsTd.querySelectorAll('.detailMetricCard').forEach((card, index) => {
    const cfg = metricItems.filter((item) => metricFlags.has(item.metric))[index];
    card.querySelector('.detailMetricValue').appendChild(createTrendElement(cfg.trend, cfg.inverse));
  });
  return detailsTr;
}

export function renderCampaigns() {
  const tbody = document.getElementById('campaignsBody');
  if (!tbody) return;
  const maxSpend = Math.max(...demo.campaigns.map((c) => c.spend));
  const rows = applySort(applyFilter(demo.campaigns.map((c) => {
    const ctr = calcCtr(c.clicks, c.impr);
    const cpc = calcCpc(c.spend, c.clicks);
    const cr = calcCr(c.conv, c.clicks);
    const cpa = calcCpa(c.spend, c.conv);
    const flags = buildFlags({ ctr, cpc, cr, cpa });
    return { ...c, ctr, cpc, cr, cpa, flags, status: statusFromFlags(flags), sevScore: scoreFlags(flags) };
  })));

  tbody.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.className = 'campaignRow';
    const trend = demo.campaignDeltas[r.name] || {};
    tr.innerHTML = `<td class="campaignNameCell" data-label="Кампания">${r.name}</td>
      <td data-label="Статус"><span class="tag ${r.status.cls}">${r.status.text}</span></td>
      <td data-label="Расход" class="mono spendCell">${formatMoney(r.spend, 2)}</td>
      <td data-label="CTR" class="mono ${cellClass(r.ctr, 'ctr')}">${formatPct(r.ctr, 2)}</td>
      <td data-label="Клики" class="mono">${formatInt(r.clicks)}</td>
      <td data-label="CPC" class="mono ${cellClass(r.cpc, 'cpc')}">${formatMoney(r.cpc, 2)}</td>
      <td data-label="Конверсии" class="mono">${formatInt(r.conv)}</td>
      <td data-label="CR" class="mono ${cellClass(r.cr, 'cr')}">${formatPct(r.cr, 2)}</td>
      <td data-label="CPA" class="mono ${cellClass(r.cpa, 'cpa')}">${formatMoney(r.cpa, 2)}</td>`;
    tbody.appendChild(tr);

    tr.children[2].appendChild(createTrendElement(trend.spend ?? 0, true));
    const bar = document.createElement('div');
    bar.className = 'spendBar';
    const fill = document.createElement('i');
    fill.style.width = `${Math.max(3, (r.spend / maxSpend) * 100)}%`;
    bar.appendChild(fill);
    tr.children[2].appendChild(bar);
    [3, 4, 5, 6, 7, 8].forEach((i, idx) => {
      const keys = ['ctr', 'clicks', 'cpc', 'conv', 'cr', 'cpa'];
      tr.children[i].appendChild(createTrendElement(trend[keys[idx]] ?? 0, ['cpc', 'cpa'].includes(keys[idx])));
    });

    const detailsTr = appendDetailRow(tbody, r, trend);
    tr.addEventListener('click', () => detailsTr.classList.toggle('hidden'));
  });

  const tagEl = document.getElementById('campaignsTag');
  if (tagEl) tagEl.textContent = `показано: ${rows.length} / всего: ${demo.campaigns.length}`;
}

export function bindCampaignControls() {
  document.querySelectorAll('.segBtn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.segBtn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter || 'all';
      renderCampaigns();
    });
  });
  const sortBy = document.getElementById('sortBy');
  if (sortBy) {
    sortBy.addEventListener('change', () => {
      state.sortBy = sortBy.value;
      renderCampaigns();
    });
  }
}
