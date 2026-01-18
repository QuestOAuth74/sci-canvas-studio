/**
 * Figure to Fabric.js Conversion
 * Converts detected elements into Fabric.js objects
 */

import {
  FabricObject,
  Rect,
  IText,
  Group,
  Path,
  loadSVGFromString,
  Point,
} from 'fabric';
import {
  AnyDetectedElement,
  DetectedText,
  DetectedIcon,
  DetectedArrow,
  DetectedBox,
  SceneGraph,
} from '@/types/figureReconstruction';
import { createConnector } from '@/lib/connectorSystem';

export interface ConversionResult {
  fabricObject: FabricObject;
  elementId: string;
  elementType: string;
}

/**
 * Metadata stored on reconstructed Fabric objects
 */
export interface ReconstructedObjectData {
  isReconstructed: true;
  sceneGraphId: string;
  elementId: string;
  elementType: 'text' | 'icon' | 'arrow' | 'box';
  originalDetection: AnyDetectedElement;
}

/**
 * Convert a detected text element to Fabric IText
 */
export function textToFabric(element: DetectedText, sceneGraphId: string): FabricObject {
  const text = new IText(element.content, {
    left: element.bbox.x,
    top: element.bbox.y,
    fontSize: element.fontSize || 14,
    fontWeight: element.fontWeight || 'normal',
    fill: element.color || '#000000',
    fontFamily: 'Inter',
    originX: 'left',
    originY: 'top',
  });

  // Attach metadata
  (text as any).reconstructedData = {
    isReconstructed: true,
    sceneGraphId,
    elementId: element.id,
    elementType: 'text',
    originalDetection: element,
  } as ReconstructedObjectData;

  text.set('name' as any, `Text: ${element.content.substring(0, 20)}`);

  return text;
}

/**
 * Convert a detected box element to Fabric Rect
 */
export function boxToFabric(element: DetectedBox, sceneGraphId: string): FabricObject {
  const rect = new Rect({
    left: element.bbox.x,
    top: element.bbox.y,
    width: element.bbox.width,
    height: element.bbox.height,
    fill: element.fillColor || 'transparent',
    stroke: element.strokeColor || '#000000',
    strokeWidth: element.strokeWidth || 1,
    rx: element.cornerRadius || 0,
    ry: element.cornerRadius || 0,
    originX: 'left',
    originY: 'top',
  });

  (rect as any).reconstructedData = {
    isReconstructed: true,
    sceneGraphId,
    elementId: element.id,
    elementType: 'box',
    originalDetection: element,
  } as ReconstructedObjectData;

  rect.set('name' as any, `Box: ${element.label}`);

  return rect;
}

/**
 * Convert a detected arrow element to Fabric Path/Group
 */
export function arrowToFabric(
  element: DetectedArrow,
  sceneGraphId: string,
  canvas: any
): FabricObject | null {
  try {
    // Use the connector system to create proper arrows
    const connectorGroup = createConnector(canvas, {
      startX: element.startPoint.x,
      startY: element.startPoint.y,
      endX: element.endPoint.x,
      endY: element.endPoint.y,
      routingStyle: element.bendPoints && element.bendPoints.length > 0 ? 'curved' : 'straight',
      lineStyle: element.style as 'solid' | 'dashed' | 'dotted',
      strokeWidth: element.strokeWidth || 2,
      strokeColor: element.color || '#000000',
      startMarker: element.tailType as any || 'none',
      endMarker: element.headType as any || 'arrow',
      waypoints: element.bendPoints,
    });

    if (connectorGroup) {
      (connectorGroup as any).reconstructedData = {
        isReconstructed: true,
        sceneGraphId,
        elementId: element.id,
        elementType: 'arrow',
        originalDetection: element,
      } as ReconstructedObjectData;

      connectorGroup.set('name' as any, `Arrow: ${element.label}`);
    }

    return connectorGroup;
  } catch (error) {
    console.error('Failed to create arrow:', error);
    return null;
  }
}

/**
 * Convert a detected icon element to Fabric Group (with SVG content)
 */
