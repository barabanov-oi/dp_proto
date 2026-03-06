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

    const chart = ns.getChartSeries();
    const palette = ns.chartPalette();
    const channelLabel = ns.state.chartChannel === "all" ? "все каналы" : ns.state.chartChannel === "search" ? "поиск" : "РСЯ";

    ns.charts = ns.charts || {};
    if (ns.charts.dashboardChart) ns.charts.dashboardChart.destroy();

    ns.charts.dashboardChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: chart.points.map((p) => ns.formatDateLabel(p.date)),
        datasets: [
          {
            type: "bar",
            label: `${chart.leftLabel} (${channelLabel})`,
            data: chart.left,
            backgroundColor: palette.bars,
            borderRadius: 4,
            yAxisID: "yLeft"
          },
          {
            type: "line",
            label: `${chart.rightLabel} (правая шкала)`,
            data: chart.right,
            borderColor: palette.line,
            backgroundColor: palette.line,
            tension: 0.32,
            pointRadius: 3,
            pointHoverRadius: 4,
            yAxisID: "yRight"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            labels: {
              color: palette.legend,
              usePointStyle: true,
              boxWidth: 10
            }
          },
          tooltip: {
            mode: "index",
            intersect: false
          }
        },
        interaction: {
          mode: "index",
          intersect: false
        },
        scales: {
          x: {
            ticks: {
              color: palette.axis,
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 7
            },
            grid: {
              color: palette.grid
            }
          },
          yLeft: {
            beginAtZero: true,
            position: "left",
            ticks: {
              color: palette.axis,
              callback: (value) => chart.leftFormatter(value)
            },
            grid: {
              color: palette.grid
            }
          },
          yRight: {
            beginAtZero: true,
            position: "right",
            ticks: {
              color: palette.axis,
              callback: (value) => chart.rightFormatter(value)
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  };
})();
