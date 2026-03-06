(function () {
  const ns = (window.MonitoringApp = window.MonitoringApp || {});

  function dateLabels(points) {
    return points.map((point, index) => (index % 2 === 0 ? ns.formatDateLabel(point.date) : ""));
  }

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

    const chart = ns.getChartSeries();
    const labels = dateLabels(chart.points);
    const palette = ns.chartPalette();
    const channelLabel = ns.state.chartChannel === "all" ? "все каналы" : ns.state.chartChannel === "search" ? "поиск" : "РСЯ";

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: palette.legend }
        },
        tooltip: {
          callbacks: {
            label(context) {
              if (context.dataset.yAxisID === "yLeft") {
                return `${chart.leftLabel}: ${chart.leftFormatter(context.parsed.y)}`;
              }
              return `${chart.rightLabel}: ${chart.rightFormatter(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: palette.grid },
          ticks: { color: palette.axis, autoSkip: false, maxRotation: 0, minRotation: 0 }
        },
        yLeft: {
          type: "linear",
          position: "left",
          grid: { color: palette.grid },
          ticks: {
            color: palette.axis,
            callback: (value) => chart.leftFormatter(value)
          }
        },
        yRight: {
          type: "linear",
          position: "right",
          grid: { drawOnChartArea: false, color: palette.grid },
          ticks: {
            color: palette.axis,
            callback: (value) => chart.rightFormatter(value)
          }
        }
      }
    };

    const datasets = [
      {
        type: "bar",
        label: `${chart.leftLabel} (${channelLabel})`,
        data: chart.left,
        yAxisID: "yLeft",
        backgroundColor: palette.bars,
        borderRadius: 4,
        barPercentage: 0.62,
        categoryPercentage: 0.72
      },
      {
        type: "line",
        label: `${chart.rightLabel} (правая шкала)`,
        data: chart.right,
        yAxisID: "yRight",
        borderColor: palette.line,
        backgroundColor: palette.line,
        pointRadius: 3,
        pointHoverRadius: 4,
        tension: 0.28
      }
    ];

    ns.charts = ns.charts || {};
    if (ns.charts.main) {
      ns.charts.main.data.labels = labels;
      ns.charts.main.data.datasets = datasets;
      ns.charts.main.options = commonOptions;
      ns.charts.main.update();
      return;
    }

    ns.charts.main = new Chart(canvas, {
      type: "bar",
      data: { labels, datasets },
      options: commonOptions
    });
  };
})();
