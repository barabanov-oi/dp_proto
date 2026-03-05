import { formatInt, formatMoney, formatPct, demo, state } from './app-core.js';
import { drawChart } from './app-charts.js';
import { renderChannelSwitch } from './app-kpi.js';
import { calcCtr, calcCpc, calcCr, calcCpa, cellClass, statusFromFlags, buildFlags, scoreFlags, applyFilter, applySort, createTrendElement } from './app-campaign-utils.js';

function renderCampaigns() {
  const tbody = document.getElementById("campaignsBody");
  if (!tbody) return;

  const maxSpend = Math.max(...demo.campaigns.map(c => c.spend));

  // prepare computed rows
  const computed = demo.campaigns.map((c) => {
    const ctr = calcCtr(c.clicks, c.impr);
    const cpc = calcCpc(c.spend, c.clicks);
    const cr = calcCr(c.conv, c.clicks);
    const cpa = calcCpa(c.spend, c.conv);

    const flags = buildFlags({ ctr, cpc, cr, cpa });
    const status = statusFromFlags(flags);
    const sevScore = scoreFlags(flags);

    return { ...c, ctr, cpc, cr, cpa, flags, status, sevScore };
  });

  // filter + sort
  const filtered = applyFilter(computed);
  const rows = applySort(filtered);

  // render
  tbody.innerHTML = "";

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.className = "campaignRow";
    const trend = demo.campaignDeltas[r.name] || {};

    // name
    const tdName = document.createElement("td");
    tdName.className = "campaignNameCell";
    tdName.dataset.label = "Кампания";
    tdName.textContent = r.name;
    tr.appendChild(tdName);

    // status
    const tdStatus = document.createElement("td");
    tdStatus.dataset.label = "Статус";
    const tag = document.createElement("span");
    tag.className = "tag " + r.status.cls;
    tag.textContent = r.status.text;
    tdStatus.appendChild(tag);
    tr.appendChild(tdStatus);

    // spend with microbar
    const tdSpend = document.createElement("td");
    tdSpend.dataset.label = "Расход";
    tdSpend.className = "mono spendCell";
    tdSpend.textContent = formatMoney(r.spend, 2);
    tdSpend.appendChild(createTrendElement(trend.spend ?? 0, true));

    const bar = document.createElement("div");
    bar.className = "spendBar";
    const fill = document.createElement("i");
    fill.style.width = `${Math.max(3, (r.spend / maxSpend) * 100)}%`;
    bar.appendChild(fill);
    tdSpend.appendChild(bar);

    tr.appendChild(tdSpend);

    // ctr (highlight)
    const tdCtr = document.createElement("td");
    tdCtr.dataset.label = "CTR";
    tdCtr.className = "mono " + cellClass(r.ctr, "ctr");
    tdCtr.textContent = formatPct(r.ctr, 2);
    tdCtr.appendChild(createTrendElement(trend.ctr ?? 0));
    tr.appendChild(tdCtr);

    // clicks
    const tdClicks = document.createElement("td");
    tdClicks.dataset.label = "Клики";
    tdClicks.className = "mono";
    tdClicks.textContent = formatInt(r.clicks);
    tdClicks.appendChild(createTrendElement(trend.clicks ?? 0));
    tr.appendChild(tdClicks);

    // cpc (highlight)
    const tdCpc = document.createElement("td");
    tdCpc.dataset.label = "CPC";
    tdCpc.className = "mono " + cellClass(r.cpc, "cpc");
    tdCpc.textContent = formatMoney(r.cpc, 2);
    tdCpc.appendChild(createTrendElement(trend.cpc ?? 0, true));
    tr.appendChild(tdCpc);

    // conv
    const tdConv = document.createElement("td");
    tdConv.dataset.label = "Конверсии";
    tdConv.className = "mono";
    tdConv.textContent = formatInt(r.conv);
    tdConv.appendChild(createTrendElement(trend.conv ?? 0));
    tr.appendChild(tdConv);

    // cr (highlight)
    const tdCr = document.createElement("td");
    tdCr.dataset.label = "CR";
    tdCr.className = "mono " + cellClass(r.cr, "cr");
    tdCr.textContent = formatPct(r.cr, 2);
    tdCr.appendChild(createTrendElement(trend.cr ?? 0));
    tr.appendChild(tdCr);

    // cpa (highlight)
    const tdCpa = document.createElement("td");
    tdCpa.dataset.label = "CPA";
    tdCpa.className = "mono " + cellClass(r.cpa, "cpa");
    tdCpa.textContent = formatMoney(r.cpa, 2);
    tdCpa.appendChild(createTrendElement(trend.cpa ?? 0, true));
    tr.appendChild(tdCpa);

    tbody.appendChild(tr);

    const detailsTr = document.createElement("tr");
    detailsTr.className = "campaignDetails hidden";
    const detailsTd = document.createElement("td");
    detailsTd.colSpan = 9;

    const detailsWrap = document.createElement("div");
    detailsWrap.className = "campaignDetailsWrap";

    const head = document.createElement("div");
    head.className = "campaignDetailsHead";

    const title = document.createElement("b");
    title.textContent = "Критичные показатели";
    head.appendChild(title);

    const reviewBtn = document.createElement("button");
    reviewBtn.type = "button";
    reviewBtn.className = "btn btnTiny";
    reviewBtn.textContent = "Обзор";
    reviewBtn.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    head.appendChild(reviewBtn);

    const metrics = document.createElement("div");
    metrics.className = "detailMetrics";
    const metricItems = [
      { metric: "ctr", label: "CTR", value: formatPct(r.ctr, 2), trend: trend.ctr ?? 0, inverse: false },
      { metric: "cpc", label: "CPC", value: formatMoney(r.cpc, 2), trend: trend.cpc ?? 0, inverse: true },
      { metric: "cr", label: "CR", value: formatPct(r.cr, 2), trend: trend.cr ?? 0, inverse: false },
      { metric: "cpa", label: "CPA", value: formatMoney(r.cpa, 2), trend: trend.cpa ?? 0, inverse: true }
    ];

    const metricFlags = new Map(r.flags.map((flag) => [flag.metric, flag]));
    const flaggedMetrics = metricItems.filter((item) => metricFlags.has(item.metric));

    flaggedMetrics.forEach((item) => {
      const flag = metricFlags.get(item.metric);
      const card = document.createElement("div");
      card.className = "detailMetricCard " + flag.level;

      const label = document.createElement("span");
      label.className = "detailMetricLabel";
      label.textContent = item.label;

      const value = document.createElement("span");
      value.className = "detailMetricValue mono";
      value.textContent = item.value;
      value.appendChild(createTrendElement(item.trend, item.inverse));

      const warning = document.createElement("small");
      warning.className = "detailMetricWarning";
      warning.textContent = `⚠ ${flag.text}: требуется проверка.`;

      card.appendChild(label);
      card.appendChild(value);
      card.appendChild(warning);
      metrics.appendChild(card);
    });

    if (flaggedMetrics.length === 0) {
      const noProblems = document.createElement("div");
      noProblems.className = "detailMetricEmpty";
      noProblems.textContent = "Отклонений по контролируемым показателям не обнаружено.";
      metrics.appendChild(noProblems);
    }

    detailsWrap.appendChild(head);
    detailsWrap.appendChild(metrics);
    detailsTd.appendChild(detailsWrap);
    detailsTr.appendChild(detailsTd);
    tbody.appendChild(detailsTr);

    tr.addEventListener("click", () => {
      detailsTr.classList.toggle("hidden");
    });
  });

  // tag
  const tagEl = document.getElementById("campaignsTag");
  if (tagEl) tagEl.textContent = `показано: ${rows.length} / всего: ${demo.campaigns.length}`;
}

