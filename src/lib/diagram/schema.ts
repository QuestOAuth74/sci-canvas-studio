/**
 * Diagram JSON Schema - TypeScript types and runtime validation
 * Version 1.0.0
 */

import { z } from 'zod';

// ============ Port Schema ============
export const PortSchema = z.object({
  id: z.string(),
  x: z.number().min(0).max(1), // Normalized 0-1 coordinates
  y: z.number().min(0).max(1),
  label: z.string().optional(),
});

export type DiagramPort = z.infer<typeof PortSchema>;

// ============ Label Schema ============
export const LabelSchema = z.object({
  text: z.string(),
  placement: z.enum(['top', 'bottom', 'left', 'right', 'center', 'inside']).default('bottom'),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  color: z.string().optional(),
  offsetX: z.number().optional(),
  offsetY: z.number().optional(),
});

export type DiagramLabel = z.infer<typeof LabelSchema>;

// ============ Node Schema ============
export const NodeSchema = z.object({
  id: z.string(),
  kind: z.enum(['icon', 'group', 'shape']),
  iconId: z.string().optional(), // For icon nodes - references internal icon library
  generatedIconUrl: z.string().optional(), // AI-generated icon as data URL (when no icon in library)
  shapeType: z.enum(['rect', 'ellipse', 'diamond', 'hexagon', 'triangle', 'star']).optional(),
  x: z.number().optional(), // Optional if using auto-layout
  y: z.number().optional(),
  w: z.number().default(80),
  h: z.number().default(80),
  rotation: z.number().default(0),
  label: LabelSchema.optional(),
  ports: z.array(PortSchema).optional(), // If omitted, auto-generate 8 ports
  data: z.record(z.unknown()).optional(), // Freeform metadata
  style: z.object({
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional(),
    opacity: z.number().min(0).max(1).optional(),
  }).optional(),
  children: z.array(z.string()).optional(), // For groups - child node IDs
  locked: z.boolean().optional(),
});

export type DiagramNode = z.infer<typeof NodeSchema>;

// ============ Connector Endpoint Schema ============
export const ConnectorEndpointSchema = z.object({
  nodeId: z.string(),
  portId: z.string().optional(), // If omitted, auto-select best port
});

export type ConnectorEndpoint = z.infer<typeof ConnectorEndpointSchema>;

// ============ Connector Style Schema ============
export const ConnectorStyleSchema = z.object({
  stroke: z.string().default('#374151'),
  width: z.number().default(2),
  dash: z.array(z.number()).optional(), // e.g., [5, 5] for dashed
  arrowStart: z.enum(['none', 'arrow', 'open-arrow', 'diamond', 'circle', 'block', 'tee', 
    'inhibition', 'activation', 'phosphorylation', 'binding', 'catalysis', 'stimulation']).default('none'),
  arrowEnd: z.enum(['none', 'arrow', 'open-arrow', 'diamond', 'circle', 'block', 'tee',
    'inhibition', 'activation', 'phosphorylation', 'binding', 'catalysis', 'stimulation']).default('arrow'),
  opacity: z.number().min(0).max(1).optional(),
});

export type ConnectorStyle = z.infer<typeof ConnectorStyleSchema>;

// ============ Connector Label Schema ============
export const ConnectorLabelSchema = z.object({
  text: z.string(),
  position: z.number().min(0).max(1).default(0.5), // Position along path (0-1)
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
});

export type ConnectorLabel = z.infer<typeof ConnectorLabelSchema>;

// ============ Connector Schema ============
export const ConnectorSchema = z.object({
  id: z.string(),
  from: ConnectorEndpointSchema,
  to: ConnectorEndpointSchema,
  router: z.enum(['straight', 'orthogonal', 'curved']).default('straight'),
  waypoints: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  style: ConnectorStyleSchema.optional(),
  label: ConnectorLabelSchema.optional(),
  data: z.record(z.unknown()).optional(),
});

export type DiagramConnector = z.infer<typeof ConnectorSchema>;

// ============ Text Schema ============
export const TextSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  fontSize: z.number().default(16),
  fontFamily: z.string().default('Inter'),
  fontWeight: z.enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']).default('normal'),
  fontStyle: z.enum(['normal', 'italic']).default('normal'),
  color: z.string().default('#000000'),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  width: z.number().optional(), // For text wrapping
  rotation: z.number().default(0),
  data: z.record(z.unknown()).optional(),
});

export type DiagramText = z.infer<typeof TextSchema>;

// ============ Canvas Config Schema ============
export const CanvasConfigSchema = z.object({
  width: z.number().default(1920),
  height: z.number().default(1080),
  background: z.string().default('#ffffff'),
  grid: z.object({
    enabled: z.boolean().default(false),
    size: z.number().default(20),
    color: z.string().default('#e5e7eb'),
    snap: z.boolean().default(false),
  }).optional(),
});

export type CanvasConfig = z.infer<typeof CanvasConfigSchema>;

// ============ Layout Config Schema ============
export const GridLayoutSchema = z.object({
  type: z.literal('grid'),
  startX: z.number().default(50),
  startY: z.number().default(50),
  cols: z.number().default(10),
  cellW: z.number().default(120),
  cellH: z.number().default(120),
  padding: z.number().default(20),
});

