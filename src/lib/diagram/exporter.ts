/**
 * Diagram Exporter - Convert Fabric.js canvas objects to JSON scene
 */

import { Canvas as FabricCanvas, FabricObject, Group, Path, Textbox, FabricImage, Rect, Ellipse, Polygon } from 'fabric';
import {
  DiagramScene,
  DiagramNode,
  DiagramConnector,
  DiagramText,
  DiagramPort,
  generateDiagramId,
  validateDiagramScene,
} from './schema';
import { attachmentRegistry } from './ports';

// ============ Export Types ============

export interface ExportOptions {
  includeMetadata?: boolean;
  prettyPrint?: boolean;
  validate?: boolean;
  version?: string;
}

export interface ExportResult {
  success: boolean;
  json: string;
  scene: DiagramScene | null;
  errors: string[];
  stats: {
    nodesExported: number;
    connectorsExported: number;
    textsExported: number;
  };
}

// ============ Main Export Function ============

/**
 * Export a Fabric.js canvas to diagram scene JSON
 */
export function exportDiagramScene(
  canvas: FabricCanvas,
  options: ExportOptions = {}
): ExportResult {
  const {
    includeMetadata = true,
    prettyPrint = true,
    validate = true,
    version = '1.0.0',
  } = options;

  const result: ExportResult = {
    success: false,
    json: '',
    scene: null,
    errors: [],
    stats: {
      nodesExported: 0,
      connectorsExported: 0,
      textsExported: 0,
    },
  };

  try {
    const objects = canvas.getObjects();
    
    const nodes: DiagramNode[] = [];
    const connectors: DiagramConnector[] = [];
    const texts: DiagramText[] = [];
    const processedIds = new Set<string>();

    // Process all canvas objects
    for (const obj of objects) {
      // Skip ephemeral UI elements
      if ((obj as any).isPortIndicator || (obj as any).isFeedback) {
        continue;
      }

      const meta = (obj as any).meta;
      const diagramId = (obj as any).diagramId;

      if (meta?.type === 'node') {
        const node = exportNode(obj, meta, diagramId);
        if (node && !processedIds.has(node.id)) {
          nodes.push(node);
          processedIds.add(node.id);
          result.stats.nodesExported++;
        }
      } else if (meta?.type === 'connector') {
        const connector = exportConnector(obj, meta, diagramId);
        if (connector && !processedIds.has(connector.id)) {
          connectors.push(connector);
          processedIds.add(connector.id);
          result.stats.connectorsExported++;
        }
      } else if (meta?.type === 'text') {
        const text = exportText(obj, meta, diagramId);
        if (text && !processedIds.has(text.id)) {
          texts.push(text);
          processedIds.add(text.id);
          result.stats.textsExported++;
        }
      } else {
        // Try to infer type from object
        const inferred = inferAndExportObject(obj);
        if (inferred) {
          if ('kind' in inferred && !processedIds.has(inferred.id)) {
            nodes.push(inferred as DiagramNode);
            processedIds.add(inferred.id);
            result.stats.nodesExported++;
          } else if ('from' in inferred && !processedIds.has(inferred.id)) {
            // Skip connectors without proper metadata
          } else if ('fontSize' in inferred && !processedIds.has(inferred.id)) {
            texts.push(inferred as DiagramText);
            processedIds.add(inferred.id);
            result.stats.textsExported++;
          }
        }
      }
    }

    // Build scene object
    const scene: DiagramScene = {
      version,
      canvas: {
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        background: typeof canvas.backgroundColor === 'string' ? canvas.backgroundColor : '#ffffff',
      },
      nodes,
      connectors,
      texts,
    };

    // Add metadata if requested
    if (includeMetadata) {
      scene.metadata = {
        modified: new Date().toISOString(),
      };
    }

    // Validate if requested
    if (validate) {
      const validation = validateDiagramScene(scene);
      if (!validation.valid) {
        result.errors = validation.errors.map(e => `${e.path}: ${e.message}`);
        return result;
      }
    }

    result.scene = scene;
    result.json = prettyPrint ? JSON.stringify(scene, null, 2) : JSON.stringify(scene);
    result.success = true;

    return result;
  } catch (error) {
    result.errors.push(`Export failed: ${error}`);
    return result;
  }
}

// ============ Node Export ============