// --- UI bindings for campaigns controls ---
function bindCampaignControls() {
  // segmented filter
  document.querySelectorAll(".segBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".segBtn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filter = btn.dataset.filter || "all";
      renderCampaigns();
    });
  });

  // sort
  const sortBy = document.getElementById("sortBy");
  if (sortBy) {
    sortBy.addEventListener("change", () => {
      state.sortBy = sortBy.value;
      renderCampaigns();
    });
  }
}

function bindChannelControls() {
  document.querySelectorAll(".channelBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const clickedChannel = btn.dataset.channel || "search";
      state.selectedChannelKpi = state.selectedChannelKpi === clickedChannel ? null : clickedChannel;
      renderChannelSwitch();
    });
  });

  const chartChannel = document.getElementById("chartChannel");
  if (chartChannel) {
    chartChannel.value = state.chartChannel;
    chartChannel.addEventListener("change", () => {
      state.chartChannel = chartChannel.value;
      drawChart();
    });
  }

  const chartMode = document.getElementById("chartMode");
  if (chartMode) {
    chartMode.value = state.chartMode;
    chartMode.addEventListener("change", () => {
      state.chartMode = chartMode.value;
      drawChart();
    });
  }
}

export { renderCampaigns, bindCampaignControls, bindChannelControls };
