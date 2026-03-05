(function () {
  const ns = (window.MonitoringApp = window.MonitoringApp || {});

  ns.renderAlerts = function renderAlerts() {
    const ul = document.getElementById("alertsList");
    if (!ul) return;
    ul.innerHTML = "";
    ns.demo.alerts.forEach((a) => {
      const li = document.createElement("li");
      li.className = "statusItem";
      li.innerHTML = `<div class="statusLeft"><div class="badge ${a.level || ""}"></div><div><b>${a.title}</b><small>${a.desc}</small></div></div><div class="statusRight">${a.right || ""}</div>`;
      ul.appendChild(li);
    });
    document.getElementById("alertsCount").textContent = `${ns.demo.alerts.length} сигнала`;
  };

  ns.renderChannelKpi = function renderChannelKpi(channel) {
    const container = document.getElementById("channelKpiGrid");
    if (!container) return;
    const totals = ns.aggregateByName(channel === "search" ? "Поиск" : "РСЯ");
    const delta = ns.demo.channelDeltas[channel];

    const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
    const cpc = totals.clicks ? totals.spend / totals.clicks : 0;
    const cr = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpa = totals.conversions ? totals.spend / totals.conversions : 0;

    const cards = [
      ["Расход", ns.formatMoney(totals.spend, 0), delta.spend], ["CTR", ns.formatPct(ctr, 2), delta.ctr],
      ["CR", ns.formatPct(cr, 2), delta.cr], ["CPA", ns.formatMoney(cpa, 2), delta.cpa],
      ["Клики", ns.formatInt(totals.clicks), delta.clicks], ["Показы", ns.formatInt(totals.impressions), delta.impressions],
      ["Конверсии", ns.formatInt(totals.conversions), delta.conversions], ["CPC", ns.formatMoney(cpc, 2), delta.cpc]
    ];

    container.innerHTML = cards.map(([label, value, d]) => `<div class="kpiCard"><div class="kpiTop"><div><div class="kpiLabel">${label}</div></div><span class="delta" data-delta="${d}"></span></div><div class="kpiValue mono">${value}</div></div>`).join("");
    container.querySelectorAll("[data-delta]").forEach((el) => ns.setDelta(el, Number(el.dataset.delta)));
  };

  ns.renderChannelButtons = function renderChannelButtons() {
    document.querySelectorAll(".channelBtn").forEach((btn) => {
      const channel = btn.dataset.channel || "search";
      const totals = ns.aggregateByName(channel === "search" ? "Поиск" : "РСЯ");
      const delta = ns.demo.channelDeltas[channel] || {};
      btn.innerHTML = `<span class="channelBtnTitle">${channel === "search" ? "Поиск" : "РСЯ"}</span><span class="channelBtnMeta"><span>Расход ${ns.formatMoney(totals.spend, 0)} ${delta.spend >= 0 ? "▲" : "▼"} ${Math.abs(delta.spend ?? 0).toFixed(1)}%</span><span>Клики ${ns.formatInt(totals.clicks)} ${delta.clicks >= 0 ? "▲" : "▼"} ${Math.abs(delta.clicks ?? 0).toFixed(1)}%</span><span>Конверсии ${ns.formatInt(totals.conversions)} ${delta.conversions >= 0 ? "▲" : "▼"} ${Math.abs(delta.conversions ?? 0).toFixed(1)}%</span></span>`;
    });
  };

  ns.renderChannelSwitch = function renderChannelSwitch() {
    const grid = document.getElementById("channelKpiGrid");
    document.querySelectorAll(".channelBtn").forEach((btn) => {
      const isActive = btn.dataset.channel === ns.state.selectedChannelKpi;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-expanded", isActive ? "true" : "false");
    });

    if (!grid) return;
    if (!ns.state.selectedChannelKpi) {
      grid.classList.add("hidden");
      grid.innerHTML = "";
      return;
    }

    grid.classList.remove("hidden");
    ns.renderChannelKpi(ns.state.selectedChannelKpi);
  };

  ns.bindChannelControls = function bindChannelControls() {
    document.querySelectorAll(".channelBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const channel = btn.dataset.channel || "search";
        ns.state.selectedChannelKpi = ns.state.selectedChannelKpi === channel ? null : channel;
        ns.renderChannelSwitch();
      });
    });

    const chartChannel = document.getElementById("chartChannel");
    if (chartChannel) {
      chartChannel.value = ns.state.chartChannel;
      chartChannel.addEventListener("change", () => {
        ns.state.chartChannel = chartChannel.value;
        ns.drawChart();
      });
    }

    const chartMode = document.getElementById("chartMode");
    if (chartMode) {
      chartMode.value = ns.state.chartMode;
      chartMode.addEventListener("change", () => {
        ns.state.chartMode = chartMode.value;
        ns.drawChart();
      });
    }
  };

  ns.bindPeriodControl = function bindPeriodControl() {
    const periodSelect = document.getElementById("periodPreset");
    if (!periodSelect) return;

    periodSelect.value = String(ns.state.periodDays);
    periodSelect.addEventListener("change", () => {
      ns.state.periodDays = Number(periodSelect.value) || 14;
      ns.renderKPI();
      ns.renderSparklines();
      ns.drawChart();
      if (document.getElementById("kpiModal")?.classList.contains("open")) ns.drawKpiDetailChart(ns.state.activeKpiMetric);
    });
  };
})();
