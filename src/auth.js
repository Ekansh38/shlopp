// Auth — login/signup modal
import { login, signup, logout, getCurrentUser } from './data.js';

let overlayEl = null;
let bodyEl = null;
let titleEl = null;
let isSignup = false;
let onAuthChange = null;

export function initAuth(callbacks) {
  overlayEl = document.getElementById('auth-overlay');
  bodyEl = document.getElementById('auth-body');
  titleEl = document.getElementById('auth-title');
  onAuthChange = callbacks.onAuthChange;

  document.getElementById('auth-close').addEventListener('click', closeAuth);
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) closeAuth();
  });
}

export function openAuth() {
  const user = getCurrentUser();
  if (user) {
    renderLoggedIn(user);
  } else {
    isSignup = false;
    renderForm();
  }
  overlayEl.classList.remove('hidden');
}

export function closeAuth() {
  overlayEl.classList.add('hidden');
}

function renderForm() {
  titleEl.textContent = isSignup ? 'sign up' : 'log in';

  bodyEl.innerHTML = `
    <div class="auth-form">
      <input type="text" class="auth-input" id="auth-username" placeholder="username" autocomplete="off" spellcheck="false" />
      <input type="password" class="auth-input" id="auth-password" placeholder="password" />
      <div class="auth-error hidden" id="auth-error"></div>
      <button class="auth-submit" id="auth-submit">${isSignup ? 'sign up' : 'log in'}</button>
      <div class="auth-toggle">
        ${isSignup
          ? 'already have an account? <a id="auth-switch">log in</a>'
          : 'no account? <a id="auth-switch">sign up</a>'}
      </div>
    </div>
  `;

  // Wire events
  document.getElementById('auth-submit').addEventListener('click', handleSubmit);
  document.getElementById('auth-switch').addEventListener('click', () => {
    isSignup = !isSignup;
    renderForm();
  });

  // Enter key
  bodyEl.querySelectorAll('.auth-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  });

  setTimeout(() => {
    document.getElementById('auth-username').focus();
  }, 100);
}

function renderLoggedIn(username) {
  titleEl.textContent = 'account';

  bodyEl.innerHTML = `
    <div class="auth-logged-in">
      <div class="auth-username">${escapeHtml(username)}</div>
      <button class="auth-submit" id="auth-logout">log out</button>
    </div>
  `;

  document.getElementById('auth-logout').addEventListener('click', () => {
    logout();
    if (onAuthChange) onAuthChange(null);
    renderForm();
  });
}

function handleSubmit() {
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');

  if (!username) {
    showError(errorEl, 'enter a username');
    return;
  }
  if (!password) {
    showError(errorEl, 'enter a password');
    return;
  }
  if (username.length < 3) {
    showError(errorEl, 'username must be at least 3 characters');
    return;
  }

  let result;
  if (isSignup) {
    result = signup(username, password);
  } else {
    result = login(username, password);
  }

  if (result) {
    if (onAuthChange) onAuthChange(result.username);
    closeAuth();
  } else {
    showError(errorEl, 'something went wrong');
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

const USER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4.5 20c1.5-3.5 4.2-5 7.5-5s6 1.5 7.5 5" /></svg>';

export function updateAuthButton() {
  const btn = document.getElementById('btn-auth');
  const user = getCurrentUser();
  if (user) {
    btn.textContent = user.slice(0, 2).toLowerCase();
    btn.classList.add('logged-in');
  } else {
    btn.innerHTML = USER_SVG;
    btn.classList.remove('logged-in');
  }
  btn.title = user ? user : 'account';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
