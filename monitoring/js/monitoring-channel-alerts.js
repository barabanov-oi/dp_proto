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

  ns.renderChannelSummary = function renderChannelSummary() {
    const tbody = document.getElementById("channelSummaryBody");
    if (!tbody) return;

    const channels = [
      { key: "search", label: "Поиск" },
      { key: "rsya", label: "РСЯ" }
    ];

    tbody.innerHTML = channels.map(({ key, label }) => {
      const totals = ns.aggregateByName(label);
      const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
      const cpc = totals.clicks ? totals.spend / totals.clicks : 0;
      const cr = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
      const cpa = totals.conversions ? totals.spend / totals.conversions : 0;
      const delta = ns.demo.channelDeltas[key] || {};

      return `
        <tr>
          <td>${label}</td>
          <td class="mono">${ns.formatMoney(totals.spend, 0)}<br><span class="trendInline" data-delta="${delta.spend ?? 0}"></span></td>
          <td class="mono">${ns.formatInt(totals.impressions)}</td>
          <td class="mono">${ns.formatInt(totals.clicks)}<br><span class="trendInline" data-delta="${delta.clicks ?? 0}"></span></td>
          <td class="mono">${ns.formatPct(ctr, 2)}<br><span class="trendInline" data-delta="${delta.ctr ?? 0}"></span></td>
          <td class="mono">${ns.formatMoney(cpc, 2)}<br><span class="trendInline" data-delta="${delta.cpc ?? 0}"></span></td>
          <td class="mono">${ns.formatInt(totals.conversions)}<br><span class="trendInline" data-delta="${delta.conversions ?? 0}"></span></td>
          <td class="mono">${ns.formatPct(cr, 2)}<br><span class="trendInline" data-delta="${delta.cr ?? 0}"></span></td>
          <td class="mono">${ns.formatMoney(cpa, 2)}<br><span class="trendInline" data-delta="${delta.cpa ?? 0}"></span></td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".trendInline").forEach((el) => ns.setDelta(el, Number(el.dataset.delta)));
  };

  ns.bindChannelControls = function bindChannelControls() {
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
