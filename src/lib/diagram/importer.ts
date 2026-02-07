/**
 * Diagram Importer - Convert JSON scene to Fabric.js canvas objects
 */

import { Canvas as FabricCanvas, FabricObject, FabricImage, Circle, Rect, Ellipse, Polygon, Group, Path, FabricText, Textbox } from 'fabric';
import {
  DiagramScene,
  DiagramNode,
  DiagramConnector,
  DiagramText,
  parseDiagramScene,
  validateDiagramScene,
  generateDefaultPorts,
  ValidationResult,
} from './schema';
import { resolveIcons, svgToDataUrl, ResolvedIcon } from './iconResolver';
import { applyLayout } from './layout';
import {
  resolvePortsAbsolute,
  ResolvedPort,
  attachmentRegistry,
  chooseBestPorts,
  getPortById,
} from './ports';
import { route, RoutingResult, getPointAlongPath } from './routing';

// ============ Import Types ============

export interface ImportOptions {
  canvas: FabricCanvas;
  validate?: boolean;
  clearCanvas?: boolean;
  onProgress?: (progress: number, message: string) => void;
}

export interface ImportResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    nodesImported: number;
    connectorsImported: number;
    textsImported: number;
    iconsFetched: number;
    timeMs: number;
  };
}

// Canvas object metadata interface
interface DiagramMeta {
  type: 'node' | 'connector' | 'text' | 'label';
  nodeId?: string;
  connectorId?: string;
  textId?: string;
  iconId?: string;
  diagramData?: DiagramNode | DiagramConnector | DiagramText;
}

// ============ Main Import Function ============

/**
 * Import a diagram scene JSON into a Fabric.js canvas
 */
