/**
 * Auto-Layout System - Grid and flow layouts for bulk node placement
 */

import { DiagramNode, LayoutConfig } from './schema';

export interface LayoutResult {
  nodes: DiagramNode[];
  bounds: { width: number; height: number };
}

/**
 * Apply layout to nodes that are missing positions
 */
export function applyLayout(
  nodes: DiagramNode[],
  layout: LayoutConfig
): LayoutResult {
  switch (layout.type) {
    case 'grid':
      return applyGridLayout(nodes, { ...layout, type: 'grid' as const });
    case 'flowLR':
      return applyFlowLRLayout(nodes, { ...layout, type: 'flowLR' as const });
    case 'flowTB':
      return applyFlowTBLayout(nodes, { ...layout, type: 'flowTB' as const });
    default:
      return { nodes, bounds: { width: 0, height: 0 } };
  }
}

/**
 * Grid layout - arrange nodes in a grid pattern
 */
export function applyGridLayout(
  nodes: DiagramNode[],
  config: {
    type: 'grid';
    startX?: number;
    startY?: number;
    cols?: number;
    cellW?: number;
    cellH?: number;
    padding?: number;
  }
): LayoutResult {
  const {
    startX = 50,
    startY = 50,
    cols = 10,
    cellW = 120,
    cellH = 120,
    padding = 20,
  } = config;

  const layoutedNodes: DiagramNode[] = [];
  let needsLayoutIndex = 0;
  let maxX = startX;
  let maxY = startY;

  nodes.forEach((node) => {
    if (node.x !== undefined && node.y !== undefined) {
      // Node already has position, keep it
      layoutedNodes.push(node);
      maxX = Math.max(maxX, node.x + (node.w || 80));
      maxY = Math.max(maxY, node.y + (node.h || 80));
    } else {
      // Calculate grid position
      const row = Math.floor(needsLayoutIndex / cols);
      const col = needsLayoutIndex % cols;

      const x = startX + col * (cellW + padding);
      const y = startY + row * (cellH + padding);

      // Center node within cell
      const nodeW = node.w || 80;
      const nodeH = node.h || 80;
      const offsetX = (cellW - nodeW) / 2;
      const offsetY = (cellH - nodeH) / 2;

      layoutedNodes.push({
        ...node,
        x: x + offsetX,
        y: y + offsetY,
      });

      maxX = Math.max(maxX, x + cellW);
      maxY = Math.max(maxY, y + cellH);
      needsLayoutIndex++;
    }
  });

  return {
    nodes: layoutedNodes,
    bounds: { width: maxX + padding, height: maxY + padding },
  };
}

/**
 * Flow Left-to-Right layout - arrange nodes horizontally with wrapping
 */
export function applyFlowLRLayout(
  nodes: DiagramNode[],
  config: {
    type: 'flowLR';
    startX?: number;
    startY?: number;
    rowGap?: number;
    colGap?: number;
    maxWidth?: number;
  }
): LayoutResult {
  const {
    startX = 50,
    startY = 50,
    rowGap = 100,
    colGap = 150,
    maxWidth = 1920,
  } = config;

  const layoutedNodes: DiagramNode[] = [];
  let currentX = startX;
  let currentY = startY;
  let rowMaxHeight = 0;
  let maxX = startX;
  let maxY = startY;

  nodes.forEach((node) => {
    if (node.x !== undefined && node.y !== undefined) {
      // Node already has position, keep it
      layoutedNodes.push(node);
      maxX = Math.max(maxX, node.x + (node.w || 80));
      maxY = Math.max(maxY, node.y + (node.h || 80));
    } else {
      const nodeW = node.w || 80;
      const nodeH = node.h || 80;

      // Check if we need to wrap to next row
      if (currentX + nodeW > maxWidth && currentX > startX) {
        currentX = startX;
        currentY += rowMaxHeight + rowGap;
        rowMaxHeight = 0;
      }

      layoutedNodes.push({
        ...node,
        x: currentX,
        y: currentY,
      });

      rowMaxHeight = Math.max(rowMaxHeight, nodeH);
      maxX = Math.max(maxX, currentX + nodeW);
      maxY = Math.max(maxY, currentY + nodeH);

      currentX += nodeW + colGap;
    }
  });

  return {
    nodes: layoutedNodes,
    bounds: { width: maxX + colGap, height: maxY + rowGap },
  };
}

