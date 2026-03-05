(function () {
  const ns = (window.MonitoringApp = window.MonitoringApp || {});

  ns.formatInt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

  ns.formatMoney = (n, digits = 0) =>
    `${new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    }).format(n)} ₽`;

  ns.formatPct = (n, digits = 2) =>
    `${new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    }).format(n)}%`;

  ns.setDelta = function setDelta(el, pct) {
    const sign = pct >= 0 ? "▲" : "▼";
    el.textContent = `${sign} ${Math.abs(pct).toFixed(1)}%`;
    el.classList.remove("good", "warn", "bad");

    const abs = Math.abs(pct);
    if (abs <= 3) el.classList.add("good");
    else if (abs <= 8) el.classList.add("warn");
    else el.classList.add("bad");
  };

  ns.formatDateLabel = function formatDateLabel(iso) {
    const d = new Date(`${iso}T00:00:00`);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}`;
  };
})();
