// Graph view — d3-force simulation + canvas rendering
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';

let simulation = null;
let canvas = null;
let ctx = null;
let minimapCanvas = null;
let minimapCtx = null;
let nodes = [];
let edges = [];
let transform = zoomIdentity;
let hoveredNode = null;
let selectedNode = null;
let draggedNode = null;
let dragStarted = false;
let dragOrigin = { x: 0, y: 0 };
let width = 0;
let height = 0;
let animationFrame = null;
let onNodeClick = null;
let onNodeHover = null;
let highlightedNodes = new Set();
let isDark = true;

// Zoom behavior
let zoomBehavior = null;

export function initGraph(canvasEl, minimapEl, data, callbacks) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  minimapCanvas = minimapEl;
  minimapCtx = minimapCanvas.getContext('2d');
  onNodeClick = callbacks.onNodeClick;
  onNodeHover = callbacks.onNodeHover;

  isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  resize();

  // Deep clone nodes and edges so d3 can mutate them
  nodes = data.nodes.map(n => ({ ...n }));
  edges = data.edges.map(e => ({ ...e }));

  // Apply saved positions to section nodes
  const centerX = width / 2;
  const centerY = height / 2;
  nodes.forEach(n => {
    if (n.savedX !== undefined) {
      n.x = centerX + n.savedX;
      n.y = centerY + n.savedY;
    }
  });

  // Position post nodes near their parent sections initially
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  nodes.forEach(n => {
    if (n.type === 'post' && n.x === undefined) {
      // Find connected section
      const sectionEdge = edges.find(e => e.source === n.id && String(e.target).startsWith('sec-'));
      const sectionId = sectionEdge ? sectionEdge.target : null;
      const sectionNode = sectionId ? nodeMap.get(sectionId) : null;
      if (sectionNode && sectionNode.x !== undefined) {
        n.x = sectionNode.x + (Math.random() - 0.5) * 200;
        n.y = sectionNode.y + (Math.random() - 0.5) * 200;
      } else {
        n.x = centerX + (Math.random() - 0.5) * 600;
        n.y = centerY + (Math.random() - 0.5) * 600;
      }
    }
  });

  // Create simulation
  simulation = forceSimulation(nodes)
    .force('link', forceLink(edges)
      .id(d => d.id)
      .distance(d => {
        const source = typeof d.source === 'object' ? d.source : nodeMap.get(d.source);
        const target = typeof d.target === 'object' ? d.target : nodeMap.get(d.target);
        if (!source || !target) return 120;
        if (source.type === 'section' || target.type === 'section') return 100;
        return 80;
      })
      .strength(d => {
        const source = typeof d.source === 'object' ? d.source : nodeMap.get(d.source);
        const target = typeof d.target === 'object' ? d.target : nodeMap.get(d.target);
        if (!source || !target) return 0.3;
        if (source.type === 'section' || target.type === 'section') return 0.5;
        return 0.3;
      })
    )
    .force('charge', forceManyBody()
      .strength(d => d.type === 'section' ? -800 : -120)
    )
    .force('center', forceCenter(centerX, centerY).strength(0.03))
    .force('collide', forceCollide()
      .radius(d => d.radius + 8)
      .strength(0.7)
    )
    .force('x', forceX(centerX).strength(0.015))
    .force('y', forceY(centerY).strength(0.015))
    .alphaDecay(0.008)
    .alphaMin(0.005)
    .alphaTarget(0.008)
    .velocityDecay(0.4);

  // Start with higher alpha for initial layout, then settle into gentle jiggle
  simulation.alpha(0.4).restart();

  // Setup zoom
  zoomBehavior = zoom()
    .scaleExtent([0.1, 5])
    .on('zoom', (event) => {
      transform = event.transform;
    });

  const sel = select(canvas);
  sel.call(zoomBehavior);

  // Disable default double-click zoom
  sel.on('dblclick.zoom', null);

  // Mouse events for hover and click
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);

  // Minimap click
  minimapCanvas.addEventListener('click', handleMinimapClick);

  // Window resize
  window.addEventListener('resize', handleResize);

  // Start continuous render loop
  function loop() {
    render();
    animationFrame = requestAnimationFrame(loop);
  }
  loop();
}

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Minimap
  const mmRect = minimapCanvas.getBoundingClientRect();
  const mmDpr = dpr;
  minimapCanvas.width = mmRect.width * mmDpr;
  minimapCanvas.height = mmRect.height * mmDpr;
  minimapCtx.setTransform(mmDpr, 0, 0, mmDpr, 0, 0);
}

function handleResize() {
  resize();
  if (simulation) {
    simulation.force('center', forceCenter(width / 2, height / 2).strength(0.03));
    simulation.force('x', forceX(width / 2).strength(0.015));
    simulation.force('y', forceY(height / 2).strength(0.015));
    simulation.alpha(0.1).restart();
  }
}

function screenToSim(sx, sy) {
  return [
    (sx - transform.x) / transform.k,
    (sy - transform.y) / transform.k,
  ];
}

