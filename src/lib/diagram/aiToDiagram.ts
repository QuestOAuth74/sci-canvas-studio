/**
 * AI Figure to Diagram JSON Bridge
 * Converts AI generation output into DiagramScene format for canvas rendering
 */

import {
  DiagramScene,
  DiagramNode,
  DiagramConnector,
  DiagramText,
  generateDiagramId,
} from './schema';

// ============ AI Generation Input Types ============

export interface AIGeneratedObject {
  type: 'icon' | 'shape';
  element_index: number;
  // Icon properties
  icon_id?: string;
  icon_name?: string;
  scale?: number;
  // Shape properties
  shape_type?: 'rectangle' | 'circle' | 'oval';
  shape_subtype?: 'text_label' | 'simple_shape' | 'complex_shape';
  width?: number;
  height?: number;
  fill_color?: string;
  stroke_color?: string;
  stroke_width?: number;
  rounded_corners?: boolean;
  // Text properties
  text_content?: string;
  text_properties?: {
    font_size?: 'small' | 'medium' | 'large';
    text_alignment?: 'center' | 'left' | 'right';
    multiline?: boolean;
  };
  // Common properties
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  rotation: number;
  label?: string;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export interface AIGeneratedConnector {
  from: number;
  to: number;
  type: string;
  style: string;
  strokeWidth: number;
  color: string;
  startMarker?: string;
  endMarker?: string;
  label?: string;
  waypoints?: Array<{ x: number; y: number }>;
  relationship_category?: string;
}

export interface AIGeneratedLayout {
  objects: AIGeneratedObject[];
  connectors: AIGeneratedConnector[];
}

export interface AIGenerationResponse {
  diagramDescription?: string;
  analysis?: unknown;
  proposed_layout?: AIGeneratedLayout;
  layout: AIGeneratedLayout;
  checks?: unknown[];
  metadata?: unknown;
  critique?: unknown;
}

// ============ Conversion Options ============

export interface ConversionOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  sceneMetadata?: {
    name?: string;
    description?: string;
  };
}

// ============ Main Conversion Function ============

/**
 * Convert AI generation response to DiagramScene format
 */
