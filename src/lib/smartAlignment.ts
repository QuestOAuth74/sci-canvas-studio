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
 * Calculate all potential alignment guides based on nearby objects
 */
export function calculateAlignmentGuides(
  movingObject: FabricObject,
  canvas: FabricCanvas,
  threshold: number = 8
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

  return guides;
}

/**
 * Calculate the snap position based on alignment guides
 */
export function findSnapPosition(
  movingObject: FabricObject,
  guides: AlignmentGuide[],
  threshold: number = 8
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
  const nearbyObjects = findNearbyObjects(movingObject, canvas, 500);
  
  const movingBounds = movingObject.getBoundingRect();
  
  nearbyObjects.forEach(obj => {
    const bounds = obj.getBoundingRect();
    
    // Horizontal distance
    if (Math.abs(movingBounds.top - bounds.top) < 50) {
      const distance = movingBounds.left < bounds.left
        ? bounds.left - (movingBounds.left + movingBounds.width)
        : movingBounds.left - (bounds.left + bounds.width);
      
      if (distance > 0 && distance < 200) {
        distances.push({
          from: movingObject,
          to: obj,
          distance,
          direction: 'horizontal',
          fromPoint: {
            x: movingBounds.left < bounds.left ? movingBounds.left + movingBounds.width : movingBounds.left,
            y: movingBounds.top + movingBounds.height / 2
          },
          toPoint: {
            x: movingBounds.left < bounds.left ? bounds.left : bounds.left + bounds.width,
            y: bounds.top + bounds.height / 2
          }
        });
      }
    }
    
    // Vertical distance
    if (Math.abs(movingBounds.left - bounds.left) < 50) {
      const distance = movingBounds.top < bounds.top
        ? bounds.top - (movingBounds.top + movingBounds.height)
        : movingBounds.top - (bounds.top + bounds.height);
      
      if (distance > 0 && distance < 200) {
        distances.push({
          from: movingObject,
          to: obj,
          distance,
          direction: 'vertical',
          fromPoint: {
            x: movingBounds.left + movingBounds.width / 2,
            y: movingBounds.top < bounds.top ? movingBounds.top + movingBounds.height : movingBounds.top
          },
          toPoint: {
            x: bounds.left + bounds.width / 2,
            y: movingBounds.top < bounds.top ? bounds.top : bounds.top + bounds.height
          }
        });
      }
    }
  });
  
  return distances;
}
