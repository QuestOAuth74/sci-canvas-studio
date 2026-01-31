/**
 * Diagram Operations - Command/ops mode for programmatic canvas manipulation
 */

import { Canvas as FabricCanvas, FabricObject } from 'fabric';
import {
  DiagramNode,
  DiagramConnector,
  DiagramText,
  generateDiagramId,
} from './schema';
import { importDiagramScene } from './importer';
import { exportDiagramScene } from './exporter';
import {
  attachmentRegistry,
  showPortIndicators,
  hidePortIndicators,
  PortIndicator,
} from './ports';

// ============ Operation Types ============

export type DiagramOp =
  | { type: 'addNode'; node: DiagramNode }
  | { type: 'removeNode'; nodeId: string }
  | { type: 'updateNode'; nodeId: string; changes: Partial<DiagramNode> }
  | { type: 'addConnector'; connector: DiagramConnector }
  | { type: 'removeConnector'; connectorId: string }
  | { type: 'updateConnector'; connectorId: string; changes: Partial<DiagramConnector> }
  | { type: 'addText'; text: DiagramText }
  | { type: 'removeText'; textId: string }
  | { type: 'updateText'; textId: string; changes: Partial<DiagramText> }
  | { type: 'replaceIcon'; nodeId: string; newIconId: string }
  | { type: 'moveNode'; nodeId: string; x: number; y: number }
  | { type: 'resizeNode'; nodeId: string; w: number; h: number }
  | { type: 'duplicateNode'; nodeId: string; offsetX?: number; offsetY?: number }
  | { type: 'groupNodes'; nodeIds: string[]; groupId?: string }
  | { type: 'ungroupNodes'; groupId: string };

export interface OpResult {
  success: boolean;
  error?: string;
  affectedIds?: string[];
}

// ============ Diagram Manager Class ============

export class DiagramManager {
  private canvas: FabricCanvas;
  private objectMap: Map<string, FabricObject> = new Map();
  private nodeDataMap: Map<string, DiagramNode> = new Map();
  private connectorDataMap: Map<string, DiagramConnector> = new Map();
  private textDataMap: Map<string, DiagramText> = new Map();
  private activePortIndicators: PortIndicator[] = [];
  private undoStack: DiagramOp[][] = [];
  private redoStack: DiagramOp[][] = [];

  constructor(canvas: FabricCanvas) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  // ============ Event Handling ============

  private setupEventListeners(): void {
    // Update connectors when objects move
    this.canvas.on('object:moving', (e) => {
      if (e.target) {
        this.onObjectMove(e.target);
      }
    });

    this.canvas.on('object:scaling', (e) => {
      if (e.target) {
        this.onObjectScale(e.target);
      }
    });

    this.canvas.on('object:modified', (e) => {
      if (e.target) {
        this.onObjectModified(e.target);
      }
    });

    // Show ports on selection
    this.canvas.on('selection:created', (e) => {
      this.showPortsForSelection(e.selected || []);
    });

    this.canvas.on('selection:updated', (e) => {
      this.hideAllPorts();
      this.showPortsForSelection(e.selected || []);
    });

    this.canvas.on('selection:cleared', () => {
      this.hideAllPorts();
    });
  }

  private onObjectMove(obj: FabricObject): void {
    const meta = (obj as any).meta;
    if (meta?.type === 'node') {
      this.updateConnectorsForNode(meta.nodeId);
    }
  }

  private onObjectScale(obj: FabricObject): void {
    const meta = (obj as any).meta;
    if (meta?.type === 'node') {
      this.updateConnectorsForNode(meta.nodeId);
    }
  }

  private onObjectModified(obj: FabricObject): void {
    const meta = (obj as any).meta;
    if (meta?.type === 'node') {
      // Update stored node data
      const nodeData = this.nodeDataMap.get(meta.nodeId);
      if (nodeData) {
        nodeData.x = obj.left;
        nodeData.y = obj.top;
        nodeData.w = (obj.width || 80) * (obj.scaleX || 1);
        nodeData.h = (obj.height || 80) * (obj.scaleY || 1);
        nodeData.rotation = obj.angle;
      }
    }
  }

  private updateConnectorsForNode(nodeId: string): void {
    const attachments = attachmentRegistry.getNodeAttachments(nodeId);
    
    for (const attachment of attachments) {
      const connectorObj = this.objectMap.get(attachment.connectorId);
      if (connectorObj) {
        // Recalculate connector path
        // This is a simplified version - full implementation would re-route
        this.canvas.requestRenderAll();
      }
    }
  }

