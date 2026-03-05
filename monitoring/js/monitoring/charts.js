export function createChartsModule({
  state,
  demo,
  getDailyMetric,
  getVisibleDailyData,
  getChannelDaily,
  chartPalette
}) {
  function formatDateLabel(iso) {
    const d = new Date(iso + "T00:00:00");
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}`;
  }

  function renderSparkline(svgId, metric) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const series = getDailyMetric(metric, 7).map((p) => p.value);
    const width = 120;
    const height = 32;
    const max = Math.max(...series);
    const min = Math.min(...series);
    const span = max - min || 1;

    const points = series
      .map((value, index) => {
        const x = (index / (series.length - 1 || 1)) * width;
        const y = height - ((value - min) / span) * (height - 4) - 2;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    svg.innerHTML = `<polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
  }

  function renderSparklines() {
    renderSparkline("sparkSpend", "spend");
    renderSparkline("sparkImpressions", "impressions");
    renderSparkline("sparkCtr", "ctr");
    renderSparkline("sparkClicks", "clicks");
    renderSparkline("sparkCpc", "cpc");
    renderSparkline("sparkConversions", "conversions");
    renderSparkline("sparkCr", "cr");
    renderSparkline("sparkCpa", "cpa");
  }

  function drawKpiDetailChart(metric) {
    const canvas = document.getElementById("kpiDetailChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = chartPalette().bg;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = chartPalette().grid;
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
    values.forEach((v, i) => {
      const x = xAt(i);
      const y = yAt(v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "#6d5efc";
    values.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xAt(i), yAt(v), 2.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = chartPalette().axis;
    ctx.font = "12px ui-sans-serif";
    for (let i = 0; i < points.length; i += 2) {
      ctx.fillText(formatDateLabel(points[i].date), xAt(i) - 12, cssH - 10);
    }
  }

  function bindKpiCards() {
    const modal = document.getElementById("kpiModal");
    const close = document.getElementById("kpiModalClose");
    const title = document.getElementById("kpiModalTitle");
    if (!modal || !close || !title) return;

    const openModal = (metric) => {
      state.activeKpiMetric = metric;
      const labels = {
        spend: "Расход", impressions: "Показы", ctr: "CTR", clicks: "Клики",
        cpc: "CPC", conversions: "Конверсии", cr: "CR", cpa: "CPA"
      };
      title.textContent = `Динамика: ${labels[metric] || "Показатель"} (14 дней)`;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      drawKpiDetailChart(metric);
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

    close.addEventListener("click", () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      }
    });
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

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, w, h);

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

    ctx.fillStyle = palette.axis;
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    for (let i = 0; i <= gridY; i++) {
      const y = pad.t + (plotH * i) / gridY;
      const val = maxLeft - (maxLeft * i) / gridY;
      ctx.fillText(chart.leftFormatter(val), 10, y);
    }

    ctx.textAlign = "right";
    for (let i = 0; i <= gridY; i++) {
      const y = pad.t + (plotH * i) / gridY;
      const val = maxRight - (maxRight * i) / gridY;
      ctx.fillText(chart.rightFormatter(val), w - 10, y);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    for (let i = 0; i < points.length; i += 2) {
      const x = pad.l + (plotW * i) / (points.length - 1);
      ctx.fillText(formatDateLabel(points[i].date), x - 12, h - 10);
    }

    const xAt = (i) => pad.l + (plotW * i) / (points.length - 1);
    const yLeft = (v) => pad.t + plotH - (plotH * v) / maxLeft;
    const yRight = (v) => pad.t + plotH - (plotH * v) / maxRight;

    const barW = (plotW / points.length) * 0.55;
    ctx.fillStyle = palette.bars;
    for (let i = 0; i < points.length; i++) {
      const x = xAt(i) - barW / 2;
      const y = yLeft(leftSeries[i]);
      const bh = pad.t + plotH - y;
      ctx.fillRect(x, y, barW, bh);
    }

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

    ctx.fillStyle = palette.line;
    for (let i = 0; i < points.length; i++) {
      const x = xAt(i);
      const y = yRight(rightSeries[i]);
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = palette.axis;
    ctx.font = "12px ui-sans-serif";
    ctx.fillText(`■ ${chart.leftLabel}`, pad.l, 14);
    ctx.fillStyle = palette.line;
    ctx.fillText(`● ${chart.rightLabel}`, pad.l + 100, 14);
  }

  return {
    renderSparklines,
    drawKpiDetailChart,
    bindKpiCards,
    drawChart
  };
}
