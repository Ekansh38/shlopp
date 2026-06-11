// Feed view — chronological list grouped by recency
import { getPosts, getConnectionsForNode, getNode } from './data.js';

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

  // Group by time period
  const now = Date.now();
  const groups = [
    { label: 'just now', posts: [], max: 3600000 },         // 1 hour
    { label: 'today', posts: [], max: 86400000 },            // 24 hours
    { label: 'yesterday', posts: [], max: 172800000 },       // 48 hours
    { label: 'this week', posts: [], max: 604800000 },       // 7 days
    { label: 'older', posts: [], max: Infinity },
  ];

  for (const post of sorted) {
    const age = now - post.timestamp;
    for (const group of groups) {
      if (age < group.max) {
        group.posts.push(post);
        break;
      }
    }
  }

  let html = '';
  for (const group of groups) {
    if (group.posts.length === 0) continue;
    html += `<div class="feed-group-label">${group.label}</div>`;
    html += group.posts.map(post => renderFeedItem(post)).join('');
  }

  containerEl.innerHTML = html;

  // Click handlers
  containerEl.querySelectorAll('.feed-item').forEach(el => {
    el.addEventListener('click', () => {
      if (onPostClick) onPostClick(el.dataset.id);
    });
  });
}

function renderFeedItem(post) {
  const { outgoing, incoming } = getConnectionsForNode(post.id);
  const sectionIds = outgoing.filter(id => id.startsWith('sec-'));
  const sections = sectionIds.map(id => getNode(id)).filter(Boolean);
  const linkedPosts = outgoing.filter(id => !id.startsWith('sec-'));
  const backlinks = incoming.filter(id => !id.startsWith('sec-'));

  // Get a preview of what this replies to
  let replyPreview = '';
  if (linkedPosts.length > 0) {
    const parent = getNode(linkedPosts[0]);
    if (parent) {
      replyPreview = `
        <div class="feed-reply-context">
          <span class="feed-reply-arrow">&#8627;</span>
          <span class="feed-reply-to">@${escapeHtml(parent.author)}:</span>
          <span class="feed-reply-preview">${escapeHtml(parent.text).slice(0, 60)}${parent.text.length > 60 ? '...' : ''}</span>
        </div>
      `;
    }
  }

  return `
    <div class="feed-item" data-id="${post.id}">
      ${replyPreview}
      <div class="feed-header">
        <span class="feed-author">${escapeHtml(post.author)}</span>
        <span class="feed-time">${timeAgo(post.timestamp)}</span>
      </div>
      <div class="feed-text">${escapeHtml(post.text)}</div>
      <div class="feed-footer">
        <div class="feed-sections">
          ${sections.map(s => `<span class="feed-section-tag" style="color: ${s.color}; border-color: ${s.color}">${s.name}</span>`).join('')}
        </div>
        <div class="feed-stats">
          ${backlinks.length > 0 ? `<span class="feed-stat">${backlinks.length} backlink${backlinks.length !== 1 ? 's' : ''}</span>` : ''}
          ${linkedPosts.length > 0 ? `<span class="feed-stat">${linkedPosts.length} link${linkedPosts.length !== 1 ? 's' : ''}</span>` : ''}
          ${post.edits && post.edits.length > 0 ? '<span class="feed-stat">edited</span>' : ''}
        </div>
      </div>
    </div>
  `;
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
