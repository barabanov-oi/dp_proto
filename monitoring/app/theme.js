import { state } from './store.js';

export function chartPalette() {
  const rootStyle = getComputedStyle(document.documentElement);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    bg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(24,36,61,0.03)',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,113,138,0.22)',
    axis: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(24,36,61,0.65)',
    legend: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(24,36,61,0.80)',
    bars: isDark ? 'rgba(109,94,252,0.35)' : 'rgba(79,70,229,0.38)',
    line: rootStyle.getPropertyValue('--good').trim() || '#22c55e'
  };
}

export function applyTheme(theme, drawChart) {
  state.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('monitoring-theme', state.theme);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    const dark = state.theme === 'dark';
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.textContent = dark ? '☀️ Светлая тема' : '🌙 Тёмная тема';
  }
  drawChart();
}

export function bindThemeToggle(drawChart) {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  applyTheme(localStorage.getItem('monitoring-theme') || 'dark', drawChart);
  btn.addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark', drawChart));
}
