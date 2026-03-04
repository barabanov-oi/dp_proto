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
  const ctx = canvas.getContext('2d');
  const { labels, spend, clicks } = demoCampaign.trend;
  const width = canvas.width;
  const height = canvas.height;
  const pad = { top: 26, right: 56, bottom: 38, left: 62 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const maxSpend = Math.max(...spend) * 1.1;
  const maxClicks = Math.max(...clicks) * 1.1;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  ctx.lineWidth = 1;
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.62)';

  for (let i = 0; i < 5; i += 1) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();

    const spendVal = Math.round(maxSpend - (maxSpend / 4) * i);
    const clicksVal = Math.round(maxClicks - (maxClicks / 4) * i);
    ctx.fillText(fmtNum(spendVal), 8, y + 4);
    ctx.fillText(fmtNum(clicksVal), width - pad.right + 8, y + 4);
  }

  const getX = (index) => pad.left + (chartW / (labels.length - 1)) * index;
  const getYSpend = (value) => pad.top + chartH - (value / maxSpend) * chartH;
  const getYClicks = (value) => pad.top + chartH - (value / maxClicks) * chartH;

  ctx.strokeStyle = '#6d5efc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  spend.forEach((value, index) => {
    const x = getX(index);
    const y = getYSpend(value);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = 'rgba(109,94,252,.25)';
  ctx.beginPath();
  spend.forEach((value, index) => {
    const x = getX(index);
    const y = getYSpend(value);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(getX(labels.length - 1), pad.top + chartH);
  ctx.lineTo(getX(0), pad.top + chartH);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  clicks.forEach((value, index) => {
    const x = getX(index);
    const y = getYClicks(value);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  labels.forEach((label, index) => {
    const x = getX(index);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fillText(label, x - 10, height - 12);

    ctx.fillStyle = '#6d5efc';
    ctx.beginPath();
    ctx.arc(x, getYSpend(spend[index]), 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x, getYClicks(clicks[index]), 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(255,255,255,.86)';
  ctx.fillText('● Расход', pad.left, 14);
  ctx.fillStyle = '#22c55e';
  ctx.fillText('● Клики', pad.left + 90, 14);
}

function drawPie(canvasId, values) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  const radius = Math.min(canvas.width, canvas.height) / 2 - 10;
  const total = values.reduce((acc, item) => acc + item.value, 0);
  let angle = -Math.PI / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  values.forEach((item, index) => {
    const part = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.arc(center.x, center.y, radius, angle, angle + part);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    angle += part;
  });

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = '#0f1730';
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.font = '11px sans-serif';
  values.forEach((item, index) => {
    const y = 16 + index * 14;
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(12, y - 8, 8, 8);
    ctx.fillStyle = 'rgba(255,255,255,.76)';
    ctx.fillText(`${item.name} ${Math.round((item.value / total) * 100)}%`, 26, y);
  });
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

  drawPie('deviceSpendChart', devices.map((item) => ({ name: item.name, value: item.spend })));
  drawPie('deviceClicksChart', devices.map((item) => ({ name: item.name, value: item.clicks })));
  drawPie('genderSpendChart', gender.map((item) => ({ name: item.name, value: item.spend })));
  drawPie('genderClicksChart', gender.map((item) => ({ name: item.name, value: item.clicks })));
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
