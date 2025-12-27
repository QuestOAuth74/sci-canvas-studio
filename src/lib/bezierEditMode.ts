import { Canvas, Circle, Line as FabricLine, Path, Rect, util, Point as FabricPoint } from "fabric";
import { BezierPoint, BezierPath, BezierEditConfig, Point } from "@/types/bezier";
import {
  subdivideCubicBezier,
  findClosestPointOnPath,
  alignControlHandles,
  calculateAngle,
  vectorLength,
  getPointOnCubicBezier,
} from "./bezierMath";
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: BezierEditConfig = {
  anchorRadius: 6,
  controlHandleRadius: 5,
  smoothColor: '#10b981',
  cornerColor: '#3b82f6',
  selectedColor: '#f59e0b',
  guideLineColor: '#10b981',
  guideLineDash: [5, 3],
};

export class BezierEditMode {
  private canvas: Canvas;
  private path: BezierPath | null = null;
  private config: BezierEditConfig;
  private anchorHandles: Map<string, Circle | Rect> = new Map();
  private controlHandles: Map<string, Circle> = new Map();
  private guideLines: Map<string, FabricLine> = new Map();
  private selectedAnchorId: string | null = null;
  private hoverAnchorId: string | null = null;

  constructor(canvas: Canvas, config?: Partial<BezierEditConfig>) {
    this.canvas = canvas;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Activate edit mode for a bezier path
   */
  activate(path: Path): void {
    if (!path || !(path as any).isBezierPath) {
      console.warn('Can only edit bezier paths');
      return;
    }

    this.path = path as BezierPath;
    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];

    if (!bezierPoints || bezierPoints.length < 2) {
      console.warn('Path does not have valid bezier points');
      return;
    }

    console.log('[BezierEditMode] ========== ACTIVATING EDIT MODE ==========');
    console.log('[BezierEditMode] Path state:');
    console.log('  - left:', this.path.left, 'top:', this.path.top);
    console.log('  - width:', this.path.width, 'height:', this.path.height);
    console.log('  - originX:', this.path.originX, 'originY:', this.path.originY);
    console.log('  - pathOffset:', (this.path as any).pathOffset);
    console.log('  - scaleX:', this.path.scaleX, 'scaleY:', this.path.scaleY);
    console.log('  - angle:', this.path.angle);
    console.log('[BezierEditMode] First bezierPoint (world):', bezierPoints[0]);

    // Mark path as in edit mode
    (this.path as any).isEditMode = true;

    // Convert bezierPoints from world coordinates to local coordinates
    if (!(this.path as any).bezierPointsAreLocal) {
      const matrix = this.path.calcTransformMatrix();
      const invMatrix = util.invertTransform(matrix);

      bezierPoints.forEach(point => {
        const localAnchor = util.transformPoint(
          new FabricPoint(point.x, point.y),
          invMatrix
        );
        point.x = localAnchor.x;
        point.y = localAnchor.y;

        if (point.controlPoint1) {
          const localCp1 = util.transformPoint(
            new FabricPoint(point.controlPoint1.x, point.controlPoint1.y),
            invMatrix
          );
          point.controlPoint1.x = localCp1.x;
          point.controlPoint1.y = localCp1.y;
        }
        if (point.controlPoint2) {
          const localCp2 = util.transformPoint(
            new FabricPoint(point.controlPoint2.x, point.controlPoint2.y),
            invMatrix
          );
          point.controlPoint2.x = localCp2.x;
          point.controlPoint2.y = localCp2.y;
        }
      });

      (this.path as any).bezierPointsAreLocal = true;
      console.log('[BezierEditMode] Converted to local - first point:', bezierPoints[0]);
    }

    // Disable path selection/dragging while in edit mode
    // Disable caching to prevent clipping issues
    this.path.set({
      selectable: false,
      evented: false,
      objectCaching: false, // Prevents clipping during edit
    });

    // Create anchor handles for all points
    bezierPoints.forEach((point, index) => {
      this.createAnchorHandle(point);
    });

    this.canvas.requestRenderAll();
  }

