/**
 * Diagram System - Main entry point and exports
 */

// Schema and types
export {
  // Types
  type DiagramScene,
  type DiagramNode,
  type DiagramConnector,
  type DiagramText,
  type DiagramPort,
  type DiagramLabel,
  type ConnectorEndpoint,
  type ConnectorStyle,
  type ConnectorLabel,
  type CanvasConfig,
  type LayoutConfig,
  type AssetRef,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  
  // Schema validation
  DiagramSceneSchema,
  NodeSchema,
  ConnectorSchema,
  TextSchema,
  PortSchema,
  LayoutConfigSchema,
  
  // Utility functions
  validateDiagramScene,
  parseDiagramScene,
  generateDefaultPorts,
  generateDiagramId,
} from './schema';

// Import functionality
export {
  importDiagramScene,
  validateScene,
  type ImportOptions,
  type ImportResult,
} from './importer';

// Export functionality
export {
  exportDiagramScene,
  downloadDiagramScene,
  copyDiagramSceneToClipboard,
  type ExportOptions,
  type ExportResult,
} from './exporter';

// Port system
export {
  // Types
  type PortPositionName,
  type ResolvedPort,
  type PortIndicator,
  type ConnectorAttachment,
  
  // Port calculations
  getPortExitAngle,
  resolveNodePorts,
  calculateAbsolutePortPosition,
  resolvePortsAbsolute,
  findNearestPort,
  chooseBestPorts,
  getPortById,
  
  // Port indicators (visual)
  createPortIndicators,
  showPortIndicators,
  hidePortIndicators,
  updatePortIndicators,
  highlightPortIndicator,
  
  // Attachment registry
  AttachmentRegistry,
  attachmentRegistry,
} from './ports';

// Routing
export {
  // Types
  type Point,
  type RoutingResult,
  type OrthogonalOptions,
  type CurvedOptions,
  
  // Routing functions
  routeStraight,
  routeOrthogonal,
  routeCurved,
  route,
  
  // Path utilities
  getPointAlongPath,
  getAngleAlongPath,
  getPathLength,
} from './routing';

// Layout
export {
  // Types
  type LayoutResult,
  
  // Layout functions
  applyLayout,
  applyGridLayout,
  applyFlowLRLayout,
  applyFlowTBLayout,
  applyHierarchicalLayout,
  applyForceLayout,
} from './layout';

// Icon resolution
export {
  // Types
  type ResolvedIcon,
  
  // Functions
  resolveIcon,
  resolveIcons,
  preloadIcons,
  clearIconCache,
  getIconCacheStats,
  searchIcons,
  createIconElement,
  svgToDataUrl,
} from './iconResolver';

// Operations / Manager
export {
  // Types
  type DiagramOp,
  type OpResult,
  
  // Manager class
  DiagramManager,
} from './ops';

// ============ Convenience Functions ============

import { Canvas as FabricCanvas } from 'fabric';
import { importDiagramScene, ImportResult } from './importer';
import { exportDiagramScene, ExportResult } from './exporter';
import { DiagramScene, parseDiagramScene, validateDiagramScene } from './schema';

/**
 * Quick import: Load JSON string into canvas
 */
export async function quickImport(
  canvas: FabricCanvas,
  json: string,
  options: { clear?: boolean } = {}
): Promise<ImportResult> {
  const data = JSON.parse(json);
  return importDiagramScene(data, {
    canvas,
    clearCanvas: options.clear ?? true,
  });
}

/**
 * Quick export: Get JSON string from canvas
 */
export function quickExport(canvas: FabricCanvas): string {
  const result = exportDiagramScene(canvas);
  if (!result.success) {
    throw new Error(`Export failed: ${result.errors.join(', ')}`);
  }
  return result.json;
}

/**
 * Validate JSON string without importing
 */
export function validateJson(json: string): { valid: boolean; errors: string[] } {
  try {
    const data = JSON.parse(json);
    const result = validateDiagramScene(data);
    return {
      valid: result.valid,
      errors: result.errors.map(e => `${e.path}: ${e.message}`),
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Invalid JSON: ${error}`],
    };
  }
}

/**
 * Create an empty scene
 */
export function createEmptyScene(options: {
  width?: number;
  height?: number;
  background?: string;
} = {}): DiagramScene {
  return {
    version: '1.0.0',
    canvas: {
      width: options.width || 1920,
      height: options.height || 1080,
      background: options.background || '#ffffff',
    },
    nodes: [],
    connectors: [],
    texts: [],
  };
}

/**
 * Merge two scenes
 */
export function mergeScenes(
  base: DiagramScene,
  overlay: DiagramScene,
  options: { offsetX?: number; offsetY?: number } = {}
): DiagramScene {
  const { offsetX = 0, offsetY = 0 } = options;

  // Offset overlay nodes
  const offsetNodes = overlay.nodes.map(node => ({
    ...node,
    x: (node.x || 0) + offsetX,
    y: (node.y || 0) + offsetY,
  }));

  // Offset overlay texts
  const offsetTexts = overlay.texts.map(text => ({
    ...text,
    x: text.x + offsetX,
    y: text.y + offsetY,
  }));

  return {
    ...base,
    nodes: [...base.nodes, ...offsetNodes],
    connectors: [...base.connectors, ...overlay.connectors],
    texts: [...base.texts, ...offsetTexts],
  };
}

/**
 * Clone a scene (deep copy)
 */
export function cloneScene(scene: DiagramScene): DiagramScene {
  return JSON.parse(JSON.stringify(scene));
}
