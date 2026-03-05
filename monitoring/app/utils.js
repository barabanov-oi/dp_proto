import { thresholds } from './store.js';

export const formatInt = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n));
export const formatMoney = (n, digits = 0) =>
  `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n)} ₽`;
export const formatPct = (n, digits = 2) =>
  `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n)}%`;

export function setDelta(el, pct) {
  const sign = pct >= 0 ? '▲' : '▼';
  el.textContent = `${sign} ${Math.abs(pct).toFixed(1)}%`;
  el.classList.remove('good', 'warn', 'bad');
  const abs = Math.abs(pct);
  if (abs <= 3) el.classList.add('good');
  else if (abs <= 8) el.classList.add('warn');
  else el.classList.add('bad');
}

export function formatDateLabel(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const calcCtr = (clicks, impr) => (impr ? (clicks / impr) * 100 : 0);
export const calcCpc = (spend, clicks) => (clicks ? spend / clicks : 0);
export const calcCr = (conv, clicks) => (clicks ? (conv / clicks) * 100 : 0);
export const calcCpa = (spend, conv) => (conv ? spend / conv : 0);

export function cellClass(value, metric) {
  const checks = {
    ctr: [value < thresholds.ctrBad, value < thresholds.ctrWarn],
    cpc: [value > thresholds.cpcBad, value > thresholds.cpcWarn],
    cr: [value < thresholds.crBad, value < thresholds.crWarn],
    cpa: [value > thresholds.cpaBad, value > thresholds.cpaWarn]
  };
  const [bad, warn] = checks[metric] || [];
  if (bad) return 'cellBad';
  if (warn) return 'cellWarn';
  return checks[metric] ? 'cellOk' : '';
}

export function buildFlags({ ctr, cpc, cr, cpa }) {
  const flags = [];
  if (ctr < thresholds.ctrBad) flags.push({ metric: 'ctr', level: 'bad', text: 'CTR низкий' });
  else if (ctr < thresholds.ctrWarn) flags.push({ metric: 'ctr', level: 'warn', text: 'CTR проседает' });
  if (cpc > thresholds.cpcBad) flags.push({ metric: 'cpc', level: 'bad', text: 'CPC высокий' });
  else if (cpc > thresholds.cpcWarn) flags.push({ metric: 'cpc', level: 'warn', text: 'CPC растёт' });
  if (cr < thresholds.crBad) flags.push({ metric: 'cr', level: 'bad', text: 'CR низкий' });
  else if (cr < thresholds.crWarn) flags.push({ metric: 'cr', level: 'warn', text: 'CR проседает' });
  if (cpa > thresholds.cpaBad) flags.push({ metric: 'cpa', level: 'bad', text: 'CPA высокий' });
  else if (cpa > thresholds.cpaWarn) flags.push({ metric: 'cpa', level: 'warn', text: 'CPA растёт' });
  return flags;
}

export function statusFromFlags(flags) {
  if (flags.some((f) => f.level === 'bad')) return { text: 'Критично', cls: 'bad', severity: 2 };
  if (flags.some((f) => f.level === 'warn')) return { text: 'Внимание', cls: 'warn', severity: 1 };
  return { text: 'OK', cls: 'good', severity: 0 };
}

export const scoreFlags = (flags) => flags.reduce((acc, f) => acc + (f.level === 'bad' ? 2 : 1), 0);

export function trendClass(pct, inverse = false) {
  const effective = inverse ? -pct : pct;
  if (effective >= 0) return 'good';
  if (effective > -3) return 'warn';
  return 'bad';
}

export function createTrendElement(value, inverse = false) {
  const el = document.createElement('span');
  el.className = `trendInline ${trendClass(value, inverse)}`;
  el.textContent = `${value >= 0 ? '↑' : '↓'} ${Math.abs(value).toFixed(1)}%`;
  return el;
}