/**
 * Flow Top-to-Bottom layout - arrange nodes vertically with wrapping
 */
export function applyFlowTBLayout(
  nodes: DiagramNode[],
  config: {
    type: 'flowTB';
    startX?: number;
    startY?: number;
    rowGap?: number;
    colGap?: number;
    maxHeight?: number;
  }
): LayoutResult {
  const {
    startX = 50,
    startY = 50,
    rowGap = 100,
    colGap = 150,
    maxHeight = 1080,
  } = config;

  const layoutedNodes: DiagramNode[] = [];
  let currentX = startX;
  let currentY = startY;
  let colMaxWidth = 0;
  let maxX = startX;
  let maxY = startY;

  nodes.forEach((node) => {
    if (node.x !== undefined && node.y !== undefined) {
      // Node already has position, keep it
      layoutedNodes.push(node);
      maxX = Math.max(maxX, node.x + (node.w || 80));
      maxY = Math.max(maxY, node.y + (node.h || 80));
    } else {
      const nodeW = node.w || 80;
      const nodeH = node.h || 80;

      // Check if we need to wrap to next column
      if (currentY + nodeH > maxHeight && currentY > startY) {
        currentY = startY;
        currentX += colMaxWidth + colGap;
        colMaxWidth = 0;
      }

      layoutedNodes.push({
        ...node,
        x: currentX,
        y: currentY,
      });

      colMaxWidth = Math.max(colMaxWidth, nodeW);
      maxX = Math.max(maxX, currentX + nodeW);
      maxY = Math.max(maxY, currentY + nodeH);

      currentY += nodeH + rowGap;
    }
  });

  return {
    nodes: layoutedNodes,
    bounds: { width: maxX + colGap, height: maxY + rowGap },
  };
}

/**
 * Hierarchical layout for tree structures (based on connectors)
 */
export function applyHierarchicalLayout(
  nodes: DiagramNode[],
  connectors: { from: { nodeId: string }; to: { nodeId: string } }[],
  options: {
    direction?: 'TB' | 'LR' | 'BT' | 'RL';
    levelGap?: number;
    nodeGap?: number;
    startX?: number;
    startY?: number;
  } = {}
): LayoutResult {
  const {
    direction = 'TB',
    levelGap = 150,
    nodeGap = 80,
    startX = 100,
    startY = 100,
  } = options;

  // Build adjacency list
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  
  nodes.forEach(node => {
    children.set(node.id, []);
    parents.set(node.id, []);
  });

  connectors.forEach(conn => {
    const childList = children.get(conn.from.nodeId);
    if (childList) childList.push(conn.to.nodeId);
    
    const parentList = parents.get(conn.to.nodeId);
    if (parentList) parentList.push(conn.from.nodeId);
  });

  // Find root nodes (no parents)
  const roots = nodes.filter(n => (parents.get(n.id) || []).length === 0);

  // Calculate levels using BFS
  const levels = new Map<string, number>();
  const queue: { id: string; level: number }[] = roots.map(r => ({ id: r.id, level: 0 }));
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    
    if (levels.has(id)) continue;
    levels.set(id, level);
    
    const childIds = children.get(id) || [];
    childIds.forEach(childId => {
      if (!levels.has(childId)) {
        queue.push({ id: childId, level: level + 1 });
      }
    });
  }

  // Group nodes by level
  const levelGroups = new Map<number, DiagramNode[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) ?? 0;
    const group = levelGroups.get(level) || [];
    group.push(node);
    levelGroups.set(level, group);
  });

  // Position nodes
  const layoutedNodes: DiagramNode[] = [];
  let maxX = startX;
  let maxY = startY;

  const isHorizontal = direction === 'LR' || direction === 'RL';
  const isReverse = direction === 'BT' || direction === 'RL';

  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => 
    isReverse ? b - a : a - b
  );

  sortedLevels.forEach((level, levelIndex) => {
    const nodesAtLevel = levelGroups.get(level) || [];
    const levelOffset = levelIndex * levelGap;

    nodesAtLevel.forEach((node, nodeIndex) => {
      const nodeW = node.w || 80;
      const nodeH = node.h || 80;
      const nodeOffset = nodeIndex * (Math.max(nodeW, nodeH) + nodeGap);

      let x: number, y: number;

      if (isHorizontal) {
        x = startX + levelOffset;
        y = startY + nodeOffset;
      } else {
        x = startX + nodeOffset;
        y = startY + levelOffset;
      }

      layoutedNodes.push({
        ...node,
        x,
        y,
      });

      maxX = Math.max(maxX, x + nodeW);
      maxY = Math.max(maxY, y + nodeH);
    });
  });

  return {
    nodes: layoutedNodes,
    bounds: { width: maxX + nodeGap, height: maxY + nodeGap },
  };
}

