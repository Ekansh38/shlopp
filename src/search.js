// Search — fuzzy full-text search
import { getPosts, getSections } from './data.js';
import Fuse from 'fuse.js';

let inputEl = null;
let resultsEl = null;
let onResultClick = null;
let fuse = null;

export function initSearch(callbacks) {
  inputEl = document.getElementById('search-input');
  resultsEl = document.getElementById('search-results');
  onResultClick = callbacks.onResultClick;

  inputEl.addEventListener('input', handleSearch);
  inputEl.addEventListener('focus', handleSearch);
  inputEl.addEventListener('blur', () => {
    // Delay to allow click on results
    setTimeout(() => {
      resultsEl.classList.add('hidden');
    }, 200);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      inputEl.blur();
      resultsEl.classList.add('hidden');
    }
  });
}

export function rebuildIndex() {
  const posts = getPosts();
  const sections = getSections();

  const items = [
    ...sections.map(s => ({
      id: s.id,
      type: 'section',
      name: s.name,
      text: s.description,
      color: s.color,
    })),
    ...posts.map(p => ({
      id: p.id,
      type: 'post',
      name: p.author,
      text: p.text,
      color: null,
    })),
  ];

  fuse = new Fuse(items, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'text', weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeMatches: true,
  });
}

function handleSearch() {
  const query = inputEl.value.trim();
  if (!query) {
    resultsEl.classList.add('hidden');
    return;
  }

  if (!fuse) rebuildIndex();

  const results = fuse.search(query).slice(0, 10);

  if (results.length === 0) {
    resultsEl.innerHTML = '<div class="search-result"><div class="search-result-text" style="color: var(--text-muted)">no results</div></div>';
    resultsEl.classList.remove('hidden');
    return;
  }

  resultsEl.innerHTML = results.map(r => {
    const item = r.item;
    const preview = item.text.length > 80 ? item.text.slice(0, 80) + '...' : item.text;

    return `
      <div class="search-result" data-id="${item.id}">
        <div class="search-result-type" ${item.color ? `style="color: ${item.color}"` : ''}>${item.type}</div>
        <div class="search-result-text">${item.type === 'section' ? item.name : escapeHtml(preview)}</div>
        <div class="search-result-meta">${item.type === 'post' ? `@${escapeHtml(item.name)}` : escapeHtml(item.text)}</div>
      </div>
    `;
  }).join('');

  resultsEl.classList.remove('hidden');

  resultsEl.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent blur
      const id = el.dataset.id;
      if (onResultClick) onResultClick(id);
      inputEl.value = '';
      resultsEl.classList.add('hidden');
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
