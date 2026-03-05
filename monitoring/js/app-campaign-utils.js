import { formatInt, formatMoney, formatPct, demo, state } from './app-core.js';
import { drawChart } from './app-charts.js';
import { renderChannelSwitch } from './app-kpi.js';
function calcCtr(clicks, impr) { return impr ? (clicks / impr) * 100 : 0; }
function calcCpc(spend, clicks) { return clicks ? (spend / clicks) : 0; }
function calcCr(conv, clicks) { return clicks ? (conv / clicks) * 100 : 0; }
function calcCpa(spend, conv) { return conv ? (spend / conv) : 0; }

// Демонстрационные пороги "критично"
const thresholds = {
  ctrBad: 0.9,
  ctrWarn: 1.2,
  cpcBad: 35,
  cpcWarn: 28,
  crBad: 10,
  crWarn: 14,
  cpaBad: 350,
  cpaWarn: 240
};

function cellClass(value, metric) {
  if (metric === "ctr") {
    if (value < thresholds.ctrBad) return "cellBad";
    if (value < thresholds.ctrWarn) return "cellWarn";
    return "cellOk";
  }
  if (metric === "cpc") {
    if (value > thresholds.cpcBad) return "cellBad";
    if (value > thresholds.cpcWarn) return "cellWarn";
    return "cellOk";
  }
  if (metric === "cr") {
    if (value < thresholds.crBad) return "cellBad";
    if (value < thresholds.crWarn) return "cellWarn";
    return "cellOk";
  }
  if (metric === "cpa") {
    if (value > thresholds.cpaBad) return "cellBad";
    if (value > thresholds.cpaWarn) return "cellWarn";
    return "cellOk";
  }
  return "";
}

function statusFromFlags(flags) {
  const hasBad = flags.some(f => f.level === "bad");
  const hasWarn = flags.some(f => f.level === "warn");
  if (hasBad) return { text: "Критично", cls: "bad", severity: 2 };
  if (hasWarn) return { text: "Внимание", cls: "warn", severity: 1 };
  return { text: "OK", cls: "good", severity: 0 };
}

function buildFlags({ ctr, cpc, cr, cpa }) {
  const flags = [];
  if (ctr < thresholds.ctrBad) flags.push({ metric: "ctr", level: "bad", text: "CTR низкий" });
  else if (ctr < thresholds.ctrWarn) flags.push({ metric: "ctr", level: "warn", text: "CTR проседает" });

  if (cpc > thresholds.cpcBad) flags.push({ metric: "cpc", level: "bad", text: "CPC высокий" });
  else if (cpc > thresholds.cpcWarn) flags.push({ metric: "cpc", level: "warn", text: "CPC растёт" });

  if (cr < thresholds.crBad) flags.push({ metric: "cr", level: "bad", text: "CR низкий" });
  else if (cr < thresholds.crWarn) flags.push({ metric: "cr", level: "warn", text: "CR проседает" });

  if (cpa > thresholds.cpaBad) flags.push({ metric: "cpa", level: "bad", text: "CPA высокий" });
  else if (cpa > thresholds.cpaWarn) flags.push({ metric: "cpa", level: "warn", text: "CPA растёт" });

  return flags;
}

function scoreFlags(flags) {
  // 2 балла за bad, 1 за warn
  return flags.reduce((acc, f) => acc + (f.level === "bad" ? 2 : 1), 0);
}

function applyFilter(rows) {
  if (state.filter === "all") return rows;
  if (state.filter === "warn") return rows.filter(r => r.status.cls === "warn" || r.status.cls === "bad");
  if (state.filter === "bad") return rows.filter(r => r.status.cls === "bad");
  return rows;
}

function applySort(rows) {
  const s = state.sortBy;
  const copy = [...rows];

  if (s === "severity") {
    copy.sort((a, b) => (b.sevScore - a.sevScore) || (b.spend - a.spend));
    return copy;
  }
  if (s === "spend_desc") return copy.sort((a, b) => b.spend - a.spend);
  if (s === "cpa_desc") return copy.sort((a, b) => b.cpa - a.cpa);
  if (s === "cr_asc") return copy.sort((a, b) => a.cr - b.cr);
  if (s === "ctr_asc") return copy.sort((a, b) => a.ctr - b.ctr);
  return copy;
}

function trendClass(pct, inverse = false) {
  const effective = inverse ? -pct : pct;
  if (effective >= 0) return "good";
  if (effective > -3) return "warn";
  return "bad";
}

function createTrendElement(value, inverse = false) {
  const el = document.createElement("span");
  const isUp = value >= 0;
  const arrow = isUp ? "↑" : "↓";
  el.className = "trendInline " + trendClass(value, inverse);
  el.textContent = `${arrow} ${Math.abs(value).toFixed(1)}%`;
  return el;
}


export { calcCtr, calcCpc, calcCr, calcCpa, cellClass, statusFromFlags, buildFlags, scoreFlags, applyFilter, applySort, trendClass, createTrendElement };
