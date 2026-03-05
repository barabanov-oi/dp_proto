export function createCampaignsModule({ state, demo, formatInt, formatMoney, formatPct }) {
  function calcCtr(clicks, impr) { return impr ? (clicks / impr) * 100 : 0; }
  function calcCpc(spend, clicks) { return clicks ? (spend / clicks) : 0; }
  function calcCr(conv, clicks) { return clicks ? (conv / clicks) * 100 : 0; }
  function calcCpa(spend, conv) { return conv ? (spend / conv) : 0; }

  const thresholds = { ctrBad: 0.9, ctrWarn: 1.2, cpcBad: 35, cpcWarn: 28, crBad: 10, crWarn: 14, cpaBad: 350, cpaWarn: 240 };

  function cellClass(value, metric) {
    if (metric === "ctr") return value < thresholds.ctrBad ? "cellBad" : value < thresholds.ctrWarn ? "cellWarn" : "cellOk";
    if (metric === "cpc") return value > thresholds.cpcBad ? "cellBad" : value > thresholds.cpcWarn ? "cellWarn" : "cellOk";
    if (metric === "cr") return value < thresholds.crBad ? "cellBad" : value < thresholds.crWarn ? "cellWarn" : "cellOk";
    if (metric === "cpa") return value > thresholds.cpaBad ? "cellBad" : value > thresholds.cpaWarn ? "cellWarn" : "cellOk";
    return "";
  }

  function statusFromFlags(flags) {
    const hasBad = flags.some(f => f.level === "bad");
    const hasWarn = flags.some(f => f.level === "warn");
    if (hasBad) return { text: "Критично", cls: "bad", severity: 2 };
    if (hasWarn) return { text: "Внимание", cls: "warn", severity: 1 };
    return { text: "OK", cls: "good", severity: 0 };
  }

  function buildFlags({ ctr, cpc, cr, cpa }) {
    const flags = [];
    if (ctr < thresholds.ctrBad) flags.push({ metric: "ctr", level: "bad", text: "CTR низкий" });
    else if (ctr < thresholds.ctrWarn) flags.push({ metric: "ctr", level: "warn", text: "CTR проседает" });
    if (cpc > thresholds.cpcBad) flags.push({ metric: "cpc", level: "bad", text: "CPC высокий" });
    else if (cpc > thresholds.cpcWarn) flags.push({ metric: "cpc", level: "warn", text: "CPC растёт" });
    if (cr < thresholds.crBad) flags.push({ metric: "cr", level: "bad", text: "CR низкий" });
    else if (cr < thresholds.crWarn) flags.push({ metric: "cr", level: "warn", text: "CR проседает" });
    if (cpa > thresholds.cpaBad) flags.push({ metric: "cpa", level: "bad", text: "CPA высокий" });
    else if (cpa > thresholds.cpaWarn) flags.push({ metric: "cpa", level: "warn", text: "CPA растёт" });
    return flags;
  }

  const scoreFlags = (flags) => flags.reduce((acc, f) => acc + (f.level === "bad" ? 2 : 1), 0);
  function applyFilter(rows) {
    if (state.filter === "all") return rows;
    if (state.filter === "warn") return rows.filter(r => r.status.cls === "warn" || r.status.cls === "bad");
    if (state.filter === "bad") return rows.filter(r => r.status.cls === "bad");
    return rows;
  }

  function applySort(rows) {
    const copy = [...rows];
    if (state.sortBy === "severity") return copy.sort((a, b) => (b.sevScore - a.sevScore) || (b.spend - a.spend));
    if (state.sortBy === "spend_desc") return copy.sort((a, b) => b.spend - a.spend);
    if (state.sortBy === "cpa_desc") return copy.sort((a, b) => b.cpa - a.cpa);
    if (state.sortBy === "cr_asc") return copy.sort((a, b) => a.cr - b.cr);
    if (state.sortBy === "ctr_asc") return copy.sort((a, b) => a.ctr - b.ctr);
    return copy;
  }

  function trendClass(pct, inverse = false) {
    const effective = inverse ? -pct : pct;
    if (effective >= 0) return "good";
    if (effective > -3) return "warn";
    return "bad";
  }

  function createTrendElement(value, inverse = false) {
    const el = document.createElement("span");
    const arrow = value >= 0 ? "↑" : "↓";
    el.className = "trendInline " + trendClass(value, inverse);
    el.textContent = `${arrow} ${Math.abs(value).toFixed(1)}%`;
    return el;
  }

  function renderCampaigns() {
    const tbody = document.getElementById("campaignsBody");
    if (!tbody) return;
    const maxSpend = Math.max(...demo.campaigns.map(c => c.spend));
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

    const rows = applySort(applyFilter(computed));
    tbody.innerHTML = "";

    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.className = "campaignRow";
      const trend = demo.campaignDeltas[r.name] || {};

      const cells = [
        ["Кампания", r.name, "campaignNameCell"],
      ];
      const tdName = document.createElement("td"); tdName.className = "campaignNameCell"; tdName.dataset.label = "Кампания"; tdName.textContent = r.name; tr.appendChild(tdName);

      const tdStatus = document.createElement("td"); tdStatus.dataset.label = "Статус";
      const tag = document.createElement("span"); tag.className = "tag " + r.status.cls; tag.textContent = r.status.text; tdStatus.appendChild(tag); tr.appendChild(tdStatus);

      const tdSpend = document.createElement("td"); tdSpend.dataset.label = "Расход"; tdSpend.className = "mono spendCell"; tdSpend.textContent = formatMoney(r.spend, 2); tdSpend.appendChild(createTrendElement(trend.spend ?? 0, true));
      const bar = document.createElement("div"); bar.className = "spendBar"; const fill = document.createElement("i"); fill.style.width = `${Math.max(3, (r.spend / maxSpend) * 100)}%`; bar.appendChild(fill); tdSpend.appendChild(bar); tr.appendChild(tdSpend);

      const tdCtr = document.createElement("td"); tdCtr.dataset.label = "CTR"; tdCtr.className = "mono " + cellClass(r.ctr, "ctr"); tdCtr.textContent = formatPct(r.ctr, 2); tdCtr.appendChild(createTrendElement(trend.ctr ?? 0)); tr.appendChild(tdCtr);
      const tdClicks = document.createElement("td"); tdClicks.dataset.label = "Клики"; tdClicks.className = "mono"; tdClicks.textContent = formatInt(r.clicks); tdClicks.appendChild(createTrendElement(trend.clicks ?? 0)); tr.appendChild(tdClicks);
      const tdCpc = document.createElement("td"); tdCpc.dataset.label = "CPC"; tdCpc.className = "mono " + cellClass(r.cpc, "cpc"); tdCpc.textContent = formatMoney(r.cpc, 2); tdCpc.appendChild(createTrendElement(trend.cpc ?? 0, true)); tr.appendChild(tdCpc);
      const tdConv = document.createElement("td"); tdConv.dataset.label = "Конверсии"; tdConv.className = "mono"; tdConv.textContent = formatInt(r.conv); tdConv.appendChild(createTrendElement(trend.conv ?? 0)); tr.appendChild(tdConv);
      const tdCr = document.createElement("td"); tdCr.dataset.label = "CR"; tdCr.className = "mono " + cellClass(r.cr, "cr"); tdCr.textContent = formatPct(r.cr, 2); tdCr.appendChild(createTrendElement(trend.cr ?? 0)); tr.appendChild(tdCr);
      const tdCpa = document.createElement("td"); tdCpa.dataset.label = "CPA"; tdCpa.className = "mono " + cellClass(r.cpa, "cpa"); tdCpa.textContent = formatMoney(r.cpa, 2); tdCpa.appendChild(createTrendElement(trend.cpa ?? 0, true)); tr.appendChild(tdCpa);
      tbody.appendChild(tr);

      const detailsTr = document.createElement("tr"); detailsTr.className = "campaignDetails hidden";
      const detailsTd = document.createElement("td"); detailsTd.colSpan = 9;
      const detailsWrap = document.createElement("div"); detailsWrap.className = "campaignDetailsWrap";
      const head = document.createElement("div"); head.className = "campaignDetailsHead";
      const title = document.createElement("b"); title.textContent = "Критичные показатели"; head.appendChild(title);
      const reviewBtn = document.createElement("button"); reviewBtn.type = "button"; reviewBtn.className = "btn btnTiny"; reviewBtn.textContent = "Обзор"; reviewBtn.addEventListener("click", (e) => e.stopPropagation()); head.appendChild(reviewBtn);

      const metrics = document.createElement("div"); metrics.className = "detailMetrics";
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
        const card = document.createElement("div"); card.className = "detailMetricCard " + flag.level;
        const label = document.createElement("span"); label.className = "detailMetricLabel"; label.textContent = item.label;
        const value = document.createElement("span"); value.className = "detailMetricValue mono"; value.textContent = item.value; value.appendChild(createTrendElement(item.trend, item.inverse));
        const warning = document.createElement("small"); warning.className = "detailMetricWarning"; warning.textContent = `⚠ ${flag.text}: требуется проверка.`;
        card.appendChild(label); card.appendChild(value); card.appendChild(warning); metrics.appendChild(card);
      });
      if (flaggedMetrics.length === 0) { const noProblems = document.createElement("div"); noProblems.className = "detailMetricEmpty"; noProblems.textContent = "Отклонений по контролируемым показателям не обнаружено."; metrics.appendChild(noProblems); }

      detailsWrap.appendChild(head); detailsWrap.appendChild(metrics); detailsTd.appendChild(detailsWrap); detailsTr.appendChild(detailsTd); tbody.appendChild(detailsTr);
      tr.addEventListener("click", () => detailsTr.classList.toggle("hidden"));
    });

    const tagEl = document.getElementById("campaignsTag");
    if (tagEl) tagEl.textContent = `показано: ${rows.length} / всего: ${demo.campaigns.length}`;
  }

  function bindCampaignControls() {
    document.querySelectorAll(".segBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".segBtn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.filter = btn.dataset.filter || "all";
        renderCampaigns();
      });
    });

    const sortBy = document.getElementById("sortBy");
    if (sortBy) {
      sortBy.addEventListener("change", () => {
        state.sortBy = sortBy.value;
        renderCampaigns();
      });
    }
  }

  return { renderCampaigns, bindCampaignControls };
}