export function aiResponseToDiagramScene(
  response: AIGenerationResponse,
  options: ConversionOptions = {}
): DiagramScene {
  const { canvasWidth = 1920, canvasHeight = 1080 } = options;
  const layout = response.layout;
  
  const nodes: DiagramNode[] = [];
  const connectors: DiagramConnector[] = [];
  const texts: DiagramText[] = [];
  
  // Map from element_index to node ID
  const indexToNodeId = new Map<number, string>();
  
  // Convert objects to nodes
  for (const obj of layout.objects) {
    const nodeId = generateDiagramId('node');
    indexToNodeId.set(obj.element_index, nodeId);
    
    // Convert percentage positions to absolute
    const x = (obj.x / 100) * canvasWidth;
    const y = (obj.y / 100) * canvasHeight;
    
    if (obj.type === 'icon') {
      // Icon node
      nodes.push({
        id: nodeId,
        kind: 'icon',
        iconId: obj.icon_id,
        x,
        y,
        w: calculateIconSize(obj.scale),
        h: calculateIconSize(obj.scale),
        rotation: obj.rotation || 0,
        label: obj.label ? {
          text: obj.label,
          placement: mapLabelPlacement(obj.labelPosition),
        } : undefined,
        data: {
          iconName: obj.icon_name,
          elementIndex: obj.element_index,
          aiGenerated: true,
        },
      });
    } else if (obj.type === 'shape') {
      // Handle text-only labels as text objects
      if (obj.shape_subtype === 'text_label') {
        texts.push({
          id: generateDiagramId('text'),
          x,
          y,
          text: obj.text_content || obj.label || '',
          fontSize: mapFontSize(obj.text_properties?.font_size),
          fontFamily: 'Inter',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000',
          textAlign: mapTextAlign(obj.text_properties?.text_alignment),
          data: {
            elementIndex: obj.element_index,
            aiGenerated: true,
          },
        });
      } else {
        // Shape node
        const w = obj.width || 100;
        const h = obj.height || calculateShapeHeight(obj.text_content);
        
        nodes.push({
          id: nodeId,
          kind: 'shape',
          shapeType: mapShapeType(obj.shape_type),
          x,
          y,
          w,
          h,
          rotation: obj.rotation || 0,
          label: obj.text_content ? {
            text: obj.text_content,
            placement: 'center',
            fontSize: mapFontSize(obj.text_properties?.font_size),
          } : undefined,
          style: {
            fill: obj.fill_color || inferFillColor(obj),
            stroke: obj.stroke_color || '#333333',
            strokeWidth: obj.stroke_width || 2,
          },
          data: {
            shapeSubtype: obj.shape_subtype,
            elementIndex: obj.element_index,
            aiGenerated: true,
          },
        });
      }
    }
  }
  
  // Convert connectors
  for (const conn of layout.connectors) {
    const fromNodeId = indexToNodeId.get(conn.from);
    const toNodeId = indexToNodeId.get(conn.to);
    
    if (!fromNodeId || !toNodeId) {
      console.warn(`Connector references invalid indices: ${conn.from} -> ${conn.to}`);
      continue;
    }
    
    if (conn.from === conn.to) {
      console.warn('Skipping self-referencing connector');
      continue;
    }
    
    connectors.push({
      id: generateDiagramId('conn'),
      from: { nodeId: fromNodeId },
      to: { nodeId: toNodeId },
      router: mapRouterType(conn.type),
      waypoints: conn.waypoints,
      style: {
        stroke: normalizeColor(conn.color),
        width: Math.max(1, Math.min(5, conn.strokeWidth || 2)),
        dash: mapLineStyleToDash(conn.style),
        arrowStart: mapMarkerType(conn.startMarker),
        arrowEnd: mapMarkerType(conn.endMarker),
      },
      label: conn.label ? {
        text: conn.label,
        position: 0.5,
      } : undefined,
      data: {
        relationshipCategory: conn.relationship_category,
        aiGenerated: true,
      },
    });
  }
  
  return {
    version: '1.0.0',
    canvas: {
      width: canvasWidth,
      height: canvasHeight,
      background: '#ffffff',
    },
    nodes,
    connectors,
    texts,
    metadata: {
      name: options.sceneMetadata?.name || 'AI Generated Figure',
      description: options.sceneMetadata?.description || response.diagramDescription,
      created: new Date().toISOString(),
      tags: ['ai-generated'],
    },
  };
}

/**
 * Convert editable figure elements to DiagramScene format
 */
export function editableElementsToDiagramScene(
  elements: Array<{
    id: string;
    type: 'icon' | 'arrow' | 'shape' | 'text' | 'connector';
    label: string;
    svgContent: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation?: number;
    metadata?: Record<string, unknown>;
  }>,
  options: ConversionOptions = {}
): DiagramScene {
  const { canvasWidth = 1920, canvasHeight = 1080 } = options;
  
  const nodes: DiagramNode[] = [];
  const connectors: DiagramConnector[] = [];
  const texts: DiagramText[] = [];
  
  for (const elem of elements) {
    switch (elem.type) {
      case 'icon':
      case 'shape':
        nodes.push({
          id: elem.id,
          kind: elem.type === 'icon' ? 'icon' : 'shape',
          iconId: elem.metadata?.iconId as string,
          x: elem.position.x,
          y: elem.position.y,
          w: elem.size.width,
          h: elem.size.height,
          rotation: elem.rotation || 0,
          label: {
            text: elem.label,
            placement: 'bottom',
          },
          data: {
            svgContent: elem.svgContent,
            aiGenerated: true,
          },
        });
        break;
        
      case 'text':
        texts.push({
          id: elem.id,
          x: elem.position.x,
          y: elem.position.y,
          text: elem.label,
          fontSize: 14,
          fontFamily: 'Inter',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000',
          data: {
            aiGenerated: true,
          },
        });
        break;
        
      case 'arrow':
      case 'connector':
        // Arrows/connectors from editable elements need special handling
        // They may not have from/to node references
        // Store as custom connector with absolute positions
        const arrowMeta = elem.metadata || {};
        if (arrowMeta.fromNodeId && arrowMeta.toNodeId) {
          connectors.push({
            id: elem.id,
            from: { nodeId: arrowMeta.fromNodeId as string },
            to: { nodeId: arrowMeta.toNodeId as string },
            router: 'straight',
            data: {
              svgContent: elem.svgContent,
              aiGenerated: true,
            },
          });
        }
        break;
    }
  }
  
  return {
    version: '1.0.0',
    canvas: {
      width: canvasWidth,
      height: canvasHeight,
      background: '#ffffff',
    },
    nodes,
    connectors,
    texts,
    metadata: {
      name: options.sceneMetadata?.name || 'AI Editable Figure',
      created: new Date().toISOString(),
      tags: ['ai-generated', 'editable'],
    },
  };
}

