// Theme — light/dark mode toggle

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
    btnEl.textContent = '\u263E'; // moon
  } else {
    document.documentElement.removeAttribute('data-theme');
    btnEl.textContent = '\u2600'; // sun
  }
}
