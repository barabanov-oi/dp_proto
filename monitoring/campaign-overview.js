const demoCampaign = {
  title: 'Кампания: Поиск + РСЯ | Недвижимость СПб',
  updatedAt: '02.04.2026 11:40',
  kpis: [
    { label: 'Расход', hint: 'за 7 дней', value: '184 560 ₽', delta: '+8.4%', tone: 'warn' },
    { label: 'Клики', hint: 'за 7 дней', value: '4 215', delta: '+12.1%', tone: 'good' },
    { label: 'Показы', hint: 'за 7 дней', value: '92 340', delta: '+5.3%', tone: 'good' },
    { label: 'CTR', hint: 'средний', value: '4.56%', delta: '+0.21 п.п.', tone: 'good' },
    { label: 'CPC', hint: 'средний', value: '43.79 ₽', delta: '-3.2%', tone: 'good' },
    { label: 'Конверсии', hint: 'за 7 дней', value: '206', delta: '+7.8%', tone: 'good' },
    { label: 'CR', hint: 'средний', value: '4.89%', delta: '+0.12 п.п.', tone: 'good' },
    { label: 'CPA', hint: 'средний', value: '895.92 ₽', delta: '+1.1%', tone: 'warn' }
  ],
  trend: {
    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    spend: [23520, 24600, 25140, 27200, 28050, 29210, 26840],
    clicks: [530, 560, 575, 630, 650, 680, 590]
  },
  slices: {
    devices: [
      { name: 'Мобильные', spend: 92400, clicks: 2360, cpc: 39.15, conv: 109, cpa: 847.71 },
      { name: 'Десктоп', spend: 64620, clicks: 1315, cpc: 49.14, conv: 73, cpa: 885.21 },
      { name: 'Планшеты', spend: 27540, clicks: 540, cpc: 51, conv: 24, cpa: 1147.5 }
    ],
    gender: [
      { name: 'Женщины', spend: 81240, clicks: 1880, cpc: 43.21, conv: 98, cpa: 829.0 },
      { name: 'Мужчины', spend: 77120, clicks: 1715, cpc: 44.97, conv: 83, cpa: 929.16 },
      { name: 'Не определён', spend: 26200, clicks: 620, cpc: 42.26, conv: 25, cpa: 1048.0 }
    ]
  },
  groups: [
    { name: 'Группа: Новостройки', spendShare: 36.2, clickShare: 34.1, spend: 66780, clicks: 1437, cpc: 46.47, conv: 69, cr: 4.8, cpa: 967.83 },
    { name: 'Группа: Вторичка', spendShare: 27.4, clickShare: 28.2, spend: 50570, clicks: 1189, cpc: 42.53, conv: 64, cr: 5.38, cpa: 790.16 },
    { name: 'Группа: Аренда', spendShare: 20.1, clickShare: 21.5, spend: 37095, clicks: 906, cpc: 40.94, conv: 49, cr: 5.41, cpa: 757.04 }
  ],
  networkClicksShare: 24.8,
  placements: [
    { name: 'realty.example.ru', clickShare: 6.1, spendShare: 8.4, spend: 15420, clicks: 258, cpc: 59.77, conv: 9, cr: 3.49, cpa: 1713.33 },
    { name: 'market-houses.pro', clickShare: 5.8, spendShare: 7.2, spend: 13290, clicks: 245, cpc: 54.24, conv: 12, cr: 4.9, cpa: 1107.5 },
    { name: 'kvartira-news.ru', clickShare: 4.9, spendShare: 6.4, spend: 11810, clicks: 206, cpc: 57.33, conv: 8, cr: 3.88, cpa: 1476.25 },
    { name: 'dzen-demo.ru', clickShare: 4.2, spendShare: 5.5, spend: 10150, clicks: 178, cpc: 57.02, conv: 7, cr: 3.93, cpa: 1450.0 },
    { name: 'news-home.online', clickShare: 3.8, spendShare: 4.7, spend: 8660, clicks: 162, cpc: 53.46, conv: 6, cr: 3.7, cpa: 1443.33 },
    { name: 'Остальные', clickShare: 36.2, spendShare: 38.1, spend: 70320, clicks: 1521, cpc: 46.23, conv: 54, cr: 3.55, cpa: 1302.22 }
  ]
};

const colors = ['#6d5efc', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];
const charts = {};

function fmtNum(value) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function fmtMoney(value) {
  return `${fmtNum(Math.round(value))} ₽`;
}

