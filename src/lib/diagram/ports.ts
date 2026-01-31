/**
 * Port System - Port generation, attachment, and connector binding
 */

import { FabricObject, Canvas as FabricCanvas, Circle } from 'fabric';
import { DiagramNode, DiagramPort, generateDefaultPorts } from './schema';

// ============ Port Position Types ============
export type PortPositionName = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'center';

export interface ResolvedPort {
  id: string;
  nodeId: string;
  x: number; // Absolute canvas X
  y: number; // Absolute canvas Y
  normalizedX: number; // 0-1
  normalizedY: number; // 0-1
  angle: number; // Exit angle in degrees
}

export interface PortIndicator extends Circle {
  _portData?: {
    nodeId: string;
    portId: string;
    normalizedX: number;
    normalizedY: number;
  };
}

// ============ Port Calculations ============

/**
 * Get the exit angle for a port based on its position
 */
export function getPortExitAngle(normalizedX: number, normalizedY: number): number {
  // Calculate angle based on position relative to center (0.5, 0.5)
  const dx = normalizedX - 0.5;
  const dy = normalizedY - 0.5;
  
  if (dx === 0 && dy === 0) return 0; // Center port
  
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Resolve ports for a node - either use defined ports or generate defaults
 */
export function resolveNodePorts(node: DiagramNode): DiagramPort[] {
  if (node.ports && node.ports.length > 0) {
    return node.ports;
  }
  return generateDefaultPorts(node.id);
}

/**
 * Calculate absolute port position from node bounds and normalized coordinates
 */
export function calculateAbsolutePortPosition(
  nodeX: number,
  nodeY: number,
  nodeW: number,
  nodeH: number,
  rotation: number,
  normalizedX: number,
  normalizedY: number
): { x: number; y: number } {
  // Calculate position relative to node origin
  const localX = normalizedX * nodeW;
  const localY = normalizedY * nodeH;
  
  // Apply rotation if present
  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const centerX = nodeW / 2;
    const centerY = nodeH / 2;
    
    const relX = localX - centerX;
    const relY = localY - centerY;
    
    const rotatedX = relX * cos - relY * sin + centerX;
    const rotatedY = relX * sin + relY * cos + centerY;
    
    return {
      x: nodeX + rotatedX,
      y: nodeY + rotatedY,
    };
  }
  
  return {
    x: nodeX + localX,
    y: nodeY + localY,
  };
}

/**
 * Resolve all ports for a node to absolute positions
 */
export function resolvePortsAbsolute(
  node: DiagramNode,
  nodeX: number,
  nodeY: number,
  nodeW: number,
  nodeH: number
): ResolvedPort[] {
  const ports = resolveNodePorts(node);
  
  return ports.map(port => {
    const { x, y } = calculateAbsolutePortPosition(
      nodeX, nodeY, nodeW, nodeH,
      node.rotation || 0,
      port.x, port.y
    );
    
    return {
      id: port.id,
      nodeId: node.id,
      x,
      y,
      normalizedX: port.x,
      normalizedY: port.y,
      angle: getPortExitAngle(port.x, port.y),
    };
  });
}

/**
 * Find the nearest port to a given point
 */
export function findNearestPort(
  ports: ResolvedPort[],
  targetX: number,
  targetY: number,
  maxDistance: number = Infinity
): ResolvedPort | null {
  let nearest: ResolvedPort | null = null;
  let minDist = maxDistance;
  
  for (const port of ports) {
    const dist = Math.hypot(port.x - targetX, port.y - targetY);
    if (dist < minDist) {
      minDist = dist;
      nearest = port;
    }
  }
  
  return nearest;
}

/**
 * Choose best ports for connecting two nodes
 */