  private showPortsForSelection(objects: FabricObject[]): void {
    for (const obj of objects) {
      const meta = (obj as any).meta;
      if (meta?.type === 'node') {
        const nodeData = this.nodeDataMap.get(meta.nodeId);
        if (nodeData) {
          const indicators = showPortIndicators(this.canvas, nodeData, obj);
          this.activePortIndicators.push(...indicators);
        }
      }
    }
  }

  private hideAllPorts(): void {
    hidePortIndicators(this.canvas, this.activePortIndicators);
    this.activePortIndicators = [];
  }

  // ============ Operation Execution ============

  /**
   * Execute a diagram operation
   */
  async execute(op: DiagramOp): Promise<OpResult> {
    try {
      switch (op.type) {
        case 'addNode':
          return this.addNode(op.node);
        case 'removeNode':
          return this.removeNode(op.nodeId);
        case 'updateNode':
          return this.updateNode(op.nodeId, op.changes);
        case 'addConnector':
          return this.addConnector(op.connector);
        case 'removeConnector':
          return this.removeConnector(op.connectorId);
        case 'updateConnector':
          return this.updateConnector(op.connectorId, op.changes);
        case 'addText':
          return this.addText(op.text);
        case 'removeText':
          return this.removeText(op.textId);
        case 'updateText':
          return this.updateText(op.textId, op.changes);
        case 'replaceIcon':
          return this.replaceIcon(op.nodeId, op.newIconId);
        case 'moveNode':
          return this.moveNode(op.nodeId, op.x, op.y);
        case 'resizeNode':
          return this.resizeNode(op.nodeId, op.w, op.h);
        case 'duplicateNode':
          return this.duplicateNode(op.nodeId, op.offsetX, op.offsetY);
        default:
          return { success: false, error: 'Unknown operation type' };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Execute multiple operations in batch
   */
  async executeBatch(ops: DiagramOp[]): Promise<OpResult[]> {
    const results: OpResult[] = [];
    for (const op of ops) {
      results.push(await this.execute(op));
    }
    this.canvas.requestRenderAll();
    return results;
  }

  // ============ Node Operations ============

  private async addNode(node: DiagramNode): Promise<OpResult> {
    // Import the node through the importer
    const scene = {
      version: '1.0.0',
      nodes: [node],
      connectors: [],
      texts: [],
    };

    const result = await importDiagramScene(scene, {
      canvas: this.canvas,
      clearCanvas: false,
    });

    if (result.success) {
      // Find the newly added object
      const objects = this.canvas.getObjects();
      const newObj = objects.find((o) => (o as any).diagramId === node.id);
      if (newObj) {
        this.objectMap.set(node.id, newObj);
        this.nodeDataMap.set(node.id, node);
      }
      return { success: true, affectedIds: [node.id] };
    }

    return { success: false, error: result.errors.join(', ') };
  }

  private removeNode(nodeId: string): OpResult {
    const obj = this.objectMap.get(nodeId);
    if (!obj) {
      return { success: false, error: `Node not found: ${nodeId}` };
    }

    // Remove attached connectors
    const removedConnectors = attachmentRegistry.removeNode(nodeId);
    removedConnectors.forEach((connId) => {
      const connObj = this.objectMap.get(connId);
      if (connObj) {
        this.canvas.remove(connObj);
        this.objectMap.delete(connId);
        this.connectorDataMap.delete(connId);
      }
    });

    // Remove node
    this.canvas.remove(obj);
    this.objectMap.delete(nodeId);
    this.nodeDataMap.delete(nodeId);
    this.canvas.requestRenderAll();

    return { success: true, affectedIds: [nodeId, ...removedConnectors] };
  }

  private updateNode(nodeId: string, changes: Partial<DiagramNode>): OpResult {
    const obj = this.objectMap.get(nodeId);
    const nodeData = this.nodeDataMap.get(nodeId);
    
    if (!obj || !nodeData) {
      return { success: false, error: `Node not found: ${nodeId}` };
    }

    // Apply changes
    if (changes.x !== undefined) obj.set('left', changes.x);
    if (changes.y !== undefined) obj.set('top', changes.y);
    if (changes.rotation !== undefined) obj.set('angle', changes.rotation);
    if (changes.locked !== undefined) {
      obj.set('selectable', !changes.locked);
      obj.set('evented', !changes.locked);
    }

    // Update stored data
    Object.assign(nodeData, changes);
    
    obj.setCoords();
    this.canvas.requestRenderAll();

    return { success: true, affectedIds: [nodeId] };
  }

  private async replaceIcon(nodeId: string, newIconId: string): Promise<OpResult> {
    const nodeData = this.nodeDataMap.get(nodeId);
    if (!nodeData || nodeData.kind !== 'icon') {
      return { success: false, error: `Icon node not found: ${nodeId}` };
    }

    // Remove old node
    this.removeNode(nodeId);

    // Add new node with same properties but different icon
    const newNode: DiagramNode = {
      ...nodeData,
      iconId: newIconId,
    };

    return this.addNode(newNode);
  }

  private moveNode(nodeId: string, x: number, y: number): OpResult {
    return this.updateNode(nodeId, { x, y });
  }

  private resizeNode(nodeId: string, w: number, h: number): OpResult {
    const obj = this.objectMap.get(nodeId);
    if (!obj) {
      return { success: false, error: `Node not found: ${nodeId}` };
    }

    // Calculate scale factors
    const currentW = (obj.width || 80) * (obj.scaleX || 1);
    const currentH = (obj.height || 80) * (obj.scaleY || 1);
    
    obj.set('scaleX', (obj.scaleX || 1) * (w / currentW));
    obj.set('scaleY', (obj.scaleY || 1) * (h / currentH));
    obj.setCoords();
    
    // Update stored data
    const nodeData = this.nodeDataMap.get(nodeId);
    if (nodeData) {
      nodeData.w = w;
      nodeData.h = h;
    }

    this.updateConnectorsForNode(nodeId);
    this.canvas.requestRenderAll();

    return { success: true, affectedIds: [nodeId] };
  }

  private duplicateNode(nodeId: string, offsetX = 50, offsetY = 50): OpResult {
    const nodeData = this.nodeDataMap.get(nodeId);
    if (!nodeData) {
      return { success: false, error: `Node not found: ${nodeId}` };
    }

    const newNode: DiagramNode = {
      ...nodeData,
      id: generateDiagramId('node'),
      x: (nodeData.x || 0) + offsetX,
      y: (nodeData.y || 0) + offsetY,
    };

    return { success: true, affectedIds: [newNode.id] };
  }

  // ============ Connector Operations ============

  private async addConnector(connector: DiagramConnector): Promise<OpResult> {
    const scene = {
      version: '1.0.0',
      nodes: Array.from(this.nodeDataMap.values()),
      connectors: [connector],
      texts: [],
    };

    const result = await importDiagramScene(scene, {
      canvas: this.canvas,
      clearCanvas: false,
    });

    if (result.success) {
      const objects = this.canvas.getObjects();
      const newObj = objects.find((o) => (o as any).diagramId === connector.id);
      if (newObj) {
        this.objectMap.set(connector.id, newObj);
        this.connectorDataMap.set(connector.id, connector);
      }
      return { success: true, affectedIds: [connector.id] };
    }

    return { success: false, error: result.errors.join(', ') };
  }

  private removeConnector(connectorId: string): OpResult {
    const obj = this.objectMap.get(connectorId);
    if (!obj) {
      return { success: false, error: `Connector not found: ${connectorId}` };
    }

    attachmentRegistry.detach(connectorId);
    this.canvas.remove(obj);
    this.objectMap.delete(connectorId);
    this.connectorDataMap.delete(connectorId);
    this.canvas.requestRenderAll();

    return { success: true, affectedIds: [connectorId] };
  }

  private updateConnector(connectorId: string, changes: Partial<DiagramConnector>): OpResult {
    const connectorData = this.connectorDataMap.get(connectorId);
    if (!connectorData) {
      return { success: false, error: `Connector not found: ${connectorId}` };
    }

    // Update stored data
    Object.assign(connectorData, changes);

    // Re-create connector with new properties
    this.removeConnector(connectorId);
    return { success: true, affectedIds: [connectorId] };
  }

  // ============ Text Operations ============

  private async addText(text: DiagramText): Promise<OpResult> {
    const scene = {
      version: '1.0.0',
      nodes: [],
      connectors: [],
      texts: [text],
    };

    const result = await importDiagramScene(scene, {
      canvas: this.canvas,
      clearCanvas: false,
    });

    if (result.success) {
      const objects = this.canvas.getObjects();
      const newObj = objects.find((o) => (o as any).diagramId === text.id);
      if (newObj) {
        this.objectMap.set(text.id, newObj);
        this.textDataMap.set(text.id, text);
      }
      return { success: true, affectedIds: [text.id] };
    }

    return { success: false, error: result.errors.join(', ') };
  }

  private removeText(textId: string): OpResult {
    const obj = this.objectMap.get(textId);
    if (!obj) {
      return { success: false, error: `Text not found: ${textId}` };
    }

    this.canvas.remove(obj);
    this.objectMap.delete(textId);
    this.textDataMap.delete(textId);
    this.canvas.requestRenderAll();

    return { success: true, affectedIds: [textId] };
  }

  private updateText(textId: string, changes: Partial<DiagramText>): OpResult {
    const obj = this.objectMap.get(textId);
    const textData = this.textDataMap.get(textId);
    
    if (!obj || !textData) {
      return { success: false, error: `Text not found: ${textId}` };
    }

    // Apply changes
    if (changes.x !== undefined) obj.set('left', changes.x);
    if (changes.y !== undefined) obj.set('top', changes.y);
    if (changes.text !== undefined) (obj as any).set('text', changes.text);
    if (changes.fontSize !== undefined) (obj as any).set('fontSize', changes.fontSize);
    if (changes.color !== undefined) obj.set('fill', changes.color);
    if (changes.rotation !== undefined) obj.set('angle', changes.rotation);

    Object.assign(textData, changes);
    
    obj.setCoords();
    this.canvas.requestRenderAll();

    return { success: true, affectedIds: [textId] };
  }

  // ============ Import/Export ============

  /**
   * Load a scene from JSON
   */
  async loadScene(sceneData: unknown): Promise<OpResult> {
    this.clear();
    
    const result = await importDiagramScene(sceneData, {
      canvas: this.canvas,
      clearCanvas: true,
    });

    if (result.success) {
      // Rebuild object maps from canvas
      this.rebuildMapsFromCanvas();
      return { success: true };
    }

    return { success: false, error: result.errors.join(', ') };
  }

  /**
   * Export current scene to JSON
   */
  exportScene(): { success: boolean; json: string; error?: string } {
    const result = exportDiagramScene(this.canvas);
    return {
      success: result.success,
      json: result.json,
      error: result.errors.join(', '),
    };
  }

  /**
   * Clear all diagram elements
   */
  clear(): void {
    this.canvas.clear();
    this.objectMap.clear();
    this.nodeDataMap.clear();
    this.connectorDataMap.clear();
    this.textDataMap.clear();
    attachmentRegistry.clear();
    this.hideAllPorts();
  }

  private rebuildMapsFromCanvas(): void {
    this.objectMap.clear();
    this.nodeDataMap.clear();
    this.connectorDataMap.clear();
    this.textDataMap.clear();

    for (const obj of this.canvas.getObjects()) {
      const meta = (obj as any).meta;
      const id = (obj as any).diagramId;

      if (!meta || !id) continue;

      this.objectMap.set(id, obj);

      if (meta.type === 'node' && meta.diagramData) {
        this.nodeDataMap.set(id, meta.diagramData);
      } else if (meta.type === 'connector' && meta.diagramData) {
        this.connectorDataMap.set(id, meta.diagramData);
      } else if (meta.type === 'text' && meta.diagramData) {
        this.textDataMap.set(id, meta.diagramData);
      }
    }
  }

  // ============ Getters ============

  getNode(nodeId: string): DiagramNode | undefined {
    return this.nodeDataMap.get(nodeId);
  }

  getConnector(connectorId: string): DiagramConnector | undefined {
    return this.connectorDataMap.get(connectorId);
  }

  getText(textId: string): DiagramText | undefined {
    return this.textDataMap.get(textId);
  }

  getAllNodes(): DiagramNode[] {
    return Array.from(this.nodeDataMap.values());
  }

  getAllConnectors(): DiagramConnector[] {
    return Array.from(this.connectorDataMap.values());
  }

  getAllTexts(): DiagramText[] {
    return Array.from(this.textDataMap.values());
  }
}
