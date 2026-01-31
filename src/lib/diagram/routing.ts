/**
 * Connector Routing - Straight, orthogonal, and curved routing algorithms
 */

import { ResolvedPort } from './ports';

export interface Point {
  x: number;
  y: number;
}

export interface RoutingResult {
  path: Point[];
  svgPath: string;
}

// ============ Straight Routing ============

/**
 * Simple straight line between two points
 */
export function routeStraight(from: Point, to: Point): RoutingResult {
  const path = [from, to];
  const svgPath = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  
  return { path, svgPath };
}

// ============ Orthogonal (Manhattan) Routing ============

export interface OrthogonalOptions {
  preferHorizontalFirst?: boolean;
  minSegmentLength?: number;
  waypoints?: Point[];
}

/**
 * Orthogonal (right-angle) routing with Manhattan style
 */
export function routeOrthogonal(
  from: ResolvedPort | Point,
  to: ResolvedPort | Point,
  options: OrthogonalOptions = {}
): RoutingResult {
  const { preferHorizontalFirst = true, minSegmentLength = 20, waypoints = [] } = options;
  
  const fromPoint = { x: from.x, y: from.y };
  const toPoint = { x: to.x, y: to.y };
  
  // If waypoints are provided, route through them
  if (waypoints.length > 0) {
    return routeOrthogonalWithWaypoints(fromPoint, toPoint, waypoints);
  }
  
  const path: Point[] = [fromPoint];
  
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  
  // Determine exit direction based on port angle if available
  let exitHorizontal = preferHorizontalFirst;
  if ('angle' in from) {
    const angle = (from as ResolvedPort).angle;
    // Exit horizontally if angle is roughly left/right
    exitHorizontal = Math.abs(angle) < 45 || Math.abs(angle) > 135;
  }
  
  // Simple L-shape routing
  if (Math.abs(dx) < minSegmentLength && Math.abs(dy) < minSegmentLength) {
    // Points are very close, direct connection
    path.push(toPoint);
  } else if (exitHorizontal) {
    // Horizontal first, then vertical
    const midX = fromPoint.x + dx / 2;
    
    // Check if we need an S-curve (points are too close horizontally)
    if (Math.abs(dx) < minSegmentLength * 2) {
      // Go out, then vertical, then horizontal to target
      const outX = fromPoint.x + (dx > 0 ? minSegmentLength : -minSegmentLength);
      path.push({ x: outX, y: fromPoint.y });
      path.push({ x: outX, y: toPoint.y });
    } else {
      // Standard L or Z shape
      path.push({ x: midX, y: fromPoint.y });
      path.push({ x: midX, y: toPoint.y });
    }
    path.push(toPoint);
  } else {
    // Vertical first, then horizontal
    const midY = fromPoint.y + dy / 2;
    
    if (Math.abs(dy) < minSegmentLength * 2) {
      const outY = fromPoint.y + (dy > 0 ? minSegmentLength : -minSegmentLength);
      path.push({ x: fromPoint.x, y: outY });
      path.push({ x: toPoint.x, y: outY });
    } else {
      path.push({ x: fromPoint.x, y: midY });
      path.push({ x: toPoint.x, y: midY });
    }
    path.push(toPoint);
  }
  
  // Clean up redundant points
  const cleanPath = cleanOrthogonalPath(path);
  
  return {
    path: cleanPath,
    svgPath: pathToSvg(cleanPath),
  };
}

/**
 * Route through specific waypoints with orthogonal segments
 */
function routeOrthogonalWithWaypoints(from: Point, to: Point, waypoints: Point[]): RoutingResult {
  const allPoints = [from, ...waypoints, to];
  const path: Point[] = [from];
  
  for (let i = 1; i < allPoints.length; i++) {
    const prev = allPoints[i - 1];
    const curr = allPoints[i];
    
    // Add intermediate points for orthogonal routing
    if (prev.x !== curr.x && prev.y !== curr.y) {
      // Need a corner
      path.push({ x: curr.x, y: prev.y });
    }
    path.push(curr);
  }
  
  const cleanPath = cleanOrthogonalPath(path);
  
  return {
    path: cleanPath,
    svgPath: pathToSvg(cleanPath),
  };
}

/**
 * Remove redundant colinear points from orthogonal path
 */
function cleanOrthogonalPath(path: Point[]): Point[] {
  if (path.length < 3) return path;
  
  const cleaned: Point[] = [path[0]];
  
  for (let i = 1; i < path.length - 1; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = path[i];
    const next = path[i + 1];
    
    // Check if current point is on the same line as prev and next
    const onHorizontal = prev.y === curr.y && curr.y === next.y;
    const onVertical = prev.x === curr.x && curr.x === next.x;
    
    if (!onHorizontal && !onVertical) {
      cleaned.push(curr);
    }
  }
  
  cleaned.push(path[path.length - 1]);
  return cleaned;
}

// ============ Curved Routing ============

export interface CurvedOptions {
  curvature?: number; // 0-1, how curved the line is
  waypoints?: Point[];
}

/**
 * Curved routing using quadratic or cubic Bezier curves
 */
