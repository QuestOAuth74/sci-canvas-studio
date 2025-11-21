import { FabricObject, Path, Circle, Ellipse, Textbox, Group } from "fabric";

export interface TextOnPathData {
  isTextOnPath: boolean;
  pathId?: string;
  textContent: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  offset: number; // Distance from path (positive = outside, negative = inside)
  alignmentOffset: number; // Position along path (0-1)
  flipText: boolean; // Flip text upside down
}

/**
 * Check if an object can be used as a path for text
 */
export function isValidPath(obj: FabricObject | null): boolean {
  if (!obj) return false;
  return obj instanceof Path || obj instanceof Circle || obj instanceof Ellipse;
}

/**
 * Get points along a path at regular intervals
 */
export function getPathPoints(path: FabricObject, numPoints: number = 100): Array<{ x: number; y: number; angle: number }> {
  const points: Array<{ x: number; y: number; angle: number }> = [];
  
  if (path instanceof Circle) {
    // Handle circle
    const radius = path.radius || 50;
    const centerX = (path.left || 0) + radius;
    const centerY = (path.top || 0) + radius;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const tangentAngle = angle + Math.PI / 2; // Tangent is perpendicular to radius
      
      points.push({ x, y, angle: tangentAngle });
    }
  } else if (path instanceof Ellipse) {
    // Handle ellipse
    const rx = path.rx || 50;
    const ry = path.ry || 30;
    const centerX = (path.left || 0) + rx;
    const centerY = (path.top || 0) + ry;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * rx;
      const y = centerY + Math.sin(angle) * ry;
      
      // Calculate tangent angle for ellipse
      const dx = -rx * Math.sin(angle);
      const dy = ry * Math.cos(angle);
      const tangentAngle = Math.atan2(dy, dx);
      
      points.push({ x, y, angle: tangentAngle });
    }
  } else if (path instanceof Path) {
    // Handle custom path
    const pathData = (path as any).path;
    if (!pathData) return points;
    
    // Sample points along the path
    const totalLength = path.width || 100;
    const step = totalLength / numPoints;
    
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const point = getPointOnPath(path, t);
      if (point) {
        points.push(point);
      }
    }
  }
  
  return points;
}

/**
 * Get a point on a path at position t (0-1)
 */
function getPointOnPath(path: Path, t: number): { x: number; y: number; angle: number } | null {
  try {
    // For fabric Path objects, we can use the path array
    const pathArray = (path as any).path;
    if (!pathArray || pathArray.length === 0) return null;
    
    // Simple implementation: interpolate between path points
    const totalSegments = pathArray.length - 1;
    const segmentIndex = Math.floor(t * totalSegments);
    const segmentT = (t * totalSegments) - segmentIndex;
    
    const segment = pathArray[Math.min(segmentIndex, pathArray.length - 1)];
    const nextSegment = pathArray[Math.min(segmentIndex + 1, pathArray.length - 1)];
    
    // Extract coordinates based on segment type
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    
    if (segment[0] === 'M' || segment[0] === 'L') {
      x1 = segment[1];
      y1 = segment[2];
    }
    
    if (nextSegment[0] === 'M' || nextSegment[0] === 'L') {
      x2 = nextSegment[1];
      y2 = nextSegment[2];
    }
    
    // Interpolate position
    const x = x1 + (x2 - x1) * segmentT + (path.left || 0);
    const y = y1 + (y2 - y1) * segmentT + (path.top || 0);
    
    // Calculate angle based on direction
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    return { x, y, angle };
  } catch (error) {
    console.error('Error getting point on path:', error);
    return null;
  }
}

/**
 * Create text characters positioned along a path
 */
export function createTextOnPath(
  text: string,
  path: FabricObject,
  options: {
    fontSize: number;
    fontFamily: string;
    fill: string;
    offset: number;
    alignmentOffset: number;
    flipText: boolean;
  }
): Group {
  const { fontSize, fontFamily, fill, offset, alignmentOffset, flipText } = options;
  
  // Get points along the path
  const pathPoints = getPathPoints(path, text.length * 10);
  if (pathPoints.length === 0) {
    throw new Error('Could not generate path points');
  }
  
  // Calculate character spacing
  const totalChars = text.length;
  const startIndex = Math.floor(alignmentOffset * pathPoints.length);
  const endIndex = pathPoints.length;
  const availablePoints = endIndex - startIndex;
  const step = Math.max(1, Math.floor(availablePoints / totalChars));
  
  // Create individual text objects for each character
  const textObjects: Textbox[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === ' ') continue; // Skip spaces
    
    const pointIndex = startIndex + (i * step);
    if (pointIndex >= pathPoints.length) break;
    
    const point = pathPoints[pointIndex];
    
    // Create text object for this character
    const charText = new Textbox(char, {
      fontSize,
      fontFamily,
      fill,
      selectable: false,
      evented: false,
    });
    
    // Calculate position with offset
    let angle = point.angle;
    if (flipText) {
      angle += Math.PI;
    }
    
    const offsetX = Math.cos(angle + Math.PI / 2) * offset;
    const offsetY = Math.sin(angle + Math.PI / 2) * offset;
    
    charText.set({
      left: point.x + offsetX,
      top: point.y + offsetY,
      angle: (angle * 180) / Math.PI,
      originX: 'center',
      originY: 'center',
    });
    
    textObjects.push(charText);
  }
  
  // Group all characters together
  const group = new Group(textObjects, {
    selectable: true,
    hasControls: true,
  });
  
  // Store metadata
  (group as any).textOnPathData = {
    isTextOnPath: true,
    pathId: (path as any).id || '',
    textContent: text,
    fontSize,
    fontFamily,
    fill,
    offset,
    alignmentOffset,
    flipText,
  } as TextOnPathData;
  
  return group;
}

/**
 * Update text on path with new options
 */
export function updateTextOnPath(
  group: Group,
  path: FabricObject,
  options: Partial<{
    text: string;
    fontSize: number;
    fontFamily: string;
    fill: string;
    offset: number;
    alignmentOffset: number;
    flipText: boolean;
  }>
): Group {
  const existingData = (group as any).textOnPathData as TextOnPathData;
  if (!existingData) {
    throw new Error('Object is not a text-on-path group');
  }
  
  // Merge options with existing data
  const newOptions = {
    fontSize: options.fontSize ?? existingData.fontSize,
    fontFamily: options.fontFamily ?? existingData.fontFamily,
    fill: options.fill ?? existingData.fill,
    offset: options.offset ?? existingData.offset,
    alignmentOffset: options.alignmentOffset ?? existingData.alignmentOffset,
    flipText: options.flipText ?? existingData.flipText,
  };
  
  const text = options.text ?? existingData.textContent;
  
  // Create new text on path
  return createTextOnPath(text, path, { ...newOptions });
}

/**
 * Check if an object is a text-on-path group
 */
export function isTextOnPath(obj: FabricObject | null): boolean {
  if (!obj || !(obj instanceof Group)) return false;
  return !!(obj as any).textOnPathData?.isTextOnPath;
}

/**
 * Get text-on-path data from a group
 */
export function getTextOnPathData(obj: FabricObject | null): TextOnPathData | null {
  if (!isTextOnPath(obj)) return null;
  return (obj as any).textOnPathData || null;
}