export async function importDiagramScene(
  sceneData: unknown,
  options: ImportOptions
): Promise<ImportResult> {
  const startTime = performance.now();
  const { canvas, validate = true, clearCanvas = true, onProgress } = options;

  const result: ImportResult = {
    success: false,
    errors: [],
    warnings: [],
    stats: {
      nodesImported: 0,
      connectorsImported: 0,
      textsImported: 0,
      iconsFetched: 0,
      timeMs: 0,
    },
  };

  try {
    // Step 1: Validate
    onProgress?.(0.05, 'Validating scene...');
    
    let scene: DiagramScene;
    if (validate) {
      const validation = validateDiagramScene(sceneData);
      if (!validation.valid) {
        result.errors = validation.errors.map(e => `${e.path}: ${e.message}`);
        return result;
      }
      result.warnings = validation.warnings.map(w => `${w.path}: ${w.message}`);
    }
    
    scene = parseDiagramScene(sceneData);

    // Step 2: Clear canvas if requested
    if (clearCanvas) {
      canvas.clear();
      attachmentRegistry.clear();
    }

    // Step 3: Apply canvas config
    onProgress?.(0.1, 'Configuring canvas...');
    if (scene.canvas) {
      if (scene.canvas.width) canvas.setWidth(scene.canvas.width);
      if (scene.canvas.height) canvas.setHeight(scene.canvas.height);
      if (scene.canvas.background) {
        canvas.backgroundColor = scene.canvas.background;
      }
    }

    // Step 4: Apply layout if nodes need positioning
    let nodes = scene.nodes;
    if (scene.layout) {
      onProgress?.(0.15, 'Applying layout...');
      const layoutResult = applyLayout(nodes, scene.layout);
      nodes = layoutResult.nodes;
    }

    // Step 5: Collect and preload icons
    onProgress?.(0.2, 'Loading icons...');
    const iconNodes = nodes.filter(n => n.kind === 'icon');
    const iconIds = iconNodes
      .filter(n => n.iconId)
      .map(n => n.iconId!);

    console.log(`[Importer] Icon nodes: ${iconNodes.length}, with iconId: ${iconIds.length}, with generatedIconUrl: ${iconNodes.filter(n => n.generatedIconUrl).length}`);

    const uniqueIconIds = [...new Set(iconIds)];
    console.log(`[Importer] Resolving ${uniqueIconIds.length} unique icon IDs:`, uniqueIconIds);

    const icons = await resolveIcons(uniqueIconIds);
    console.log(`[Importer] Resolved ${icons.size} icons, found: ${[...icons.values()].filter(v => v !== null).length}`);

    // Log which icons were not found
    uniqueIconIds.forEach(id => {
      const icon = icons.get(id);
      if (!icon) {
        console.warn(`[Importer] Icon NOT found: ${id}`);
      } else {
        console.log(`[Importer] Icon found: ${id} -> ${icon.name}`);
      }
    });

    result.stats.iconsFetched = icons.size;

    // Step 6: Create node objects
    onProgress?.(0.4, 'Creating nodes...');
    const nodeObjects = new Map<string, FabricObject>();
    const nodeDataMap = new Map<string, DiagramNode>();

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const progress = 0.4 + (i / nodes.length) * 0.3;
      onProgress?.(progress, `Creating node ${i + 1}/${nodes.length}...`);

      try {
        const obj = await createNodeObject(node, icons);
        if (obj) {
          // Store metadata
          (obj as any).meta = {
            type: 'node',
            nodeId: node.id,
            iconId: node.iconId,
            diagramData: node,
          } as DiagramMeta;
          
          // Store custom ID
          (obj as any).diagramId = node.id;

          nodeObjects.set(node.id, obj);
          nodeDataMap.set(node.id, node);
          canvas.add(obj);
          result.stats.nodesImported++;
        }
      } catch (error) {
        result.warnings.push(`Failed to create node ${node.id}: ${error}`);
      }
    }

    // Step 7: Create connectors
    onProgress?.(0.7, 'Creating connectors...');
    for (let i = 0; i < scene.connectors.length; i++) {
      const connector = scene.connectors[i];
      const progress = 0.7 + (i / scene.connectors.length) * 0.15;
      onProgress?.(progress, `Creating connector ${i + 1}/${scene.connectors.length}...`);

      try {
        const obj = await createConnectorObject(
          connector,
          nodeObjects,
          nodeDataMap
        );
        if (obj) {
          (obj as any).meta = {
            type: 'connector',
            connectorId: connector.id,
            diagramData: connector,
          } as DiagramMeta;
          (obj as any).diagramId = connector.id;

          canvas.add(obj);
          result.stats.connectorsImported++;
        }
      } catch (error) {
        result.warnings.push(`Failed to create connector ${connector.id}: ${error}`);
      }
    }

    // Step 8: Create text objects
    onProgress?.(0.85, 'Creating text objects...');
    for (const text of scene.texts) {
      try {
        const obj = createTextObject(text);
        (obj as any).meta = {
          type: 'text',
          textId: text.id,
          diagramData: text,
        } as DiagramMeta;
        (obj as any).diagramId = text.id;

        canvas.add(obj);
        result.stats.textsImported++;
      } catch (error) {
        result.warnings.push(`Failed to create text ${text.id}: ${error}`);
      }
    }

    // Step 9: Finalize
    onProgress?.(0.95, 'Finalizing...');
    canvas.requestRenderAll();

    result.success = true;
    result.stats.timeMs = performance.now() - startTime;
    onProgress?.(1, 'Import complete!');

    return result;
  } catch (error) {
    result.errors.push(`Import failed: ${error}`);
    result.stats.timeMs = performance.now() - startTime;
    return result;
  }
}

// ============ Node Creation ============

async function createNodeObject(
  node: DiagramNode,
  icons: Map<string, ResolvedIcon | null>
): Promise<FabricObject | null> {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const w = node.w ?? 80;
  const h = node.h ?? 80;

  switch (node.kind) {
    case 'icon':
      return createIconNode(node, icons, x, y, w, h);
    case 'shape':
      return createShapeNode(node, x, y, w, h);
    case 'group':
      return createGroupNode(node, x, y, w, h);
    default:
      return null;
  }
}

