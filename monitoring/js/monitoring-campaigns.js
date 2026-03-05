(function () {
  const ns = (window.MonitoringApp = window.MonitoringApp || {});

  const thresholds = { ctrBad: 0.9, ctrWarn: 1.2, cpcBad: 35, cpcWarn: 28, crBad: 10, crWarn: 14, cpaBad: 350, cpaWarn: 240 };
  const calcCtr = (clicks, impr) => (impr ? (clicks / impr) * 100 : 0);
  const calcCpc = (spend, clicks) => (clicks ? spend / clicks : 0);
  const calcCr = (conv, clicks) => (clicks ? (conv / clicks) * 100 : 0);
  const calcCpa = (spend, conv) => (conv ? spend / conv : 0);

  function cellClass(value, metric) {
    if (metric === "ctr") return value < thresholds.ctrBad ? "cellBad" : value < thresholds.ctrWarn ? "cellWarn" : "cellOk";
    if (metric === "cpc") return value > thresholds.cpcBad ? "cellBad" : value > thresholds.cpcWarn ? "cellWarn" : "cellOk";
    if (metric === "cr") return value < thresholds.crBad ? "cellBad" : value < thresholds.crWarn ? "cellWarn" : "cellOk";
    if (metric === "cpa") return value > thresholds.cpaBad ? "cellBad" : value > thresholds.cpaWarn ? "cellWarn" : "cellOk";
    return "";
  }

  function buildFlags({ ctr, cpc, cr, cpa }) {
    const flags = [];
    if (ctr < thresholds.ctrBad) flags.push({ metric: "ctr", level: "bad", text: "CTR низкий" }); else if (ctr < thresholds.ctrWarn) flags.push({ metric: "ctr", level: "warn", text: "CTR проседает" });
    if (cpc > thresholds.cpcBad) flags.push({ metric: "cpc", level: "bad", text: "CPC высокий" }); else if (cpc > thresholds.cpcWarn) flags.push({ metric: "cpc", level: "warn", text: "CPC растёт" });
    if (cr < thresholds.crBad) flags.push({ metric: "cr", level: "bad", text: "CR низкий" }); else if (cr < thresholds.crWarn) flags.push({ metric: "cr", level: "warn", text: "CR проседает" });
    if (cpa > thresholds.cpaBad) flags.push({ metric: "cpa", level: "bad", text: "CPA высокий" }); else if (cpa > thresholds.cpaWarn) flags.push({ metric: "cpa", level: "warn", text: "CPA растёт" });
    return flags;
  }

  const statusFromFlags = (flags) => flags.some((f) => f.level === "bad") ? { text: "Критично", cls: "bad", severity: 2 } : flags.some((f) => f.level === "warn") ? { text: "Внимание", cls: "warn", severity: 1 } : { text: "OK", cls: "good", severity: 0 };
  const scoreFlags = (flags) => flags.reduce((acc, f) => acc + (f.level === "bad" ? 2 : 1), 0);

  const applyFilter = (rows) => ns.state.filter === "all" ? rows : ns.state.filter === "warn" ? rows.filter((r) => r.status.cls !== "good") : rows.filter((r) => r.status.cls === "bad");
  function applySort(rows) {
    const copy = [...rows];
    if (ns.state.sortBy === "severity") return copy.sort((a, b) => (b.sevScore - a.sevScore) || (b.spend - a.spend));
    if (ns.state.sortBy === "spend_desc") return copy.sort((a, b) => b.spend - a.spend);
    if (ns.state.sortBy === "cpa_desc") return copy.sort((a, b) => b.cpa - a.cpa);
    if (ns.state.sortBy === "cr_asc") return copy.sort((a, b) => a.cr - b.cr);
    if (ns.state.sortBy === "ctr_asc") return copy.sort((a, b) => a.ctr - b.ctr);
    return copy;
  }

  const trendClass = (pct, inverse = false) => (inverse ? -pct : pct) >= 0 ? "good" : (inverse ? -pct : pct) > -3 ? "warn" : "bad";
  function createTrendElement(value, inverse = false) {
    const el = document.createElement("span");
    el.className = `trendInline ${trendClass(value, inverse)}`;
    el.textContent = `${value >= 0 ? "↑" : "↓"} ${Math.abs(value).toFixed(1)}%`;
    return el;
  }

  ns.renderCampaigns = function renderCampaigns() {
    const tbody = document.getElementById("campaignsBody");
    if (!tbody) return;
    const maxSpend = Math.max(...ns.demo.campaigns.map((c) => c.spend));
    const computed = ns.demo.campaigns.map((c) => {
      const ctr = calcCtr(c.clicks, c.impr);
      const cpc = calcCpc(c.spend, c.clicks);
      const cr = calcCr(c.conv, c.clicks);
      const cpa = calcCpa(c.spend, c.conv);
      const flags = buildFlags({ ctr, cpc, cr, cpa });
      return { ...c, ctr, cpc, cr, cpa, flags, status: statusFromFlags(flags), sevScore: scoreFlags(flags) };
    });

    tbody.innerHTML = "";
    applySort(applyFilter(computed)).forEach((r) => {
      const trend = ns.demo.campaignDeltas[r.name] || {};
      const tr = document.createElement("tr");
      tr.className = "campaignRow";
      tr.innerHTML = `<td class="campaignNameCell" data-label="Кампания">${r.name}</td><td data-label="Статус"><span class="tag ${r.status.cls}">${r.status.text}</span></td>`;

      const spendCell = document.createElement("td");
      spendCell.dataset.label = "Расход";
      spendCell.className = "mono spendCell";
      spendCell.textContent = ns.formatMoney(r.spend, 2);
      spendCell.appendChild(createTrendElement(trend.spend ?? 0, true));
      const bar = document.createElement("div");
      bar.className = "spendBar";
      const fill = document.createElement("i");
      fill.style.width = `${Math.max(3, (r.spend / maxSpend) * 100)}%`;
      bar.appendChild(fill);
      spendCell.appendChild(bar);
      tr.appendChild(spendCell);

      [["CTR", "ctr", ns.formatPct(r.ctr, 2), false, "ctr"], ["Клики", "", ns.formatInt(r.clicks), false, "clicks"], ["CPC", "cpc", ns.formatMoney(r.cpc, 2), true, "cpc"], ["Конверсии", "", ns.formatInt(r.conv), false, "conv"], ["CR", "cr", ns.formatPct(r.cr, 2), false, "cr"], ["CPA", "cpa", ns.formatMoney(r.cpa, 2), true, "cpa"]]
        .forEach(([label, metric, value, inverse, trendKey]) => {
          const td = document.createElement("td");
          td.dataset.label = label;
          td.className = `mono ${metric ? cellClass(r[metric], metric) : ""}`;
          td.textContent = value;
          td.appendChild(createTrendElement(trend[trendKey] ?? 0, inverse));
          tr.appendChild(td);
        });

      const detailsTr = document.createElement("tr");
      detailsTr.className = "campaignDetails hidden";
      const metricFlags = new Map(r.flags.map((flag) => [flag.metric, flag]));
      const items = [{ metric: "ctr", label: "CTR", value: ns.formatPct(r.ctr, 2), trend: trend.ctr ?? 0, inverse: false }, { metric: "cpc", label: "CPC", value: ns.formatMoney(r.cpc, 2), trend: trend.cpc ?? 0, inverse: true }, { metric: "cr", label: "CR", value: ns.formatPct(r.cr, 2), trend: trend.cr ?? 0, inverse: false }, { metric: "cpa", label: "CPA", value: ns.formatMoney(r.cpa, 2), trend: trend.cpa ?? 0, inverse: true }]
        .filter((item) => metricFlags.has(item.metric))
        .map((item) => `<div class="detailMetricCard ${metricFlags.get(item.metric).level}"><span class="detailMetricLabel">${item.label}</span><span class="detailMetricValue mono">${item.value}</span><small class="detailMetricWarning">⚠ ${metricFlags.get(item.metric).text}: требуется проверка.</small></div>`)
        .join("") || '<div class="detailMetricEmpty">Отклонений по контролируемым показателям не обнаружено.</div>';

      detailsTr.innerHTML = `<td colspan="9"><div class="campaignDetailsWrap"><div class="campaignDetailsHead"><b>Критичные показатели</b><button type="button" class="btn btnTiny">Обзор</button></div><div class="detailMetrics">${items}</div></div></td>`;
      const reviewBtn = detailsTr.querySelector(".btnTiny");
      if (reviewBtn) reviewBtn.addEventListener("click", (event) => event.stopPropagation());

      detailsTr.querySelectorAll(".detailMetricCard .detailMetricValue").forEach((el) => {
        const card = el.closest(".detailMetricCard");
        const key = card.querySelector(".detailMetricLabel").textContent.toLowerCase();
        const metricItem = [{ key: "ctr", trend: trend.ctr, inverse: false }, { key: "cpc", trend: trend.cpc, inverse: true }, { key: "cr", trend: trend.cr, inverse: false }, { key: "cpa", trend: trend.cpa, inverse: true }].find((x) => x.key === key);
        if (metricItem) el.appendChild(createTrendElement(metricItem.trend ?? 0, metricItem.inverse));
      });

      tr.addEventListener("click", () => detailsTr.classList.toggle("hidden"));
      tbody.appendChild(tr);
      tbody.appendChild(detailsTr);
    });

    const totalRows = applySort(applyFilter(computed));
    const tagEl = document.getElementById("campaignsTag");
    if (tagEl) tagEl.textContent = `показано: ${totalRows.length} / всего: ${ns.demo.campaigns.length}`;
  };

  ns.bindCampaignControls = function bindCampaignControls() {
    document.querySelectorAll(".segBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".segBtn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        ns.state.filter = btn.dataset.filter || "all";
        ns.renderCampaigns();
      });
    });

    const sortBy = document.getElementById("sortBy");
    if (sortBy) {
      sortBy.addEventListener("change", () => {
        ns.state.sortBy = sortBy.value;
        ns.renderCampaigns();
      });
    }
  };
})();