export const FlowLRLayoutSchema = z.object({
  type: z.literal('flowLR'),
  startX: z.number().default(50),
  startY: z.number().default(50),
  rowGap: z.number().default(100),
  colGap: z.number().default(150),
  maxWidth: z.number().optional(),
});

export const FlowTBLayoutSchema = z.object({
  type: z.literal('flowTB'),
  startX: z.number().default(50),
  startY: z.number().default(50),
  rowGap: z.number().default(100),
  colGap: z.number().default(150),
  maxHeight: z.number().optional(),
});

export const LayoutConfigSchema = z.discriminatedUnion('type', [
  GridLayoutSchema,
  FlowLRLayoutSchema,
  FlowTBLayoutSchema,
]);

export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;

// ============ Asset Reference Schema ============
export const AssetRefSchema = z.object({
  id: z.string(),
  type: z.enum(['icon', 'image']),
  sourceId: z.string().optional(), // Internal icon ID
  url: z.string().optional(), // External URL (for custom images)
  name: z.string().optional(),
});

export type AssetRef = z.infer<typeof AssetRefSchema>;

// ============ Scene Schema (Top Level) ============
export const DiagramSceneSchema = z.object({
  version: z.string().default('1.0.0'),
  canvas: CanvasConfigSchema.optional(),
  assets: z.object({
    icons: z.array(AssetRefSchema).optional(),
    images: z.array(AssetRefSchema).optional(),
  }).optional(),
  nodes: z.array(NodeSchema).default([]),
  connectors: z.array(ConnectorSchema).default([]),
  texts: z.array(TextSchema).default([]),
  layout: LayoutConfigSchema.optional(),
  metadata: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    author: z.string().optional(),
    created: z.string().optional(),
    modified: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export type DiagramScene = z.infer<typeof DiagramSceneSchema>;

// ============ Validation Functions ============

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

/**
 * Validate a diagram scene JSON
 */
export function validateDiagramScene(data: unknown): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Parse with Zod
  const parseResult = DiagramSceneSchema.safeParse(data);
  
  if (!parseResult.success) {
    result.valid = false;
    parseResult.error.errors.forEach(err => {
      result.errors.push({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      });
    });
    return result;
  }

  const scene = parseResult.data;

  // Check for unique IDs
  const allIds = new Set<string>();
  const duplicates: string[] = [];

  const checkId = (id: string, type: string) => {
    if (allIds.has(id)) {
      duplicates.push(`${type}:${id}`);
    } else {
      allIds.add(id);
    }
  };

  scene.nodes.forEach(node => checkId(node.id, 'node'));
  scene.connectors.forEach(conn => checkId(conn.id, 'connector'));
  scene.texts.forEach(text => checkId(text.id, 'text'));

  if (duplicates.length > 0) {
    result.valid = false;
    result.errors.push({
      path: '',
      message: `Duplicate IDs found: ${duplicates.join(', ')}`,
      code: 'duplicate_ids',
    });
  }

  // Check connector references
  const nodeIds = new Set(scene.nodes.map(n => n.id));
  scene.connectors.forEach(conn => {
    if (!nodeIds.has(conn.from.nodeId)) {
      result.valid = false;
      result.errors.push({
        path: `connectors.${conn.id}.from.nodeId`,
        message: `Connector references non-existent node: ${conn.from.nodeId}`,
        code: 'invalid_reference',
      });
    }
    if (!nodeIds.has(conn.to.nodeId)) {
      result.valid = false;
      result.errors.push({
        path: `connectors.${conn.id}.to.nodeId`,
        message: `Connector references non-existent node: ${conn.to.nodeId}`,
        code: 'invalid_reference',
      });
    }
  });

  // Check for icon nodes without iconId
  scene.nodes.forEach(node => {
    if (node.kind === 'icon' && !node.iconId) {
      result.warnings.push({
        path: `nodes.${node.id}`,
        message: 'Icon node missing iconId',
        code: 'missing_icon_id',
      });
    }
  });

  // Check for nodes without position when no layout
  if (!scene.layout) {
    scene.nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) {
        result.warnings.push({
          path: `nodes.${node.id}`,
          message: 'Node missing position (x/y) and no layout specified',
          code: 'missing_position',
        });
      }
    });
  }

  return result;
}

/**
 * Parse and validate diagram scene, throwing on error
 */
export function parseDiagramScene(data: unknown): DiagramScene {
  const validation = validateDiagramScene(data);
  
  if (!validation.valid) {
    const errorMessages = validation.errors.map(e => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid diagram scene:\n${errorMessages}`);
  }

  return DiagramSceneSchema.parse(data);
}

/**
 * Generate default 8 ports for a node (N, NE, E, SE, S, SW, W, NW)
 */
export function generateDefaultPorts(nodeId: string): DiagramPort[] {
  return [
    { id: `${nodeId}-n`, x: 0.5, y: 0 },
    { id: `${nodeId}-ne`, x: 1, y: 0 },
    { id: `${nodeId}-e`, x: 1, y: 0.5 },
    { id: `${nodeId}-se`, x: 1, y: 1 },
    { id: `${nodeId}-s`, x: 0.5, y: 1 },
    { id: `${nodeId}-sw`, x: 0, y: 1 },
    { id: `${nodeId}-w`, x: 0, y: 0.5 },
    { id: `${nodeId}-nw`, x: 0, y: 0 },
  ];
}

/**
 * Generate a unique ID for diagram elements
 */
export function generateDiagramId(prefix: string = 'elem'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}