async function createIconNode(
  node: DiagramNode,
  icons: Map<string, ResolvedIcon | null>,
  x: number,
  y: number,
  w: number,
  h: number
): Promise<FabricObject | null> {
  // Check for AI-generated icon first (data URL)
  if (node.generatedIconUrl) {
    try {
      console.log(`[Importer] Using AI-generated icon for node ${node.id}`);
      const img = await FabricImage.fromURL(node.generatedIconUrl);

      img.set({
        left: x,
        top: y,
        scaleX: w / (img.width || 64),
        scaleY: h / (img.height || 64),
        angle: node.rotation || 0,
        opacity: node.style?.opacity ?? 1,
        selectable: !node.locked,
        evented: !node.locked,
      });

      // Add label if present
      if (node.label) {
        return createNodeWithLabel(img, node, w, h);
      }

      return img;
    } catch (error) {
      console.error(`[Importer] Failed to load generated icon for ${node.id}:`, error);
      return createPlaceholderNode(node, x, y, w, h);
    }
  }

  // Check for icon from database
  if (!node.iconId) {
    console.warn(`Icon node ${node.id} missing iconId and generatedIconUrl`);
    return createPlaceholderNode(node, x, y, w, h);
  }

  const icon = icons.get(node.iconId);
  if (!icon) {
    console.warn(`Icon not found: ${node.iconId}`);
    return createPlaceholderNode(node, x, y, w, h);
  }

  try {
    const dataUrl = svgToDataUrl(icon.svgContent);
    const img = await FabricImage.fromURL(dataUrl);
    
    img.set({
      left: x,
      top: y,
      scaleX: w / (img.width || 100),
      scaleY: h / (img.height || 100),
      angle: node.rotation || 0,
      opacity: node.style?.opacity ?? 1,
      selectable: !node.locked,
      evented: !node.locked,
    });

    // Add label if present
    if (node.label) {
      return createNodeWithLabel(img, node, w, h);
    }

    return img;
  } catch (error) {
    console.error(`Failed to load icon ${node.iconId}:`, error);
    return createPlaceholderNode(node, x, y, w, h);
  }
}

function createShapeNode(
  node: DiagramNode,
  x: number,
  y: number,
  w: number,
  h: number
): FabricObject {
  // Common props - position will be set based on whether there's a label
  const hasLabel = !!node.label;

  const commonProps = {
    // If has label, shape will be centered in group; otherwise use x,y
    left: hasLabel ? 0 : x,
    top: hasLabel ? 0 : y,
    width: w,
    height: h,
    angle: node.rotation || 0,
    fill: node.style?.fill || '#4A90A4',
    stroke: node.style?.stroke || '#2D5A6B',
    strokeWidth: node.style?.strokeWidth || 2,
    opacity: node.style?.opacity ?? 1,
    selectable: !node.locked,
    evented: !node.locked,
    strokeUniform: true,
  };

  let shape: FabricObject;

  switch (node.shapeType) {
    case 'ellipse':
      shape = new Ellipse({
        ...commonProps,
        rx: w / 2,
        ry: h / 2,
        originX: hasLabel ? 'center' : 'left',
        originY: hasLabel ? 'center' : 'top',
      });
      break;
    case 'diamond':
      const diamondPoints = [
        { x: 0, y: -h / 2 },
        { x: w / 2, y: 0 },
        { x: 0, y: h / 2 },
        { x: -w / 2, y: 0 },
      ];
      shape = new Polygon(diamondPoints, {
        ...commonProps,
        originX: 'center',
        originY: 'center',
      });
      if (!hasLabel) {
        shape.set({ left: x + w / 2, top: y + h / 2 });
      }
      break;
    case 'hexagon':
      const hexPoints = createHexagonPoints(w, h);
      // Offset to center
      const centeredHexPoints = hexPoints.map(p => ({
        x: p.x - w / 2,
        y: p.y - h / 2,
      }));
      shape = new Polygon(centeredHexPoints, {
        ...commonProps,
        originX: 'center',
        originY: 'center',
      });
      if (!hasLabel) {
        shape.set({ left: x + w / 2, top: y + h / 2 });
      }
      break;
    case 'triangle':
      const triPoints = [
        { x: 0, y: -h / 2 },
        { x: w / 2, y: h / 2 },
        { x: -w / 2, y: h / 2 },
      ];
      shape = new Polygon(triPoints, {
        ...commonProps,
        originX: 'center',
        originY: 'center',
      });
      if (!hasLabel) {
        shape.set({ left: x + w / 2, top: y + h / 2 });
      }
      break;
    case 'rect':
    default:
      shape = new Rect({
        ...commonProps,
        originX: hasLabel ? 'center' : 'left',
        originY: hasLabel ? 'center' : 'top',
      });
      break;
  }

  if (node.label) {
    return createNodeWithLabel(shape, node, w, h);
  }

  // Mark standalone shapes
  (shape as any).diagramNodeId = node.id;
  return shape;
}