function exportNode(
  obj: FabricObject,
  meta: any,
  diagramId?: string
): DiagramNode | null {
  const id = diagramId || meta?.nodeId || generateDiagramId('node');
  const originalData = meta?.diagramData as DiagramNode | undefined;

  // Handle grouped objects (node with label)
  let mainObject = obj;
  let labelObject: Textbox | null = null;

  if (obj instanceof Group) {
    const children = obj.getObjects();
    mainObject = children.find(c => !(c instanceof Textbox)) || children[0];
    labelObject = children.find(c => c instanceof Textbox) as Textbox | null;
  }

  const left = obj.left || 0;
  const top = obj.top || 0;
  const width = (mainObject.width || 80) * (mainObject.scaleX || 1);
  const height = (mainObject.height || 80) * (mainObject.scaleY || 1);

  const node: DiagramNode = {
    id,
    kind: determineNodeKind(mainObject, meta),
    x: left,
    y: top,
    w: width,
    h: height,
    rotation: obj.angle || 0,
  };

  // Add iconId if present
  if (meta?.iconId) {
    node.iconId = meta.iconId;
  } else if (originalData?.iconId) {
    node.iconId = originalData.iconId;
  }

  // Add shape type if applicable
  if (node.kind === 'shape') {
    node.shapeType = determineShapeType(mainObject);
  }

  // Add label if present
  if (labelObject) {
    node.label = {
      text: labelObject.text || '',
      placement: determineLabelPlacement(obj, labelObject),
      fontSize: labelObject.fontSize,
      fontFamily: labelObject.fontFamily,
      color: typeof labelObject.fill === 'string' ? labelObject.fill : undefined,
    };
  }

  // Add style if different from defaults
  const style: DiagramNode['style'] = {};
  if (mainObject instanceof Rect || mainObject instanceof Ellipse || mainObject instanceof Polygon) {
    if (mainObject.fill && mainObject.fill !== '#ffffff') {
      style.fill = typeof mainObject.fill === 'string' ? mainObject.fill : undefined;
    }
    if (mainObject.stroke && mainObject.stroke !== '#374151') {
      style.stroke = typeof mainObject.stroke === 'string' ? mainObject.stroke : undefined;
    }
    if (mainObject.strokeWidth && mainObject.strokeWidth !== 2) {
      style.strokeWidth = mainObject.strokeWidth;
    }
  }
  if (Object.keys(style).length > 0) {
    node.style = style;
  }

  // Preserve custom ports if originally defined
  if (originalData?.ports) {
    node.ports = originalData.ports;
  }

  // Preserve custom data
  if (originalData?.data) {
    node.data = originalData.data;
  }

  // Add locked state
  if (!obj.selectable) {
    node.locked = true;
  }

  return node;
}

function determineNodeKind(obj: FabricObject, meta: any): 'icon' | 'group' | 'shape' {
  if (meta?.iconId) return 'icon';
  if (obj instanceof FabricImage) return 'icon';
  if (obj instanceof Group) return 'group';
  return 'shape';
}

function determineShapeType(obj: FabricObject): 'rect' | 'ellipse' | 'diamond' | 'hexagon' | 'triangle' | undefined {
  if (obj instanceof Ellipse) return 'ellipse';
  if (obj instanceof Polygon) {
    const points = obj.points || [];
    if (points.length === 4) return 'diamond';
    if (points.length === 6) return 'hexagon';
    if (points.length === 3) return 'triangle';
  }
  if (obj instanceof Rect) return 'rect';
  return 'rect';
}

function determineLabelPlacement(parent: FabricObject, label: Textbox): 'top' | 'bottom' | 'left' | 'right' | 'center' {
  const parentLeft = parent.left || 0;
  const parentTop = parent.top || 0;
  const parentW = (parent.width || 80) * (parent.scaleX || 1);
  const parentH = (parent.height || 80) * (parent.scaleY || 1);
  const parentCenterX = parentLeft + parentW / 2;
  const parentCenterY = parentTop + parentH / 2;

  const labelLeft = label.left || 0;
  const labelTop = label.top || 0;

  const dx = labelLeft - parentCenterX;
  const dy = labelTop - parentCenterY;

  if (Math.abs(dx) < parentW * 0.3 && Math.abs(dy) < parentH * 0.3) {
    return 'center';
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'bottom' : 'top';
  }
}

// ============ Connector Export ============

function exportConnector(
  obj: FabricObject,
  meta: any,
  diagramId?: string
): DiagramConnector | null {
  const id = diagramId || meta?.connectorId || generateDiagramId('conn');
  const originalData = meta?.diagramData as DiagramConnector | undefined;

  if (!originalData) {
    // Can't export connector without original data
    return null;
  }

  // Get path object
  let pathObj: Path | null = null;
  if (obj instanceof Path) {
    pathObj = obj;
  } else if (obj instanceof Group) {
    pathObj = obj.getObjects().find(c => c instanceof Path) as Path | null;
  }

  const connector: DiagramConnector = {
    id,
    from: originalData.from,
    to: originalData.to,
    router: originalData.router || 'straight',
  };

  // Export waypoints if present
  if (originalData.waypoints) {
    connector.waypoints = originalData.waypoints;
  }

  // Export style
  if (pathObj) {
    connector.style = {
      stroke: typeof pathObj.stroke === 'string' ? pathObj.stroke : '#374151',
      width: pathObj.strokeWidth || 2,
      dash: pathObj.strokeDashArray as number[] | undefined,
      arrowStart: originalData.style?.arrowStart || 'none',
      arrowEnd: originalData.style?.arrowEnd || 'arrow',
    };
  } else if (originalData.style) {
    connector.style = originalData.style;
  }

  // Export label if present
  if (originalData.label) {
    connector.label = originalData.label;
  }

  // Preserve custom data
  if (originalData.data) {
    connector.data = originalData.data;
  }

  return connector;
}