  /**
   * Deactivate edit mode
   */
  deactivate(): void {
    if (!this.path) return;

    console.log('[BezierEditMode] Deactivating edit mode - cleaning up handles');

    // Remove all handles and guide lines
    this.clearHandles();

    // Clear any active selections that might reference handles
    this.canvas.discardActiveObject();

    // Convert bezierPoints back to world coordinates
    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    if (bezierPoints && bezierPoints.length >= 2) {
      const finalMatrix = this.path.calcTransformMatrix();
      bezierPoints.forEach(point => {
        const worldAnchor = util.transformPoint(
          new FabricPoint(point.x, point.y),
          finalMatrix
        );
        point.x = worldAnchor.x;
        point.y = worldAnchor.y;

        if (point.controlPoint1) {
          const worldCp1 = util.transformPoint(
            new FabricPoint(point.controlPoint1.x, point.controlPoint1.y),
            finalMatrix
          );
          point.controlPoint1.x = worldCp1.x;
          point.controlPoint1.y = worldCp1.y;
        }
        if (point.controlPoint2) {
          const worldCp2 = util.transformPoint(
            new FabricPoint(point.controlPoint2.x, point.controlPoint2.y),
            finalMatrix
          );
          point.controlPoint2.x = worldCp2.x;
          point.controlPoint2.y = worldCp2.y;
        }
      });

      (this.path as any).bezierPointsAreLocal = false;
    }

    // Mark path as not in edit mode
    (this.path as any).isEditMode = false;
    (this.path as any).selectedAnchorId = null;

    // Re-enable path selection and caching
    this.path.set({
      selectable: true,
      evented: true,
      objectCaching: true,
      dirty: true,
    });

    // Force bounding box recalculation
    this.path.setCoords();

    this.path = null;
    this.selectedAnchorId = null;
    this.hoverAnchorId = null;

    // Final cleanup: remove any objects with the edit mode flags
    const objectsToRemove = this.canvas.getObjects().filter((obj: any) =>
      obj.isAnchorHandle || obj.isControlHandle || obj.isGuideLine
    );
    objectsToRemove.forEach(obj => this.canvas.remove(obj));

    console.log('[BezierEditMode] Removed', objectsToRemove.length, 'lingering edit mode objects');

    // Force multiple render passes to ensure cleanup
    this.canvas.requestRenderAll();
    setTimeout(() => this.canvas.requestRenderAll(), 0);
  }

  /**
   * Create visual anchor handle for a bezier point
   */
  private createAnchorHandle(point: BezierPoint): void {
    const worldPoint = this.getWorldPoint(point);
    const isSmooth = point.type === 'smooth';

    console.log('[createAnchorHandle] Creating handle at world position:', worldPoint.x, worldPoint.y);

    let handle: Circle | Rect;

    if (isSmooth) {
      // Smooth points are circles
      handle = new Circle({
        left: worldPoint.x,
        top: worldPoint.y,
        radius: this.config.anchorRadius,
        fill: this.config.smoothColor,
        stroke: '#ffffff',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: false,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        lockSkewingX: true,
        lockSkewingY: true,
        hoverCursor: 'move',
      });
    } else {
      // Corner points are squares
      const size = this.config.anchorRadius * 2;
      handle = new Rect({
        left: worldPoint.x,
        top: worldPoint.y,
        width: size,
        height: size,
        fill: this.config.cornerColor,
        stroke: '#ffffff',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: false,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        lockSkewingX: true,
        lockSkewingY: true,
        hoverCursor: 'move',
      });
    }

    // Completely hide all selection controls
    handle.setControlsVisibility({
      tl: false,
      tr: false,
      br: false,
      bl: false,
      ml: false,
      mt: false,
      mr: false,
      mb: false,
      mtr: false,
    });

    // Flag and store metadata
    (handle as any).isAnchorHandle = true;
    (handle as any).pointId = point.id;
    (handle as any).excludeFromExport = true;

    // Attach event handlers
    handle.on('mousedown', () => this.handleAnchorClick(point.id));
    handle.on('moving', () => this.handleAnchorDrag(point.id));
    handle.on('mouseover', () => this.handleAnchorHover(point.id));
    handle.on('mouseout', () => this.handleAnchorHoverOut());

    this.anchorHandles.set(point.id, handle);
    this.canvas.add(handle);
  }

