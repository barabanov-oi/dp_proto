import { state, bindThemeToggle } from './js/app-core.js';
import { renderKPI, renderSparklines, renderAlerts, renderChannelSwitch, renderChannelButtons, bindKpiCards, bindPeriodControl } from './js/app-kpi.js';
import { drawChart } from './js/app-charts.js';
import { drawKpiDetailChart } from './js/app-kpi-details.js';
import { renderCampaigns, bindCampaignControls, bindChannelControls } from './js/app-campaigns.js';

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
  window.addEventListener('resize', () => {
    drawChart();
    if (document.getElementById('kpiModal')?.classList.contains('open')) {
      drawKpiDetailChart(state.activeKpiMetric);
    }
  });

  bindThemeToggle();
  document.getElementById('refreshBtn').addEventListener('click', () => {
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
