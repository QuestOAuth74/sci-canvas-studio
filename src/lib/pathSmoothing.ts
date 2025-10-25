import { Path } from "fabric";

export interface Point {
  x: number;
  y: number;
}

/**
 * Simplify a path by removing redundant points
 * Uses Ramer-Douglas-Peucker algorithm
 */
export function simplifyPath(points: Point[], tolerance: number = 2): Point[] {
  if (points.length <= 2) return points;

  // Find the point with maximum distance from the line segment
  let maxDistance = 0;
  let maxIndex = 0;
  const end = points.length - 1;
  
  for (let i = 1; i < end; i++) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points[end]
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  
  if (mag === 0) return Math.sqrt(
    Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
  );
  
  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  
  let closestPoint: Point;
  if (u < 0) {
    closestPoint = lineStart;
  } else if (u > 1) {
    closestPoint = lineEnd;
  } else {
    closestPoint = {
      x: lineStart.x + u * dx,
      y: lineStart.y + u * dy
    };
  }
  
  return Math.sqrt(
    Math.pow(point.x - closestPoint.x, 2) + Math.pow(point.y - closestPoint.y, 2)
  );
}

/**
 * Apply Chaikin's corner cutting algorithm for smooth curves
 */
export function chaikinSmooth(points: Point[], iterations: number = 1): Point[] {
  if (points.length < 2 || iterations === 0) return points;

  let smoothed = [...points];
  
  for (let iter = 0; iter < iterations; iter++) {
    const newPoints: Point[] = [];
    
    // Keep the first point
    newPoints.push(smoothed[0]);
    
    // Create new points between each pair
    for (let i = 0; i < smoothed.length - 1; i++) {
      const p1 = smoothed[i];
      const p2 = smoothed[i + 1];
      
      // Point at 25% along the segment
      newPoints.push({
        x: 0.75 * p1.x + 0.25 * p2.x,
        y: 0.75 * p1.y + 0.25 * p2.y
      });
      
      // Point at 75% along the segment
      newPoints.push({
        x: 0.25 * p1.x + 0.75 * p2.x,
        y: 0.25 * p1.y + 0.75 * p2.y
      });
    }
    
    // Keep the last point
    newPoints.push(smoothed[smoothed.length - 1]);
    smoothed = newPoints;
  }
  
  return smoothed;
}

/**
 * Extract points from a Fabric.js Path object
 */
export function extractPathPoints(path: Path): Point[] {
  const pathData = path.path as any[];
  if (!pathData || pathData.length === 0) return [];

  const points: Point[] = [];
  
  for (let i = 0; i < pathData.length; i++) {
    const cmd = pathData[i];
    const cmdType = cmd[0];
    
    if (cmdType === 'M' || cmdType === 'L') {
      // Move or Line command: [cmd, x, y]
      points.push({ x: cmd[1], y: cmd[2] });
    } else if (cmdType === 'Q') {
      // Quadratic curve: [cmd, cpx, cpy, x, y]
      // Add the end point
      points.push({ x: cmd[3], y: cmd[4] });
    } else if (cmdType === 'C') {
      // Cubic curve: [cmd, cp1x, cp1y, cp2x, cp2y, x, y]
      // Add the end point
      points.push({ x: cmd[5], y: cmd[6] });
    }
  }
  
  return points;
}

/**
 * Convert points back to SVG path data
 */
export function pointsToPathData(points: Point[]): any[] {
  if (points.length === 0) return [];
  
  const pathData: any[] = [];
  
  // Start with Move command
  pathData.push(['M', points[0].x, points[0].y]);
  
  // Use quadratic bezier curves for smoothness
  for (let i = 1; i < points.length; i++) {
    if (i === points.length - 1) {
      // Last point: use Line
      pathData.push(['L', points[i].x, points[i].y]);
    } else {
      // Create smooth curve using midpoints as control points
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // Control point is the current point
      const cpx = p1.x;
      const cpy = p1.y;
      
      // End point is midpoint to next
      const ex = (p1.x + p2.x) / 2;
      const ey = (p1.y + p2.y) / 2;
      
      pathData.push(['Q', cpx, cpy, ex, ey]);
    }
  }
  
  return pathData;
}

/**
 * Main smoothing function for Fabric.js Path objects
 */
export function smoothFabricPath(path: Path, strength: number): void {
  // Extract current path points
  const points = extractPathPoints(path);
  
  if (points.length < 3) {
    // Too few points to smooth
    return;
  }
  
  // Map strength (0-100) to smoothing parameters
  let iterations = 1;
  let tolerance = 3;
  
  if (strength <= 30) {
    iterations = 1;
    tolerance = 2;
  } else if (strength <= 70) {
    iterations = 2;
    tolerance = 3;
  } else {
    iterations = 3;
    tolerance = 4;
  }
  
  // First simplify to remove redundant points
  let smoothedPoints = simplifyPath(points, tolerance);
  
  // Then apply Chaikin smoothing
  smoothedPoints = chaikinSmooth(smoothedPoints, iterations);
  
  // Convert back to path data
  const newPathData = pointsToPathData(smoothedPoints);
  
  // Update the path
  path.path = newPathData;
  path.setCoords();
}