  /**
   * Create control handles for a selected anchor point
   */
  private createControlHandles(pointId: string): void {
    if (!this.path) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    const point = bezierPoints.find(p => p.id === pointId);
    if (!point) return;

    const worldPoint = this.getWorldPoint(point);

    // Create handle for controlPoint1 (incoming)
    if (point.controlPoint1) {
      const worldCp1 = this.getWorldPoint(point.controlPoint1);
      const handle1 = this.createControlHandle(worldCp1, pointId, 1);
      this.controlHandles.set(`${pointId}-cp1`, handle1);
      this.canvas.add(handle1);

      // Create guide line
      const guideLine1 = this.createGuideLine(worldPoint, worldCp1);
      this.guideLines.set(`${pointId}-line1`, guideLine1);
      this.canvas.add(guideLine1);
    }

    // Create handle for controlPoint2 (outgoing)
    if (point.controlPoint2) {
      const worldCp2 = this.getWorldPoint(point.controlPoint2);
      const handle2 = this.createControlHandle(worldCp2, pointId, 2);
      this.controlHandles.set(`${pointId}-cp2`, handle2);
      this.canvas.add(handle2);

      // Create guide line
      const guideLine2 = this.createGuideLine(worldPoint, worldCp2);
      this.guideLines.set(`${pointId}-line2`, guideLine2);
      this.canvas.add(guideLine2);
    }
  }

  /**
   * Create a single control handle
   */
  private createControlHandle(worldPoint: Point, pointId: string, handleIndex: number): Circle {
    const handle = new Circle({
      left: worldPoint.x,
      top: worldPoint.y,
      radius: this.config.controlHandleRadius,
      fill: '#ffffff',
      stroke: this.config.guideLineColor,
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: false,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      lockSkewingX: true,
      lockSkewingY: true,
      hoverCursor: 'move',
    });

    // Completely hide all selection controls
    handle.setControlsVisibility({
      tl: false,
      tr: false,
      br: false,
      bl: false,
      ml: false,
      mt: false,
      mr: false,
      mb: false,
      mtr: false,
    });

    (handle as any).isControlHandle = true;
    (handle as any).pointId = pointId;
    (handle as any).handleIndex = handleIndex;
    (handle as any).excludeFromExport = true;

    handle.on('moving', () => this.handleControlDrag(pointId, handleIndex));

    return handle;
  }

  /**
   * Create guide line connecting anchor to control handle
   */
  private createGuideLine(start: Point, end: Point): FabricLine {
    const line = new FabricLine([start.x, start.y, end.x, end.y], {
      stroke: this.config.guideLineColor,
      strokeWidth: 1,
      strokeDashArray: this.config.guideLineDash,
      selectable: false,
      evented: false,
    });

    (line as any).isGuideLine = true;
    (line as any).excludeFromExport = true;

    return line;
  }

  /**
   * Handle anchor point click
   */
  private handleAnchorClick(pointId: string): void {
    // If clicking already selected anchor, do nothing
    if (this.selectedAnchorId === pointId) return;

    // Clear previous selection
    if (this.selectedAnchorId) {
      this.deselectAnchor(this.selectedAnchorId);
    }

    // Select new anchor
    this.selectAnchor(pointId);
  }

  /**
   * Select an anchor point
   */
  private selectAnchor(pointId: string): void {
    this.selectedAnchorId = pointId;
    if (this.path) {
      (this.path as any).selectedAnchorId = pointId;
    }

    // Update anchor visual (highlight)
    const handle = this.anchorHandles.get(pointId);
    if (handle) {
      handle.set({
        fill: this.config.selectedColor,
        strokeWidth: 3,
        scaleX: 1.2,
        scaleY: 1.2,
      });
    }

    // Show control handles
    this.createControlHandles(pointId);

    this.canvas.requestRenderAll();
  }

