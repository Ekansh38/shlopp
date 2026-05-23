// Sidebar — Obsidian-style note pane with backlinks, outgoing links, and inline link adding
import { getNode, getSection, getPost, getConnectionsForNode, getSections, getPosts, getCurrentUser, addConnectionToPost } from './data.js';
import Fuse from 'fuse.js';

let sidebarEl = null;
let contentEl = null;
let onNavigate = null;
let onReply = null;
let onEdit = null;
let onLinkAdded = null;

export function initSidebar(el, callbacks) {
  sidebarEl = el;
  contentEl = document.getElementById('sidebar-content');
  onNavigate = callbacks.onNavigate;
  onReply = callbacks.onReply;
  onEdit = callbacks.onEdit;
  onLinkAdded = callbacks.onLinkAdded;

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
  const { incoming } = getConnectionsForNode(section.id);
  const posts = getPosts();
  const sectionPosts = posts.filter(p => {
    const { outgoing } = getConnectionsForNode(p.id);
    return outgoing.includes(section.id);
  }).sort((a, b) => b.timestamp - a.timestamp);

  contentEl.innerHTML = `
    <div class="pane-breadcrumb">section</div>
    <div class="pane-title-row">
      <div class="pane-color-dot" style="background: ${section.color}"></div>
      <h1 class="pane-title">${section.name}</h1>
    </div>
    <p class="pane-desc">${section.description}</p>

    <div class="pane-stat-bar">
      <div class="pane-stat"><span class="pane-stat-num">${incoming.length}</span> posts</div>
    </div>

    <div class="pane-divider"></div>

    <div class="pane-section-label">${incoming.length} linked posts</div>
    <div class="pane-backlinks">
      ${sectionPosts.length === 0
        ? '<div class="pane-empty">no posts yet</div>'
        : sectionPosts.slice(0, 30).map(p => renderBacklinkCard(p)).join('')
      }
    </div>
  `;

  wireBacklinkClicks();
}

function renderPost(post) {
  const { incoming, outgoing } = getConnectionsForNode(post.id);
  const currentUser = getCurrentUser();
  const isAuthor = currentUser === post.author;

  // Separate outgoing into sections and posts
  const outgoingSections = outgoing.filter(id => id.startsWith('sec-')).map(id => getNode(id)).filter(Boolean);
  const outgoingPosts = outgoing.filter(id => !id.startsWith('sec-')).map(id => getNode(id)).filter(Boolean);

  // Incoming = backlinks (other posts that link TO this one)
  const backlinks = incoming.map(id => getNode(id)).filter(n => n && n.type !== 'section');
  const backlinkSections = incoming.map(id => getNode(id)).filter(n => n && n.type === 'section');

  contentEl.innerHTML = `
    <div class="pane-breadcrumb">
      ${outgoingSections.map(s => `<a class="pane-crumb" data-id="${s.id}" style="color: ${s.color}">${s.name}</a>`).join(' / ')}
    </div>

    <div class="pane-post-meta">
      <span class="pane-author">${post.author}</span>
      <span class="pane-time">${formatTime(post.timestamp)}</span>
      ${post.edits && post.edits.length > 0 ? `<span class="pane-edited">edited ${post.edits.length}x</span>` : ''}
    </div>

    <div class="pane-body">${escapeHtml(post.text)}</div>

    <div class="pane-actions">
      <button class="pane-action-btn pane-action-primary" id="sidebar-reply">
        <span class="pane-action-icon">&#8617;</span> reply
      </button>
      <button class="pane-action-btn" id="sidebar-add-link">
        <span class="pane-action-icon">+</span> add link
      </button>
      ${isAuthor ? '<button class="pane-action-btn" id="sidebar-edit"><span class="pane-action-icon">&#9998;</span> edit</button>' : ''}
    </div>

    <!-- Add link inline search (hidden by default) -->
    <div class="pane-link-adder hidden" id="pane-link-adder">
      <input type="text" class="pane-link-search" id="pane-link-search" placeholder="search posts or sections to link..." autocomplete="off" spellcheck="false" />
      <div class="pane-link-results" id="pane-link-results"></div>
    </div>

    <div class="pane-divider"></div>

    <!-- Outgoing links (posts this links to) -->
    ${outgoingPosts.length > 0 ? `
      <div class="pane-section-label">${outgoingPosts.length} outgoing link${outgoingPosts.length !== 1 ? 's' : ''}</div>
      <div class="pane-links">
        ${outgoingPosts.map(p => renderLinkCard(p, 'outgoing')).join('')}
      </div>
    ` : ''}

    <!-- Backlinks (posts that link to this) -->
    ${backlinks.length > 0 ? `
      <div class="pane-section-label">${backlinks.length} backlink${backlinks.length !== 1 ? 's' : ''}</div>
      <div class="pane-backlinks">
        ${backlinks.map(p => renderBacklinkCard(p)).join('')}
      </div>
    ` : `
      <div class="pane-section-label">0 backlinks</div>
      <div class="pane-empty">no posts link here yet</div>
    `}

    ${post.edits && post.edits.length > 0 ? `
      <div class="pane-divider"></div>
      <details class="pane-edit-history">
        <summary class="pane-section-label pane-clickable">edit history (${post.edits.length})</summary>
        ${post.edits.map(edit => `
          <div class="pane-edit-item">
            <div class="pane-edit-time">${formatTime(edit.timestamp)}</div>
            <div class="pane-edit-text">${escapeHtml(edit.text)}</div>
          </div>
        `).join('')}
      </details>
    ` : ''}
  `;

  wireBacklinkClicks();
  wireBreadcrumbClicks();
  wireActions(post);
  wireLinkAdder(post);
}

