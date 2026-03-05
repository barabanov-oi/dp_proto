import { formatInt, formatMoney, formatPct, setDelta } from "./js/formatters.js";
import { createChartsModule } from "./js/monitoring/charts.js";
import { createCampaignsModule } from "./js/monitoring/campaigns.js";

// --- Demo data (14 дней) ---
  const demo = {
    periodDays: 14,
    totals: {
      balance: 483920.45,
      spend: 1339902.09,
      impressions: 3388435,
      clicks: 64150,
      conversions: 13734
    },
    deltas: {
      spend: +6.8,
      impressions: +4.2,
      ctr: +1.1,
      clicks: +3.1,
      cpc: +3.5,
      conv: +9.4,
      cr: -1.9,
      cpa: +12.2
    },
    daily: [
      { date: "2026-02-15", spend: 84210.45, clicks: 4012 },
      { date: "2026-02-16", spend: 91135.12, clicks: 4260 },
      { date: "2026-02-17", spend: 98340.88, clicks: 4521 },
      { date: "2026-02-18", spend: 102114.22, clicks: 4680 },
      { date: "2026-02-19", spend: 96770.15, clicks: 4511 },
      { date: "2026-02-20", spend: 88902.30, clicks: 4325 },
      { date: "2026-02-21", spend: 90510.66, clicks: 4401 },
      { date: "2026-02-22", spend: 159783.43, clicks: 7810 },
      { date: "2026-02-23", spend: 104110.56, clicks: 5101 },
      { date: "2026-02-24", spend: 205957.02, clicks: 8894 },
      { date: "2026-02-25", spend: 218115.52, clicks: 9217 },
      { date: "2026-02-26", spend: 206104.55, clicks: 8016 },
      { date: "2026-02-27", spend: 183658.05, clicks: 8907 },
      { date: "2026-02-28", spend: 220800.93, clicks: 14983 }
    ],
    alerts: [
      {
        level: "warn",
        title: "Перерасход относительно среднедневного",
        desc: "За последние 2 дня расход выше среднего по периоду на 18%. Проверьте ставки и дневные лимиты.",
        right: "сегодня"
      },
      {
        level: "bad",
        title: "CR просел при росте кликов",
        desc: "Кликов больше, но конверсии не растут пропорционально. Проверьте запросы/площадки и качество трафика.",
        right: "2 дня"
      },
      {
        level: "warn",
        title: "Рост CPC быстрее роста CTR",
        desc: "Стоимость клика растёт, а CTR почти не меняется. Есть риск выгорания креативов/аудиторий.",
        right: "3 дня"
      }
    ],
    campaigns: [
      { name: "Поиск — Бренд", spend: 218340.22, impr: 412340, clicks: 12861, conv: 4120 },
      { name: "РСЯ — Ремаркетинг", spend: 334901.18, impr: 1104230, clicks: 11594, conv: 1380 },
      { name: "Поиск — Категории", spend: 401225.76, impr: 615990, clicks: 14411, conv: 4820 },
      { name: "РСЯ — Интересы", spend: 277880.55, impr: 1005420, clicks: 7245, conv: 610 },
      { name: "Мастер кампаний", spend: 107554.38, impr: 250455, clicks: 4000, conv: 2804 }
    ],
    campaignDeltas: {
      "Поиск — Бренд": { spend: +4.1, impr: +3.8, ctr: +2.4, clicks: +6.3, cpc: -1.7, conv: +5.4, cr: +1.9, cpa: -1.2 },
      "РСЯ — Ремаркетинг": { spend: +7.8, impr: +5.1, ctr: -1.2, clicks: +3.2, cpc: +4.4, conv: -2.4, cr: -4.8, cpa: +10.3 },
      "Поиск — Категории": { spend: +2.9, impr: +1.7, ctr: +0.9, clicks: +4.5, cpc: -0.8, conv: +2.1, cr: -1.1, cpa: +0.8 },
      "РСЯ — Интересы": { spend: -1.7, impr: -2.6, ctr: -0.5, clicks: -2.9, cpc: +1.2, conv: -4.8, cr: -2.0, cpa: +6.6 },
      "Мастер кампаний": { spend: +5.5, impr: +4.4, ctr: +1.3, clicks: +2.8, cpc: +2.1, conv: +9.7, cr: +3.5, cpa: -3.9 }
    },
    channelDeltas: {
      search: {
        spend: +5.6,
        ctr: +1.8,
        cr: -2.1,
        cpa: +8.4,
        clicks: +2.9,
        impressions: +4.7,
        conversions: +6.2,
        cpc: +3.1
      },
      rsya: {
        spend: +8.9,
        ctr: -1.4,
        cr: -3.8,
        cpa: +11.7,
        clicks: +1.6,
        impressions: +5.3,
        conversions: +2.5,
        cpc: +6.5
      }
    }
  };

  // --- State ---
  const state = {
    filter: "all",   // all | warn | bad
    sortBy: "severity",
    selectedChannelKpi: null,
    chartChannel: "all",
    chartMode: "traffic",
    periodDays: 14,
    activeKpiMetric: "spend",
    theme: "dark"
  };






  function generateExtendedDaily(days = 28) {
    const seed = demo.daily;
    const source = seed.slice(-Math.min(seed.length, days));
    const result = [...source];

    while (result.length < days) {
      const first = result[0];
      const date = new Date(first.date + "T00:00:00");
      date.setDate(date.getDate() - 1);
      const wave = 0.9 + Math.sin(result.length / 2.3) * 0.08;
      result.unshift({
        date: date.toISOString().slice(0, 10),
        spend: Math.max(12000, first.spend * wave),
        clicks: Math.max(500, Math.round(first.clicks * (0.92 + Math.cos(result.length / 3) * 0.06)))
      });
    }

    return result.slice(-days);
  }

  const extendedDaily = generateExtendedDaily(28);

  function getVisibleDailyData() {
    return extendedDaily.slice(-state.periodDays);
  }

  function getDailyMetric(metric, days = state.periodDays) {
    const points = extendedDaily.slice(-days);
    return points.map((point, index) => {
      const impressions = Math.max(point.clicks, Math.round(point.clicks * (49 + Math.sin(index / 2.6) * 4)));
      const conversions = Math.max(1, Math.round(point.clicks * (0.2 + Math.cos(index / 3.1) * 0.025)));
      const ctr = impressions ? (point.clicks / impressions) * 100 : 0;
      const cpc = point.clicks ? (point.spend / point.clicks) : 0;
      const cr = point.clicks ? (conversions / point.clicks) * 100 : 0;
      const cpa = conversions ? (point.spend / conversions) : 0;

      const byMetric = {
        spend: point.spend,
        impressions,
        ctr,
        clicks: point.clicks,
        cpc,
        conversions,
        cr,
        cpa
      };

      return { date: point.date, value: byMetric[metric] ?? 0 };
    });
  }

  function chartPalette() {
    const rootStyle = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    return {
      bg: isDark ? "rgba(255,255,255,0.02)" : "rgba(24,36,61,0.03)",
      grid: isDark ? "rgba(255,255,255,0.06)" : "rgba(99,113,138,0.22)",
      axis: isDark ? "rgba(255,255,255,0.60)" : "rgba(24,36,61,0.65)",
      legend: isDark ? "rgba(255,255,255,0.75)" : "rgba(24,36,61,0.80)",
      bars: isDark ? "rgba(109,94,252,0.35)" : "rgba(79,70,229,0.38)",
      line: rootStyle.getPropertyValue("--good").trim() || "#22c55e"
    };
  }

  function applyTheme(theme) {
    const normalized = theme === "dark" ? "dark" : "light";
    state.theme = normalized;
    document.documentElement.setAttribute("data-theme", normalized);
    localStorage.setItem("monitoring-theme", normalized);

    const btn = document.getElementById("themeToggle");
    if (btn) {
      const dark = normalized === "dark";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.textContent = dark ? "☀️ Светлая тема" : "🌙 Тёмная тема";
    }

    drawChart();
  }

  function bindThemeToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    const saved = localStorage.getItem("monitoring-theme");
    applyTheme(saved || "dark");

    btn.addEventListener("click", () => {
      applyTheme(state.theme === "dark" ? "light" : "dark");
    });
  }

  // --- KPI render (8 показателей) ---
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

  // --- Chart (Canvas, без библиотек) ---
  // --- Campaign calculations ---
  
