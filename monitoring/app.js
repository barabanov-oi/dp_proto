(function () {
  const ns = (window.MonitoringApp = window.MonitoringApp || {});

  function refreshDashboard() {
    ns.renderKPI();
    ns.renderSparklines();
    ns.renderAlerts();
    ns.drawChart();
    ns.renderCampaigns();
    ns.renderChannelSummary();
  }

  function bindGlobalHandlers() {
    window.addEventListener("resize", () => {
      ns.drawChart();
      if (document.getElementById("kpiModal")?.classList.contains("open")) {
        ns.drawKpiDetailChart(ns.state.activeKpiMetric);
      }
    });

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", refreshDashboard);
  }

  ns.init = function init() {
    ns.bindPeriodControl();
    ns.bindThemeToggle();
    ns.bindChannelControls();
    ns.bindCampaignControls();
    ns.bindKpiCards();
    bindGlobalHandlers();
    refreshDashboard();
  };

  ns.init();
})();
