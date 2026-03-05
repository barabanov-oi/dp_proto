import { formatInt, formatMoney, formatPct, setDelta, demo, state, getVisibleDailyData } from './app-core.js';
import { drawChart } from './app-charts.js';
import { renderSparklines, bindKpiCards, drawKpiDetailChart } from './app-kpi-details.js';
function renderKPI() {
  const points = getVisibleDailyData();
  const totals = points.reduce((acc, point, index) => {
    const impressions = Math.max(point.clicks, Math.round(point.clicks * (49 + Math.sin(index / 2.6) * 4)));
    const conversions = Math.max(1, Math.round(point.clicks * (0.2 + Math.cos(index / 3.1) * 0.025)));
    acc.spend += point.spend;
    acc.impressions += impressions;
    acc.clicks += point.clicks;
    acc.conversions += conversions;
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks ? (totals.spend / totals.clicks) : 0;
  const cr = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
  const cpa = totals.conversions ? (totals.spend / totals.conversions) : 0;

  document.getElementById("kpiSpend").textContent = formatMoney(totals.spend, 0);
  document.getElementById("kpiBalance").textContent = formatMoney(demo.totals.balance, 2);
  document.getElementById("kpiImpr").textContent = formatInt(totals.impressions);
  document.getElementById("kpiCtr").textContent = formatPct(ctr, 2);
  document.getElementById("kpiClicks").textContent = formatInt(totals.clicks);
  document.getElementById("kpiCpc").textContent = formatMoney(cpc, 2);
  document.getElementById("kpiConv").textContent = formatInt(totals.conversions);
  document.getElementById("kpiCr").textContent = formatPct(cr, 2);
  document.getElementById("kpiCpa").textContent = formatMoney(cpa, 2);

  setDelta(document.getElementById("deltaSpend"), demo.deltas.spend);
  setDelta(document.getElementById("deltaImpr"), demo.deltas.impressions);
  setDelta(document.getElementById("deltaCtr"), demo.deltas.ctr);
  setDelta(document.getElementById("deltaClicks"), demo.deltas.clicks);
  setDelta(document.getElementById("deltaCpc"), demo.deltas.cpc);
  setDelta(document.getElementById("deltaConv"), demo.deltas.conv);
  setDelta(document.getElementById("deltaCr"), demo.deltas.cr);
  setDelta(document.getElementById("deltaCpa"), demo.deltas.cpa);

  document.querySelectorAll(".kpiCard").forEach((card) => {
    const delta = card.querySelector(".delta");
    card.classList.toggle("kpiCritical", Boolean(delta && delta.classList.contains("bad")));
  });

  document.getElementById("lastUpdateTag").textContent =
    "Обновлено: " + new Date().toLocaleString("ru-RU");
}

function aggregateByName(part) {
  const rows = demo.campaigns.filter((c) => c.name.includes(part));
  return rows.reduce((acc, c) => {
    acc.spend += c.spend;
    acc.impressions += c.impr;
    acc.clicks += c.clicks;
    acc.conversions += c.conv;
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
}

function getChannelDaily(channel) {
  const source = getVisibleDailyData();
  const ratioByDay = source.map((_, index) => {
    const wave = Math.sin(index / 2.4) * 0.06;
    return Math.min(0.74, Math.max(0.58, 0.65 + wave));
  });

  return source.map((d, index) => {
    const searchRatio = ratioByDay[index];
    const rsyaRatio = 1 - searchRatio;
    const ratio = channel === "search" ? searchRatio : rsyaRatio;
    return {
      date: d.date,
      spend: d.spend * ratio,
      clicks: Math.round(d.clicks * ratio)
    };
  });
}

function renderChannelKpi(channel) {
  const container = document.getElementById("channelKpiGrid");
  if (!container) return;

  const isSearch = channel === "search";
  const totals = aggregateByName(isSearch ? "Поиск" : "РСЯ");
  const channelDelta = demo.channelDeltas[channel];

  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks ? (totals.spend / totals.clicks) : 0;
  const cr = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
  const cpa = totals.conversions ? (totals.spend / totals.conversions) : 0;

  const cards = [
    { label: "Расход", value: formatMoney(totals.spend, 0), delta: channelDelta.spend },
    { label: "CTR", value: formatPct(ctr, 2), delta: channelDelta.ctr },
    { label: "CR", value: formatPct(cr, 2), delta: channelDelta.cr },
    { label: "CPA", value: formatMoney(cpa, 2), delta: channelDelta.cpa },
    { label: "Клики", value: formatInt(totals.clicks), delta: channelDelta.clicks },
    { label: "Показы", value: formatInt(totals.impressions), delta: channelDelta.impressions },
    { label: "Конверсии", value: formatInt(totals.conversions), delta: channelDelta.conversions },
    { label: "CPC", value: formatMoney(cpc, 2), delta: channelDelta.cpc }
  ];

  container.innerHTML = `
    ${cards.map((card) => `
      <div class="kpiCard">
        <div class="kpiTop">
          <div>
            <div class="kpiLabel">${card.label}</div>
          </div>
          <span class="delta" data-delta="${card.delta}"></span>
        </div>
        <div class="kpiValue mono">${card.value}</div>
      </div>
    `).join("")}
  `;

  container.querySelectorAll("[data-delta]").forEach((el) => {
    setDelta(el, Number(el.dataset.delta));
  });
}

function renderChannelButtons() {
  document.querySelectorAll(".channelBtn").forEach((btn) => {
    const channel = btn.dataset.channel || "search";
    const isSearch = channel === "search";
    const totals = aggregateByName(isSearch ? "Поиск" : "РСЯ");
    const delta = demo.channelDeltas[channel] || {};
    btn.innerHTML = `
      <span class="channelBtnTitle">${isSearch ? "Поиск" : "РСЯ"}</span>
      <span class="channelBtnMeta">
        <span>Расход ${formatMoney(totals.spend, 0)} ${delta.spend >= 0 ? "▲" : "▼"} ${Math.abs(delta.spend ?? 0).toFixed(1)}%</span>
        <span>Клики ${formatInt(totals.clicks)} ${delta.clicks >= 0 ? "▲" : "▼"} ${Math.abs(delta.clicks ?? 0).toFixed(1)}%</span>
        <span>Конверсии ${formatInt(totals.conversions)} ${delta.conversions >= 0 ? "▲" : "▼"} ${Math.abs(delta.conversions ?? 0).toFixed(1)}%</span>
      </span>
    `;
  });
}

function renderChannelSwitch() {
  const grid = document.getElementById("channelKpiGrid");

  document.querySelectorAll(".channelBtn").forEach((btn) => {
    const isActive = btn.dataset.channel === state.selectedChannelKpi;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-expanded", isActive ? "true" : "false");
  });

  if (!grid) return;

  if (!state.selectedChannelKpi) {
    grid.classList.add("hidden");
    grid.innerHTML = "";
    return;
  }

  grid.classList.remove("hidden");
  renderChannelKpi(state.selectedChannelKpi);
}



}

// --- Alerts render (3 сигнала) ---
function renderAlerts() {
  const ul = document.getElementById("alertsList");
  ul.innerHTML = "";

  demo.alerts.forEach((a) => {
    const li = document.createElement("li");
    li.className = "statusItem";

    const left = document.createElement("div");
    left.className = "statusLeft";

    const badge = document.createElement("div");
    badge.className = "badge " + (a.level || "");
    left.appendChild(badge);

    const text = document.createElement("div");
    const b = document.createElement("b");
    b.textContent = a.title;
    const s = document.createElement("small");
    s.textContent = a.desc;
    text.appendChild(b);
    text.appendChild(s);

    left.appendChild(text);

    const right = document.createElement("div");
    right.className = "statusRight";
    right.textContent = a.right || "";

    li.appendChild(left);
    li.appendChild(right);
    ul.appendChild(li);
  });

  document.getElementById("alertsCount").textContent = `${demo.alerts.length} сигнала`;
}

function bindPeriodControl() {
  const periodSelect = document.getElementById("periodPreset");
  if (!periodSelect) return;

  periodSelect.value = String(state.periodDays);
  periodSelect.addEventListener("change", () => {
    state.periodDays = Number(periodSelect.value) || 14;
    renderKPI();
    renderSparklines();
    drawChart();
    if (document.getElementById("kpiModal")?.classList.contains("open")) {
      drawKpiDetailChart(state.activeKpiMetric);
    }
  });
}

export { renderKPI, aggregateByName, getChannelDaily, renderChannelKpi, renderChannelButtons, renderChannelSwitch, renderSparklines, bindKpiCards, renderAlerts, bindPeriodControl };
