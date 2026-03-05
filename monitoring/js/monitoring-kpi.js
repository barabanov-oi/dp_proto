(function () {
  const ns = (window.MonitoringApp = window.MonitoringApp || {});

  ns.chartPalette = function chartPalette() {
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
  };

  ns.applyTheme = function applyTheme(theme) {
    const normalized = theme === "dark" ? "dark" : "light";
    ns.state.theme = normalized;
    document.documentElement.setAttribute("data-theme", normalized);
    localStorage.setItem("monitoring-theme", normalized);

    const btn = document.getElementById("themeToggle");
    if (btn) {
      const dark = normalized === "dark";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.textContent = dark ? "☀️ Светлая тема" : "🌙 Тёмная тема";
    }

    ns.drawChart();
  };

  ns.bindThemeToggle = function bindThemeToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    ns.applyTheme(localStorage.getItem("monitoring-theme") || "dark");
    btn.addEventListener("click", () => ns.applyTheme(ns.state.theme === "dark" ? "light" : "dark"));
  };

  ns.renderKPI = function renderKPI() {
    const points = ns.getVisibleDailyData();
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

    document.getElementById("kpiSpend").textContent = ns.formatMoney(totals.spend, 0);
    document.getElementById("kpiBalance").textContent = ns.formatMoney(ns.demo.totals.balance, 2);
    document.getElementById("kpiImpr").textContent = ns.formatInt(totals.impressions);
    document.getElementById("kpiCtr").textContent = ns.formatPct(ctr, 2);
    document.getElementById("kpiClicks").textContent = ns.formatInt(totals.clicks);
    document.getElementById("kpiCpc").textContent = ns.formatMoney(cpc, 2);
    document.getElementById("kpiConv").textContent = ns.formatInt(totals.conversions);
    document.getElementById("kpiCr").textContent = ns.formatPct(cr, 2);
    document.getElementById("kpiCpa").textContent = ns.formatMoney(cpa, 2);

    ns.setDelta(document.getElementById("deltaSpend"), ns.demo.deltas.spend);
    ns.setDelta(document.getElementById("deltaImpr"), ns.demo.deltas.impressions);
    ns.setDelta(document.getElementById("deltaCtr"), ns.demo.deltas.ctr);
    ns.setDelta(document.getElementById("deltaClicks"), ns.demo.deltas.clicks);
    ns.setDelta(document.getElementById("deltaCpc"), ns.demo.deltas.cpc);
    ns.setDelta(document.getElementById("deltaConv"), ns.demo.deltas.conv);
    ns.setDelta(document.getElementById("deltaCr"), ns.demo.deltas.cr);
    ns.setDelta(document.getElementById("deltaCpa"), ns.demo.deltas.cpa);

    document.querySelectorAll(".kpiCard").forEach((card) => {
      const delta = card.querySelector(".delta");
      card.classList.toggle("kpiCritical", Boolean(delta && delta.classList.contains("bad")));
    });

  };

  function renderSparkline(svgId, metric) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const series = ns.getDailyMetric(metric, 7).map((p) => p.value);
    const max = Math.max(...series);
    const min = Math.min(...series);
    const span = max - min || 1;
    const points = series
      .map((value, index) => `${((index / (series.length - 1 || 1)) * 120).toFixed(2)},${(32 - ((value - min) / span) * 28 - 2).toFixed(2)}`)
      .join(" ");
    svg.innerHTML = `<polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
  }

  ns.renderSparklines = function renderSparklines() {
    renderSparkline("sparkSpend", "spend");
    renderSparkline("sparkImpressions", "impressions");
    renderSparkline("sparkCtr", "ctr");
    renderSparkline("sparkClicks", "clicks");
    renderSparkline("sparkCpc", "cpc");
    renderSparkline("sparkConversions", "conversions");
    renderSparkline("sparkCr", "cr");
    renderSparkline("sparkCpa", "cpa");
  };

  ns.drawKpiDetailChart = function drawKpiDetailChart(metric) {
    const canvas = document.getElementById("kpiDetailChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const points = ns.getDailyMetric(metric, 14);
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

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = ns.chartPalette().bg;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = ns.chartPalette().grid;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
    }

    const xAt = (i) => pad.l + (plotW * i) / (values.length - 1 || 1);
    const yAt = (v) => pad.t + plotH - ((v - min) / span) * plotH;

    ctx.strokeStyle = "#6d5efc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => (i === 0 ? ctx.moveTo(xAt(i), yAt(v)) : ctx.lineTo(xAt(i), yAt(v))));
    ctx.stroke();

    ctx.fillStyle = "#6d5efc";
    values.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xAt(i), yAt(v), 2.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = ns.chartPalette().axis;
    ctx.font = "12px ui-sans-serif";
    for (let i = 0; i < points.length; i += 2) {
      ctx.fillText(ns.formatDateLabel(points[i].date), xAt(i) - 12, cssH - 10);
    }
  };

  ns.bindKpiCards = function bindKpiCards() {
    const modal = document.getElementById("kpiModal");
    const close = document.getElementById("kpiModalClose");
    const title = document.getElementById("kpiModalTitle");
    if (!modal || !close || !title) return;

    const labels = { spend: "Расход", impressions: "Показы", ctr: "CTR", clicks: "Клики", cpc: "CPC", conversions: "Конверсии", cr: "CR", cpa: "CPA" };
    const openModal = (metric) => {
      ns.state.activeKpiMetric = metric;
      title.textContent = `Динамика: ${labels[metric] || "Показатель"} (14 дней)`;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      ns.drawKpiDetailChart(metric);
    };

    document.querySelectorAll(".kpiCard[data-metric]").forEach((card) => {
      const metric = card.dataset.metric || "spend";
      card.addEventListener("click", () => openModal(metric));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModal(metric);
        }
      });
    });

    const closeModal = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    };

    close.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => event.target === modal && closeModal());
  };
})();
