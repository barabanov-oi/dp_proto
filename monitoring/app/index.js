import { drawChart } from './chart.js';
import { renderAlerts } from './alerts.js';
import { bindCampaignControls, renderCampaigns } from './campaigns.js';
import { bindChannelControls, renderChannelButtons, renderChannelSwitch } from './channels.js';
import { bindKpiCards, bindPeriodControl, drawKpiDetailChart, renderKPI, renderSparklines } from './kpi.js';
import { state } from './store.js';
import { bindThemeToggle } from './theme.js';

function renderAll() {
  renderKPI();
  renderSparklines();
  renderAlerts();
  drawChart();
  renderCampaigns();
  renderChannelSwitch();
  renderChannelButtons();
}

export function initApp() {
  bindPeriodControl({ drawChart });
  bindChannelControls(drawChart);
  bindCampaignControls();
  bindKpiCards();
  bindThemeToggle(drawChart);

  document.getElementById('refreshBtn')?.addEventListener('click', renderAll);
  window.addEventListener('resize', () => {
    drawChart();
    if (document.getElementById('kpiModal')?.classList.contains('open')) {
      drawKpiDetailChart(state.activeKpiMetric);
    }
  });

  renderAll();
}
