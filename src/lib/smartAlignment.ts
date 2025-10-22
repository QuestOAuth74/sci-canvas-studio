import { FabricObject, Canvas as FabricCanvas } from "fabric";

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number; // x for vertical, y for horizontal
  objects: FabricObject[];
  alignmentType: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
}

export interface DistanceInfo {
  from: FabricObject;
  to: FabricObject;
  distance: number;
  direction: 'horizontal' | 'vertical';
  fromPoint: { x: number; y: number };
  toPoint: { x: number; y: number };
}

export interface SnapPosition {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
}

/**
 * Find all objects on the canvas except the one being moved
 */
export function findNearbyObjects(
  movingObject: FabricObject,
  canvas: FabricCanvas,
  detectionRadius: number = 1000
): FabricObject[] {
  const objects = canvas.getObjects();
  const movingBounds = movingObject.getBoundingRect();
  const movingCenter = {
    x: movingBounds.left + movingBounds.width / 2,
    y: movingBounds.top + movingBounds.height / 2
  };

  return objects.filter(obj => {
    if (obj === movingObject) return false;
    if (!obj.visible) return false;
    if ((obj as any).isAlignmentGuide) return false; // Don't snap to guides
    if ((obj as any).isConnector) return false; // Don't include connectors
    
    const bounds = obj.getBoundingRect();
    const center = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2
    };
    
    const distance = Math.sqrt(
      Math.pow(center.x - movingCenter.x, 2) + 
      Math.pow(center.y - movingCenter.y, 2)
    );
    
    return distance < detectionRadius;
  });
}

/**
 * Prioritize alignment guides to show only the most relevant ones
 */
function prioritizeGuides(guides: AlignmentGuide[]): AlignmentGuide[] {
  if (guides.length === 0) return [];
  
  // Separate vertical and horizontal
  const vertical = guides.filter(g => g.type === 'vertical');
  const horizontal = guides.filter(g => g.type === 'horizontal');
  
  // Priority order: center/middle > canvas-center > edges
  const priorityOrder = ['center', 'middle', 'left', 'right', 'top', 'bottom'];
  
  // Pick best vertical guide (highest priority)
  const bestVertical = vertical.sort((a, b) => {
    return priorityOrder.indexOf(a.alignmentType) - priorityOrder.indexOf(b.alignmentType);
  })[0];
  
  // Pick best horizontal guide (highest priority)
  const bestHorizontal = horizontal.sort((a, b) => {
    return priorityOrder.indexOf(a.alignmentType) - priorityOrder.indexOf(b.alignmentType);
  })[0];
  
  // Return only the best guides (max 2: 1 vertical + 1 horizontal)
  return [bestVertical, bestHorizontal].filter(Boolean);
}

/**
 * Calculate all potential alignment guides based on nearby objects
 */
export function calculateAlignmentGuides(
  movingObject: FabricObject,
  canvas: FabricCanvas,
  threshold: number = 5
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const nearbyObjects = findNearbyObjects(movingObject, canvas);
  
  const movingBounds = movingObject.getBoundingRect();
  const movingLeft = movingBounds.left;
  const movingRight = movingBounds.left + movingBounds.width;
  const movingTop = movingBounds.top;
  const movingBottom = movingBounds.top + movingBounds.height;
  const movingCenterX = movingLeft + movingBounds.width / 2;
  const movingCenterY = movingTop + movingBounds.height / 2;

  // Canvas center guides
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  if (Math.abs(movingCenterX - canvasCenterX) < threshold) {
    guides.push({
      type: 'vertical',
      position: canvasCenterX,
      objects: [],
      alignmentType: 'center'
    });
  }

  if (Math.abs(movingCenterY - canvasCenterY) < threshold) {
    guides.push({
      type: 'horizontal',
      position: canvasCenterY,
      objects: [],
      alignmentType: 'middle'
    });
  }

  // Check alignment with each nearby object
  nearbyObjects.forEach(obj => {
    const bounds = obj.getBoundingRect();
    const left = bounds.left;
    const right = bounds.left + bounds.width;
    const top = bounds.top;
    const bottom = bounds.top + bounds.height;
    const centerX = left + bounds.width / 2;
    const centerY = top + bounds.height / 2;

    // Vertical alignment guides
    if (Math.abs(movingLeft - left) < threshold) {
      guides.push({
        type: 'vertical',
        position: left,
        objects: [obj],
        alignmentType: 'left'
      });
    }
    if (Math.abs(movingRight - right) < threshold) {
      guides.push({
        type: 'vertical',
        position: right,
        objects: [obj],
        alignmentType: 'right'
      });
    }
    if (Math.abs(movingCenterX - centerX) < threshold) {
      guides.push({
        type: 'vertical',
        position: centerX,
        objects: [obj],
        alignmentType: 'center'
      });
    }
    if (Math.abs(movingLeft - right) < threshold) {
      guides.push({
        type: 'vertical',
        position: right,
        objects: [obj],
        alignmentType: 'left'
      });
    }
    if (Math.abs(movingRight - left) < threshold) {
      guides.push({
        type: 'vertical',
        position: left,
        objects: [obj],
        alignmentType: 'right'
      });
    }

    // Horizontal alignment guides
    if (Math.abs(movingTop - top) < threshold) {
      guides.push({
        type: 'horizontal',
        position: top,
        objects: [obj],
        alignmentType: 'top'
      });
    }
    if (Math.abs(movingBottom - bottom) < threshold) {
      guides.push({
        type: 'horizontal',
        position: bottom,
        objects: [obj],
        alignmentType: 'bottom'
      });
    }
    if (Math.abs(movingCenterY - centerY) < threshold) {
      guides.push({
        type: 'horizontal',
        position: centerY,
        objects: [obj],
        alignmentType: 'middle'
      });
    }
    if (Math.abs(movingTop - bottom) < threshold) {
      guides.push({
        type: 'horizontal',
        position: bottom,
        objects: [obj],
        alignmentType: 'top'
      });
    }
    if (Math.abs(movingBottom - top) < threshold) {
      guides.push({
        type: 'horizontal',
        position: top,
        objects: [obj],
        alignmentType: 'bottom'
      });
    }
  });

  // Prioritize and limit guides to prevent clutter
  return prioritizeGuides(guides);
}