function getNodeAt(sx, sy) {
  const [x, y] = screenToSim(sx, sy);
  let closest = null;
  let minDist = Infinity;
  for (const node of nodes) {
    const dx = node.x - x;
    const dy = node.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hitRadius = node.radius + 6;
    if (dist < hitRadius && dist < minDist) {
      closest = node;
      minDist = dist;
    }
  }
  return closest;
}

function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;

  // Handle drag
  if (draggedNode) {
    const [x, y] = screenToSim(sx, sy);
    draggedNode.fx = x;
    draggedNode.fy = y;
    simulation.alpha(0.1).restart();
    const dx = sx - dragOrigin.x;
    const dy = sy - dragOrigin.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStarted = true;
    }
    return;
  }

  const node = getNodeAt(sx, sy);
  if (node !== hoveredNode) {
    hoveredNode = node;
    canvas.style.cursor = node ? 'pointer' : 'grab';
    if (onNodeHover) onNodeHover(node, e.clientX, e.clientY);
  }
}

function handleMouseDown(e) {
  if (e.button !== 0) return;
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const node = getNodeAt(sx, sy);
  if (node) {
    draggedNode = node;
    dragStarted = false;
    dragOrigin = { x: sx, y: sy };
    const [simX, simY] = screenToSim(sx, sy);
    node.fx = simX;
    node.fy = simY;
  }
}

function handleMouseUp(e) {
  if (draggedNode) {
    if (dragStarted) {
      // Pin the node where it was dropped — stays until refresh
      draggedNode.fx = draggedNode.x;
      draggedNode.fy = draggedNode.y;
      simulation.alpha(0.05).restart();
    } else {
      // Was just a click, not a drag — release it
      draggedNode.fx = null;
      draggedNode.fy = null;
    }
    draggedNode = null;
    dragStarted = false;
  }
}

function handleClick(e) {
  if (dragStarted) return; // Was a drag, not a click
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const node = getNodeAt(sx, sy);

  if (node) {
    selectedNode = node;
    if (onNodeClick) onNodeClick(node);
  } else {
    selectedNode = null;
    if (onNodeClick) onNodeClick(null);
  }
}

function handleMinimapClick(e) {
  const rect = minimapCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // Calculate bounds for minimap mapping
  const bounds = getNodeBounds();
  if (!bounds) return;

  const padding = 40;
  const bw = bounds.maxX - bounds.minX + padding * 2;
  const bh = bounds.maxY - bounds.minY + padding * 2;
  const mmW = rect.width;
  const mmH = rect.height;
  const scale = Math.min(mmW / bw, mmH / bh);

  const targetX = (mx / scale) + bounds.minX - padding;
  const targetY = (my / scale) + bounds.minY - padding;

  // Center view on clicked point
  const sel = select(canvas);
  sel.transition().duration(300).call(
    zoomBehavior.transform,
    zoomIdentity.translate(width / 2 - targetX * transform.k, height / 2 - targetY * transform.k).scale(transform.k)
  );
}

function getNodeBounds() {
  if (nodes.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  }
  return { minX, minY, maxX, maxY };
}

function render() {
  isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const bg = isDark ? '#0a0a0a' : '#f5f5f5';
  const edgeColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const edgeHighlight = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)';
  const labelColor = isDark ? '#d4d4d4' : '#1a1a1a';
  const labelMuted = isDark ? '#666666' : '#888888';

  // Clear
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  // Gather connected edges/nodes for highlighting
  const connectedEdges = new Set();
  const connectedNodes = new Set();
  if (selectedNode || hoveredNode) {
    const activeNode = hoveredNode || selectedNode;
    connectedNodes.add(activeNode.id);
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const sid = typeof e.source === 'object' ? e.source.id : e.source;
      const tid = typeof e.target === 'object' ? e.target.id : e.target;
      if (sid === activeNode.id || tid === activeNode.id) {
        connectedEdges.add(i);
        connectedNodes.add(sid);
        connectedNodes.add(tid);
      }
    }
  }

  // Draw edges
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const source = typeof e.source === 'object' ? e.source : null;
    const target = typeof e.target === 'object' ? e.target : null;
    if (!source || !target) continue;

    const isHighlighted = connectedEdges.has(i);
    const isSearchHighlighted = highlightedNodes.size > 0 &&
      (highlightedNodes.has(source.id) || highlightedNodes.has(target.id));

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);

    if (isHighlighted) {
      ctx.strokeStyle = edgeHighlight;
      ctx.lineWidth = 1.2;
    } else if (isSearchHighlighted) {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 0.5;
    }
    ctx.stroke();
  }

  // Draw nodes
  for (const node of nodes) {
    const isConnected = connectedNodes.has(node.id);
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    const isSearchHit = highlightedNodes.has(node.id);

    const baseAlpha = (selectedNode || hoveredNode)
      ? (isConnected ? 1 : 0.15)
      : (highlightedNodes.size > 0 ? (isSearchHit ? 1 : 0.15) : 1);

    ctx.globalAlpha = baseAlpha;

    // Glow for selected/hovered
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(node.color, 0.15);
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

    if (node.type === 'section') {
      ctx.fillStyle = hexToRgba(node.color, 0.8);
    } else {
      ctx.fillStyle = hexToRgba(node.color, isConnected || isSearchHit ? 0.7 : 0.4);
    }
    ctx.fill();

    // Border for selected
    if (isSelected) {
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Labels
    if (node.type === 'section') {
      // Always show section labels
      ctx.font = '700 15px "Roboto Mono", monospace';
      ctx.fillStyle = labelColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, node.x, node.y + node.radius + 20);
    } else if (transform.k > 1.2 || isHovered || isSelected || isSearchHit) {
      // Show post labels when zoomed in or active
      ctx.font = '400 11px "Roboto Mono", monospace';
      ctx.fillStyle = labelMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = node.author || node.id;
      ctx.fillText(label, node.x, node.y + node.radius + 14);
    }

    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Render minimap
  renderMinimap();
}