  /**
   * Deselect an anchor point
   */
  private deselectAnchor(pointId: string): void {
    // Restore anchor visual
    const handle = this.anchorHandles.get(pointId);
    if (handle && this.path) {
      const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
      const point = bezierPoints.find(p => p.id === pointId);
      if (point) {
        const color = point.type === 'smooth' ? this.config.smoothColor : this.config.cornerColor;
        handle.set({
          fill: color,
          strokeWidth: 2,
          scaleX: 1,
          scaleY: 1,
        });
      }
    }

    // Remove control handles
    this.clearControlHandles();
  }

  /**
   * Handle anchor point hover
   */
  private handleAnchorHover(pointId: string): void {
    this.hoverAnchorId = pointId;
    // Could add visual feedback here if desired
  }

  /**
   * Handle anchor point hover out
   */
  private handleAnchorHoverOut(): void {
    this.hoverAnchorId = null;
  }

  /**
   * Handle anchor point drag
   */
  private handleAnchorDrag(pointId: string): void {
    if (!this.path) return;

    const handle = this.anchorHandles.get(pointId);
    if (!handle) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    const pointIndex = bezierPoints.findIndex(p => p.id === pointId);
    if (pointIndex === -1) return;

    // Get new position in world coordinates
    const newWorldX = handle.left!;
    const newWorldY = handle.top!;

    // Convert to local coordinates using inverse transform matrix
    const invMatrix = util.invertTransform(this.path.calcTransformMatrix());
    const localPoint = util.transformPoint(
      new FabricPoint(newWorldX, newWorldY),
      invMatrix
    );

    // Update bezier point with local coordinates
    bezierPoints[pointIndex].x = localPoint.x;
    bezierPoints[pointIndex].y = localPoint.y;

    // Rebuild path
    this.rebuildPath();

    // Update control handles if this point is selected
    if (this.selectedAnchorId === pointId) {
      this.updateControlHandles(pointId);
    }

    this.canvas.requestRenderAll();
  }

  /**
   * Handle control handle drag
   */
  private handleControlDrag(pointId: string, handleIndex: number): void {
    if (!this.path) return;

    const handleKey = `${pointId}-cp${handleIndex}`;
    const handle = this.controlHandles.get(handleKey);
    if (!handle) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    const point = bezierPoints.find(p => p.id === pointId);
    if (!point) return;

    // Get new position in world coordinates
    const newWorldX = handle.left!;
    const newWorldY = handle.top!;

    // Convert to local coordinates using inverse transform matrix
    const invMatrix = util.invertTransform(this.path.calcTransformMatrix());
    const localPoint = util.transformPoint(
      new FabricPoint(newWorldX, newWorldY),
      invMatrix
    );

    // Update control point with local coordinates
    if (handleIndex === 1 && point.controlPoint1) {
      point.controlPoint1.x = localPoint.x;
      point.controlPoint1.y = localPoint.y;

      // For smooth points, align opposite handle
      if (point.type === 'smooth' && point.controlPoint2) {
        const aligned = alignControlHandles(
          { x: point.x, y: point.y },
          point.controlPoint1,
          point.controlPoint2,
          true
        );
        point.controlPoint2 = aligned.cp2;

        // Update opposite handle visual (convert local to world for positioning)
        const oppositeHandle = this.controlHandles.get(`${pointId}-cp2`);
        if (oppositeHandle) {
          const worldCp2 = this.getWorldPoint(aligned.cp2);
          oppositeHandle.set({ left: worldCp2.x, top: worldCp2.y });
        }
      }
    } else if (handleIndex === 2 && point.controlPoint2) {
      point.controlPoint2.x = localPoint.x;
      point.controlPoint2.y = localPoint.y;

      // For smooth points, align opposite handle
      if (point.type === 'smooth' && point.controlPoint1) {
        const aligned = alignControlHandles(
          { x: point.x, y: point.y },
          point.controlPoint2,
          point.controlPoint1,
          true
        );
        point.controlPoint1 = aligned.cp2;

        // Update opposite handle visual (convert local to world for positioning)
        const oppositeHandle = this.controlHandles.get(`${pointId}-cp1`);
        if (oppositeHandle) {
          const worldCp1 = this.getWorldPoint(aligned.cp2);
          oppositeHandle.set({ left: worldCp1.x, top: worldCp1.y });
        }
      }
    }

    // Rebuild path
    this.rebuildPath();

    // Update guide lines
    this.updateGuideLines(pointId);

    this.canvas.requestRenderAll();
  }

