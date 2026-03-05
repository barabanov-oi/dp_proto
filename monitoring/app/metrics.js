import { demo, state } from './store.js';

function generateExtendedDaily(days = 28) {
  const source = demo.daily.slice(-Math.min(demo.daily.length, days));
  const result = [...source];
  while (result.length < days) {
    const first = result[0];
    const date = new Date(`${first.date}T00:00:00`);
    date.setDate(date.getDate() - 1);
    const wave = 0.9 + Math.sin(result.length / 2.3) * 0.08;
    result.unshift({
      date: date.toISOString().slice(0, 10),
      spend: Math.max(12000, first.spend * wave),
      clicks: Math.max(500, Math.round(first.clicks * (0.92 + Math.cos(result.length / 3) * 0.06)))
    });
  }
  return result.slice(-days);
}

const extendedDaily = generateExtendedDaily(28);

export const getVisibleDailyData = () => extendedDaily.slice(-state.periodDays);

export function enrichPoint(point, index) {
  const impressions = Math.max(point.clicks, Math.round(point.clicks * (49 + Math.sin(index / 2.6) * 4)));
  const conversions = Math.max(1, Math.round(point.clicks * (0.2 + Math.cos(index / 3.1) * 0.025)));
  const ctr = impressions ? (point.clicks / impressions) * 100 : 0;
  const cpc = point.clicks ? point.spend / point.clicks : 0;
  const cr = point.clicks ? (conversions / point.clicks) * 100 : 0;
  const cpa = conversions ? point.spend / conversions : 0;
  return { ...point, impressions, conversions, ctr, cpc, cr, cpa };
}

export function getDailyMetric(metric, days = state.periodDays) {
  return extendedDaily.slice(-days).map((point, index) => {
    const p = enrichPoint(point, index);
    return { date: point.date, value: p[metric] ?? 0 };
  });
}

export function getChannelDaily(channel) {
  const source = getVisibleDailyData();
  return source.map((d, index) => {
    const searchRatio = Math.min(0.74, Math.max(0.58, 0.65 + Math.sin(index / 2.4) * 0.06));
    const ratio = channel === 'search' ? searchRatio : 1 - searchRatio;
    return { date: d.date, spend: d.spend * ratio, clicks: Math.round(d.clicks * ratio) };
  });
}
