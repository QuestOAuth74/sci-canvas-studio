import { Point, FabricObject, Canvas as FabricCanvas } from "fabric";
import { Port } from "@/types/connector";

// Straight line routing - direct line between two points
export function routeStraight(start: Point, end: Point): Point[] {
  return [start, end];
}

// Curved line routing - simple bezier curve
export function routeCurved(
  start: Point,
  end: Point,
  curvature: number = 0.5
): string {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Calculate control points for smooth curve
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const offset = distance * curvature;

  // Perpendicular offset for control points
  const cx1 = start.x + offset;
  const cy1 = start.y;
  const cx2 = end.x - offset;
  const cy2 = end.y;

  return `M ${start.x} ${start.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.x} ${end.y}`;
}

// Orthogonal/Manhattan routing - 90-degree angles
export function routeOrthogonal(
  start: Point,
  end: Point,
  startPort?: Port,
  endPort?: Port
): Point[] {
  const points: Point[] = [start];
  
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Simple L-shape routing
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal priority
    const midX = start.x + dx / 2;
    points.push(new Point(midX, start.y));
    points.push(new Point(midX, end.y));
  } else {
    // Vertical priority
    const midY = start.y + dy / 2;
    points.push(new Point(start.x, midY));
    points.push(new Point(end.x, midY));
  }
  
  points.push(end);
  return points;
}

// Elbow connector with custom waypoint
export function routeElbow(
  start: Point,
  end: Point,
  direction: 'horizontal' | 'vertical' = 'horizontal'
): Point[] {
  const points: Point[] = [start];
  
  if (direction === 'horizontal') {
    const midX = (start.x + end.x) / 2;
    points.push(new Point(midX, start.y));
    points.push(new Point(midX, end.y));
  } else {
    const midY = (start.y + end.y) / 2;
    points.push(new Point(start.x, midY));
    points.push(new Point(end.x, midY));
  }
  
  points.push(end);
  return points;
}

// Convert points array to SVG path string
export function pointsToPath(points: Point[]): string {
  if (points.length === 0) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  
  return path;
}

// Find obstacles between start and end points
function findObstacles(
  canvas: FabricCanvas,
  start: Point,
  end: Point,
  excludeIds: string[]
): FabricObject[] {
  const bounds = {
    left: Math.min(start.x, end.x) - 20,
    top: Math.min(start.y, end.y) - 20,
    right: Math.max(start.x, end.x) + 20,
    bottom: Math.max(start.y, end.y) + 20
  };
  
  return canvas.getObjects().filter(obj => {
    // Skip connectors, grid, rulers, and excluded shapes
    if ((obj as any).isConnector || 
        (obj as any).isGridLine || 
        (obj as any).isRuler || 
        (obj as any).isAlignmentGuide ||
        excludeIds.includes((obj as any).id)) {
      return false;
    }
    
    // Check if object intersects with connector path bounds
    const objBounds = obj.getBoundingRect();
    return !(
      objBounds.left > bounds.right ||
      objBounds.left + objBounds.width < bounds.left ||
      objBounds.top > bounds.bottom ||
      objBounds.top + objBounds.height < bounds.top
    );
  });
}

// Smart orthogonal routing with obstacle avoidance
export function routeOrthogonalSmart(
  canvas: FabricCanvas,
  start: Point,
  end: Point,
  startPort?: Port,
  endPort?: Port,
  sourceShapeId?: string,
  targetShapeId?: string
): Point[] {
  // Find obstacles
  const excludeIds = [sourceShapeId, targetShapeId].filter(Boolean) as string[];
  const obstacles = findObstacles(canvas, start, end, excludeIds);
  
  // If no obstacles, use simple routing
  if (obstacles.length === 0) {
    return routeOrthogonal(start, end, startPort, endPort);
  }
  
  // Simple obstacle avoidance: route around bounding box
  const points: Point[] = [start];
  const clearance = 20; // Minimum distance from obstacles
  
  // Calculate obstacle bounds
  const obstacleBounds = obstacles.map(obj => {
    const bounds = obj.getBoundingRect();
    return {
      left: bounds.left - clearance,
      top: bounds.top - clearance,
      right: bounds.left + bounds.width + clearance,
      bottom: bounds.top + bounds.height + clearance
    };
  });
  
  // Check if path is blocked
  const isPathBlocked = (p1: Point, p2: Point): boolean => {
    return obstacleBounds.some(bounds => {
      // Check if line segment intersects obstacle
      if (p1.x === p2.x) {
        // Vertical line
        const x = p1.x;
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        return x > bounds.left && x < bounds.right && 
               !(maxY < bounds.top || minY > bounds.bottom);
      } else if (p1.y === p2.y) {
        // Horizontal line
        const y = p1.y;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        return y > bounds.top && y < bounds.bottom && 
               !(maxX < bounds.left || minX > bounds.right);
      }
      return false;
    });
  };
  
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Try simple L-shape first
  if (Math.abs(dx) > Math.abs(dy)) {
    const midX = start.x + dx / 2;
    const point1 = new Point(midX, start.y);
    const point2 = new Point(midX, end.y);
    
    if (!isPathBlocked(start, point1) && !isPathBlocked(point1, point2) && !isPathBlocked(point2, end)) {
      points.push(point1, point2);
    } else {
      // Route around obstacles
      const mainObstacle = obstacleBounds[0];
      if (start.y < mainObstacle.top) {
        // Go over the obstacle
        points.push(new Point(start.x, mainObstacle.top - clearance));
        points.push(new Point(end.x, mainObstacle.top - clearance));
      } else {
        // Go under the obstacle
        points.push(new Point(start.x, mainObstacle.bottom + clearance));
        points.push(new Point(end.x, mainObstacle.bottom + clearance));
      }
    }
  } else {
    const midY = start.y + dy / 2;
    const point1 = new Point(start.x, midY);
    const point2 = new Point(end.x, midY);
    
    if (!isPathBlocked(start, point1) && !isPathBlocked(point1, point2) && !isPathBlocked(point2, end)) {
      points.push(point1, point2);
    } else {
      // Route around obstacles
      const mainObstacle = obstacleBounds[0];
      if (start.x < mainObstacle.left) {
        // Go left of the obstacle
        points.push(new Point(mainObstacle.left - clearance, start.y));
        points.push(new Point(mainObstacle.left - clearance, end.y));
      } else {
        // Go right of the obstacle
        points.push(new Point(mainObstacle.right + clearance, start.y));
        points.push(new Point(mainObstacle.right + clearance, end.y));
      }
    }
  }
  
  points.push(end);
  return points;
}

// Calculate smooth corners for orthogonal paths
export function smoothOrthogonalPath(points: Point[], cornerRadius: number = 10): string {
  if (points.length < 3) return pointsToPath(points);
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Calculate distances
    const d1x = curr.x - prev.x;
    const d1y = curr.y - prev.y;
    const d2x = next.x - curr.x;
    const d2y = next.y - curr.y;
    
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y);
    
    const radius = Math.min(cornerRadius, len1 / 2, len2 / 2);
    
    // Calculate corner points
    const ratio1 = radius / len1;
    const ratio2 = radius / len2;
    
    const p1x = curr.x - d1x * ratio1;
    const p1y = curr.y - d1y * ratio1;
    const p2x = curr.x + d2x * ratio2;
    const p2y = curr.y + d2y * ratio2;
    
    path += ` L ${p1x} ${p1y}`;
    path += ` Q ${curr.x} ${curr.y} ${p2x} ${p2y}`;
  }
  
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  
  return path;
}