function renderKpi() {
  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = demoCampaign.kpis.map((kpi) => `
    <div class="kpiCard">
      <div class="kpiTop">
        <div>
          <div class="kpiLabel">${kpi.label}</div>
          <div class="kpiHint">${kpi.hint}</div>
        </div>
        <span class="delta ${kpi.tone}">${kpi.delta}</span>
      </div>
      <div class="kpiValue mono">${kpi.value}</div>
    </div>
  `).join('');
}

function drawTrendChart() {
  const canvas = document.getElementById('trendChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const { labels, spend, clicks } = demoCampaign.trend;

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Расход',
          data: spend,
          yAxisID: 'ySpend',
          backgroundColor: 'rgba(109,94,252,.25)',
          borderColor: '#6d5efc',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          type: 'line',
          label: 'Клики',
          data: clicks,
          yAxisID: 'yClicks',
          borderColor: '#22c55e',
          backgroundColor: '#22c55e',
          pointRadius: 3,
          tension: 0.28
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: 'rgba(255,255,255,.86)' } }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,.7)' },
          grid: { color: 'rgba(255,255,255,.08)' }
        },
        ySpend: {
          type: 'linear',
          position: 'left',
          ticks: {
            color: 'rgba(255,255,255,.62)',
            callback: (v) => fmtNum(v)
          },
          grid: { color: 'rgba(255,255,255,.16)' }
        },
        yClicks: {
          type: 'linear',
          position: 'right',
          ticks: {
            color: 'rgba(255,255,255,.62)',
            callback: (v) => fmtNum(v)
          },
          grid: { drawOnChartArea: false }
        }
      }
    }
  };

  if (charts.trend) {
    charts.trend.data = config.data;
    charts.trend.options = config.options;
    charts.trend.update();
    return;
  }

  charts.trend = new Chart(canvas, config);
}

function drawPie(canvasId, values, title) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  const config = {
    type: 'doughnut',
    data: {
      labels: values.map((item) => item.name),
      datasets: [{
        data: values.map((item) => item.value),
        backgroundColor: values.map((_, index) => colors[index % colors.length]),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '52%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: 'rgba(255,255,255,.76)', boxWidth: 10, boxHeight: 10 }
        },
        tooltip: {
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((sum, v) => sum + v, 0);
              const pct = total ? Math.round((context.parsed / total) * 100) : 0;
              return `${context.label}: ${fmtNum(context.parsed)} (${pct}%)`;
            },
            title: () => title
          }
        }
      }
    }
  };

  if (charts[canvasId]) {
    charts[canvasId].data = config.data;
    charts[canvasId].update();
    return;
  }

  charts[canvasId] = new Chart(canvas, config);
}

function renderSliceCards() {
  const container = document.getElementById('sliceTables');

  const buildSliceBlock = (title, rows) => `
    <article class="card span-6 sliceCard">
      <div class="sliceHeader">
        <h3>${title}</h3>
        <span class="tag">${rows.length} сегмента</span>
      </div>
      <div class="sliceGrid">
        ${rows.map((item) => {
          const cr = item.clicks > 0 ? ((item.conv / item.clicks) * 100).toFixed(2) : '0.00';
          return `
            <div class="sliceItem">
              <h4>${item.name}</h4>
              <div class="sliceStats mono">
                <div class="stat"><span class="statLabel">CPC</span><span class="statValue">${item.cpc.toFixed(2)} ₽</span></div>
                <div class="stat"><span class="statLabel">Расход</span><span class="statValue">${fmtMoney(item.spend)}</span></div>
                <div class="stat"><span class="statLabel">Клики</span><span class="statValue">${fmtNum(item.clicks)}</span></div>
                <div class="stat"><span class="statLabel">Конверсии</span><span class="statValue">${fmtNum(item.conv)}</span></div>
                <div class="stat"><span class="statLabel">CPA</span><span class="statValue">${item.cpa.toFixed(2)} ₽</span></div>
              </div>
              <div class="tableHint">CR: ${cr}%</div>
            </div>
          `;
        }).join('')}
      </div>
    </article>
  `;

  container.innerHTML = [
    buildSliceBlock('Показатели по типам устройств', demoCampaign.slices.devices),
    buildSliceBlock('Показатели по полу', demoCampaign.slices.gender)
  ].join('');
}