export async function iconToFabric(
  element: DetectedIcon,
  svgContent: string,
  sceneGraphId: string
): Promise<FabricObject | null> {
  try {
    // Wrap SVG content
    const svgWrapper = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${element.bbox.width} ${element.bbox.height}">
        ${svgContent}
      </svg>
    `;

    const result = await loadSVGFromString(svgWrapper);
    
    if (!result.objects || result.objects.length === 0) {
      return null;
    }

    const validObjects = result.objects.filter((obj): obj is FabricObject => obj !== null);
    
    if (validObjects.length === 0) {
      return null;
    }

    // Create a group from parsed SVG objects
    const group = new Group(validObjects, {
      left: element.bbox.x,
      top: element.bbox.y,
      originX: 'left',
      originY: 'top',
    });

    // Scale to fit bounding box
    const groupBounds = group.getBoundingRect();
    const scaleX = element.bbox.width / groupBounds.width;
    const scaleY = element.bbox.height / groupBounds.height;
    const scale = Math.min(scaleX, scaleY);
    
    group.set({
      scaleX: scale,
      scaleY: scale,
    });

    (group as any).reconstructedData = {
      isReconstructed: true,
      sceneGraphId,
      elementId: element.id,
      elementType: 'icon',
      originalDetection: element,
      iconId: element.matchedIconId,
      iconName: element.matchedIconName,
    } as ReconstructedObjectData & { iconId?: string; iconName?: string };

    group.set('name' as any, `Icon: ${element.matchedIconName || element.label}`);

    return group;
  } catch (error) {
    console.error('Failed to create icon:', error);
    return null;
  }
}

/**
 * Create placeholder rect for icon regions awaiting icon selection
 */
export function createIconPlaceholder(element: DetectedIcon, sceneGraphId: string): FabricObject {
  const placeholder = new Rect({
    left: element.bbox.x,
    top: element.bbox.y,
    width: element.bbox.width,
    height: element.bbox.height,
    fill: 'rgba(59, 130, 246, 0.1)',
    stroke: '#3b82f6',
    strokeWidth: 2,
    strokeDashArray: [5, 5],
    rx: 8,
    ry: 8,
    originX: 'left',
    originY: 'top',
  });

  (placeholder as any).reconstructedData = {
    isReconstructed: true,
    sceneGraphId,
    elementId: element.id,
    elementType: 'icon',
    originalDetection: element,
    isPlaceholder: true,
  };

  (placeholder as any).isIconPlaceholder = true;
  placeholder.set('name' as any, `Icon Region: ${element.label}`);

  return placeholder;
}

/**
 * Convert all accepted elements in a scene graph to Fabric objects
 */
export async function convertSceneGraphToFabric(
  sceneGraph: SceneGraph,
  canvas: any,
  iconSvgMap: Map<string, string>
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];
  const sceneGraphId = `sg-${Date.now()}`;

  for (const element of sceneGraph.elements) {
    if (element.status !== 'accepted') continue;

    let fabricObject: FabricObject | null = null;

    switch (element.type) {
      case 'text':
        fabricObject = textToFabric(element as DetectedText, sceneGraphId);
        break;

      case 'box':
        fabricObject = boxToFabric(element as DetectedBox, sceneGraphId);
        break;

      case 'arrow':
        fabricObject = arrowToFabric(element as DetectedArrow, sceneGraphId, canvas);
        break;

      case 'icon':
        const iconElement = element as DetectedIcon;
        if (iconElement.matchedIconId && iconSvgMap.has(iconElement.matchedIconId)) {
          fabricObject = await iconToFabric(
            iconElement,
            iconSvgMap.get(iconElement.matchedIconId)!,
            sceneGraphId
          );
        } else {
          // Create placeholder for unmatched icons
          fabricObject = createIconPlaceholder(iconElement, sceneGraphId);
        }
        break;
    }

    if (fabricObject) {
      results.push({
        fabricObject,
        elementId: element.id,
        elementType: element.type,
      });
    }
  }

  return results;
}

/**
 * Check if a Fabric object is a reconstructed element
 */
export function isReconstructedElement(obj: FabricObject): boolean {
  return (obj as any).reconstructedData?.isReconstructed === true;
}

/**
 * Get reconstruction data from a Fabric object
 */
export function getReconstructionData(obj: FabricObject): ReconstructedObjectData | null {
  return (obj as any).reconstructedData || null;
}
