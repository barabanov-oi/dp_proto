(function () {
  const ns = (window.MonitoringApp = window.MonitoringApp || {});

  ns.demo = {
    periodDays: 14,
    totals: { balance: 483920.45, spend: 1339902.09, impressions: 3388435, clicks: 64150, conversions: 13734 },
    deltas: { spend: +6.8, impressions: +4.2, ctr: +1.1, clicks: +3.1, cpc: +3.5, conv: +9.4, cr: -1.9, cpa: +12.2 },
    daily: [
      { date: "2026-02-15", spend: 84210.45, clicks: 4012 }, { date: "2026-02-16", spend: 91135.12, clicks: 4260 },
      { date: "2026-02-17", spend: 98340.88, clicks: 4521 }, { date: "2026-02-18", spend: 102114.22, clicks: 4680 },
      { date: "2026-02-19", spend: 96770.15, clicks: 4511 }, { date: "2026-02-20", spend: 88902.30, clicks: 4325 },
      { date: "2026-02-21", spend: 90510.66, clicks: 4401 }, { date: "2026-02-22", spend: 159783.43, clicks: 7810 },
      { date: "2026-02-23", spend: 104110.56, clicks: 5101 }, { date: "2026-02-24", spend: 205957.02, clicks: 8894 },
      { date: "2026-02-25", spend: 218115.52, clicks: 9217 }, { date: "2026-02-26", spend: 206104.55, clicks: 8016 },
      { date: "2026-02-27", spend: 183658.05, clicks: 8907 }, { date: "2026-02-28", spend: 220800.93, clicks: 14983 }
    ],
    alerts: [
      { level: "warn", title: "Перерасход относительно среднедневного", desc: "За последние 2 дня расход выше среднего по периоду на 18%. Проверьте ставки и дневные лимиты.", right: "сегодня" },
      { level: "bad", title: "CR просел при росте кликов", desc: "Кликов больше, но конверсии не растут пропорционально. Проверьте запросы/площадки и качество трафика.", right: "2 дня" },
      { level: "warn", title: "Рост CPC быстрее роста CTR", desc: "Стоимость клика растёт, а CTR почти не меняется. Есть риск выгорания креативов/аудиторий.", right: "3 дня" }
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
      search: { spend: +5.6, ctr: +1.8, cr: -2.1, cpa: +8.4, clicks: +2.9, impressions: +4.7, conversions: +6.2, cpc: +3.1 },
      rsya: { spend: +8.9, ctr: -1.4, cr: -3.8, cpa: +11.7, clicks: +1.6, impressions: +5.3, conversions: +2.5, cpc: +6.5 }
    }
  };

  ns.state = {
    filter: "all",
    sortBy: "severity",
    selectedChannelKpi: null,
    chartChannel: "all",
    chartMode: "traffic",
    periodDays: 14,
    activeKpiMetric: "spend",
    theme: "dark"
  };

  function generateExtendedDaily(days = 28) {
    const source = ns.demo.daily.slice(-Math.min(ns.demo.daily.length, days));
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

  ns.extendedDaily = generateExtendedDaily(28);
  ns.getVisibleDailyData = () => ns.extendedDaily.slice(-ns.state.periodDays);

  ns.getDailyMetric = function getDailyMetric(metric, days = ns.state.periodDays) {
    const points = ns.extendedDaily.slice(-days);
    return points.map((point, index) => {
      const impressions = Math.max(point.clicks, Math.round(point.clicks * (49 + Math.sin(index / 2.6) * 4)));
      const conversions = Math.max(1, Math.round(point.clicks * (0.2 + Math.cos(index / 3.1) * 0.025)));
      const ctr = impressions ? (point.clicks / impressions) * 100 : 0;
      const cpc = point.clicks ? (point.spend / point.clicks) : 0;
      const cr = point.clicks ? (conversions / point.clicks) * 100 : 0;
      const cpa = conversions ? (point.spend / conversions) : 0;
      return { date: point.date, value: ({ spend: point.spend, impressions, ctr, clicks: point.clicks, cpc, conversions, cr, cpa })[metric] ?? 0 };
    });
  };

  ns.aggregateByName = function aggregateByName(part) {
    return ns.demo.campaigns
      .filter((c) => c.name.includes(part))
      .reduce((acc, c) => {
        acc.spend += c.spend;
        acc.impressions += c.impr;
        acc.clicks += c.clicks;
        acc.conversions += c.conv;
        return acc;
      }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
  };

  ns.getChannelDaily = function getChannelDaily(channel) {
    const source = ns.getVisibleDailyData();
    return source.map((d, index) => {
      const searchRatio = Math.min(0.74, Math.max(0.58, 0.65 + Math.sin(index / 2.4) * 0.06));
      const ratio = channel === "search" ? searchRatio : 1 - searchRatio;
      return { date: d.date, spend: d.spend * ratio, clicks: Math.round(d.clicks * ratio) };
    });
  };
})();