export function chooseBestPorts(
  fromNode: DiagramNode,
  fromX: number, fromY: number, fromW: number, fromH: number,
  toNode: DiagramNode,
  toX: number, toY: number, toW: number, toH: number
): { fromPort: ResolvedPort; toPort: ResolvedPort } {
  const fromPorts = resolvePortsAbsolute(fromNode, fromX, fromY, fromW, fromH);
  const toPorts = resolvePortsAbsolute(toNode, toX, toY, toW, toH);
  
  // Find the pair with minimum distance
  let bestPair: { fromPort: ResolvedPort; toPort: ResolvedPort } | null = null;
  let minDist = Infinity;
  
  for (const fp of fromPorts) {
    for (const tp of toPorts) {
      const dist = Math.hypot(fp.x - tp.x, fp.y - tp.y);
      if (dist < minDist) {
        minDist = dist;
        bestPair = { fromPort: fp, toPort: tp };
      }
    }
  }
  
  if (!bestPair) {
    // Fallback to center ports
    const fromCenter = fromPorts.find(p => p.normalizedX === 0.5 && p.normalizedY === 0.5) || fromPorts[0];
    const toCenter = toPorts.find(p => p.normalizedX === 0.5 && p.normalizedY === 0.5) || toPorts[0];
    return { fromPort: fromCenter, toPort: toCenter };
  }
  
  return bestPair;
}

/**
 * Get a specific port by ID from a node
 */
export function getPortById(
  node: DiagramNode,
  nodeX: number, nodeY: number, nodeW: number, nodeH: number,
  portId: string
): ResolvedPort | null {
  const ports = resolvePortsAbsolute(node, nodeX, nodeY, nodeW, nodeH);
  return ports.find(p => p.id === portId) || null;
}

// ============ Port Indicators (Visual) ============

const PORT_INDICATOR_RADIUS = 6;
const PORT_INDICATOR_FILL = '#ffffff';
const PORT_INDICATOR_STROKE = '#3b82f6';
const PORT_INDICATOR_STROKE_WIDTH = 2;
const PORT_HOVER_FILL = '#3b82f6';

/**
 * Create visual port indicators for a node
 */
export function createPortIndicators(
  canvas: FabricCanvas,
  node: DiagramNode,
  nodeObject: FabricObject
): PortIndicator[] {
  const ports = resolveNodePorts(node);
  const indicators: PortIndicator[] = [];
  
  const left = nodeObject.left || 0;
  const top = nodeObject.top || 0;
  const width = (nodeObject.width || 80) * (nodeObject.scaleX || 1);
  const height = (nodeObject.height || 80) * (nodeObject.scaleY || 1);
  
  ports.forEach(port => {
    const { x, y } = calculateAbsolutePortPosition(
      left, top, width, height,
      node.rotation || 0,
      port.x, port.y
    );
    
    const indicator = new Circle({
      left: x,
      top: y,
      radius: PORT_INDICATOR_RADIUS,
      fill: PORT_INDICATOR_FILL,
      stroke: PORT_INDICATOR_STROKE,
      strokeWidth: PORT_INDICATOR_STROKE_WIDTH,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'crosshair',
    }) as PortIndicator;
    
    indicator._portData = {
      nodeId: node.id,
      portId: port.id,
      normalizedX: port.x,
      normalizedY: port.y,
    };
    
    // Mark as ephemeral UI
    (indicator as any).isPortIndicator = true;
    (indicator as any).isFeedback = true;
    
    indicators.push(indicator);
  });
  
  return indicators;
}

/**
 * Show port indicators for a node
 */
export function showPortIndicators(
  canvas: FabricCanvas,
  node: DiagramNode,
  nodeObject: FabricObject
): PortIndicator[] {
  const indicators = createPortIndicators(canvas, node, nodeObject);
  indicators.forEach(indicator => canvas.add(indicator));
  canvas.requestRenderAll();
  return indicators;
}

/**
 * Hide port indicators
 */
export function hidePortIndicators(
  canvas: FabricCanvas,
  indicators: PortIndicator[]
): void {
  indicators.forEach(indicator => canvas.remove(indicator));
  canvas.requestRenderAll();
}

/**
 * Update port indicator positions (call when node moves/resizes)
 */