/**
 * Force-directed layout for organic arrangements
 * Simplified implementation - for complex graphs, consider using a library
 */
export function applyForceLayout(
  nodes: DiagramNode[],
  connectors: { from: { nodeId: string }; to: { nodeId: string } }[],
  options: {
    iterations?: number;
    repulsion?: number;
    attraction?: number;
    damping?: number;
    centerX?: number;
    centerY?: number;
  } = {}
): LayoutResult {
  const {
    iterations = 100,
    repulsion = 5000,
    attraction = 0.01,
    damping = 0.9,
    centerX = 500,
    centerY = 400,
  } = options;

  // Initialize positions randomly if not set
  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  
  nodes.forEach((node, i) => {
    positions.set(node.id, {
      x: node.x ?? centerX + (Math.random() - 0.5) * 400,
      y: node.y ?? centerY + (Math.random() - 0.5) * 400,
      vx: 0,
      vy: 0,
    });
  });

  // Run simulation
  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations;

    // Repulsion between all nodes
    nodes.forEach((nodeA) => {
      nodes.forEach((nodeB) => {
        if (nodeA.id === nodeB.id) return;

        const posA = positions.get(nodeA.id)!;
        const posB = positions.get(nodeB.id)!;

        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dist = Math.max(1, Math.hypot(dx, dy));

        const force = (repulsion * cooling) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        posA.vx += fx;
        posA.vy += fy;
      });
    });

    // Attraction along connectors
    connectors.forEach((conn) => {
      const posA = positions.get(conn.from.nodeId);
      const posB = positions.get(conn.to.nodeId);
      if (!posA || !posB) return;

      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const dist = Math.hypot(dx, dy);

      const force = dist * attraction * cooling;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      posA.vx += fx;
      posA.vy += fy;
      posB.vx -= fx;
      posB.vy -= fy;
    });

    // Center gravity
    nodes.forEach((node) => {
      const pos = positions.get(node.id)!;
      pos.vx += (centerX - pos.x) * 0.001 * cooling;
      pos.vy += (centerY - pos.y) * 0.001 * cooling;
    });

    // Apply velocities
    nodes.forEach((node) => {
      const pos = positions.get(node.id)!;
      pos.x += pos.vx;
      pos.y += pos.vy;
      pos.vx *= damping;
      pos.vy *= damping;
    });
  }

  // Create layouted nodes
  const layoutedNodes: DiagramNode[] = [];
  let maxX = 0;
  let maxY = 0;

  nodes.forEach((node) => {
    const pos = positions.get(node.id)!;
    const nodeW = node.w || 80;
    const nodeH = node.h || 80;

    layoutedNodes.push({
      ...node,
      x: pos.x,
      y: pos.y,
    });

    maxX = Math.max(maxX, pos.x + nodeW);
    maxY = Math.max(maxY, pos.y + nodeH);
  });

  return {
    nodes: layoutedNodes,
    bounds: { width: maxX + 50, height: maxY + 50 },
  };
}