function createHexagonPoints(w: number, h: number): { x: number; y: number }[] {
  const offset = w * 0.25;
  return [
    { x: offset, y: 0 },
    { x: w - offset, y: 0 },
    { x: w, y: h / 2 },
    { x: w - offset, y: h },
    { x: offset, y: h },
    { x: 0, y: h / 2 },
  ];
}

function createGroupNode(
  node: DiagramNode,
  x: number,
  y: number,
  w: number,
  h: number
): FabricObject {
  // Create a simple rectangle as group placeholder
  // Child nodes will be positioned relative to this
  const rect = new Rect({
    left: x,
    top: y,
    width: w,
    height: h,
    fill: 'transparent',
    stroke: '#9CA3AF',
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    angle: node.rotation || 0,
    selectable: !node.locked,
    evented: !node.locked,
  });

  if (node.label) {
    return createNodeWithLabel(rect, node, w, h);
  }

  return rect;
}

function createPlaceholderNode(
  node: DiagramNode,
  x: number,
  y: number,
  w: number,
  h: number
): FabricObject {
  // Create a styled shape placeholder with label (not just empty rectangle)
  const fill = node.style?.fill || '#4A90A4';
  const stroke = node.style?.stroke || '#2D5A6B';

  const shape = new Ellipse({
    left: 0,
    top: 0,
    rx: w / 2,
    ry: h / 2,
    fill: fill,
    stroke: stroke,
    strokeWidth: node.style?.strokeWidth || 2,
    angle: node.rotation || 0,
    originX: 'center',
    originY: 'center',
  });

  // Add label if present
  if (node.label?.text) {
    const label = new Textbox(node.label.text, {
      fontSize: node.label.fontSize || 11,
      fontFamily: 'Inter',
      fill: '#ffffff',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      width: w + 20,
      left: 0,
      top: h / 2 + 15, // Below the shape
    });

    const group = new Group([shape, label], {
      left: x,
      top: y,
      originX: 'center',
      originY: 'center',
      subTargetCheck: true,
      interactive: true,
    });

    return group;
  }

  shape.set({ left: x, top: y });
  return shape;
}

