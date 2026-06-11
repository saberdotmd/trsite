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

// Player
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');

playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    iconPlay.style.display = 'none';
    iconPause.style.display = '';
  } else {
    audio.pause();
    iconPlay.style.display = '';
    iconPause.style.display = 'none';
  }
});
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
    document.getElementById('weather').textContent = `${temperature}°C · ${WMO[weathercode] ?? 'Unknown'}`;
  } catch {
    document.getElementById('weather').textContent = 'Unavailable';
  }
}
fetchWeather();