  /**
   * Update control handles positions
   */
  private updateControlHandles(pointId: string): void {
    if (!this.path) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    const point = bezierPoints.find(p => p.id === pointId);
    if (!point) return;

    const worldPoint = this.getWorldPoint(point);

    // Update cp1 handle
    if (point.controlPoint1) {
      const worldCp1 = this.getWorldPoint(point.controlPoint1);
      const handle1 = this.controlHandles.get(`${pointId}-cp1`);
      if (handle1) {
        handle1.set({ left: worldCp1.x, top: worldCp1.y });
      }
    }

    // Update cp2 handle
    if (point.controlPoint2) {
      const worldCp2 = this.getWorldPoint(point.controlPoint2);
      const handle2 = this.controlHandles.get(`${pointId}-cp2`);
      if (handle2) {
        handle2.set({ left: worldCp2.x, top: worldCp2.y });
      }
    }

    this.updateGuideLines(pointId);
  }

  /**
   * Update guide lines for an anchor point
   */
  private updateGuideLines(pointId: string): void {
    if (!this.path) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    const point = bezierPoints.find(p => p.id === pointId);
    if (!point) return;

    const worldPoint = this.getWorldPoint(point);

    // Update line1
    if (point.controlPoint1) {
      const worldCp1 = this.getWorldPoint(point.controlPoint1);
      const line1 = this.guideLines.get(`${pointId}-line1`);
      if (line1) {
        line1.set({
          x1: worldPoint.x,
          y1: worldPoint.y,
          x2: worldCp1.x,
          y2: worldCp1.y,
        });
        line1.setCoords();
      }
    }

    // Update line2
    if (point.controlPoint2) {
      const worldCp2 = this.getWorldPoint(point.controlPoint2);
      const line2 = this.guideLines.get(`${pointId}-line2`);
      if (line2) {
        line2.set({
          x1: worldPoint.x,
          y1: worldPoint.y,
          x2: worldCp2.x,
          y2: worldCp2.y,
        });
        line2.setCoords();
      }
    }
  }

