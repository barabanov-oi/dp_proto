(function () {
  const ns = (window.MonitoringApp = window.MonitoringApp || {});

  ns.getChartSeries = function getChartSeries() {
    const source = ns.state.chartChannel === "all"
      ? ns.getVisibleDailyData()
      : ns.getChannelDaily(ns.state.chartChannel).slice(-ns.state.periodDays);

    if (ns.state.chartMode === "traffic") {
      return {
        points: source,
        left: source.map((p) => p.spend),
        right: source.map((p) => p.clicks),
        leftLabel: "Расход",
        rightLabel: "Клики",
        leftFormatter: (val) => `${Math.round(val / 1000)}k`,
        rightFormatter: (val) => Math.round(val)
      };
    }

    const converted = source.map((p, index) => {
      const conv = Math.max(1, Math.round(p.clicks * (0.17 + Math.sin(index / 2.7) * 0.03)));
      return { ...p, conv, cpa: p.spend / conv };
    });

    return {
      points: converted,
      left: converted.map((p) => p.conv),
      right: converted.map((p) => p.cpa),
      leftLabel: "Конверсии",
      rightLabel: "CPA",
      leftFormatter: (val) => Math.round(val),
      rightFormatter: (val) => `${Math.round(val)}₽`
    };
  };

  ns.drawChart = function drawChart() {
    const canvas = document.getElementById("chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const cssW = canvas.clientWidth || 900;
    const cssH = canvas.clientHeight || 260;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { l: 52, r: 52, t: 22, b: 34 };
    const plotW = cssW - pad.l - pad.r;
    const plotH = cssH - pad.t - pad.b;
    const chart = ns.getChartSeries();

    const maxLeft = Math.max(...chart.left) * 1.08;
    const maxRight = Math.max(...chart.right) * 1.12;
    const palette = ns.chartPalette();

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (plotH * i) / 5;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
    }

    ctx.fillStyle = palette.axis;
    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (plotH * i) / 5;
      ctx.fillText(chart.leftFormatter(maxLeft - (maxLeft * i) / 5), 10, y);
    }

    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (plotH * i) / 5;
      ctx.fillText(chart.rightFormatter(maxRight - (maxRight * i) / 5), cssW - 10, y);
    }

    const xAt = (i) => pad.l + (plotW * i) / (chart.points.length - 1);
    const yLeft = (v) => pad.t + plotH - (plotH * v) / maxLeft;
    const yRight = (v) => pad.t + plotH - (plotH * v) / maxRight;

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    for (let i = 0; i < chart.points.length; i += 2) {
      ctx.fillText(ns.formatDateLabel(chart.points[i].date), xAt(i) - 12, cssH - 10);
    }

    const barW = (plotW / chart.points.length) * 0.55;
    ctx.fillStyle = palette.bars;
    chart.points.forEach((_, i) => {
      const y = yLeft(chart.left[i]);
      ctx.fillRect(xAt(i) - barW / 2, y, barW, pad.t + plotH - y);
    });

    ctx.strokeStyle = palette.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    chart.points.forEach((_, i) => (i ? ctx.lineTo(xAt(i), yRight(chart.right[i])) : ctx.moveTo(xAt(i), yRight(chart.right[i]))));
    ctx.stroke();

    ctx.fillStyle = palette.line;
    chart.points.forEach((_, i) => {
      ctx.beginPath();
      ctx.arc(xAt(i), yRight(chart.right[i]), 3, 0, Math.PI * 2);
      ctx.fill();
    });

    const channelLabel = ns.state.chartChannel === "all" ? "все каналы" : ns.state.chartChannel === "search" ? "поиск" : "РСЯ";
    ctx.fillStyle = palette.legend;
    ctx.fillText(`▮ ${chart.leftLabel} (${channelLabel})`, pad.l, 16);
    ctx.fillStyle = palette.line;
    ctx.fillText(`— ${chart.rightLabel} (правая шкала)`, pad.l + 210, 16);
  };
})();
