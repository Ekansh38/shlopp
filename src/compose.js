// Compose — new post creation modal
import { getSections, getPosts, createPost, editPost, getCurrentUser, getConnectionsForNode, getNode } from './data.js';
import Fuse from 'fuse.js';

let overlayEl = null;
let bodyEl = null;
let onPostCreated = null;
let onPostEdited = null;
let selectedSections = new Set();
let selectedPosts = new Set();
let prelinkedId = null;
let editingPost = null;

const MAX_CHARS = 4000;

export function initCompose(callbacks) {
  overlayEl = document.getElementById('compose-overlay');
  bodyEl = document.getElementById('compose-body');
  onPostCreated = callbacks.onPostCreated;
  onPostEdited = callbacks.onPostEdited;

  document.getElementById('compose-close').addEventListener('click', closeCompose);
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) closeCompose();
  });
}

export function openCompose(replyToId = null) {
  if (!getCurrentUser()) {
    alert('log in first');
    return;
  }

  editingPost = null;
  prelinkedId = replyToId;
  selectedSections = new Set();
  selectedPosts = new Set();

  if (replyToId) {
    if (replyToId.startsWith('sec-')) {
      selectedSections.add(replyToId);
    } else {
      selectedPosts.add(replyToId);
      // Also inherit the parent's sections
      const { outgoing } = getConnectionsForNode(replyToId);
      outgoing.filter(id => id.startsWith('sec-')).forEach(id => selectedSections.add(id));
    }
  }

  document.querySelector('#compose-modal .modal-header h2').textContent = 'new post';
  renderComposeBody('');
  overlayEl.classList.remove('hidden');

  // Focus textarea
  setTimeout(() => {
    const ta = document.getElementById('compose-textarea');
    if (ta) ta.focus();
  }, 100);
}

export function openEdit(post) {
  if (!getCurrentUser() || getCurrentUser() !== post.author) return;
  editingPost = post;
  selectedSections = new Set();
  selectedPosts = new Set();

  // Load existing connections
  const { outgoing } = getConnectionsForNode(post.id);
  outgoing.forEach(id => {
    if (id.startsWith('sec-')) selectedSections.add(id);
    else selectedPosts.add(id);
  });

  document.querySelector('#compose-modal .modal-header h2').textContent = 'edit post';
  renderComposeBody(post.text);
  overlayEl.classList.remove('hidden');

  setTimeout(() => {
    const ta = document.getElementById('compose-textarea');
    if (ta) ta.focus();
  }, 100);
}

export function closeCompose() {
  overlayEl.classList.add('hidden');
  editingPost = null;
}

function renderComposeBody(initialText) {
  const sections = getSections();

  bodyEl.innerHTML = `
    <textarea id="compose-textarea" placeholder="what's on your mind?" maxlength="${MAX_CHARS}">${escapeHtml(initialText)}</textarea>
    <div id="compose-char-count">${initialText.length} / ${MAX_CHARS}</div>

    <div class="compose-label">sections</div>
    <div class="compose-sections">
      ${sections.map(s => `
        <button class="compose-section-pill ${selectedSections.has(s.id) ? 'selected' : ''}"
                data-id="${s.id}"
                style="--pill-color: ${s.color}; ${selectedSections.has(s.id) ? `color: ${s.color}; border-color: ${s.color}` : ''}">
          ${s.name}
        </button>
      `).join('')}
    </div>

    <div class="compose-label">link to posts</div>
    <input type="text" class="compose-link-search" placeholder="search posts to link..." id="compose-link-search" />
    <div class="compose-link-results" id="compose-link-results"></div>

    <div class="compose-selected-links" id="compose-selected-links">
      ${[...selectedPosts].map(id => {
        const node = getNode(id);
        return node ? `
          <div class="compose-selected-link" data-id="${id}">
            <span>@${node.author}: ${escapeHtml(node.text).slice(0, 30)}...</span>
            <button data-remove="${id}">&times;</button>
          </div>
        ` : '';
      }).join('')}
    </div>

    <div class="compose-footer">
      <button class="compose-submit" id="compose-submit" ${!canSubmit(initialText) ? 'disabled' : ''}>
        ${editingPost ? 'save' : 'post'}
      </button>
    </div>
  `;

  // Wire up events
  const textarea = document.getElementById('compose-textarea');
  const charCount = document.getElementById('compose-char-count');
  const submitBtn = document.getElementById('compose-submit');

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    charCount.textContent = `${len} / ${MAX_CHARS}`;
    charCount.className = len > MAX_CHARS * 0.9 ? 'warning' : '';
    submitBtn.disabled = !canSubmit(textarea.value);
  });

  // Section pills
  bodyEl.querySelectorAll('.compose-section-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const id = pill.dataset.id;
      if (selectedSections.has(id)) {
        selectedSections.delete(id);
        pill.classList.remove('selected');
        pill.style.color = '';
        pill.style.borderColor = '';
      } else {
        selectedSections.add(id);
        pill.classList.add('selected');
        const section = sections.find(s => s.id === id);
        pill.style.color = section.color;
        pill.style.borderColor = section.color;
      }
      submitBtn.disabled = !canSubmit(textarea.value);
    });
  });

  // Post link search
  const linkSearch = document.getElementById('compose-link-search');
  const linkResults = document.getElementById('compose-link-results');
  const posts = getPosts();
  const fuse = new Fuse(posts, {
    keys: ['text', 'author'],
    threshold: 0.4,
  });

  linkSearch.addEventListener('input', () => {
    const query = linkSearch.value.trim();
    if (!query) {
      linkResults.innerHTML = '';
      return;
    }

    const results = fuse.search(query).slice(0, 8);
    linkResults.innerHTML = results.map(r => `
      <div class="compose-link-result" data-id="${r.item.id}">
        <strong>${r.item.author}</strong>: ${escapeHtml(r.item.text).slice(0, 60)}...
      </div>
    `).join('');

    linkResults.querySelectorAll('.compose-link-result').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        selectedPosts.add(id);
        linkSearch.value = '';
        linkResults.innerHTML = '';
        updateSelectedLinks();
        submitBtn.disabled = !canSubmit(textarea.value);
      });
    });
  });

  // Remove selected links
  bodyEl.addEventListener('click', (e) => {
    const removeId = e.target.dataset?.remove;
    if (removeId) {
      selectedPosts.delete(removeId);
      updateSelectedLinks();
      submitBtn.disabled = !canSubmit(textarea.value);
    }
  });

  // Submit
  submitBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!canSubmit(text)) return;

    if (editingPost) {
      editPost(editingPost.id, text);
      if (onPostEdited) onPostEdited(editingPost.id);
    } else {
      const parentIds = [...selectedSections, ...selectedPosts];
      const newPost = createPost(text, parentIds);
      if (newPost && onPostCreated) onPostCreated(newPost, parentIds);
    }

    closeCompose();
  });
}

function updateSelectedLinks() {
  const container = document.getElementById('compose-selected-links');
  container.innerHTML = [...selectedPosts].map(id => {
    const node = getNode(id);
    return node ? `
      <div class="compose-selected-link" data-id="${id}">
        <span>@${node.author}: ${escapeHtml(node.text).slice(0, 30)}...</span>
        <button data-remove="${id}">&times;</button>
      </div>
    ` : '';
  }).join('');
}

function canSubmit(text) {
  const hasText = text.trim().length > 0;
  const hasLink = selectedSections.size > 0 || selectedPosts.size > 0;
  const withinLimit = text.length <= MAX_CHARS;
  return hasText && hasLink && withinLimit;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