export function updatePortIndicators(
  indicators: PortIndicator[],
  nodeObject: FabricObject
): void {
  const left = nodeObject.left || 0;
  const top = nodeObject.top || 0;
  const width = (nodeObject.width || 80) * (nodeObject.scaleX || 1);
  const height = (nodeObject.height || 80) * (nodeObject.scaleY || 1);
  const rotation = nodeObject.angle || 0;
  
  indicators.forEach(indicator => {
    if (!indicator._portData) return;
    
    const { x, y } = calculateAbsolutePortPosition(
      left, top, width, height,
      rotation,
      indicator._portData.normalizedX,
      indicator._portData.normalizedY
    );
    
    indicator.set({ left: x, top: y });
    indicator.setCoords();
  });
}

/**
 * Highlight a port indicator
 */
export function highlightPortIndicator(indicator: PortIndicator, highlight: boolean): void {
  indicator.set({
    fill: highlight ? PORT_HOVER_FILL : PORT_INDICATOR_FILL,
    radius: highlight ? PORT_INDICATOR_RADIUS + 2 : PORT_INDICATOR_RADIUS,
  });
}

// ============ Connector Attachment Registry ============

export interface ConnectorAttachment {
  connectorId: string;
  isSource: boolean; // true = from, false = to
  nodeId: string;
  portId: string;
}

export class AttachmentRegistry {
  private attachments: Map<string, ConnectorAttachment[]> = new Map(); // nodeId -> attachments
  private connectorMap: Map<string, { from: ConnectorAttachment; to: ConnectorAttachment }> = new Map();
  
  /**
   * Register a connector attachment
   */
  attach(
    connectorId: string,
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ): void {
    const fromAttachment: ConnectorAttachment = {
      connectorId,
      isSource: true,
      nodeId: fromNodeId,
      portId: fromPortId,
    };
    
    const toAttachment: ConnectorAttachment = {
      connectorId,
      isSource: false,
      nodeId: toNodeId,
      portId: toPortId,
    };
    
    // Add to node attachment lists
    const fromList = this.attachments.get(fromNodeId) || [];
    fromList.push(fromAttachment);
    this.attachments.set(fromNodeId, fromList);
    
    const toList = this.attachments.get(toNodeId) || [];
    toList.push(toAttachment);
    this.attachments.set(toNodeId, toList);
    
    // Add to connector map
    this.connectorMap.set(connectorId, { from: fromAttachment, to: toAttachment });
  }
  
  /**
   * Remove a connector attachment
   */
  detach(connectorId: string): void {
    const connector = this.connectorMap.get(connectorId);
    if (!connector) return;
    
    // Remove from node attachment lists
    const fromList = this.attachments.get(connector.from.nodeId);
    if (fromList) {
      this.attachments.set(
        connector.from.nodeId,
        fromList.filter(a => a.connectorId !== connectorId)
      );
    }
    
    const toList = this.attachments.get(connector.to.nodeId);
    if (toList) {
      this.attachments.set(
        connector.to.nodeId,
        toList.filter(a => a.connectorId !== connectorId)
      );
    }
    
    this.connectorMap.delete(connectorId);
  }
  
  /**
   * Get all connectors attached to a node
   */
  getNodeAttachments(nodeId: string): ConnectorAttachment[] {
    return this.attachments.get(nodeId) || [];
  }
  
  /**
   * Get connector endpoints
   */
  getConnectorEndpoints(connectorId: string): { from: ConnectorAttachment; to: ConnectorAttachment } | null {
    return this.connectorMap.get(connectorId) || null;
  }
  
  /**
   * Clear all attachments
   */
  clear(): void {
    this.attachments.clear();
    this.connectorMap.clear();
  }
  
  /**
   * Remove all attachments for a node (when node is deleted)
   */
  removeNode(nodeId: string): string[] {
    const attachments = this.attachments.get(nodeId) || [];
    const connectorIds = attachments.map(a => a.connectorId);
    
    // Detach all connectors
    connectorIds.forEach(id => this.detach(id));
    
    return connectorIds;
  }
}

// Global attachment registry
export const attachmentRegistry = new AttachmentRegistry();