function createNodeWithLabel(
  shape: FabricObject,
  node: DiagramNode,
  w: number,
  h: number
): FabricObject {
  if (!node.label) return shape;

  const placement = node.label.placement || 'center';
  const isInside = placement === 'center' || placement === 'inside';

  // For inside placement, use contrasting text color (matching canvas labeled shapes tool)
  const textColor = isInside
    ? (node.label.color || '#ffffff')  // White text for inside
    : (node.label.color || '#374151'); // Dark text for outside

  // Determine text width based on shape
  const textWidth = isInside ? Math.min(w * 0.9, 100) : w;

  // Create editable text (matching canvas labeled shapes tool structure)
  const label = new Textbox(node.label.text, {
    fontSize: node.label.fontSize || (isInside ? 18 : 12),
    fontFamily: node.label.fontFamily || 'Inter',
    fill: textColor,
    textAlign: 'center',
    width: textWidth,
    originX: 'center',
    originY: 'center',
    // Make text editable (matching canvas tool)
    selectable: true,
    evented: true,
    hoverCursor: 'text',
  });
  // Mark as editable label (matching canvas tool)
  (label as any).isEditableLabel = true;
  (label as any).listType = 'none';

  // Set shape origin to center for proper grouping
  shape.set({
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
  });

  const offsetX = node.label.offsetX || 0;
  const offsetY = node.label.offsetY || 0;

  // Position label based on placement (relative to center)
  switch (placement) {
    case 'top':
      label.set({ left: offsetX, top: -(h / 2 + 15) + offsetY });
      break;
    case 'bottom':
      label.set({ left: offsetX, top: (h / 2 + 15) + offsetY });
      break;
    case 'left':
      label.set({ left: -(w / 2 + 10) + offsetX, top: offsetY, originX: 'right' });
      break;
    case 'right':
      label.set({ left: (w / 2 + 10) + offsetX, top: offsetY, originX: 'left' });
      break;
    case 'center':
    case 'inside':
    default:
      label.set({ left: offsetX, top: offsetY });
      break;
  }

  // Create group with subTargetCheck for editable text
  // Using center origin to match canvas labeled shapes tool exactly
  const group = new Group([shape, label], {
    left: node.x || 0,
    top: node.y || 0,
    originX: 'center',
    originY: 'center',
    subTargetCheck: true,  // Allows clicking on sub-objects (matching canvas tool)
  });

  // Mark group as labeled shape (for identification)
  (group as any).isLabeledShape = true;
  (group as any).diagramNodeId = node.id;

  return group;
}

// ============ Connector Creation ============

