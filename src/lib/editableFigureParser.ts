/**
 * Editable Figure Parser
 * Parses structured SVG from AI into individual Fabric.js objects
 */

import { FabricObject, Group, loadSVGFromString, util } from 'fabric';

export interface FigureElement {
  id: string;
  type: 'icon' | 'arrow' | 'shape' | 'text' | 'connector';
  label: string;
  svgContent: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  metadata?: Record<string, unknown>;
}

export interface ParsedFigureObject {
  fabricObject: FabricObject;
  elementData: FigureElement;
}

/**
 * Custom properties added to AI-generated figure elements
 */
export interface AIFigureObjectData {
  aiGenerated: true;
  figureId: string;
  elementId: string;
  elementType: 'icon' | 'arrow' | 'shape' | 'text' | 'connector';
  elementLabel: string;
  originalSvg: string;
  metadata?: Record<string, unknown>;
}

/**
 * Parse an array of figure elements into Fabric.js objects
 */
export async function parseEditableFigure(
  elements: FigureElement[],
  figureId: string
): Promise<ParsedFigureObject[]> {
  const parsedObjects: ParsedFigureObject[] = [];
  
  for (const element of elements) {
    try {
      const fabricObject = await elementToFabricObject(element, figureId);
      if (fabricObject) {
        parsedObjects.push({
          fabricObject,
          elementData: element,
        });
      }
    } catch (error) {
      console.error(`Failed to parse element ${element.id}:`, error);
    }
  }
  
  return parsedObjects;
}

/**
 * Convert a single figure element to a Fabric.js object
 */
async function elementToFabricObject(
  element: FigureElement,
  figureId: string
): Promise<FabricObject | null> {
  // Wrap the SVG content in a proper SVG element
  const svgWrapper = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${element.size.width} ${element.size.height}">
      ${element.svgContent}
    </svg>
  `;
  
  return new Promise((resolve) => {
    loadSVGFromString(svgWrapper).then((result) => {
      if (!result.objects || result.objects.length === 0) {
        console.warn(`No objects parsed from element ${element.id}`);
        resolve(null);
        return;
      }
      
      // Filter out null objects
      const validObjects = result.objects.filter((obj): obj is FabricObject => obj !== null);
      
      if (validObjects.length === 0) {
        resolve(null);
        return;
      }
      
      // Create a group from all parsed objects
      const group = new Group(validObjects, {
        left: element.position.x,
        top: element.position.y,
        originX: 'left',
        originY: 'top',
      });
      
      // Add custom data for identification and editing
      const customData: AIFigureObjectData = {
        aiGenerated: true,
        figureId,
        elementId: element.id,
        elementType: element.type,
        elementLabel: element.label,
        originalSvg: element.svgContent,
        metadata: element.metadata,
      };
      
      // Store custom data on the object
      (group as any).aiData = customData;
      
      // Set object name for layer panel
      group.set('name' as any, `AI: ${element.label}`);
      
      resolve(group);
    }).catch((error) => {
      console.error(`Failed to load SVG for element ${element.id}:`, error);
      resolve(null);
    });
  });
}

/**
 * Check if a Fabric object is an AI-generated figure element
 */
export function isAIFigureElement(obj: FabricObject): boolean {
  return (obj as any).aiData?.aiGenerated === true;
}

/**
 * Get the AI figure data from a Fabric object
 */
export function getAIFigureData(obj: FabricObject): AIFigureObjectData | null {
  return (obj as any).aiData || null;
}

/**
 * Update the SVG content of an AI figure element
 */
export async function replaceElementContent(
  obj: FabricObject,
  newSvgContent: string
): Promise<FabricObject | null> {
  const aiData = getAIFigureData(obj);
  if (!aiData) return null;
  
  const currentLeft = obj.left || 0;
  const currentTop = obj.top || 0;
  const currentScaleX = obj.scaleX || 1;
  const currentScaleY = obj.scaleY || 1;
  const currentAngle = obj.angle || 0;
  
  // Parse the new SVG
  return new Promise((resolve) => {
    const bbox = obj.getBoundingRect();
    const svgWrapper = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bbox.width} ${bbox.height}">
        ${newSvgContent}
      </svg>
    `;
    
    loadSVGFromString(svgWrapper).then((result) => {
      if (!result.objects || result.objects.length === 0) {
        resolve(null);
        return;
      }
      
      const validObjects = result.objects.filter((o): o is FabricObject => o !== null);
      
      if (validObjects.length === 0) {
        resolve(null);
        return;
      }
      
      const newGroup = new Group(validObjects, {
        left: currentLeft,
        top: currentTop,
        scaleX: currentScaleX,
        scaleY: currentScaleY,
        angle: currentAngle,
        originX: 'left',
        originY: 'top',
      });
      
      // Preserve AI data with updated SVG
      (newGroup as any).aiData = {
        ...aiData,
        originalSvg: newSvgContent,
      };
      
      newGroup.set('name' as any, `AI: ${aiData.elementLabel}`);
      
      resolve(newGroup);
    }).catch(() => {
      resolve(null);
    });
  });
}

/**
 * Get all AI figure elements from a canvas
 */
export function getAllAIFigureElements(canvas: { getObjects: () => FabricObject[] }): FabricObject[] {
  return canvas.getObjects().filter(isAIFigureElement);
}

/**
 * Get all elements belonging to a specific figure
 */
export function getFigureElements(
  canvas: { getObjects: () => FabricObject[] },
  figureId: string
): FabricObject[] {
  return getAllAIFigureElements(canvas).filter(
    (obj) => getAIFigureData(obj)?.figureId === figureId
  );
}