// ============ Helper Functions ============

function calculateIconSize(scale?: number): number {
  const TARGET_SIZE = 200;
  const finalScale = scale ?? 0.5;
  return TARGET_SIZE * finalScale;
}

function calculateShapeHeight(textContent?: string): number {
  if (!textContent) return 40;
  const lineCount = (textContent.match(/\n/g) || []).length + 1;
  return 40 + Math.max(0, lineCount - 1) * 20;
}

function mapLabelPlacement(position?: string): 'top' | 'bottom' | 'left' | 'right' | 'center' {
  switch (position) {
    case 'top': return 'top';
    case 'left': return 'left';
    case 'right': return 'right';
    case 'bottom':
    default: return 'bottom';
  }
}

function mapFontSize(size?: string): number {
  switch (size) {
    case 'large': return 16;
    case 'small': return 10;
    case 'medium':
    default: return 13;
  }
}

function mapTextAlign(align?: string): 'left' | 'center' | 'right' {
  switch (align) {
    case 'left': return 'left';
    case 'right': return 'right';
    case 'center':
    default: return 'center';
  }
}

function mapShapeType(type?: string): 'rect' | 'ellipse' | 'diamond' | 'hexagon' | 'triangle' {
  switch (type) {
    case 'circle':
    case 'oval':
      return 'ellipse';
    case 'rectangle':
    default:
      return 'rect';
  }
}

function mapRouterType(type?: string): 'straight' | 'orthogonal' | 'curved' {
  switch (type) {
    case 'orthogonal': return 'orthogonal';
    case 'curved': return 'curved';
    case 'straight':
    default: return 'straight';
  }
}

function mapLineStyleToDash(style?: string): number[] | undefined {
  switch (style) {
    case 'dashed': return [10, 5];
    case 'dotted': return [2, 5];
    default: return undefined;
  }
}

function mapMarkerType(marker?: string): 'none' | 'arrow' | 'open-arrow' | 'diamond' | 'circle' {
  switch (marker) {
    case 'arrow': return 'arrow';
    case 'open-arrow': return 'open-arrow';
    case 'diamond': return 'diamond';
    case 'circle': return 'circle';
    default: return 'none';
  }
}

function normalizeColor(color?: string): string {
  if (!color) return '#000000';
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    // Expand shorthand
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return '#000000';
}

function inferFillColor(obj: AIGeneratedObject): string {
  const text = (obj.text_content || '').toLowerCase();
  
  // Category-based colors
  if (/angiotensin|ang\s|\(ang/i.test(text)) return '#FFB366';
  if (/ace2?|renin|peptidase|enzyme/i.test(text)) return '#98D891';
  if (/receptor|at[12]r|mas/i.test(text)) return '#98D891';
  if (/vasoconstriction|proliferation|effect/i.test(text)) return '#93C5FD';
  
  // Subtype-based defaults
  switch (obj.shape_subtype) {
    case 'simple_shape': return '#E5E7EB';
    case 'text_label': return '#FFFFFF';
    case 'complex_shape': return '#DBEAFE';
    default: return '#E5E7EB';
  }
}

// Types are already exported at definition