function renderBacklinkCard(post) {
  const { outgoing } = getConnectionsForNode(post.id);
  const sections = outgoing.filter(id => id.startsWith('sec-')).map(id => getNode(id)).filter(Boolean);

  return `
    <div class="pane-backlink-card" data-id="${post.id}">
      <div class="pane-backlink-header">
        <span class="pane-backlink-author">${post.author}</span>
        <span class="pane-backlink-time">${timeAgo(post.timestamp)}</span>
        ${sections.map(s => `<span class="pane-backlink-tag" style="color: ${s.color}">${s.name}</span>`).join('')}
      </div>
      <div class="pane-backlink-preview">${escapeHtml(post.text).slice(0, 140)}${post.text.length > 140 ? '...' : ''}</div>
    </div>
  `;
}

function renderLinkCard(node, direction) {
  if (node.type === 'section') {
    return `
      <div class="pane-link-card" data-id="${node.id}">
        <div class="pane-link-header">
          <span class="pane-link-dot" style="background: ${node.color}"></span>
          <span class="pane-link-name">${node.name}</span>
        </div>
      </div>
    `;
  }
  return `
    <div class="pane-link-card" data-id="${node.id}">
      <div class="pane-link-header">
        <span class="pane-link-author">${node.author}</span>
        <span class="pane-link-time">${timeAgo(node.timestamp)}</span>
      </div>
      <div class="pane-link-preview">${escapeHtml(node.text).slice(0, 100)}${node.text.length > 100 ? '...' : ''}</div>
    </div>
  `;
}

function wireBacklinkClicks() {
  contentEl.querySelectorAll('.pane-backlink-card, .pane-link-card').forEach(el => {
    el.addEventListener('click', () => {
      if (onNavigate) onNavigate(el.dataset.id);
    });
  });
}

function wireBreadcrumbClicks() {
  contentEl.querySelectorAll('.pane-crumb').forEach(el => {
    el.addEventListener('click', () => {
      if (onNavigate) onNavigate(el.dataset.id);
    });
  });
}

function wireActions(post) {
  const replyBtn = document.getElementById('sidebar-reply');
  if (replyBtn) {
    replyBtn.addEventListener('click', () => {
      if (onReply) onReply(post.id);
    });
  }

  const editBtn = document.getElementById('sidebar-edit');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (onEdit) onEdit(post);
    });
  }

  const addLinkBtn = document.getElementById('sidebar-add-link');
  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', () => {
      const adder = document.getElementById('pane-link-adder');
      adder.classList.toggle('hidden');
      if (!adder.classList.contains('hidden')) {
        document.getElementById('pane-link-search').focus();
      }
    });
  }
}

function wireLinkAdder(post) {
  const searchInput = document.getElementById('pane-link-search');
  const resultsEl = document.getElementById('pane-link-results');
  if (!searchInput) return;

  const { outgoing } = getConnectionsForNode(post.id);
  const existingLinks = new Set(outgoing);

  const allItems = [
    ...getSections().map(s => ({ id: s.id, type: 'section', name: s.name, text: s.description, color: s.color })),
    ...getPosts().filter(p => p.id !== post.id && !existingLinks.has(p.id)).map(p => ({ id: p.id, type: 'post', name: p.author, text: p.text, color: null })),
  ];

  const fuse = new Fuse(allItems, {
    keys: [{ name: 'name', weight: 2 }, { name: 'text', weight: 1 }],
    threshold: 0.4,
  });

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (!query) {
      resultsEl.innerHTML = '';
      return;
    }

    const results = fuse.search(query).slice(0, 6);
    resultsEl.innerHTML = results.map(r => {
      const item = r.item;
      if (item.type === 'section') {
        return `<div class="pane-link-result" data-id="${item.id}"><span class="pane-link-dot" style="background: ${item.color}"></span> ${item.name}</div>`;
      }
      return `<div class="pane-link-result" data-id="${item.id}"><strong>${item.name}</strong>: ${escapeHtml(item.text).slice(0, 50)}...</div>`;
    }).join('');

    resultsEl.querySelectorAll('.pane-link-result').forEach(el => {
      el.addEventListener('click', () => {
        const targetId = el.dataset.id;
        addConnectionToPost(post.id, targetId);
        if (onLinkAdded) onLinkAdded(post.id, targetId);
        // Re-render the sidebar to show the new link
        openSidebar(post.id);
      });
    });
  });
}

function formatTime(timestamp) {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now - d;

  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return 'today ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 172800000) {
    return 'yesterday ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
