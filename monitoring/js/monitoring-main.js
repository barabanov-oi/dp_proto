(function () {
const { formatInt, formatMoney, formatPct, setDelta } = window.MonitoringFormatters;
const { demo, state, getVisibleDailyData, getDailyMetric, chartPalette, aggregateByName, getChannelDaily, formatDateLabel } = window.MonitoringData;


  function applyTheme(theme) {
    const normalized = theme === "dark" ? "dark" : "light";
    state.theme = normalized;
    document.documentElement.setAttribute("data-theme", normalized);
    localStorage.setItem("monitoring-theme", normalized);

    const btn = document.getElementById("themeToggle");
    if (btn) {
      const dark = normalized === "dark";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.textContent = dark ? "☀️ Светлая тема" : "🌙 Тёмная тема";
    }

    drawChart();
  }

  function bindThemeToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    const saved = localStorage.getItem("monitoring-theme");
    applyTheme(saved || "dark");

    btn.addEventListener("click", () => {
      applyTheme(state.theme === "dark" ? "light" : "dark");
    });
  }

  // --- KPI render (8 показателей) ---
  function renderKPI() {
    const points = getVisibleDailyData();
    const totals = points.reduce((acc, point, index) => {
      const impressions = Math.max(point.clicks, Math.round(point.clicks * (49 + Math.sin(index / 2.6) * 4)));
      const conversions = Math.max(1, Math.round(point.clicks * (0.2 + Math.cos(index / 3.1) * 0.025)));
      acc.spend += point.spend;
      acc.impressions += impressions;
      acc.clicks += point.clicks;
      acc.conversions += conversions;
      return acc;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

    const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
    const cpc = totals.clicks ? (totals.spend / totals.clicks) : 0;
    const cr = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpa = totals.conversions ? (totals.spend / totals.conversions) : 0;

    document.getElementById("kpiSpend").textContent = formatMoney(totals.spend, 0);
    document.getElementById("kpiBalance").textContent = formatMoney(demo.totals.balance, 2);
    document.getElementById("kpiImpr").textContent = formatInt(totals.impressions);
    document.getElementById("kpiCtr").textContent = formatPct(ctr, 2);
    document.getElementById("kpiClicks").textContent = formatInt(totals.clicks);
    document.getElementById("kpiCpc").textContent = formatMoney(cpc, 2);
    document.getElementById("kpiConv").textContent = formatInt(totals.conversions);
    document.getElementById("kpiCr").textContent = formatPct(cr, 2);
    document.getElementById("kpiCpa").textContent = formatMoney(cpa, 2);

    setDelta(document.getElementById("deltaSpend"), demo.deltas.spend);
    setDelta(document.getElementById("deltaImpr"), demo.deltas.impressions);
    setDelta(document.getElementById("deltaCtr"), demo.deltas.ctr);
    setDelta(document.getElementById("deltaClicks"), demo.deltas.clicks);
    setDelta(document.getElementById("deltaCpc"), demo.deltas.cpc);
    setDelta(document.getElementById("deltaConv"), demo.deltas.conv);
    setDelta(document.getElementById("deltaCr"), demo.deltas.cr);
    setDelta(document.getElementById("deltaCpa"), demo.deltas.cpa);

    document.querySelectorAll(".kpiCard").forEach((card) => {
      const delta = card.querySelector(".delta");
      card.classList.toggle("kpiCritical", Boolean(delta && delta.classList.contains("bad")));
    });

    document.getElementById("lastUpdateTag").textContent =
      "Обновлено: " + new Date().toLocaleString("ru-RU");
  }

  function renderChannelKpi(channel) {
    const container = document.getElementById("channelKpiGrid");
    if (!container) return;

    const isSearch = channel === "search";
    const totals = aggregateByName(isSearch ? "Поиск" : "РСЯ");
    const channelDelta = demo.channelDeltas[channel];

    const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
    const cpc = totals.clicks ? (totals.spend / totals.clicks) : 0;
    const cr = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpa = totals.conversions ? (totals.spend / totals.conversions) : 0;

    const cards = [
      { label: "Расход", value: formatMoney(totals.spend, 0), delta: channelDelta.spend },
      { label: "CTR", value: formatPct(ctr, 2), delta: channelDelta.ctr },
      { label: "CR", value: formatPct(cr, 2), delta: channelDelta.cr },
      { label: "CPA", value: formatMoney(cpa, 2), delta: channelDelta.cpa },
      { label: "Клики", value: formatInt(totals.clicks), delta: channelDelta.clicks },
      { label: "Показы", value: formatInt(totals.impressions), delta: channelDelta.impressions },
      { label: "Конверсии", value: formatInt(totals.conversions), delta: channelDelta.conversions },
      { label: "CPC", value: formatMoney(cpc, 2), delta: channelDelta.cpc }
    ];

    container.innerHTML = `
      ${cards.map((card) => `
        <div class="kpiCard">
          <div class="kpiTop">
            <div>
              <div class="kpiLabel">${card.label}</div>
            </div>
            <span class="delta" data-delta="${card.delta}"></span>
          </div>
          <div class="kpiValue mono">${card.value}</div>
        </div>
      `).join("")}
    `;

    container.querySelectorAll("[data-delta]").forEach((el) => {
      setDelta(el, Number(el.dataset.delta));
    });
  }

  function renderChannelButtons() {
    document.querySelectorAll(".channelBtn").forEach((btn) => {
      const channel = btn.dataset.channel || "search";
      const isSearch = channel === "search";
      const totals = aggregateByName(isSearch ? "Поиск" : "РСЯ");
      const delta = demo.channelDeltas[channel] || {};
      btn.innerHTML = `
        <span class="channelBtnTitle">${isSearch ? "Поиск" : "РСЯ"}</span>
        <span class="channelBtnMeta">
          <span>Расход ${formatMoney(totals.spend, 0)} ${delta.spend >= 0 ? "▲" : "▼"} ${Math.abs(delta.spend ?? 0).toFixed(1)}%</span>
          <span>Клики ${formatInt(totals.clicks)} ${delta.clicks >= 0 ? "▲" : "▼"} ${Math.abs(delta.clicks ?? 0).toFixed(1)}%</span>
          <span>Конверсии ${formatInt(totals.conversions)} ${delta.conversions >= 0 ? "▲" : "▼"} ${Math.abs(delta.conversions ?? 0).toFixed(1)}%</span>
        </span>
      `;
    });
  }

  function renderChannelSwitch() {
    const grid = document.getElementById("channelKpiGrid");

    document.querySelectorAll(".channelBtn").forEach((btn) => {
      const isActive = btn.dataset.channel === state.selectedChannelKpi;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-expanded", isActive ? "true" : "false");
    });

    if (!grid) return;

    if (!state.selectedChannelKpi) {
      grid.classList.add("hidden");
      grid.innerHTML = "";
      return;
    }

    grid.classList.remove("hidden");
    renderChannelKpi(state.selectedChannelKpi);
  }



  function renderSparkline(svgId, metric) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const series = getDailyMetric(metric, 7).map((p) => p.value);
    const width = 120;
    const height = 32;
    const max = Math.max(...series);
    const min = Math.min(...series);
    const span = max - min || 1;

    const points = series.map((value, index) => {
      const x = (index / (series.length - 1 || 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");

    svg.innerHTML = `<polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
  }

  function renderSparklines() {
    renderSparkline("sparkSpend", "spend");
    renderSparkline("sparkImpressions", "impressions");
    renderSparkline("sparkCtr", "ctr");
    renderSparkline("sparkClicks", "clicks");
    renderSparkline("sparkCpc", "cpc");
    renderSparkline("sparkConversions", "conversions");
    renderSparkline("sparkCr", "cr");
    renderSparkline("sparkCpa", "cpa");
  }

  function drawKpiDetailChart(metric) {
    const canvas = document.getElementById("kpiDetailChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const points = getDailyMetric(metric, 14);
    const values = points.map((p) => p.value);

    const cssW = canvas.clientWidth || 900;
    const cssH = canvas.clientHeight || 260;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { l: 52, r: 24, t: 20, b: 34 };
    const plotW = cssW - pad.l - pad.r;
    const plotH = cssH - pad.t - pad.b;
    const max = Math.max(...values) * 1.1;
    const min = Math.min(...values) * 0.95;
    const span = max - min || 1;

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = chartPalette().bg;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = chartPalette().grid;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
    }

    const xAt = (i) => pad.l + (plotW * i) / (values.length - 1 || 1);
    const yAt = (v) => pad.t + plotH - ((v - min) / span) * plotH;

    ctx.strokeStyle = "#6d5efc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => {
      const x = xAt(i);
      const y = yAt(v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "#6d5efc";
    values.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xAt(i), yAt(v), 2.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = chartPalette().axis;
    ctx.font = "12px ui-sans-serif";
    for (let i = 0; i < points.length; i += 2) {
      ctx.fillText(formatDateLabel(points[i].date), xAt(i) - 12, cssH - 10);
    }
  }

  function bindKpiCards() {
    const modal = document.getElementById("kpiModal");
    const close = document.getElementById("kpiModalClose");
    const title = document.getElementById("kpiModalTitle");
    if (!modal || !close || !title) return;

    const openModal = (metric) => {
      state.activeKpiMetric = metric;
      const labels = {
        spend: "Расход", impressions: "Показы", ctr: "CTR", clicks: "Клики",
        cpc: "CPC", conversions: "Конверсии", cr: "CR", cpa: "CPA"
      };
      title.textContent = `Динамика: ${labels[metric] || "Показатель"} (14 дней)`;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      drawKpiDetailChart(metric);
    };

    document.querySelectorAll(".kpiCard[data-metric]").forEach((card) => {
      const metric = card.dataset.metric || "spend";
      card.addEventListener("click", () => openModal(metric));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModal(metric);
        }
      });
    });

    close.addEventListener("click", () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  // --- Alerts render (3 сигнала) ---
  function renderAlerts() {
    const ul = document.getElementById("alertsList");
    ul.innerHTML = "";

    demo.alerts.forEach((a) => {
      const li = document.createElement("li");
      li.className = "statusItem";

      const left = document.createElement("div");
      left.className = "statusLeft";

      const badge = document.createElement("div");
      badge.className = "badge " + (a.level || "");
      left.appendChild(badge);

      const text = document.createElement("div");
      const b = document.createElement("b");
      b.textContent = a.title;
      const s = document.createElement("small");
      s.textContent = a.desc;
      text.appendChild(b);
      text.appendChild(s);

      left.appendChild(text);

      const right = document.createElement("div");
      right.className = "statusRight";
      right.textContent = a.right || "";

      li.appendChild(left);
      li.appendChild(right);
      ul.appendChild(li);
    });

    document.getElementById("alertsCount").textContent = `${demo.alerts.length} сигнала`;
  }

  function bindPeriodControl() {
    const periodSelect = document.getElementById("periodPreset");
    if (!periodSelect) return;

    periodSelect.value = String(state.periodDays);
    periodSelect.addEventListener("change", () => {
      state.periodDays = Number(periodSelect.value) || 14;
      renderKPI();
      renderSparklines();
      drawChart();
      if (document.getElementById("kpiModal")?.classList.contains("open")) {
        drawKpiDetailChart(state.activeKpiMetric);
      }
    });
  }

  // --- Chart (Canvas, без библиотек) ---
  function getChartSeries() {
    const source = state.chartChannel === "all" ? getVisibleDailyData() : getChannelDaily(state.chartChannel).slice(-state.periodDays);
    const points = source;
    if (state.chartMode === "traffic") {
      return {
        points,
        left: points.map((p) => p.spend),
        right: points.map((p) => p.clicks),
        leftLabel: "Расход",
        rightLabel: "Клики",
        leftFormatter: (val) => Math.round(val / 1000) + "k",
        rightFormatter: (val) => Math.round(val)
      };
    }

    const converted = points.map((p, index) => {
      const wave = 0.17 + Math.sin(index / 2.7) * 0.03;
      const conv = Math.max(1, Math.round(p.clicks * wave));
      const cpa = conv ? (p.spend / conv) : 0;
      return { ...p, conv, cpa };
    });

    return {
      points: converted,
      left: converted.map((p) => p.conv),
      right: converted.map((p) => p.cpa),
      leftLabel: "Конверсии",
      rightLabel: "CPA",
      leftFormatter: (val) => Math.round(val),
      rightFormatter: (val) => Math.round(val) + "₽"
    };
  }

  function drawChart() {
    const canvas = document.getElementById("chart");
    const ctx = canvas.getContext("2d");

    const cssW = canvas.clientWidth || 900;
    const cssH = canvas.clientHeight || 260;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = cssW, h = cssH;
    const pad = { l: 52, r: 52, t: 22, b: 34 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    const chart = getChartSeries();
    const points = chart.points;
    const leftSeries = chart.left;
    const rightSeries = chart.right;
    const maxLeft = Math.max(...leftSeries) * 1.08;
    const maxRight = Math.max(...rightSeries) * 1.12;

    const palette = chartPalette();

    // bg
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    const gridY = 5;
    for (let i = 0; i <= gridY; i++) {
      const y = pad.t + (plotH * i) / gridY;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
    }

    // axes labels
    ctx.fillStyle = palette.axis;
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    // left axis (spend, k)
    for (let i = 0; i <= gridY; i++) {
      const y = pad.t + (plotH * i) / gridY;
      const val = maxLeft - (maxLeft * i) / gridY;
      ctx.fillText(chart.leftFormatter(val), 10, y);
    }

    // right axis (clicks)
    ctx.textAlign = "right";
    for (let i = 0; i <= gridY; i++) {
      const y = pad.t + (plotH * i) / gridY;
      const val = maxRight - (maxRight * i) / gridY;
      ctx.fillText(chart.rightFormatter(val), w - 10, y);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // x labels
    for (let i = 0; i < points.length; i += 2) {
      const x = pad.l + (plotW * i) / (points.length - 1);
      ctx.fillText(formatDateLabel(points[i].date), x - 12, h - 10);
    }

    const xAt = (i) => pad.l + (plotW * i) / (points.length - 1);
    const yLeft = (v) => pad.t + plotH - (plotH * v) / maxLeft;
    const yRight = (v) => pad.t + plotH - (plotH * v) / maxRight;

    // spend bars
    const barW = (plotW / points.length) * 0.55;
    ctx.fillStyle = palette.bars;
    for (let i = 0; i < points.length; i++) {
      const x = xAt(i) - barW / 2;
      const y = yLeft(leftSeries[i]);
      const bh = pad.t + plotH - y;
      ctx.fillRect(x, y, barW, bh);
    }

    // clicks line
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = xAt(i);
      const y = yRight(rightSeries[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // points
    ctx.fillStyle = palette.line;
    for (let i = 0; i < points.length; i++) {
      const x = xAt(i);
      const y = yRight(rightSeries[i]);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // legend
    ctx.fillStyle = palette.legend;
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const channelLabel = state.chartChannel === "all"
      ? "все каналы"
      : state.chartChannel === "search" ? "поиск" : "РСЯ";

    ctx.fillText(`▮ ${chart.leftLabel} (${channelLabel})`, pad.l, 16);
    ctx.fillStyle = palette.line;
    ctx.fillText(`— ${chart.rightLabel} (правая шкала)`, pad.l + 210, 16);
  }

  // --- Campaign calculations ---
  function calcCtr(clicks, impr) { return impr ? (clicks / impr) * 100 : 0; }
  function calcCpc(spend, clicks) { return clicks ? (spend / clicks) : 0; }
  function calcCr(conv, clicks) { return clicks ? (conv / clicks) * 100 : 0; }
  function calcCpa(spend, conv) { return conv ? (spend / conv) : 0; }

  // Демонстрационные пороги "критично"
  const thresholds = {
    ctrBad: 0.9,
    ctrWarn: 1.2,
    cpcBad: 35,
    cpcWarn: 28,
    crBad: 10,
    crWarn: 14,
    cpaBad: 350,
    cpaWarn: 240
  };

  function cellClass(value, metric) {
    if (metric === "ctr") {
      if (value < thresholds.ctrBad) return "cellBad";
      if (value < thresholds.ctrWarn) return "cellWarn";
      return "cellOk";
    }
    if (metric === "cpc") {
      if (value > thresholds.cpcBad) return "cellBad";
      if (value > thresholds.cpcWarn) return "cellWarn";
      return "cellOk";
    }
    if (metric === "cr") {
      if (value < thresholds.crBad) return "cellBad";
      if (value < thresholds.crWarn) return "cellWarn";
      return "cellOk";
    }
    if (metric === "cpa") {
      if (value > thresholds.cpaBad) return "cellBad";
      if (value > thresholds.cpaWarn) return "cellWarn";
      return "cellOk";
    }
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

  function scoreFlags(flags) {
    // 2 балла за bad, 1 за warn
    return flags.reduce((acc, f) => acc + (f.level === "bad" ? 2 : 1), 0);
  }

  function applyFilter(rows) {
    if (state.filter === "all") return rows;
    if (state.filter === "warn") return rows.filter(r => r.status.cls === "warn" || r.status.cls === "bad");
    if (state.filter === "bad") return rows.filter(r => r.status.cls === "bad");
    return rows;
  }

  function applySort(rows) {
    const s = state.sortBy;
    const copy = [...rows];

    if (s === "severity") {
      copy.sort((a, b) => (b.sevScore - a.sevScore) || (b.spend - a.spend));
      return copy;
    }
    if (s === "spend_desc") return copy.sort((a, b) => b.spend - a.spend);
    if (s === "cpa_desc") return copy.sort((a, b) => b.cpa - a.cpa);
    if (s === "cr_asc") return copy.sort((a, b) => a.cr - b.cr);
    if (s === "ctr_asc") return copy.sort((a, b) => a.ctr - b.ctr);
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
    const isUp = value >= 0;
    const arrow = isUp ? "↑" : "↓";
    el.className = "trendInline " + trendClass(value, inverse);
    el.textContent = `${arrow} ${Math.abs(value).toFixed(1)}%`;
    return el;
  }

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
  window.addEventListener("resize", () => {
    drawChart();
    if (document.getElementById("kpiModal")?.classList.contains("open")) {
      drawKpiDetailChart(state.activeKpiMetric);
    }
  });
  bindThemeToggle();
  document.getElementById("refreshBtn").addEventListener("click", () => {
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
window.MonitoringApp = { initApp };
})();
