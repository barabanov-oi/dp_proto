(function () {
const formatInt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

const formatMoney = (n, digits = 0) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n) + " ₽";

const formatPct = (n, digits = 2) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n) + "%";

function setDelta(el, pct) {
  const sign = pct >= 0 ? "▲" : "▼";
  el.textContent = `${sign} ${Math.abs(pct).toFixed(1)}%`;
  el.classList.remove("good", "warn", "bad");

  const abs = Math.abs(pct);
  if (abs <= 3) el.classList.add("good");
  else if (abs <= 8) el.classList.add("warn");
  else el.classList.add("bad");
}


// --- Demo data (14 дней) ---
  const demo = {
    periodDays: 14,
    totals: {
      balance: 483920.45,
      spend: 1339902.09,
      impressions: 3388435,
      clicks: 64150,
      conversions: 13734
    },
    deltas: {
      spend: +6.8,
      impressions: +4.2,
      ctr: +1.1,
      clicks: +3.1,
      cpc: +3.5,
      conv: +9.4,
      cr: -1.9,
      cpa: +12.2
    },
    daily: [
      { date: "2026-02-15", spend: 84210.45, clicks: 4012 },
      { date: "2026-02-16", spend: 91135.12, clicks: 4260 },
      { date: "2026-02-17", spend: 98340.88, clicks: 4521 },
      { date: "2026-02-18", spend: 102114.22, clicks: 4680 },
      { date: "2026-02-19", spend: 96770.15, clicks: 4511 },
      { date: "2026-02-20", spend: 88902.30, clicks: 4325 },
      { date: "2026-02-21", spend: 90510.66, clicks: 4401 },
      { date: "2026-02-22", spend: 159783.43, clicks: 7810 },
      { date: "2026-02-23", spend: 104110.56, clicks: 5101 },
      { date: "2026-02-24", spend: 205957.02, clicks: 8894 },
      { date: "2026-02-25", spend: 218115.52, clicks: 9217 },
      { date: "2026-02-26", spend: 206104.55, clicks: 8016 },
      { date: "2026-02-27", spend: 183658.05, clicks: 8907 },
      { date: "2026-02-28", spend: 220800.93, clicks: 14983 }
    ],
    alerts: [
      {
        level: "warn",
        title: "Перерасход относительно среднедневного",
        desc: "За последние 2 дня расход выше среднего по периоду на 18%. Проверьте ставки и дневные лимиты.",
        right: "сегодня"
      },
      {
        level: "bad",
        title: "CR просел при росте кликов",
        desc: "Кликов больше, но конверсии не растут пропорционально. Проверьте запросы/площадки и качество трафика.",
        right: "2 дня"
      },
      {
        level: "warn",
        title: "Рост CPC быстрее роста CTR",
        desc: "Стоимость клика растёт, а CTR почти не меняется. Есть риск выгорания креативов/аудиторий.",
        right: "3 дня"
      }
    ],
    campaigns: [
      { name: "Поиск — Бренд", spend: 218340.22, impr: 412340, clicks: 12861, conv: 4120 },
      { name: "РСЯ — Ремаркетинг", spend: 334901.18, impr: 1104230, clicks: 11594, conv: 1380 },
      { name: "Поиск — Категории", spend: 401225.76, impr: 615990, clicks: 14411, conv: 4820 },
      { name: "РСЯ — Интересы", spend: 277880.55, impr: 1005420, clicks: 7245, conv: 610 },
      { name: "Мастер кампаний", spend: 107554.38, impr: 250455, clicks: 4000, conv: 2804 }
    ],
    campaignDeltas: {
      "Поиск — Бренд": { spend: +4.1, impr: +3.8, ctr: +2.4, clicks: +6.3, cpc: -1.7, conv: +5.4, cr: +1.9, cpa: -1.2 },
      "РСЯ — Ремаркетинг": { spend: +7.8, impr: +5.1, ctr: -1.2, clicks: +3.2, cpc: +4.4, conv: -2.4, cr: -4.8, cpa: +10.3 },
      "Поиск — Категории": { spend: +2.9, impr: +1.7, ctr: +0.9, clicks: +4.5, cpc: -0.8, conv: +2.1, cr: -1.1, cpa: +0.8 },
      "РСЯ — Интересы": { spend: -1.7, impr: -2.6, ctr: -0.5, clicks: -2.9, cpc: +1.2, conv: -4.8, cr: -2.0, cpa: +6.6 },
      "Мастер кампаний": { spend: +5.5, impr: +4.4, ctr: +1.3, clicks: +2.8, cpc: +2.1, conv: +9.7, cr: +3.5, cpa: -3.9 }
    },
    channelDeltas: {
      search: {
        spend: +5.6,
        ctr: +1.8,
        cr: -2.1,
        cpa: +8.4,
        clicks: +2.9,
        impressions: +4.7,
        conversions: +6.2,
        cpc: +3.1
      },
      rsya: {
        spend: +8.9,
        ctr: -1.4,
        cr: -3.8,
        cpa: +11.7,
        clicks: +1.6,
        impressions: +5.3,
        conversions: +2.5,
        cpc: +6.5
      }
    }
  };

  // --- State ---
  const state = {
    filter: "all",   // all | warn | bad
    sortBy: "severity",
    selectedChannelKpi: null,
    chartChannel: "all"
  };


  // --- KPI render (8 показателей) ---
  function renderKPI() {
    const t = demo.totals;
    const ctr = t.impressions ? (t.clicks / t.impressions) * 100 : 0;
    const cpc = t.clicks ? (t.spend / t.clicks) : 0;
    const cr = t.clicks ? (t.conversions / t.clicks) * 100 : 0;
    const cpa = t.conversions ? (t.spend / t.conversions) : 0;

    document.getElementById("kpiSpend").textContent = formatMoney(t.spend, 0);
    document.getElementById("kpiBalance").textContent = formatMoney(t.balance, 2);
    document.getElementById("kpiImpr").textContent = formatInt(t.impressions);
    document.getElementById("kpiCtr").textContent = formatPct(ctr, 2);
    document.getElementById("kpiClicks").textContent = formatInt(t.clicks);
    document.getElementById("kpiCpc").textContent = formatMoney(cpc, 2);
    document.getElementById("kpiConv").textContent = formatInt(t.conversions);
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

    document.getElementById("lastUpdateTag").textContent =
      "Обновлено: " + new Date().toLocaleString("ru-RU");
  }

  function aggregateByName(part) {
    const rows = demo.campaigns.filter((c) => c.name.includes(part));
    return rows.reduce((acc, c) => {
      acc.spend += c.spend;
      acc.impressions += c.impr;
      acc.clicks += c.clicks;
      acc.conversions += c.conv;
      return acc;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
  }

  function getChannelDaily(channel) {
    const ratioByDay = demo.daily.map((_, index) => {
      const wave = Math.sin(index / 2.4) * 0.06;
      return Math.min(0.74, Math.max(0.58, 0.65 + wave));
    });

    return demo.daily.map((d, index) => {
      const searchRatio = ratioByDay[index];
      const rsyaRatio = 1 - searchRatio;
      const ratio = channel === "search" ? searchRatio : rsyaRatio;
      return {
        date: d.date,
        spend: d.spend * ratio,
        clicks: Math.round(d.clicks * ratio)
      };
    });
  }

  function renderChannelKpi(channel) {
    const container = document.getElementById("channelKpiGrid");
    if (!container) return;

    const isSearch = channel === "search";
    const totals = aggregateByName(isSearch ? "Поиск" : "РСЯ");
    const channelName = isSearch ? "Поиск" : "РСЯ";
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
              <div class="kpiHint">${channelName}</div>
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

  // --- Dates ---
  function setDefaultDates() {
    const to = demo.daily[demo.daily.length - 1].date;
    const from = demo.daily[0].date;
    document.getElementById("from").value = from;
    document.getElementById("to").value = to;
  }

  // --- Chart (Canvas, без библиотек) ---
  function formatDateLabel(iso) {
    const d = new Date(iso + "T00:00:00");
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}`;
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

    const points = state.chartChannel === "all" ? demo.daily : getChannelDaily(state.chartChannel);
    const spend = points.map((p) => p.spend);
    const clicks = points.map((p) => p.clicks);
    const maxSpend = Math.max(...spend) * 1.08;
    const maxClicks = Math.max(...clicks) * 1.12;

    // bg
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
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
    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    // left axis (spend, k)
    for (let i = 0; i <= gridY; i++) {
      const y = pad.t + (plotH * i) / gridY;
      const val = maxSpend - (maxSpend * i) / gridY;
      ctx.fillText(Math.round(val / 1000) + "k", 10, y);
    }

    // right axis (clicks)
    ctx.textAlign = "right";
    for (let i = 0; i <= gridY; i++) {
      const y = pad.t + (plotH * i) / gridY;
      const val = maxClicks - (maxClicks * i) / gridY;
      ctx.fillText(Math.round(val), w - 10, y);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // x labels
    for (let i = 0; i < points.length; i += 2) {
      const x = pad.l + (plotW * i) / (points.length - 1);
      ctx.fillText(formatDateLabel(points[i].date), x - 12, h - 10);
    }

    const xAt = (i) => pad.l + (plotW * i) / (points.length - 1);
    const ySpend = (v) => pad.t + plotH - (plotH * v) / maxSpend;
    const yClicks = (v) => pad.t + plotH - (plotH * v) / maxClicks;

    // spend bars
    const barW = (plotW / points.length) * 0.55;
    ctx.fillStyle = "rgba(109,94,252,0.35)";
    for (let i = 0; i < points.length; i++) {
      const x = xAt(i) - barW / 2;
      const y = ySpend(points[i].spend);
      const bh = pad.t + plotH - y;
      ctx.fillRect(x, y, barW, bh);
    }

    // clicks line
    ctx.strokeStyle = "rgba(34,197,94,0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = xAt(i);
      const y = yClicks(points[i].clicks);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // points
    ctx.fillStyle = "rgba(34,197,94,1)";
    for (let i = 0; i < points.length; i++) {
      const x = xAt(i);
      const y = yClicks(points[i].clicks);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // legend
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const channelLabel = state.chartChannel === "all"
      ? "все каналы"
      : state.chartChannel === "search" ? "поиск" : "РСЯ";

    ctx.fillText(`▮ Расход (${channelLabel})`, pad.l, 16);
    ctx.fillStyle = "rgba(34,197,94,0.95)";
    ctx.fillText("— Клики (правая шкала)", pad.l + 180, 16);
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
      tdName.textContent = r.name;
      tr.appendChild(tdName);

      // status
      const tdStatus = document.createElement("td");
      const tag = document.createElement("span");
      tag.className = "tag " + r.status.cls;
      tag.textContent = r.status.text;
      tdStatus.appendChild(tag);
      tr.appendChild(tdStatus);

      // spend with microbar
      const tdSpend = document.createElement("td");
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
      tdCtr.className = "mono " + cellClass(r.ctr, "ctr");
      tdCtr.textContent = formatPct(r.ctr, 2);
      tdCtr.appendChild(createTrendElement(trend.ctr ?? 0));
      tr.appendChild(tdCtr);

      // clicks
      const tdClicks = document.createElement("td");
      tdClicks.className = "mono";
      tdClicks.textContent = formatInt(r.clicks);
      tdClicks.appendChild(createTrendElement(trend.clicks ?? 0));
      tr.appendChild(tdClicks);

      // cpc (highlight)
      const tdCpc = document.createElement("td");
      tdCpc.className = "mono " + cellClass(r.cpc, "cpc");
      tdCpc.textContent = formatMoney(r.cpc, 2);
      tdCpc.appendChild(createTrendElement(trend.cpc ?? 0, true));
      tr.appendChild(tdCpc);

      // conv
      const tdConv = document.createElement("td");
      tdConv.className = "mono";
      tdConv.textContent = formatInt(r.conv);
      tdConv.appendChild(createTrendElement(trend.conv ?? 0));
      tr.appendChild(tdConv);

      // cr (highlight)
      const tdCr = document.createElement("td");
      tdCr.className = "mono " + cellClass(r.cr, "cr");
      tdCr.textContent = formatPct(r.cr, 2);
      tdCr.appendChild(createTrendElement(trend.cr ?? 0));
      tr.appendChild(tdCr);

      // cpa (highlight)
      const tdCpa = document.createElement("td");
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
  }

  function init() {
    setDefaultDates();
    renderKPI();
    renderAlerts();
    drawChart();
    bindChannelControls();
    bindCampaignControls();
    renderCampaigns();
    renderChannelSwitch();
    renderChannelButtons();
  }

function initApp() {
  window.addEventListener("resize", drawChart);
  document.getElementById("refreshBtn").addEventListener("click", () => {
    renderKPI();
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
})();
