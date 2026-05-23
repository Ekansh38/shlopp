// Main entry — wires everything together
import { getNodesAndEdges, getNode, getSections } from './data.js';
import { initGraph, focusNode, zoomIn, zoomOut, zoomFit, setHighlightedNodes, clearHighlights, addNode, destroyGraph } from './graph.js';
import { initFeed, renderFeed } from './feed.js';
import { initSidebar, openSidebar, closeSidebar } from './sidebar.js';
import { initCompose, openCompose, openEdit, closeCompose } from './compose.js';
import { initAuth, openAuth, updateAuthButton } from './auth.js';
import { initSearch, rebuildIndex } from './search.js';
import { initTheme } from './theme.js';
import './style.css';

// Add tooltip element
const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
tooltip.innerHTML = '<div class="tooltip-author"></div><div class="tooltip-preview"></div>';
document.body.appendChild(tooltip);

// Current view state
let currentView = 'graph';

// Initialize all modules
function init() {
  initTheme();

  const data = getNodesAndEdges();

  // Graph
  initGraph(
    document.getElementById('graph-canvas'),
    document.getElementById('minimap-canvas'),
    data,
    {
      onNodeClick: (node) => {
        if (node) {
          openSidebar(node.id);
          focusNode(node.id);
        } else {
          closeSidebar();
        }
      },
      onNodeHover: (node, x, y) => {
        if (node && node.type === 'post') {
          tooltip.querySelector('.tooltip-author').textContent = node.author;
          tooltip.querySelector('.tooltip-preview').textContent = node.text.slice(0, 80) + (node.text.length > 80 ? '...' : '');
          tooltip.style.display = 'block';
          tooltip.style.left = (x + 12) + 'px';
          tooltip.style.top = (y + 12) + 'px';

          // Keep tooltip on screen
          const rect = tooltip.getBoundingClientRect();
          if (rect.right > window.innerWidth) {
            tooltip.style.left = (x - rect.width - 12) + 'px';
          }
          if (rect.bottom > window.innerHeight) {
            tooltip.style.top = (y - rect.height - 12) + 'px';
          }
        } else {
          tooltip.style.display = 'none';
        }
      },
    }
  );

  // Feed
  initFeed(document.getElementById('feed-container'), {
    onPostClick: (id) => {
      openSidebar(id);
    },
  });

  // Sidebar
  initSidebar(document.getElementById('sidebar'), {
    onNavigate: (id) => {
      openSidebar(id);
      if (currentView === 'graph') {
        focusNode(id);
      }
    },
    onReply: (postId) => {
      openCompose(postId);
    },
    onEdit: (post) => {
      openEdit(post);
    },
    onLinkAdded: (sourceId, targetId) => {
      // Add edge to graph visualization
      addNode(null, [{ source: sourceId, target: targetId }], true);
      rebuildIndex();
    },
  });

  // Compose
  initCompose({
    onPostCreated: (newPost, parentIds) => {
      // Add to graph
      const sections = getSections();
      const sectionEdge = parentIds.find(id => id.startsWith('sec-'));
      const section = sectionEdge ? sections.find(s => s.id === sectionEdge) : sections[0];

      const nodeData = {
        ...newPost,
        type: 'post',
        incoming: 0,
        radius: 5,
        color: section.color,
        sectionId: section.id,
      };

      const newEdges = parentIds.map(pid => ({ source: newPost.id, target: pid }));
      addNode(nodeData, newEdges);

      // Rebuild search index
      rebuildIndex();

      // Refresh feed if visible
      if (currentView === 'feed') {
        renderFeed();
      }

      // Open the new post in sidebar
      openSidebar(newPost.id);
      if (currentView === 'graph') {
        focusNode(newPost.id);
      }
    },
    onPostEdited: (postId) => {
      openSidebar(postId);
      rebuildIndex();
      if (currentView === 'feed') {
        renderFeed();
      }
    },
  });

  // Auth
  initAuth({
    onAuthChange: (username) => {
      updateAuthButton();
    },
  });
  updateAuthButton();

  // Search
  initSearch({
    onResultClick: (id) => {
      if (currentView === 'graph') {
        focusNode(id);
      }
      openSidebar(id);
    },
  });
  rebuildIndex();

  // View toggle
  const btnGraph = document.getElementById('btn-graph');
  const btnFeed = document.getElementById('btn-feed');
  const graphView = document.getElementById('graph-view');
  const feedView = document.getElementById('feed-view');

  btnGraph.addEventListener('click', () => {
    currentView = 'graph';
    btnGraph.classList.add('active');
    btnFeed.classList.remove('active');
    graphView.classList.add('active');
    feedView.classList.remove('active');
  });

  btnFeed.addEventListener('click', () => {
    currentView = 'feed';
    btnFeed.classList.add('active');
    btnGraph.classList.remove('active');
    feedView.classList.add('active');
    graphView.classList.remove('active');
    renderFeed();
  });

  // Zoom controls
  document.getElementById('btn-zoom-in').addEventListener('click', zoomIn);
  document.getElementById('btn-zoom-out').addEventListener('click', zoomOut);
  document.getElementById('btn-zoom-fit').addEventListener('click', zoomFit);

  // Compose button
  document.getElementById('btn-compose').addEventListener('click', () => openCompose());

  // Auth button
  document.getElementById('btn-auth').addEventListener('click', openAuth);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'Escape':
        closeSidebar();
        closeCompose();
        clearHighlights();
        break;
      case '1':
        btnGraph.click();
        break;
      case '2':
        btnFeed.click();
        break;
      case 'n':
        openCompose();
        break;
      case '/':
        e.preventDefault();
        document.getElementById('search-input').focus();
        break;
      case 'f':
        zoomFit();
        break;
    }
  });

  // Initial zoom fit after simulation settles a bit
  setTimeout(() => zoomFit(), 1500);
}

// Go
init();
