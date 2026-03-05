import { demo } from './store.js';

export function renderAlerts() {
  const ul = document.getElementById('alertsList');
  if (!ul) return;
  ul.innerHTML = '';
  demo.alerts.forEach((a) => {
    const li = document.createElement('li');
    li.className = 'statusItem';
    li.innerHTML = `
      <div class="statusLeft">
        <div class="badge ${a.level || ''}"></div>
        <div><b>${a.title}</b><small>${a.desc}</small></div>
      </div>
      <div class="statusRight">${a.right || ''}</div>
    `;
    ul.appendChild(li);
  });
  document.getElementById('alertsCount').textContent = `${demo.alerts.length} сигнала`;
}
