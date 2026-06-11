// Theme — light/dark mode toggle

const SUN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></svg>';
const MOON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13.5A8.5 8.5 0 0 1 10.5 4 8.5 8.5 0 1 0 20 13.5z" /></svg>';

let btnEl = null;

export function initTheme() {
  btnEl = document.getElementById('btn-theme');

  // Load saved preference or default to dark
  const saved = localStorage.getItem('shlopp-theme');
  const theme = saved || 'dark';
  applyTheme(theme);

  btnEl.addEventListener('click', toggle);
}

function toggle() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('shlopp-theme', next);
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    btnEl.innerHTML = MOON_SVG;
  } else {
    document.documentElement.removeAttribute('data-theme');
    btnEl.innerHTML = SUN_SVG;
  }
}