async function createConnectorObject(
  connector: DiagramConnector,
  nodeObjects: Map<string, FabricObject>,
  nodeDataMap: Map<string, DiagramNode>
): Promise<FabricObject | null> {
  const fromNode = nodeObjects.get(connector.from.nodeId);
  const toNode = nodeObjects.get(connector.to.nodeId);
  const fromData = nodeDataMap.get(connector.from.nodeId);
  const toData = nodeDataMap.get(connector.to.nodeId);

  if (!fromNode || !toNode || !fromData || !toData) {
    console.warn(`Connector ${connector.id} references missing nodes`);
    return null;
  }

  // Get port positions
  let fromPort: ResolvedPort;
  let toPort: ResolvedPort;

  const fromLeft = fromNode.left || 0;
  const fromTop = fromNode.top || 0;
  const fromW = (fromNode.width || 80) * (fromNode.scaleX || 1);
  const fromH = (fromNode.height || 80) * (fromNode.scaleY || 1);

  const toLeft = toNode.left || 0;
  const toTop = toNode.top || 0;
  const toW = (toNode.width || 80) * (toNode.scaleX || 1);
  const toH = (toNode.height || 80) * (toNode.scaleY || 1);

  if (connector.from.portId) {
    const port = getPortById(fromData, fromLeft, fromTop, fromW, fromH, connector.from.portId);
    if (port) fromPort = port;
    else fromPort = chooseBestPorts(fromData, fromLeft, fromTop, fromW, fromH, toData, toLeft, toTop, toW, toH).fromPort;
  } else {
    fromPort = chooseBestPorts(fromData, fromLeft, fromTop, fromW, fromH, toData, toLeft, toTop, toW, toH).fromPort;
  }

  if (connector.to.portId) {
    const port = getPortById(toData, toLeft, toTop, toW, toH, connector.to.portId);
    if (port) toPort = port;
    else toPort = chooseBestPorts(fromData, fromLeft, fromTop, fromW, fromH, toData, toLeft, toTop, toW, toH).toPort;
  } else {
    toPort = chooseBestPorts(fromData, fromLeft, fromTop, fromW, fromH, toData, toLeft, toTop, toW, toH).toPort;
  }

  // Route the connector
  const waypointsWithRequired = connector.waypoints?.filter(
    (wp): wp is { x: number; y: number } => wp.x !== undefined && wp.y !== undefined
  );
  const routingResult = route(fromPort, toPort, connector.router, {
    waypoints: waypointsWithRequired,
  });

  // Create the path object
  const style = connector.style || {};
  const strokeColor = style.stroke || '#374151';
  const strokeWidth = style.width || 2;

  const pathObj = new Path(routingResult.svgPath, {
    fill: 'transparent',
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    strokeDashArray: style.dash,
    opacity: style.opacity ?? 1,
    selectable: true,
    evented: true,
  });

  // Register attachment
  attachmentRegistry.attach(
    connector.id,
    connector.from.nodeId,
    fromPort.id,
    connector.to.nodeId,
    toPort.id
  );

  // Create arrow heads
  const elements: FabricObject[] = [pathObj];

  // Get end point and angle for arrow
  const pathPoints = routingResult.path;
  if (pathPoints.length >= 2 && (style.arrowEnd === 'arrow' || style.arrowEnd === undefined)) {
    const endPoint = pathPoints[pathPoints.length - 1];
    const prevPoint = pathPoints[pathPoints.length - 2];

    // Calculate angle
    const angle = Math.atan2(endPoint.y - prevPoint.y, endPoint.x - prevPoint.x) * (180 / Math.PI);

    // Create arrow head (triangle)
    const arrowSize = Math.max(10, strokeWidth * 4);
    const arrowHead = new Polygon([
      { x: 0, y: 0 },
      { x: -arrowSize, y: -arrowSize / 2 },
      { x: -arrowSize, y: arrowSize / 2 },
    ], {
      left: endPoint.x,
      top: endPoint.y,
      fill: strokeColor,
      stroke: strokeColor,
      strokeWidth: 1,
      angle: angle,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    elements.push(arrowHead);
  }

  // Add start arrow if specified
  if (pathPoints.length >= 2 && style.arrowStart === 'arrow') {
    const startPoint = pathPoints[0];
    const nextPoint = pathPoints[1];

    const angle = Math.atan2(startPoint.y - nextPoint.y, startPoint.x - nextPoint.x) * (180 / Math.PI);
    const arrowSize = Math.max(10, strokeWidth * 4);

    const arrowHead = new Polygon([
      { x: 0, y: 0 },
      { x: -arrowSize, y: -arrowSize / 2 },
      { x: -arrowSize, y: arrowSize / 2 },
    ], {
      left: startPoint.x,
      top: startPoint.y,
      fill: strokeColor,
      stroke: strokeColor,
      strokeWidth: 1,
      angle: angle,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    elements.push(arrowHead);
  }

  // Add connector label if present
  if (connector.label) {
    const labelPos = getPointAlongPath(routingResult.path, connector.label.position);
    const labelText = new Textbox(connector.label.text, {
      left: labelPos.x,
      top: labelPos.y,
      fontSize: connector.label.fontSize || 12,
      fontFamily: connector.label.fontFamily || 'Inter',
      fill: connector.label.color || '#374151',
      backgroundColor: connector.label.backgroundColor || 'white',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    elements.push(labelText);
  }

  // Return grouped elements if we have arrows or labels, otherwise just the path
  if (elements.length > 1) {
    return new Group(elements, {
      subTargetCheck: true,
    });
  }

  return pathObj;
}

// ============ Text Creation ============

function createTextObject(text: DiagramText): FabricObject {
  const textObj = new Textbox(text.text, {
    left: text.x,
    top: text.y,
    fontSize: text.fontSize || 16,
    fontFamily: text.fontFamily || 'Inter',
    fontWeight: text.fontWeight === 'bold' ? 'bold' : 'normal',
    fontStyle: text.fontStyle === 'italic' ? 'italic' : 'normal',
    fill: text.color || '#000000',
    textAlign: text.textAlign || 'left',
    width: text.width,
    angle: text.rotation || 0,
    selectable: true,
    evented: true,
  });

  return textObj;
}

// ============ Validation Helper ============

/**
 * Validate a diagram scene without importing
 */
export function validateScene(sceneData: unknown): ValidationResult {
  return validateDiagramScene(sceneData);
}
