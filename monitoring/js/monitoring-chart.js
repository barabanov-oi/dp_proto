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
    if (!canvas || typeof Chart === "undefined") return;

    const palette = ns.chartPalette();
    const chartData = ns.getChartSeries();
    const channelLabel = ns.state.chartChannel === "all" ? "все каналы" : ns.state.chartChannel === "search" ? "поиск" : "РСЯ";

    const data = {
      labels: chartData.points.map((p) => ns.formatDateLabel(p.date)),
      datasets: [
        {
          type: "bar",
          label: `${chartData.leftLabel} (${channelLabel})`,
          data: chartData.left,
          backgroundColor: palette.bars,
          borderRadius: 5,
          yAxisID: "y"
        },
        {
          type: "line",
          label: `${chartData.rightLabel} (правая шкала)`,
          data: chartData.right,
          yAxisID: "y1",
          borderColor: palette.line,
          backgroundColor: palette.line,
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.35
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: palette.legend } },
        tooltip: {
          callbacks: {
            label(context) {
              const formatter = context.datasetIndex === 0 ? chartData.leftFormatter : chartData.rightFormatter;
              return `${context.dataset.label}: ${formatter(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: palette.axis, maxTicksLimit: 7 },
          grid: { color: palette.grid }
        },
        y: {
          position: "left",
          ticks: { color: palette.axis, callback: (val) => chartData.leftFormatter(Number(val)) },
          grid: { color: palette.grid }
        },
        y1: {
          position: "right",
          ticks: { color: palette.axis, callback: (val) => chartData.rightFormatter(Number(val)) },
          grid: { drawOnChartArea: false, color: palette.grid }
        }
      }
    };

    if (ns.state.mainChartInstance) {
      ns.state.mainChartInstance.data = data;
      ns.state.mainChartInstance.options = options;
      ns.state.mainChartInstance.update();
      return;
    }

    ns.state.mainChartInstance = new Chart(canvas, {
      type: "bar",
      data,
      options
    });
  };
})();