function renderGroupsTable() {
  const section = document.getElementById('groupsSection');
  if (demoCampaign.groups.length <= 1) {
    section.innerHTML = '';
    return;
  }

  section.innerHTML = `
    <article class="card span-12">
      <div class="cardHeader">
        <div>
          <h3 class="tableTitle">Группы кампании</h3>
          <div class="tableHint">Доли расходов и кликов, а также эффективность по каждой группе</div>
        </div>
      </div>
      <div class="cardBody">
        <div class="tableWrap">
          <table class="campaignsTable">
            <thead>
              <tr>
                <th>Группа</th>
                <th class="mono">Доля расходов</th>
                <th class="mono">Доля кликов</th>
                <th class="mono">Расход</th>
                <th class="mono">Клики</th>
                <th class="mono">CPC</th>
                <th class="mono">Конверсии</th>
                <th class="mono">CR</th>
                <th class="mono">CPA</th>
              </tr>
            </thead>
            <tbody>
              ${demoCampaign.groups.map((item) => `
                <tr>
                  <td>${item.name}</td>
                  <td class="mono">${item.spendShare.toFixed(1)}%</td>
                  <td class="mono">${item.clickShare.toFixed(1)}%</td>
                  <td class="mono">${fmtMoney(item.spend)}</td>
                  <td class="mono">${fmtNum(item.clicks)}</td>
                  <td class="mono">${item.cpc.toFixed(2)} ₽</td>
                  <td class="mono">${fmtNum(item.conv)}</td>
                  <td class="mono">${item.cr.toFixed(2)}%</td>
                  <td class="mono">${item.cpa.toFixed(2)} ₽</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  `;
}

function renderNetworksTable() {
  const section = document.getElementById('networksSection');
  if (demoCampaign.networkClicksShare <= 20) {
    section.innerHTML = '';
    return;
  }

  section.innerHTML = `
    <article class="card span-12">
      <div class="cardHeader">
        <div>
          <h3 class="tableTitle">ТОП площадок РСЯ (доля кликов из сетей: ${demoCampaign.networkClicksShare.toFixed(1)}%)</h3>
          <div class="tableHint">Топ-5 площадок по расходам + агрегированная строка «Остальные»</div>
        </div>
      </div>
      <div class="cardBody">
        <div class="tableWrap">
          <table class="campaignsTable">
            <thead>
              <tr>
                <th>Площадка</th>
                <th class="mono">Доля кликов</th>
                <th class="mono">Доля расходов</th>
                <th class="mono">Расход</th>
                <th class="mono">Клики</th>
                <th class="mono">CPC</th>
                <th class="mono">Конверсии</th>
                <th class="mono">CR</th>
                <th class="mono">CPA</th>
              </tr>
            </thead>
            <tbody>
              ${demoCampaign.placements.map((item) => `
                <tr>
                  <td>${item.name}</td>
                  <td class="mono">${item.clickShare.toFixed(1)}%</td>
                  <td class="mono">${item.spendShare.toFixed(1)}%</td>
                  <td class="mono">${fmtMoney(item.spend)}</td>
                  <td class="mono">${fmtNum(item.clicks)}</td>
                  <td class="mono">${item.cpc.toFixed(2)} ₽</td>
                  <td class="mono">${fmtNum(item.conv)}</td>
                  <td class="mono">${item.cr.toFixed(2)}%</td>
                  <td class="mono">${item.cpa.toFixed(2)} ₽</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  `;
}

function renderPies() {
  const devices = demoCampaign.slices.devices;
  const gender = demoCampaign.slices.gender;

  drawPie('deviceSpendChart', devices.map((item) => ({ name: item.name, value: item.spend })), 'Расходы по устройствам');
  drawPie('deviceClicksChart', devices.map((item) => ({ name: item.name, value: item.clicks })), 'Клики по устройствам');
  drawPie('genderSpendChart', gender.map((item) => ({ name: item.name, value: item.spend })), 'Расходы по полу');
  drawPie('genderClicksChart', gender.map((item) => ({ name: item.name, value: item.clicks })), 'Клики по полу');
}

function init() {
  document.getElementById('campaignTitle').textContent = demoCampaign.title;
  document.getElementById('lastUpdate').textContent = `Обновлено: ${demoCampaign.updatedAt}`;
  renderKpi();
  drawTrendChart();
  renderPies();
  renderSliceCards();
  renderGroupsTable();
  renderNetworksTable();
}

init();