export function routeCurved(
  from: ResolvedPort | Point,
  to: ResolvedPort | Point,
  options: CurvedOptions = {}
): RoutingResult {
  const { curvature = 0.5, waypoints = [] } = options;
  
  const fromPoint = { x: from.x, y: from.y };
  const toPoint = { x: to.x, y: to.y };
  
  if (waypoints.length > 0) {
    return routeCurvedWithWaypoints(fromPoint, toPoint, waypoints, curvature);
  }
  
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const distance = Math.hypot(dx, dy);
  
  // Calculate control points based on exit angles
  let cp1x: number, cp1y: number, cp2x: number, cp2y: number;
  
  if ('angle' in from && 'angle' in to) {
    // Use port angles to determine control point directions
    const fromAngle = ((from as ResolvedPort).angle * Math.PI) / 180;
    const toAngle = (((to as ResolvedPort).angle + 180) * Math.PI) / 180; // Reverse for entry
    
    const controlDist = distance * curvature * 0.5;
    
    cp1x = fromPoint.x + Math.cos(fromAngle) * controlDist;
    cp1y = fromPoint.y + Math.sin(fromAngle) * controlDist;
    cp2x = toPoint.x + Math.cos(toAngle) * controlDist;
    cp2y = toPoint.y + Math.sin(toAngle) * controlDist;
  } else {
    // Default S-curve control points
    const controlOffset = distance * curvature * 0.5;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // More horizontal - curve vertically
      cp1x = fromPoint.x + dx * 0.5;
      cp1y = fromPoint.y;
      cp2x = toPoint.x - dx * 0.5;
      cp2y = toPoint.y;
    } else {
      // More vertical - curve horizontally
      cp1x = fromPoint.x;
      cp1y = fromPoint.y + dy * 0.5;
      cp2x = toPoint.x;
      cp2y = toPoint.y - dy * 0.5;
    }
  }
  
  const path = [fromPoint, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, toPoint];
  const svgPath = `M ${fromPoint.x} ${fromPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toPoint.x} ${toPoint.y}`;
  
  return { path, svgPath };
}

/**
 * Route curved path through waypoints using smooth Bezier curves
 */
function routeCurvedWithWaypoints(
  from: Point,
  to: Point,
  waypoints: Point[],
  curvature: number
): RoutingResult {
  const allPoints = [from, ...waypoints, to];
  const path: Point[] = [...allPoints];
  
  let svgPath = `M ${from.x} ${from.y}`;
  
  if (allPoints.length === 2) {
    svgPath += ` L ${to.x} ${to.y}`;
  } else if (allPoints.length === 3) {
    // Quadratic curve through single waypoint
    const wp = waypoints[0];
    svgPath += ` Q ${wp.x} ${wp.y}, ${to.x} ${to.y}`;
  } else {
    // Catmull-Rom to Bezier conversion for smooth curve through all points
    for (let i = 0; i < allPoints.length - 1; i++) {
      const p0 = allPoints[Math.max(0, i - 1)];
      const p1 = allPoints[i];
      const p2 = allPoints[i + 1];
      const p3 = allPoints[Math.min(allPoints.length - 1, i + 2)];
      
      const tension = 1 - curvature;
      
      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
      
      svgPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }
  
  return { path, svgPath };
}

// ============ Utility Functions ============

/**
 * Convert path points to SVG polyline path
 */
function pathToSvg(path: Point[]): string {
  if (path.length === 0) return '';
  
  let svg = `M ${path[0].x} ${path[0].y}`;
  for (let i = 1; i < path.length; i++) {
    svg += ` L ${path[i].x} ${path[i].y}`;
  }
  
  return svg;
}

/**
 * Get point at a specific position along a path (0-1)
 */
export function getPointAlongPath(path: Point[], t: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0];
  if (t <= 0) return path[0];
  if (t >= 1) return path[path.length - 1];
  
  // Calculate total path length
  let totalLength = 0;
  const segmentLengths: number[] = [];
  
  for (let i = 1; i < path.length; i++) {
    const len = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    segmentLengths.push(len);
    totalLength += len;
  }
  
  // Find the segment containing the target position
  const targetLength = t * totalLength;
  let accumulatedLength = 0;
  
  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulatedLength + segmentLengths[i] >= targetLength) {
      const segmentT = (targetLength - accumulatedLength) / segmentLengths[i];
      const p1 = path[i];
      const p2 = path[i + 1];
      
      return {
        x: p1.x + (p2.x - p1.x) * segmentT,
        y: p1.y + (p2.y - p1.y) * segmentT,
      };
    }
    accumulatedLength += segmentLengths[i];
  }
  
  return path[path.length - 1];
}

/**
 * Get angle at a specific position along a path (for label rotation)
 */
export function getAngleAlongPath(path: Point[], t: number): number {
  if (path.length < 2) return 0;
  if (t <= 0) {
    const dx = path[1].x - path[0].x;
    const dy = path[1].y - path[0].y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }
  
  // Find the segment containing the target position
  const totalLength = path.reduce((sum, _, i) => {
    if (i === 0) return 0;
    return sum + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  }, 0);
  
  const targetLength = t * totalLength;
  let accumulatedLength = 0;
  
  for (let i = 1; i < path.length; i++) {
    const segmentLength = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    
    if (accumulatedLength + segmentLength >= targetLength) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      return Math.atan2(dy, dx) * (180 / Math.PI);
    }
    
    accumulatedLength += segmentLength;
  }
  
  const lastIdx = path.length - 1;
  const dx = path[lastIdx].x - path[lastIdx - 1].x;
  const dy = path[lastIdx].y - path[lastIdx - 1].y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calculate the total length of a path
 */
export function getPathLength(path: Point[]): number {
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    length += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  }
  return length;
}

/**
 * Route based on router type
 */
export function route(
  from: ResolvedPort | Point,
  to: ResolvedPort | Point,
  router: 'straight' | 'orthogonal' | 'curved',
  options: OrthogonalOptions & CurvedOptions = {}
): RoutingResult {
  switch (router) {
    case 'straight':
      return routeStraight(from, to);
    case 'orthogonal':
      return routeOrthogonal(from, to, options);
    case 'curved':
      return routeCurved(from, to, options);
    default:
      return routeStraight(from, to);
  }
}
