// Sidebar — post/section detail panel
import { getNode, getSection, getPost, getConnectionsForNode, getSections, getPosts, getCurrentUser } from './data.js';

let sidebarEl = null;
let contentEl = null;
let onNavigate = null;
let onReply = null;
let onEdit = null;

export function initSidebar(el, callbacks) {
  sidebarEl = el;
  contentEl = document.getElementById('sidebar-content');
  onNavigate = callbacks.onNavigate;
  onReply = callbacks.onReply;
  onEdit = callbacks.onEdit;

  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
}

export function openSidebar(nodeId) {
  const node = getNode(nodeId);
  if (!node) return;

  if (node.type === 'section') {
    renderSection(node);
  } else {
    renderPost(node);
  }

  sidebarEl.classList.add('open');
}

export function closeSidebar() {
  sidebarEl.classList.remove('open');
}

export function isSidebarOpen() {
  return sidebarEl.classList.contains('open');
}

function renderSection(section) {
  const { incoming, outgoing } = getConnectionsForNode(section.id);
  const posts = getPosts();
  const sectionPosts = posts.filter(p => {
    const { outgoing } = getConnectionsForNode(p.id);
    return outgoing.includes(section.id);
  }).sort((a, b) => b.timestamp - a.timestamp);

  contentEl.innerHTML = `
    <div class="sidebar-section-header">
      <div class="sidebar-section-dot" style="background: ${section.color}"></div>
      <div class="sidebar-section-name">${section.name}</div>
    </div>
    <div class="sidebar-section-desc">${section.description}</div>
    <div class="sidebar-section-stats">
      <span><strong>${incoming.length}</strong> posts</span>
    </div>
    <div class="sidebar-connections-title">recent posts</div>
    <div class="sidebar-recent-posts">
      ${sectionPosts.length === 0
        ? '<div style="color: var(--text-faint); font-size: 11px;">no posts yet</div>'
        : sectionPosts.slice(0, 20).map(p => `
          <div class="sidebar-recent-post" data-id="${p.id}">
            <div class="sidebar-recent-post-author">${p.author} <span style="color: var(--text-faint); font-weight: 400; font-size: 10px;">${timeAgo(p.timestamp)}</span></div>
            <div class="sidebar-recent-post-preview">${escapeHtml(p.text)}</div>
          </div>
        `).join('')
      }
    </div>
  `;

  // Click handlers for recent posts
  contentEl.querySelectorAll('.sidebar-recent-post').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (onNavigate) onNavigate(id);
    });
  });
}

function renderPost(post) {
  const { incoming, outgoing } = getConnectionsForNode(post.id);
  const currentUser = getCurrentUser();
  const isAuthor = currentUser === post.author;

  const allConnections = [...outgoing, ...incoming];
  const connectionNodes = allConnections.map(id => {
    const node = getNode(id);
    return node ? { id, name: node.name || `@${node.author}`, color: node.color || '#666' } : null;
  }).filter(Boolean);

  contentEl.innerHTML = `
    <div class="sidebar-post-author">${post.author}</div>
    <div class="sidebar-post-time">${timeAgo(post.timestamp)}</div>
    <div class="sidebar-post-text">${escapeHtml(post.text)}</div>

    <div class="sidebar-actions">
      <button class="sidebar-btn sidebar-btn-primary" id="sidebar-reply">reply</button>
      ${isAuthor ? '<button class="sidebar-btn" id="sidebar-edit">edit</button>' : ''}
    </div>

    <div class="sidebar-connections">
      <div class="sidebar-connections-title">links to</div>
      ${outgoing.map(id => {
        const node = getNode(id);
        if (!node) return '';
        const label = node.type === 'section' ? node.name : `@${node.author}`;
        return `<a class="sidebar-connection" data-id="${id}" style="border-color: ${node.color || 'var(--border)'}">${label}</a>`;
      }).join('')}
    </div>

    ${incoming.length > 0 ? `
      <div class="sidebar-connections">
        <div class="sidebar-connections-title">linked by</div>
        ${incoming.map(id => {
          const node = getNode(id);
          if (!node) return '';
          const label = node.type === 'section' ? node.name : `@${node.author}`;
          return `<a class="sidebar-connection" data-id="${id}" style="border-color: ${node.color || 'var(--border)'}">${label}</a>`;
        }).join('')}
      </div>
    ` : ''}

    ${post.edits && post.edits.length > 0 ? `
      <div class="sidebar-edit-history">
        <div class="sidebar-edit-history-title">edit history (${post.edits.length})</div>
        ${post.edits.map(edit => `
          <div class="sidebar-edit-item">
            <div class="sidebar-edit-item-time">${timeAgo(edit.timestamp)}</div>
            <div>${escapeHtml(edit.text)}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;

  // Connection click handlers
  contentEl.querySelectorAll('.sidebar-connection').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (onNavigate) onNavigate(id);
    });
  });

  // Reply button
  const replyBtn = document.getElementById('sidebar-reply');
  if (replyBtn) {
    replyBtn.addEventListener('click', () => {
      if (onReply) onReply(post.id);
    });
  }

  // Edit button
  const editBtn = document.getElementById('sidebar-edit');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (onEdit) onEdit(post);
    });
  }
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