// ============ Text Export ============

function exportText(
  obj: FabricObject,
  meta: any,
  diagramId?: string
): DiagramText | null {
  const id = diagramId || meta?.textId || generateDiagramId('text');

  if (!(obj instanceof Textbox)) {
    return null;
  }

  const text: DiagramText = {
    id,
    x: obj.left || 0,
    y: obj.top || 0,
    text: obj.text || '',
    fontSize: obj.fontSize || 16,
    fontFamily: obj.fontFamily || 'Inter',
    fontWeight: obj.fontWeight === 'bold' ? 'bold' : 'normal',
    fontStyle: obj.fontStyle === 'italic' ? 'italic' : 'normal',
    color: typeof obj.fill === 'string' ? obj.fill : '#000000',
    textAlign: obj.textAlign as 'left' | 'center' | 'right' || 'left',
    rotation: obj.angle || 0,
  };

  if (obj.width) {
    text.width = obj.width;
  }

  // Preserve custom data
  const originalData = meta?.diagramData as DiagramText | undefined;
  if (originalData?.data) {
    text.data = originalData.data;
  }

  return text;
}

// ============ Inference for objects without metadata ============

function inferAndExportObject(obj: FabricObject): DiagramNode | DiagramText | null {
  // Skip if it's a UI element
  if ((obj as any).isPortIndicator || (obj as any).isFeedback) {
    return null;
  }

  // Text objects
  if (obj instanceof Textbox) {
    return {
      id: generateDiagramId('text'),
      x: obj.left || 0,
      y: obj.top || 0,
      text: obj.text || '',
      fontSize: obj.fontSize || 16,
      fontFamily: obj.fontFamily || 'Inter',
      fontWeight: obj.fontWeight === 'bold' ? 'bold' : 'normal',
      fontStyle: obj.fontStyle === 'italic' ? 'italic' : 'normal',
      color: typeof obj.fill === 'string' ? obj.fill : '#000000',
      textAlign: obj.textAlign as 'left' | 'center' | 'right' || 'left',
      rotation: obj.angle || 0,
    };
  }

  // Shape objects
  if (obj instanceof Rect || obj instanceof Ellipse || obj instanceof Polygon) {
    const node: DiagramNode = {
      id: generateDiagramId('node'),
      kind: 'shape',
      shapeType: determineShapeType(obj),
      x: obj.left || 0,
      y: obj.top || 0,
      w: (obj.width || 80) * (obj.scaleX || 1),
      h: (obj.height || 80) * (obj.scaleY || 1),
      rotation: obj.angle || 0,
    };

    const style: DiagramNode['style'] = {};
    if (obj.fill && typeof obj.fill === 'string') style.fill = obj.fill;
    if (obj.stroke && typeof obj.stroke === 'string') style.stroke = obj.stroke;
    if (obj.strokeWidth) style.strokeWidth = obj.strokeWidth;
    if (Object.keys(style).length > 0) node.style = style;

    return node;
  }

  // Image objects (likely icons)
  if (obj instanceof FabricImage) {
    return {
      id: generateDiagramId('node'),
      kind: 'icon',
      x: obj.left || 0,
      y: obj.top || 0,
      w: (obj.width || 80) * (obj.scaleX || 1),
      h: (obj.height || 80) * (obj.scaleY || 1),
      rotation: obj.angle || 0,
    };
  }

  return null;
}

// ============ Utility Functions ============

/**
 * Export scene to downloadable file
 */
export function downloadDiagramScene(
  canvas: FabricCanvas,
  filename: string = 'diagram.json',
  options: ExportOptions = {}
): void {
  const result = exportDiagramScene(canvas, options);
  
  if (!result.success) {
    throw new Error(`Export failed: ${result.errors.join(', ')}`);
  }

  const blob = new Blob([result.json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Copy scene JSON to clipboard
 */
export async function copyDiagramSceneToClipboard(
  canvas: FabricCanvas,
  options: ExportOptions = {}
): Promise<boolean> {
  const result = exportDiagramScene(canvas, options);
  
  if (!result.success) {
    throw new Error(`Export failed: ${result.errors.join(', ')}`);
  }

  try {
    await navigator.clipboard.writeText(result.json);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
