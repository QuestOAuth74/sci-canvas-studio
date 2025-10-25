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
 * Sample points along a quadratic bezier curve
 */
function sampleQuadraticCurve(p0: Point, cp: Point, p1: Point, samples: number = 5): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const t1 = 1 - t;
    points.push({
      x: t1 * t1 * p0.x + 2 * t1 * t * cp.x + t * t * p1.x,
      y: t1 * t1 * p0.y + 2 * t1 * t * cp.y + t * t * p1.y
    });
  }
  return points;
}

/**
 * Sample points along a cubic bezier curve
 */
function sampleCubicCurve(p0: Point, cp1: Point, cp2: Point, p1: Point, samples: number = 5): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const t1 = 1 - t;
    const t1_2 = t1 * t1;
    const t1_3 = t1_2 * t1;
    const t_2 = t * t;
    const t_3 = t_2 * t;
    
    points.push({
      x: t1_3 * p0.x + 3 * t1_2 * t * cp1.x + 3 * t1 * t_2 * cp2.x + t_3 * p1.x,
      y: t1_3 * p0.y + 3 * t1_2 * t * cp1.y + 3 * t1 * t_2 * cp2.y + t_3 * p1.y
    });
  }
  return points;
}

/**
 * Extract points from a Fabric.js Path object with curve sampling
 */
export function extractPathPoints(path: Path): Point[] {
  const pathData = path.path as any[];
  if (!pathData || pathData.length === 0) return [];

  const points: Point[] = [];
  let lastPoint: Point = { x: 0, y: 0 };
  
  for (let i = 0; i < pathData.length; i++) {
    const cmd = pathData[i];
    const cmdType = cmd[0];
    
    if (cmdType === 'M') {
      // Move command: [cmd, x, y]
      lastPoint = { x: cmd[1], y: cmd[2] };
      points.push(lastPoint);
    } else if (cmdType === 'L') {
      // Line command: [cmd, x, y]
      lastPoint = { x: cmd[1], y: cmd[2] };
      points.push(lastPoint);
    } else if (cmdType === 'Q') {
      // Quadratic curve: [cmd, cpx, cpy, x, y]
      const sampledPoints = sampleQuadraticCurve(
        lastPoint,
        { x: cmd[1], y: cmd[2] },
        { x: cmd[3], y: cmd[4] },
        3
      );
      points.push(...sampledPoints.slice(1)); // Skip first point (it's lastPoint)
      lastPoint = { x: cmd[3], y: cmd[4] };
    } else if (cmdType === 'C') {
      // Cubic curve: [cmd, cp1x, cp1y, cp2x, cp2y, x, y]
      const sampledPoints = sampleCubicCurve(
        lastPoint,
        { x: cmd[1], y: cmd[2] },
        { x: cmd[3], y: cmd[4] },
        { x: cmd[5], y: cmd[6] },
        3
      );
      points.push(...sampledPoints.slice(1)); // Skip first point (it's lastPoint)
      lastPoint = { x: cmd[5], y: cmd[6] };
    }
  }
  
  return points;
}

/**
 * Convert Catmull-Rom control points to Cubic Bezier control points
 */
function catmullRomToBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  tension: number = 0.5
): { cp1: Point; cp2: Point } {
  const t = tension / 6;
  
  return {
    cp1: {
      x: p1.x + (p2.x - p0.x) * t,
      y: p1.y + (p2.y - p0.y) * t
    },
    cp2: {
      x: p2.x - (p3.x - p1.x) * t,
      y: p2.y - (p3.y - p1.y) * t
    }
  };
}

/**
 * Convert points to smooth Catmull-Rom SVG path data
 */
export function pointsToPathData(points: Point[], tension: number = 1.0): any[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [['M', points[0].x, points[0].y]];
  if (points.length === 2) {
    return [
      ['M', points[0].x, points[0].y],
      ['L', points[1].x, points[1].y]
    ];
  }
  
  const pathData: any[] = [];
  
  // Start with Move command
  pathData.push(['M', points[0].x, points[0].y]);
  
  // For first segment, use ghost point
  const p0_ghost = {
    x: 2 * points[0].x - points[1].x,
    y: 2 * points[0].y - points[1].y
  };
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? p0_ghost : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i === points.length - 2 
      ? { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y } // Ghost point for end
      : points[i + 2];
    
    const { cp1, cp2 } = catmullRomToBezier(p0, p1, p2, p3, tension);
    
    pathData.push(['C', cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y]);
  }
  
  return pathData;
}

/**
 * Main smoothing function for Fabric.js Path objects
 */
export function smoothFabricPath(path: Path, strength: number): void {
  // Extract current path points with curve sampling
  const points = extractPathPoints(path);
  
  if (points.length < 3) {
    // Too few points to smooth
    return;
  }
  
  // Map strength (0-100) to smoothing parameters
  let simplifyTolerance = 0;
  let chaikinIterations = 0;
  let catmullTension = 1.0;
  
  if (strength <= 33) {
    // Light smoothing
    simplifyTolerance = 0; // No simplification
    chaikinIterations = 0;
    catmullTension = 0.8; // Tighter curves
  } else if (strength <= 66) {
    // Medium smoothing
    simplifyTolerance = 1.5;
    chaikinIterations = 1;
    catmullTension = 1.0; // Medium curves
  } else {
    // Heavy smoothing
    simplifyTolerance = 2.5;
    chaikinIterations = 2;
    catmullTension = 1.2; // Looser curves
  }
  
  // Simplify path if tolerance > 0
  let smoothedPoints = simplifyTolerance > 0 
    ? simplifyPath(points, simplifyTolerance)
    : points;
  
  // Apply Chaikin smoothing if iterations > 0
  if (chaikinIterations > 0) {
    smoothedPoints = chaikinSmooth(smoothedPoints, chaikinIterations);
  }
  
  // Convert to smooth Catmull-Rom path
  const newPathData = pointsToPathData(smoothedPoints, catmullTension);
  
  // Update the path
  path.path = newPathData;
  path.setCoords();
}