const charts = createChartsModule({
  state,
  demo,
  getDailyMetric,
  getVisibleDailyData,
  getChannelDaily,
  chartPalette
});

const { renderSparklines, drawKpiDetailChart, bindKpiCards, drawChart } = charts;

const campaigns = createCampaignsModule({ state, demo, formatInt, formatMoney, formatPct });
const { renderCampaigns, bindCampaignControls } = campaigns;

function bindChannelControls() {
    document.querySelectorAll(".channelBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const clickedChannel = btn.dataset.channel || "search";
        state.selectedChannelKpi = state.selectedChannelKpi === clickedChannel ? null : clickedChannel;
        renderChannelSwitch();
      });
    });

    const chartChannel = document.getElementById("chartChannel");
    if (chartChannel) {
      chartChannel.value = state.chartChannel;
      chartChannel.addEventListener("change", () => {
        state.chartChannel = chartChannel.value;
        drawChart();
      });
    }

    const chartMode = document.getElementById("chartMode");
    if (chartMode) {
      chartMode.value = state.chartMode;
      chartMode.addEventListener("change", () => {
        state.chartMode = chartMode.value;
        drawChart();
      });
    }
  }

  function init() {
    bindPeriodControl();
    renderKPI();
    renderSparklines();
    renderAlerts();
    drawChart();
    bindChannelControls();
    bindCampaignControls();
    renderCampaigns();
    renderChannelSwitch();
    renderChannelButtons();
    bindKpiCards();
  }

function initApp() {
  window.addEventListener("resize", () => {
    drawChart();
    if (document.getElementById("kpiModal")?.classList.contains("open")) {
      drawKpiDetailChart(state.activeKpiMetric);
    }
  });
  bindThemeToggle();
  document.getElementById("refreshBtn").addEventListener("click", () => {
    renderKPI();
    renderSparklines();
    renderAlerts();
    drawChart();
    renderCampaigns();
    renderChannelSwitch();
    renderChannelButtons();
  });

  init();
  renderChannelButtons();
}


initApp();
