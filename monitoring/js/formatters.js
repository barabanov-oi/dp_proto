export const formatInt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

export const formatMoney = (n, digits = 0) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n) + " ₽";

export const formatPct = (n, digits = 2) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n) + "%";

export function setDelta(el, pct) {
  const sign = pct >= 0 ? "▲" : "▼";
  el.textContent = `${sign} ${Math.abs(pct).toFixed(1)}%`;
  el.classList.remove("good", "warn", "bad");

  const abs = Math.abs(pct);
  if (abs <= 3) el.classList.add("good");
  else if (abs <= 8) el.classList.add("warn");
  else el.classList.add("bad");
}
