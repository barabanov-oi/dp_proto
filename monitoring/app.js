(function () {
  // --- Demo data (14 дней) ---
  const demo = {
    periodDays: 14,
    totals: {
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
    ]
  };

  // --- State ---
  const state = {
    filter: "all",   // all | warn | bad
    sortBy: "severity"
  };

  // --- Helpers ---
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

  // --- KPI render (8 показателей) ---
  function renderKPI() {
    const t = demo.totals;
    const ctr = t.impressions ? (t.clicks / t.impressions) * 100 : 0;
    const cpc = t.clicks ? (t.spend / t.clicks) : 0;
    const cr = t.clicks ? (t.conversions / t.clicks) * 100 : 0;
    const cpa = t.conversions ? (t.spend / t.conversions) : 0;

    document.getElementById("kpiSpend").textContent = formatMoney(t.spend, 0);
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

    const points = demo.daily;
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
    ctx.fillText("▮ Расход (левая шкала)", pad.l, 16);
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
    if (ctr < thresholds.ctrBad) flags.push({ level: "bad", text: "CTR низкий" });
    else if (ctr < thresholds.ctrWarn) flags.push({ level: "warn", text: "CTR проседает" });

    if (cpc > thresholds.cpcBad) flags.push({ level: "bad", text: "CPC высокий" });
    else if (cpc > thresholds.cpcWarn) flags.push({ level: "warn", text: "CPC растёт" });

    if (cr < thresholds.crBad) flags.push({ level: "bad", text: "CR низкий" });
    else if (cr < thresholds.crWarn) flags.push({ level: "warn", text: "CR проседает" });

    if (cpa > thresholds.cpaBad) flags.push({ level: "bad", text: "CPA высокий" });
    else if (cpa > thresholds.cpaWarn) flags.push({ level: "warn", text: "CPA растёт" });

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

      const bar = document.createElement("div");
      bar.className = "spendBar";
      const fill = document.createElement("i");
      fill.style.width = `${Math.max(3, (r.spend / maxSpend) * 100)}%`;
      bar.appendChild(fill);
      tdSpend.appendChild(bar);

      tr.appendChild(tdSpend);

      // impr
      const tdImpr = document.createElement("td");
      tdImpr.className = "mono";
      tdImpr.textContent = formatInt(r.impr);
      tr.appendChild(tdImpr);

      // ctr (highlight)
      const tdCtr = document.createElement("td");
      tdCtr.className = "mono " + cellClass(r.ctr, "ctr");
      tdCtr.textContent = formatPct(r.ctr, 2);
      tr.appendChild(tdCtr);

      // clicks
      const tdClicks = document.createElement("td");
      tdClicks.className = "mono";
      tdClicks.textContent = formatInt(r.clicks);
      tr.appendChild(tdClicks);

      // cpc (highlight)
      const tdCpc = document.createElement("td");
      tdCpc.className = "mono " + cellClass(r.cpc, "cpc");
      tdCpc.textContent = formatMoney(r.cpc, 2);
      tr.appendChild(tdCpc);

      // conv
      const tdConv = document.createElement("td");
      tdConv.className = "mono";
      tdConv.textContent = formatInt(r.conv);
      tr.appendChild(tdConv);

      // cr (highlight)
      const tdCr = document.createElement("td");
      tdCr.className = "mono " + cellClass(r.cr, "cr");
      tdCr.textContent = formatPct(r.cr, 2);
      tr.appendChild(tdCr);

      // cpa (highlight)
      const tdCpa = document.createElement("td");
      tdCpa.className = "mono " + cellClass(r.cpa, "cpa");
      tdCpa.textContent = formatMoney(r.cpa, 2);
      tr.appendChild(tdCpa);

      // critical flags
      const tdCrit = document.createElement("td");
      const wrap = document.createElement("div");
      wrap.className = "critList";

      if (r.flags.length === 0) {
        const b = document.createElement("span");
        b.className = "critBadge";
        b.textContent = "—";
        wrap.appendChild(b);
      } else {
        r.flags.slice(0, 4).forEach((f) => {
          const b = document.createElement("span");
          b.className = "critBadge " + f.level;
          b.textContent = f.text;
          wrap.appendChild(b);
        });
        if (r.flags.length > 4) {
          const more = document.createElement("span");
          more.className = "critBadge warn";
          more.textContent = `+${r.flags.length - 4}`;
          wrap.appendChild(more);
        }
      }

      tdCrit.appendChild(wrap);
      tr.appendChild(tdCrit);

      tbody.appendChild(tr);
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

  function init() {
    setDefaultDates();
    renderKPI();
    renderAlerts();
    drawChart();
    bindCampaignControls();
    renderCampaigns();
  }

  window.addEventListener("resize", drawChart);
  document.getElementById("refreshBtn").addEventListener("click", () => {
    // В реальном приложении тут будет запрос к backend/API.
    renderKPI();
    renderAlerts();
    drawChart();
    renderCampaigns();
  });

  init();
})();