  /**
   * Normalize the path so bezierPoints start at (0, 0) and adjust path position
   * Called once in activate() to prevent shift on first drag
   */
  private normalizePath(): void {
    if (!this.path) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    if (bezierPoints.length < 2) return;

    // Find bounding box
    let minX = Infinity, minY = Infinity;
    bezierPoints.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      if (point.controlPoint1) {
        minX = Math.min(minX, point.controlPoint1.x);
        minY = Math.min(minY, point.controlPoint1.y);
      }
      if (point.controlPoint2) {
        minX = Math.min(minX, point.controlPoint2.x);
        minY = Math.min(minY, point.controlPoint2.y);
      }
    });

    // If already normalized, skip
    if (minX === 0 && minY === 0) return;

    // Normalize bezierPoints
    bezierPoints.forEach(point => {
      point.x -= minX;
      point.y -= minY;
      if (point.controlPoint1) {
        point.controlPoint1.x -= minX;
        point.controlPoint1.y -= minY;
      }
      if (point.controlPoint2) {
        point.controlPoint2.x -= minX;
        point.controlPoint2.y -= minY;
      }
    });

    // Build normalized path data
    let pathData = `M ${bezierPoints[0].x} ${bezierPoints[0].y}`;
    for (let i = 0; i < bezierPoints.length - 1; i++) {
      const curr = bezierPoints[i];
      const next = bezierPoints[i + 1];
      const cp1 = curr.controlPoint2 || curr;
      const cp2 = next.controlPoint1 || next;
      pathData += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${next.x} ${next.y}`;
    }

    // Transform the offset to world coordinates
    const matrix = this.path.calcTransformMatrix();
    const offsetWorld = util.transformPoint(new FabricPoint(minX, minY), matrix);
    const originWorld = util.transformPoint(new FabricPoint(0, 0), matrix);

    // Update path data and position
    this.path.set({
      path: util.parsePath(pathData),
      left: (this.path.left || 0) + (offsetWorld.x - originWorld.x),
      top: (this.path.top || 0) + (offsetWorld.y - originWorld.y),
      dirty: true,
    });

    this.path.setCoords();
  }

  /**
   * Rebuild the path from bezier points (in local coordinates)
   */
  private rebuildPath(): void {
    if (!this.path) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    if (bezierPoints.length < 2) return;

    console.log('[rebuildPath] BEFORE - left:', this.path.left, 'top:', this.path.top);
    console.log('[rebuildPath] BEFORE - pathOffset:', (this.path as any).pathOffset);
    console.log('[rebuildPath] BezierPoints:', bezierPoints);

    // Build path data from bezierPoints
    let pathData = `M ${bezierPoints[0].x} ${bezierPoints[0].y}`;
    for (let i = 0; i < bezierPoints.length - 1; i++) {
      const curr = bezierPoints[i];
      const next = bezierPoints[i + 1];
      const cp1 = curr.controlPoint2 || curr;
      const cp2 = next.controlPoint1 || next;
      pathData += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${next.x} ${next.y}`;
    }

    console.log('[rebuildPath] Path data:', pathData);

    // Update path with new data
    this.path.set({
      path: util.parsePath(pathData),
      pathOffset: new FabricPoint(0, 0),  // Force to zero - use path data coords directly
      dirty: true,
    });

    this.path.setCoords();

    console.log('[rebuildPath] AFTER - left:', this.path.left, 'top:', this.path.top);
    console.log('[rebuildPath] AFTER - pathOffset:', (this.path as any).pathOffset);

    this.updateAnchorHandles();
    this.canvas.requestRenderAll();
  }

  /**
   * Clear all control handles and guide lines
   */
  private clearControlHandles(): void {
    // Remove control handles
    this.controlHandles.forEach(handle => {
      this.canvas.remove(handle);
    });
    this.controlHandles.clear();

    // Remove guide lines
    this.guideLines.forEach(line => {
      this.canvas.remove(line);
    });
    this.guideLines.clear();

    // Force canvas to update and remove any lingering objects
    this.canvas.renderOnAddRemove = true;
  }

  /**
   * Clear all handles (anchor + control)
   */
  private clearHandles(): void {
    // Remove anchor handles
    this.anchorHandles.forEach(handle => {
      this.canvas.remove(handle);
    });
    this.anchorHandles.clear();

    // Remove control handles and guide lines
    this.clearControlHandles();

    // Force canvas to clean up removed objects
    this.canvas.renderOnAddRemove = true;
  }

  /**
   * Get world coordinates for a point (accounting for path transforms)
   */
  private getWorldPoint(point: Point): Point {
    if (!this.path) return point;

    // Convert from local coordinates to world coordinates using transform matrix
    const matrix = this.path.calcTransformMatrix();
    console.log('[getWorldPoint] Transform matrix:', matrix);
    console.log('[getWorldPoint] Input (local):', point.x, point.y);

    const worldPoint = util.transformPoint(
      new FabricPoint(point.x, point.y),
      matrix
    );

    console.log('[getWorldPoint] Output (world):', worldPoint.x, worldPoint.y);

    return {
      x: worldPoint.x,
      y: worldPoint.y
    };
  }

  /**
   * Update anchor handle positions (called after transform)
   */
  updateAnchorHandles(): void {
    if (!this.path) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];

    bezierPoints.forEach(point => {
      const handle = this.anchorHandles.get(point.id);
      if (handle) {
        const worldPoint = this.getWorldPoint(point);
        handle.set({ left: worldPoint.x, top: worldPoint.y });
        handle.setCoords();
      }
    });
  }

  /**
   * Toggle anchor point type between smooth and corner
   */
  togglePointType(pointId: string): void {
    if (!this.path) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    const point = bezierPoints.find(p => p.id === pointId);
    if (!point) return;

    // Toggle type
    point.type = point.type === 'smooth' ? 'corner' : 'smooth';

    // Update anchor handle visual
    const handle = this.anchorHandles.get(pointId);
    if (handle) {
      // Remove old handle
      this.canvas.remove(handle);
      this.anchorHandles.delete(pointId);

      // Create new handle with correct shape
      this.createAnchorHandle(point);

      // If this point is selected, reselect to show controls
      if (this.selectedAnchorId === pointId) {
        this.selectAnchor(pointId);
      }
    }

    this.canvas.requestRenderAll();
  }

  /**
   * Get the currently selected anchor ID
   */
  getSelectedAnchorId(): string | null {
    return this.selectedAnchorId;
  }

  /**
   * Check if edit mode is active
   */
  isActive(): boolean {
    return this.path !== null;
  }

  /**
   * Add a new anchor point at the clicked position on the path
   */
  addAnchorPoint(x: number, y: number): void {
    if (!this.path) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    if (bezierPoints.length < 2) return;

    // Find closest point on path
    const result = findClosestPointOnPath(x, y, bezierPoints);
    if (!result) return;

    const { segmentIndex, t } = result;

    // Get the segment
    const p0 = bezierPoints[segmentIndex];
    const p1 = bezierPoints[segmentIndex + 1];
    const cp1 = p0.controlPoint2 || p0;
    const cp2 = p1.controlPoint1 || p1;

    // Subdivide the cubic bezier curve at parameter t
    const subdivided = subdivideCubicBezier(t, p0, cp1, cp2, p1);

    // Create new anchor point at the split position
    const newPoint: BezierPoint = {
      x: subdivided.left.p1.x,
      y: subdivided.left.p1.y,
      controlPoint1: subdivided.left.cp2,
      controlPoint2: subdivided.right.cp1,
      type: 'smooth',  // New points default to smooth
      id: uuidv4(),
    };

    // Update control points of surrounding points
    p0.controlPoint2 = subdivided.left.cp1;
    p1.controlPoint1 = subdivided.right.cp2;

    // Insert new point into array
    bezierPoints.splice(segmentIndex + 1, 0, newPoint);

    // Create anchor handle for new point
    this.createAnchorHandle(newPoint);

    // Rebuild path
    this.rebuildPath();

    this.canvas.requestRenderAll();
  }

  /**
   * Delete an anchor point
   */
  deleteAnchorPoint(pointId: string): void {
    if (!this.path) return;

    const bezierPoints = (this.path as any).bezierPoints as BezierPoint[];
    const pointIndex = bezierPoints.findIndex(p => p.id === pointId);

    if (pointIndex === -1) return;

    // Prevent deletion if less than 2 points would remain
    if (bezierPoints.length <= 2) {
      console.warn('Cannot delete - path must have at least 2 points');
      return;
    }

    // If deleting selected point, deselect first
    if (this.selectedAnchorId === pointId) {
      this.deselectAnchor(pointId);
      this.selectedAnchorId = null;
    }

    // Remove anchor handle
    const handle = this.anchorHandles.get(pointId);
    if (handle) {
      this.canvas.remove(handle);
      this.anchorHandles.delete(pointId);
    }

    // Remove the point from array
    const deletedPoint = bezierPoints.splice(pointIndex, 1)[0];

    // Recalculate control points for neighbors
    // This ensures smooth transition after deletion
    if (pointIndex > 0 && pointIndex < bezierPoints.length) {
      const prev = bezierPoints[pointIndex - 1];
      const next = bezierPoints[pointIndex];

      // Average the control points for smooth transition
      if (deletedPoint.controlPoint1 && deletedPoint.controlPoint2) {
        prev.controlPoint2 = deletedPoint.controlPoint1;
        next.controlPoint1 = deletedPoint.controlPoint2;
      }
    }

    // Rebuild path
    this.rebuildPath();

    this.canvas.requestRenderAll();
  }

  /**
   * Handle click on path curve to add new point
   */
  handlePathClick(x: number, y: number): void {
    // Only add point if no anchor is selected
    // (clicking an anchor selects it instead)
    if (!this.hoverAnchorId) {
      this.addAnchorPoint(x, y);
    }
  }
}
