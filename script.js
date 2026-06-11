// Theme
const html = document.documentElement;
const toggle = document.getElementById('theme-toggle');
const icon = document.getElementById('theme-icon');

const saved = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', saved);
icon.textContent = saved === 'dark' ? '☀️' : '🌙';

toggle.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  icon.textContent = next === 'dark' ? '☀️' : '🌙';
});

// Clock (Athlone = Europe/Dublin)
function updateClock() {
  document.getElementById('clock').textContent =
    new Date().toLocaleTimeString('en-IE', { timeZone: 'Europe/Dublin', hour12: false });
}
updateClock();
setInterval(updateClock, 1000);

// Weather — Open-Meteo, Athlone coords
const WMO = {
  0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Rain showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + hail'
};

async function fetchWeather() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=53.4239&longitude=-7.9407&current_weather=true'
    );
    const data = await res.json();
    const { temperature, weathercode } = data.current_weather;
    const desc = WMO[weathercode] ?? 'Unknown';
    document.getElementById('weather').textContent = `${temperature}°C · ${desc}`;
  } catch {
    document.getElementById('weather').textContent = 'Unavailable';
  }
}
fetchWeather();

// Proxmox stats
const PROXMOX_TOKEN = 'root@pam!dashboard=2f8ada96-3809-43fe-b1a5-65902bcc1bf0';
const PROXMOX_BASE = 'https://proxmox.alex.tr/api2/json';

function setBar(id, pct) {
  const fill = document.getElementById(`bar-${id}`);
  fill.style.width = pct + '%';
  fill.className = 'bar-fill' + (pct >= 90 ? ' crit' : pct >= 70 ? ' warn' : '');
}

async function fetchProxmoxStats() {
  try {
    const headers = { 'Authorization': `PVEAPIToken=${PROXMOX_TOKEN}` };

    const [nodeRes, diskRes] = await Promise.all([
      fetch(`${PROXMOX_BASE}/nodes/pve/status`, { headers }),
      fetch(`${PROXMOX_BASE}/nodes/pve/disks/list`, { headers }),
    ]);

    const node = (await nodeRes.json()).data;
    const disks = (await diskRes.json()).data;

    // CPU
    const cpuPct = Math.round(node.cpu * 100);
    document.getElementById('val-cpu').textContent = `${cpuPct}%`;
    setBar('cpu', cpuPct);

    // RAM
    const ramPct = Math.round((node.memory.used / node.memory.total) * 100);
    const ramUsed = (node.memory.used / 1073741824).toFixed(1);
    const ramTotal = (node.memory.total / 1073741824).toFixed(1);
    document.getElementById('val-ram').textContent = `${ramUsed}/${ramTotal} GB`;
    setBar('ram', ramPct);

    // Disk — sum used/total across all disks
    const diskUsed = disks.reduce((a, d) => a + (d.used ?? 0), 0);
    const diskTotal = disks.reduce((a, d) => a + (d.size ?? 0), 0);
    if (diskTotal > 0) {
      const diskPct = Math.round((diskUsed / diskTotal) * 100);
      const usedGB = (diskUsed / 1073741824).toFixed(1);
      const totalGB = (diskTotal / 1073741824).toFixed(1);
      document.getElementById('val-disk').textContent = `${usedGB}/${totalGB} GB`;
      setBar('disk', diskPct);
    } else {
      document.getElementById('val-disk').textContent = 'N/A';
    }
  } catch {
    ['cpu', 'ram', 'disk'].forEach(id => {
      document.getElementById(`val-${id}`).textContent = 'N/A';
    });
  }
}

fetchProxmoxStats();
setInterval(fetchProxmoxStats, 30000);


const services = [
  { id: 'proxmox',   url: 'https://proxmox.alex.tr' },
  { id: 'jellyfin',  url: 'https://jellyfin.alex.tr/health' },
  { id: 'immich',    url: 'https://immich.alex.tr/api/server/ping' },
  { id: 'navidrome', url: 'https://music.alex.tr/ping' },
  { id: 'komga',     url: 'https://komga.alex.tr' },
];

async function checkService({ id, url }) {
  const badge = document.getElementById(`status-${id}`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    // Use GET + no-cors — works for any server regardless of allowed methods
    await fetch(url, { method: 'GET', signal: controller.signal, mode: 'no-cors' });
    clearTimeout(timeout);
    badge.textContent = 'UP';
    badge.className = 'badge up';
  } catch {
    badge.textContent = 'DOWN';
    badge.className = 'badge down';
  }
}

function checkAll() {
  const pulse = document.getElementById('pulse');
  pulse.classList.remove('active');
  void pulse.offsetWidth; // reflow to restart animation
  pulse.classList.add('active');

  services.forEach(checkService);

  document.getElementById('last-checked').textContent =
    'Last checked: ' + new Date().toLocaleTimeString('en-IE', { timeZone: 'Europe/Dublin', hour12: false });
}
checkAll();
setInterval(checkAll, 30000);