/**
 * Calculate the snap position based on alignment guides
 */
export function findSnapPosition(
  movingObject: FabricObject,
  guides: AlignmentGuide[],
  threshold: number = 5
): SnapPosition | null {
  if (guides.length === 0) return null;

  const movingBounds = movingObject.getBoundingRect();
  const currentLeft = movingBounds.left;
  const currentTop = movingBounds.top;
  const currentCenterX = currentLeft + movingBounds.width / 2;
  const currentCenterY = currentTop + movingBounds.height / 2;

  let snapX = currentLeft;
  let snapY = currentTop;
  let snappedX = false;
  let snappedY = false;
  let minDistX = threshold;
  let minDistY = threshold;

  guides.forEach(guide => {
    if (guide.type === 'vertical') {
      let targetX: number;
      
      switch (guide.alignmentType) {
        case 'left':
          targetX = guide.position;
          break;
        case 'right':
          targetX = guide.position - movingBounds.width;
          break;
        case 'center':
          targetX = guide.position - movingBounds.width / 2;
          break;
        default:
          targetX = currentLeft;
      }
      
      const distX = Math.abs(currentCenterX - guide.position);
      if (distX < minDistX) {
        snapX = targetX;
        snappedX = true;
        minDistX = distX;
      }
    } else {
      let targetY: number;
      
      switch (guide.alignmentType) {
        case 'top':
          targetY = guide.position;
          break;
        case 'bottom':
          targetY = guide.position - movingBounds.height;
          break;
        case 'middle':
          targetY = guide.position - movingBounds.height / 2;
          break;
        default:
          targetY = currentTop;
      }
      
      const distY = Math.abs(currentCenterY - guide.position);
      if (distY < minDistY) {
        snapY = targetY;
        snappedY = true;
        minDistY = distY;
      }
    }
  });

  if (snappedX || snappedY) {
    return {
      x: snapX,
      y: snapY,
      snappedX,
      snappedY
    };
  }

  return null;
}

/**
 * Measure distances between objects for equal spacing visualization
 */
export function measureDistances(
  movingObject: FabricObject,
  canvas: FabricCanvas
): DistanceInfo[] {
  const distances: DistanceInfo[] = [];
  const nearbyObjects = findNearbyObjects(movingObject, canvas, 200);
  
  const movingBounds = movingObject.getBoundingRect();
  const movingCenter = {
    x: movingBounds.left + movingBounds.width / 2,
    y: movingBounds.top + movingBounds.height / 2,
  };
  
  nearbyObjects.forEach(obj => {
    const bounds = obj.getBoundingRect();
    const center = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
    
    // Horizontal distance (objects in same row - stricter tolerance)
    if (Math.abs(movingCenter.y - center.y) < 20) {
      const horizontalGap = movingBounds.left < bounds.left
        ? bounds.left - (movingBounds.left + movingBounds.width)
        : movingBounds.left - (bounds.left + bounds.width);
      
      // Only show meaningful distances (10-100px range)
      if (horizontalGap > 10 && horizontalGap < 100) {
        const fromX = movingBounds.left < bounds.left
          ? movingBounds.left + movingBounds.width
          : bounds.left + bounds.width;
        const toX = movingBounds.left < bounds.left
          ? bounds.left
          : movingBounds.left;
        
        distances.push({
          from: movingObject,
          to: obj,
          distance: Math.abs(horizontalGap),
          direction: 'horizontal',
          fromPoint: { x: fromX, y: movingCenter.y },
          toPoint: { x: toX, y: movingCenter.y }
        });
      }
    }
    
    // Vertical distance (objects in same column - stricter tolerance)
    if (Math.abs(movingCenter.x - center.x) < 20) {
      const verticalGap = movingBounds.top < bounds.top
        ? bounds.top - (movingBounds.top + movingBounds.height)
        : movingBounds.top - (bounds.top + bounds.height);
      
      // Only show meaningful distances (10-100px range)
      if (verticalGap > 10 && verticalGap < 100) {
        const fromY = movingBounds.top < bounds.top
          ? movingBounds.top + movingBounds.height
          : bounds.top + bounds.height;
        const toY = movingBounds.top < bounds.top
          ? bounds.top
          : movingBounds.top;
        
        distances.push({
          from: movingObject,
          to: obj,
          distance: Math.abs(verticalGap),
          direction: 'vertical',
          fromPoint: { x: movingCenter.x, y: fromY },
          toPoint: { x: movingCenter.x, y: toY }
        });
      }
    }
  });
  
  // Return only closest 2 distances to avoid clutter
  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, 2);
}