function renderMinimap() {
  const mmW = minimapCanvas.width / (window.devicePixelRatio || 1);
  const mmH = minimapCanvas.height / (window.devicePixelRatio || 1);

  minimapCtx.fillStyle = isDark ? '#111111' : '#ffffff';
  minimapCtx.fillRect(0, 0, mmW, mmH);

  const bounds = getNodeBounds();
  if (!bounds) return;

  const padding = 60;
  const bw = bounds.maxX - bounds.minX + padding * 2;
  const bh = bounds.maxY - bounds.minY + padding * 2;
  const scale = Math.min(mmW / bw, mmH / bh);
  const offsetX = (mmW - bw * scale) / 2 - (bounds.minX - padding) * scale;
  const offsetY = (mmH - bh * scale) / 2 - (bounds.minY - padding) * scale;

  // Draw nodes on minimap
  for (const node of nodes) {
    const mx = node.x * scale + offsetX;
    const my = node.y * scale + offsetY;

    minimapCtx.beginPath();
    const r = node.type === 'section' ? 3 : 1.5;
    minimapCtx.arc(mx, my, r, 0, Math.PI * 2);
    minimapCtx.fillStyle = hexToRgba(node.color, node.type === 'section' ? 0.9 : 0.5);
    minimapCtx.fill();
  }

  // Draw viewport rectangle
  const vx1 = (-transform.x / transform.k) * scale + offsetX;
  const vy1 = (-transform.y / transform.k) * scale + offsetY;
  const vx2 = ((-transform.x + width) / transform.k) * scale + offsetX;
  const vy2 = ((-transform.y + height) / transform.k) * scale + offsetY;

  minimapCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(vx1, vy1, vx2 - vx1, vy2 - vy1);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Public API
export function zoomIn() {
  const sel = select(canvas);
  sel.transition().duration(200).call(zoomBehavior.scaleBy, 1.4);
}

export function zoomOut() {
  const sel = select(canvas);
  sel.transition().duration(200).call(zoomBehavior.scaleBy, 0.7);
}

export function zoomFit() {
  const bounds = getNodeBounds();
  if (!bounds) return;

  const padding = 80;
  const bw = bounds.maxX - bounds.minX + padding * 2;
  const bh = bounds.maxY - bounds.minY + padding * 2;
  const scale = Math.min(width / bw, height / bh, 2);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;

  const sel = select(canvas);
  sel.transition().duration(500).call(
    zoomBehavior.transform,
    zoomIdentity.translate(width / 2 - cx * scale, height / 2 - cy * scale).scale(scale)
  );
}

export function focusNode(nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  selectedNode = node;
  const sel = select(canvas);
  const targetScale = Math.max(transform.k, 1.2);
  sel.transition().duration(400).call(
    zoomBehavior.transform,
    zoomIdentity.translate(width / 2 - node.x * targetScale, height / 2 - node.y * targetScale).scale(targetScale)
  );
}

export function setHighlightedNodes(nodeIds) {
  highlightedNodes = new Set(nodeIds);
}

export function clearHighlights() {
  highlightedNodes.clear();
  selectedNode = null;
}

export function addNode(nodeData, newEdges, edgesOnly = false) {
  if (!edgesOnly && nodeData) {
    // Find position near first parent
    const parentEdge = newEdges[0];
    const parentNode = nodes.find(n => n.id === parentEdge.target);
    const x = parentNode ? parentNode.x + (Math.random() - 0.5) * 100 : width / 2;
    const y = parentNode ? parentNode.y + (Math.random() - 0.5) * 100 : height / 2;

    const node = { ...nodeData, x, y };
    nodes.push(node);
  }

  for (const e of newEdges) {
    edges.push({ ...e });
  }

  // Restart simulation with the new data
  simulation.nodes(nodes);
  simulation.force('link').links(edges);
  simulation.alpha(0.3).restart();

  return node;
}

export function getSelectedNode() {
  return selectedNode;
}

export function destroyGraph() {
  if (simulation) simulation.stop();
  if (animationFrame) cancelAnimationFrame(animationFrame);
  canvas.removeEventListener('mousemove', handleMouseMove);
  canvas.removeEventListener('click', handleClick);
  canvas.removeEventListener('mousedown', handleMouseDown);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('resize', handleResize);
  nodes = [];
  edges = [];
}
