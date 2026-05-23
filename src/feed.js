// Feed view — chronological list of posts
import { getPosts, getConnectionsForNode, getSections, getNode } from './data.js';

let containerEl = null;
let onPostClick = null;

export function initFeed(el, callbacks) {
  containerEl = el;
  onPostClick = callbacks.onPostClick;
}

export function renderFeed() {
  const posts = getPosts();
  const sorted = [...posts].sort((a, b) => b.timestamp - a.timestamp);

  if (sorted.length === 0) {
    containerEl.innerHTML = '<div class="feed-empty">no posts yet. be the first.</div>';
    return;
  }

  containerEl.innerHTML = sorted.map(post => {
    const { outgoing } = getConnectionsForNode(post.id);
    const sectionIds = outgoing.filter(id => id.startsWith('sec-'));
    const sections = sectionIds.map(id => getNode(id)).filter(Boolean);
    const incoming = getConnectionsForNode(post.id).incoming;

    return `
      <div class="feed-item" data-id="${post.id}">
        <div class="feed-header">
          <span class="feed-author">${post.author}</span>
          <span class="feed-time">${timeAgo(post.timestamp)}</span>
          <div class="feed-sections">
            ${sections.map(s => `<span class="feed-section-tag" style="color: ${s.color}; border-color: ${s.color}">${s.name}</span>`).join('')}
          </div>
        </div>
        <div class="feed-text">${escapeHtml(post.text)}</div>
        <div class="feed-footer">
          <span>${incoming.length} link${incoming.length !== 1 ? 's' : ''} in</span>
          <span>${outgoing.length} link${outgoing.length !== 1 ? 's' : ''} out</span>
          ${post.edits && post.edits.length > 0 ? `<span>edited</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Click handlers
  containerEl.querySelectorAll('.feed-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (onPostClick) onPostClick(id);
    });
  });
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
