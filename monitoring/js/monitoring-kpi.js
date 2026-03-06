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
      line: rootStyle.getPropertyValue("--good").trim() || "#22c55e",
      accent: rootStyle.getPropertyValue("--accent").trim() || "#6d5efc"
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
    ns.renderSparklines();
    if (document.getElementById("kpiModal")?.classList.contains("open")) {
      ns.drawKpiDetailChart(ns.state.activeKpiMetric);
    }
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

    document.getElementById("lastUpdateTag").textContent = `Обновлено: ${new Date().toLocaleString("ru-RU")}`;
  };

  function renderSparkline(canvasId, metric) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") return;

    const values = ns.getDailyMetric(metric, 7).map((p) => p.value);
    const palette = ns.chartPalette();

    ns.charts = ns.charts || {};
    ns.charts.sparklines = ns.charts.sparklines || {};

    if (ns.charts.sparklines[canvasId]) {
      ns.charts.sparklines[canvasId].data.datasets[0].data = values;
      ns.charts.sparklines[canvasId].data.datasets[0].borderColor = palette.accent;
      ns.charts.sparklines[canvasId].update();
      return;
    }

    ns.charts.sparklines[canvasId] = new Chart(canvas, {
      type: "line",
      data: {
        labels: values.map((_, index) => index + 1),
        datasets: [{
          data: values,
          borderColor: palette.accent,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        elements: {
          line: { capBezierPoints: true }
        }
      }
    });
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
    if (!canvas || typeof Chart === "undefined") return;

    const points = ns.getDailyMetric(metric, 14);
    const labels = points.map((point, index) => (index % 2 === 0 ? ns.formatDateLabel(point.date) : ""));
    const values = points.map((p) => p.value);
    const palette = ns.chartPalette();

    ns.charts = ns.charts || {};
    if (ns.charts.kpiDetail) {
      ns.charts.kpiDetail.data.labels = labels;
      ns.charts.kpiDetail.data.datasets[0].data = values;
      ns.charts.kpiDetail.options.scales.x.ticks.color = palette.axis;
      ns.charts.kpiDetail.options.scales.y.ticks.color = palette.axis;
      ns.charts.kpiDetail.options.scales.x.grid.color = palette.grid;
      ns.charts.kpiDetail.options.scales.y.grid.color = palette.grid;
      ns.charts.kpiDetail.data.datasets[0].borderColor = palette.accent;
      ns.charts.kpiDetail.data.datasets[0].pointBackgroundColor = palette.accent;
      ns.charts.kpiDetail.update();
      return;
    }

    ns.charts.kpiDetail = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Динамика",
          data: values,
          borderColor: palette.accent,
          pointBackgroundColor: palette.accent,
          pointRadius: 2.8,
          tension: 0.25,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: palette.axis, autoSkip: false, maxRotation: 0, minRotation: 0 },
            grid: { color: palette.grid }
          },
          y: {
            ticks: { color: palette.axis },
            grid: { color: palette.grid }
          }
        }
      }
    });
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
