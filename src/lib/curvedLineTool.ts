import { Canvas, Path, Circle, Line, Group, util, Point as FabricPoint } from "fabric";

export type MarkerType = 'none' | 'arrow' | 'back-arrow' | 'diamond' | 'circle' | 'dot' | 'bar' | 'block';
export type LineStyleType = 'solid' | 'dashed' | 'dotted';

export interface Point {
  x: number;
  y: number;
}

export interface CurvedLineOptions {
  startMarker?: MarkerType;
  endMarker?: MarkerType;
  lineStyle?: LineStyleType;
  strokeWidth?: number;
  strokeColor?: string;
  snap?: boolean;
  gridSize?: number;
  gradientConfig?: any; // LineGradientConfig from effects.ts
}

export class CurvedLineTool {
  private canvas: Canvas;
  private options: Required<CurvedLineOptions>;
  private startPoint: Point | null = null;
  private previewPath: Path | null = null;
  private previewMarkers: Group[] = [];
  private controlPoint: Point | null = null;

  constructor(canvas: Canvas, options: CurvedLineOptions = {}) {
    this.canvas = canvas;
    this.options = {
      startMarker: options.startMarker || 'none',
      endMarker: options.endMarker || 'none',
      lineStyle: options.lineStyle || 'solid',
      strokeWidth: options.strokeWidth || 2,
      strokeColor: options.strokeColor || '#000000',
      snap: options.snap !== undefined ? options.snap : true,
      gridSize: options.gridSize || 20,
      gradientConfig: options.gradientConfig || undefined,
    };
  }

  private disableObjectInteraction(): void {
    this.canvas.skipTargetFind = true;
    this.canvas.selection = false;
    this.canvas.forEachObject((obj) => {
      if (!(obj as any).isTemp && !(obj as any).isControlHandle && !(obj as any).isHandleLine) {
        obj.set({
          selectable: false,
          evented: false
        });
      }
    });
    this.canvas.renderAll();
  }

  private enableObjectInteraction(): void {
    this.canvas.skipTargetFind = false;
    this.canvas.selection = true;
    this.canvas.forEachObject((obj) => {
      if (!(obj as any).isTemp && !(obj as any).isControlHandle && !(obj as any).isHandleLine) {
        obj.set({
          selectable: true,
          evented: true
        });
      }
    });
    this.canvas.renderAll();
  }

  start(): void {
    this.startPoint = null;
    this.controlPoint = null;
    this.cleanup();
    this.disableObjectInteraction();
  }

  setStartPoint(x: number, y: number): void {
    const snapped = this.snapToGrid({ x, y });
    this.startPoint = snapped;
    
    // Show start marker preview
    if (this.options.startMarker !== 'none') {
      const marker = this.createMarkerPreview(snapped.x, snapped.y, 0);
      this.previewMarkers.push(marker);
      this.canvas.add(marker);
    }
    
    this.canvas.renderAll();
  }

  updatePreview(x: number, y: number): void {
    if (!this.startPoint) return;

    const snapped = this.snapToGrid({ x, y });
    
    // Calculate auto-positioned control point
    const control = this.calculateControlPoint(this.startPoint, snapped);
    
    // Create preview path
    const pathData = `M ${this.startPoint.x} ${this.startPoint.y} Q ${control.x} ${control.y} ${snapped.x} ${snapped.y}`;
    
    if (this.previewPath) {
      this.canvas.remove(this.previewPath);
    }
    
    this.previewPath = new Path(pathData, {
      stroke: '#0D9488',
      strokeWidth: this.options.strokeWidth,
      fill: '',
      selectable: false,
      evented: false,
      strokeDashArray: this.getStrokeDashArray(),
    });
    
    this.canvas.add(this.previewPath);
    
    // Remove old end marker preview
    if (this.previewMarkers.length > 1) {
      this.canvas.remove(this.previewMarkers[1]);
      this.previewMarkers.pop();
    }
    
    // Show end marker preview
    if (this.options.endMarker !== 'none') {
      const angle = this.calculateEndAngle(this.startPoint, control, snapped);
      const marker = this.createMarkerPreview(snapped.x, snapped.y, angle);
      this.previewMarkers.push(marker);
      this.canvas.add(marker);
    }
    
    this.canvas.renderAll();
  }

  setEndPoint(x: number, y: number): Group | null {
    if (!this.startPoint) return null;

    const snapped = this.snapToGrid({ x, y });
    this.controlPoint = this.calculateControlPoint(this.startPoint, snapped);
    
    return this.finish(snapped);
  }

  private finish(endPoint: Point): Group | null {
    if (!this.startPoint || !this.controlPoint) return null;

    this.cleanup();

    // Create the curved path
    const pathData = `M ${this.startPoint.x} ${this.startPoint.y} Q ${this.controlPoint.x} ${this.controlPoint.y} ${endPoint.x} ${endPoint.y}`;
    
    const curvePath = new Path(pathData, {
      stroke: this.options.strokeColor,
      strokeWidth: this.options.strokeWidth,
      fill: '',
      strokeDashArray: this.getStrokeDashArray(),
    });

    const elements: any[] = [curvePath];

    // Create start marker and store reference
    let startMarkerRef: Group | null = null;
    if (this.options.startMarker !== 'none') {
      const angle = this.calculateStartAngle(this.startPoint, this.controlPoint, endPoint);
      const marker = this.createMarker(this.startPoint.x, this.startPoint.y, angle, this.options.startMarker);
      if (marker) {
        elements.push(marker);
        startMarkerRef = marker;
      }
    }

    // Create end marker and store reference
    let endMarkerRef: Group | null = null;
    if (this.options.endMarker !== 'none') {
      const angle = this.calculateEndAngle(this.startPoint, this.controlPoint, endPoint);
      const marker = this.createMarker(endPoint.x, endPoint.y, angle, this.options.endMarker);
      if (marker) {
        elements.push(marker);
        endMarkerRef = marker;
      }
    }

    // Create control handle
    const controlHandle = this.createControlHandle(this.controlPoint.x, this.controlPoint.y);
    const [line1, line2] = this.createHandleLines(this.startPoint, this.controlPoint, endPoint);

    // Create group
    const group = new Group(elements, {
      selectable: true,
      hasControls: true,
      subTargetCheck: false, // Prevent selecting individual marker elements
    });

    // Store custom properties - ensuring these are serialized
    (group as any).isCurvedLine = true;
    (group as any).curvedLineStart = { x: this.startPoint.x, y: this.startPoint.y };
    (group as any).curvedLineEnd = { x: endPoint.x, y: endPoint.y };
    (group as any).curvedLineControlPoint = { x: this.controlPoint.x, y: this.controlPoint.y };
    (group as any).controlHandle = controlHandle;
    (group as any).handleLines = [line1, line2];
    (group as any).mainPath = curvePath;
    (group as any).startMarker = startMarkerRef;
    (group as any).endMarker = endMarkerRef;
    (group as any).startMarkerType = this.options.startMarker;
    (group as any).endMarkerType = this.options.endMarker;
    (group as any).markerOptions = {
      startMarker: this.options.startMarker,
      endMarker: this.options.endMarker,
      lineStyle: this.options.lineStyle,
    };
    (group as any).curvedLineVersion = 2; // Version for migration tracking
    
    // Store local coordinates for transform sync
    const inv = util.invertTransform(group.calcTransformMatrix());
    (group as any).curvedLocalStart = util.transformPoint(new FabricPoint(this.startPoint.x, this.startPoint.y), inv);
    (group as any).curvedLocalEnd = util.transformPoint(new FabricPoint(endPoint.x, endPoint.y), inv);
    (group as any).curvedLocalControl = util.transformPoint(new FabricPoint(this.controlPoint.x, this.controlPoint.y), inv);

    // Attach transform sync to main group
    attachCurvedLineTransformSync(this.canvas, group);

    // Add control handle and lines to canvas (initialize as hidden)
    controlHandle.visible = false;
    line1.visible = false;
    line2.visible = false;
    this.canvas.add(line1, line2, controlHandle);

    // Setup control handle drag behavior
    this.setupControlHandleDrag(group, controlHandle, line1, line2);

    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.enableObjectInteraction();
    this.canvas.renderAll();

    return group;
  }

  cancel(): void {
    this.cleanup();
    this.enableObjectInteraction();
    this.startPoint = null;
    this.controlPoint = null;
  }

  private cleanup(): void {
    if (this.previewPath) {
      this.canvas.remove(this.previewPath);
      this.previewPath = null;
    }
    
    this.previewMarkers.forEach(marker => this.canvas.remove(marker));
    this.previewMarkers = [];
    
    this.canvas.renderAll();
  }

  private snapToGrid(point: Point): Point {
    if (!this.options.snap) return point;
    
    return {
      x: Math.round(point.x / this.options.gridSize) * this.options.gridSize,
      y: Math.round(point.y / this.options.gridSize) * this.options.gridSize,
    };
  }

  private calculateControlPoint(start: Point, end: Point): Point {
    // Calculate midpoint
    const midpoint = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };

    // Calculate perpendicular vector
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return midpoint;

    const perpX = -dy / length;
    const perpY = dx / length;

    // Offset by 30% of line length
    const offset = length * 0.3;

    return {
      x: midpoint.x + perpX * offset,
      y: midpoint.y + perpY * offset,
    };
  }

  private calculateStartAngle(start: Point, control: Point, end: Point): number {
    // Tangent at start (t=0): derivative = 2(control - start)
    const tangentX = 2 * (control.x - start.x);
    const tangentY = 2 * (control.y - start.y);
    return Math.atan2(tangentY, tangentX) * (180 / Math.PI);
  }

  private calculateEndAngle(start: Point, control: Point, end: Point): number {
    // Tangent at end (t=1): derivative = 2(end - control)
    const tangentX = 2 * (end.x - control.x);
    const tangentY = 2 * (end.y - control.y);
    return Math.atan2(tangentY, tangentX) * (180 / Math.PI);
  }

  private createMarker(x: number, y: number, angle: number, type: MarkerType): Group | null {
    if (type === 'none') return null;

    const size = 12;
    let marker: any;

    switch (type) {
      case 'arrow':
        marker = new Path(`M 0 0 L ${-size} ${-size/2} L ${-size} ${size/2} Z`, {
          fill: this.options.strokeColor,
          stroke: this.options.strokeColor,
          strokeWidth: 1,
        });
        break;
      
      case 'circle':
        marker = new Circle({
          radius: size / 2,
          fill: 'transparent',
          stroke: this.options.strokeColor,
          strokeWidth: this.options.strokeWidth,
        });
        break;
      
      case 'diamond':
        marker = new Path(`M 0 0 L ${-size/2} ${-size/2} L ${-size} 0 L ${-size/2} ${size/2} Z`, {
          fill: 'transparent',
          stroke: this.options.strokeColor,
          strokeWidth: this.options.strokeWidth,
        });
        break;
      
      case 'dot':
        marker = new Circle({
          radius: size / 3,
          fill: this.options.strokeColor,
          stroke: this.options.strokeColor,
          strokeWidth: 1,
        });
        break;
      
      case 'bar':
        marker = new Path(`M 0 ${-size/2} L 0 ${size/2}`, {
          fill: 'transparent',
          stroke: this.options.strokeColor,
          strokeWidth: 3,
          strokeLineCap: 'round',
        });
        break;
      
      case 'block':
        marker = new Path(`M ${-size/2} ${-size/2} L ${size/2} ${-size/2} L ${size/2} ${size/2} L ${-size/2} ${size/2} Z`, {
          fill: this.options.strokeColor,
          stroke: this.options.strokeColor,
          strokeWidth: 1,
        });
        break;
      
      case 'back-arrow':
        marker = new Path(`M 0 0 L ${size} ${-size/2} L ${size} ${size/2} Z`, {
          fill: this.options.strokeColor,
          stroke: this.options.strokeColor,
          strokeWidth: 1,
        });
        break;
      
      default:
        return null;
    }

    const group = new Group([marker], {
      left: x,
      top: y,
      originX: 'center',
      originY: 'center',
      angle: angle,
    });

    return group;
  }

  private createMarkerPreview(x: number, y: number, angle: number): Group {
    const marker = new Circle({
      radius: 6,
      fill: '#0D9488',
      stroke: '#ffffff',
      strokeWidth: 2,
    });

    return new Group([marker], {
      left: x,
      top: y,
      originX: 'center',
      originY: 'center',
      angle: angle,
      selectable: false,
      evented: false,
    });
  }

  private createControlHandle(x: number, y: number): Circle {
    const handle = new Circle({
      left: x,
      top: y,
      radius: 8,
      fill: '#10b981',
      stroke: '#ffffff',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'move',
    });

    (handle as any).isControlHandle = true;
    return handle;
  }

  private createHandleLines(start: Point, control: Point, end: Point): [Line, Line] {
    const line1 = new Line([start.x, start.y, control.x, control.y], {
      stroke: '#10b981',
      strokeWidth: 1,
      strokeDashArray: [5, 3],
      selectable: false,
      evented: false,
    });

    const line2 = new Line([control.x, control.y, end.x, end.y], {
      stroke: '#10b981',
      strokeWidth: 1,
      strokeDashArray: [5, 3],
      selectable: false,
      evented: false,
    });

    (line1 as any).isHandleLine = true;
    (line2 as any).isHandleLine = true;

    return [line1, line2];
  }

  private setupControlHandleDrag(group: Group, handle: Circle, line1: Line, line2: Line): void {
    handle.on('moving', () => {
      const curveData = group as any;
      const start = curveData.curvedLineStart;
      const end = curveData.curvedLineEnd;
      const newControl = { x: handle.left!, y: handle.top! };

      // Update control point in group data
      curveData.curvedLineControlPoint = newControl;

      // Update handle lines
      line1.set({
        x1: start.x,
        y1: start.y,
        x2: newControl.x,
        y2: newControl.y,
      });

      line2.set({
        x1: newControl.x,
        y1: newControl.y,
        x2: end.x,
        y2: end.y,
      });

      // Update the main curve path
      const pathData = `M ${start.x} ${start.y} Q ${newControl.x} ${newControl.y} ${end.x} ${end.y}`;
      const mainPath = curveData.mainPath as Path;
      
      // Update the path in the group
      const objects = group.getObjects();
      const pathIndex = objects.indexOf(mainPath);
      if (pathIndex !== -1) {
        const newPath = new Path(pathData, {
          stroke: mainPath.stroke,
          strokeWidth: mainPath.strokeWidth,
          fill: '',
          strokeDashArray: mainPath.strokeDashArray,
          strokeUniform: true,
        });
        
        group.remove(mainPath);
        group.insertAt(pathIndex, newPath);
        curveData.mainPath = newPath;
      }

      // Force group to recalculate bounds and coordinates
      group.setCoords();

      // Recompute inverse transform with current group matrix
      const inv = util.invertTransform(group.calcTransformMatrix());
      
      // Recompute all three local positions using world coordinates
      curveData.curvedLocalStart = util.transformPoint(new FabricPoint(start.x, start.y), inv);
      curveData.curvedLocalEnd = util.transformPoint(new FabricPoint(end.x, end.y), inv);
      curveData.curvedLocalControl = util.transformPoint(new FabricPoint(newControl.x, newControl.y), inv);

      // Update marker positions and angles using local coordinates
      const localStart = curveData.curvedLocalStart;
      const localEnd = curveData.curvedLocalEnd;
      const localControl = curveData.curvedLocalControl;

      if (localStart && localEnd && localControl) {
        const scaleX = group.scaleX || 1;
        const scaleY = group.scaleY || 1;

        if (curveData.startMarker) {
          const startAngle = this.calculateStartAngle(localStart, localControl, localEnd);
          curveData.startMarker.set({
            left: localStart.x,
            top: localStart.y,
            angle: startAngle,
            scaleX: 1 / scaleX,
            scaleY: 1 / scaleY,
          });
        }

        if (curveData.endMarker) {
          const endAngle = this.calculateEndAngle(localStart, localControl, localEnd);
          curveData.endMarker.set({
            left: localEnd.x,
            top: localEnd.y,
            angle: endAngle,
            scaleX: 1 / scaleX,
            scaleY: 1 / scaleY,
          });
        }
      }

      this.canvas.renderAll();
    });
  }

  private getStrokeDashArray(): number[] | undefined {
    switch (this.options.lineStyle) {
      case 'dashed':
        return [10, 5];
      case 'dotted':
        return [2, 4];
      default:
        return undefined;
    }
  }
}

/**
 * Helper: Detect if an object looks like an orphan control handle by visual appearance
 */
function looksLikeOrphanHandle(obj: any): boolean {
  // Green circle handle
  if (obj.type === 'circle' && 
      obj.radius >= 7 && obj.radius <= 9 &&
      (obj.fill === '#10b981' || obj.fill === 'rgb(16, 185, 129)') &&
      (obj.stroke === '#ffffff' || obj.stroke === 'rgb(255, 255, 255)')) {
    return true;
  }
  
  // Green dashed line
  if (obj.type === 'line' &&
      (obj.stroke === '#10b981' || obj.stroke === 'rgb(16, 185, 129)') &&
      obj.strokeDashArray && obj.strokeDashArray.length > 0) {
    return true;
  }
  
  return false;
}

/**
 * Cleanup all orphan handles and guide lines from canvas.
 * Removes objects with transient flags OR objects that visually match handle/guide appearance.
 */
export function cleanupOrphanHandles(canvas: Canvas): void {
  const toRemove: any[] = [];
  
  canvas.getObjects().forEach((obj) => {
    const objData = obj as any;
    
    // Remove by flag
    if (objData.isControlHandle || 
        objData.isHandleLine || 
        objData.isGuideLine ||
        objData.isPortIndicator ||
        objData.isFeedback) {
      toRemove.push(obj);
      return;
    }
    
    // Remove by visual appearance (for legacy data without flags)
    if (looksLikeOrphanHandle(objData)) {
      toRemove.push(obj);
    }
  });
  
  toRemove.forEach(obj => canvas.remove(obj));
  
  if (toRemove.length > 0) {
    console.log(`Cleaned up ${toRemove.length} orphan handle(s)`);
  }
}

/**
 * Derive control point coordinates from mainPath geometry and group transform.
 * This ensures accurate positioning even after the group has been moved/scaled.
 */
function deriveControlPointFromPath(group: Group, mainPath: Path): Point | null {
  try {
    const pathData = mainPath.path;
    if (!pathData || pathData.length < 2) return null;
    
    // Extract Q command for quadratic Bezier: ['Q', cx, cy, ex, ey]
    let controlX = 0, controlY = 0;
    
    for (const command of pathData) {
      if (command[0] === 'Q' && command.length >= 5) {
        controlX = command[1] as number;
        controlY = command[2] as number;
        break;
      }
    }
    
    if (controlX === 0 && controlY === 0) return null;
    
    // Convert path-local coordinates to world coordinates
    const localPoint = new FabricPoint(controlX, controlY);
    const worldPoint = util.transformPoint(localPoint, group.calcTransformMatrix());
    
    return { x: worldPoint.x, y: worldPoint.y };
  } catch (error) {
    console.warn('Failed to derive control point from path:', error);
    return null;
  }
}

/**
 * Reconnect all curved lines on the canvas after loading from JSON.
 * This recreates control handles, guide lines, and event handlers using live path geometry.
 */
export function reconnectCurvedLines(canvas: Canvas): void {
  canvas.getObjects().forEach((obj) => {
    const curveData = obj as any;
    
    // Only process curved line groups
    if (!curveData.isCurvedLine) return;
    
    // Skip if already has a control handle (shouldn't happen after cleanup)
    if (curveData.controlHandle && canvas.contains(curveData.controlHandle)) return;
    
    const group = obj as Group;
    const mainPath = curveData.mainPath as Path;
    
    if (!mainPath) {
      console.warn('Curved line missing mainPath, skipping reconnect');
      return;
    }
    
    // Derive control point from path geometry (more reliable than stored coordinates)
    const derivedControl = deriveControlPointFromPath(group, mainPath);
    let controlPoint = derivedControl;
    
    // Fallback to stored coordinates if derivation fails
    if (!controlPoint) {
      controlPoint = curveData.curvedLineControlPoint;
      if (!controlPoint) {
        console.warn('Curved line missing control point data, skipping reconnect');
        return;
      }
    }
    
    // Update stored coordinate to match derived position
    curveData.curvedLineControlPoint = controlPoint;
    
    // Derive start/end from path or use stored
    let start = curveData.curvedLineStart;
    let end = curveData.curvedLineEnd;
    
    // Try to extract from path if not stored
    if ((!start || !end) && mainPath.path && mainPath.path.length >= 2) {
      try {
        const pathData = mainPath.path;
        // M command: ['M', x, y]
        if (pathData[0][0] === 'M') {
          const localStart = new FabricPoint(pathData[0][1] as number, pathData[0][2] as number);
          const worldStart = util.transformPoint(localStart, group.calcTransformMatrix());
          start = { x: worldStart.x, y: worldStart.y };
        }
        
        // Find Q command end point
        for (const command of pathData) {
          if (command[0] === 'Q' && command.length >= 5) {
            const localEnd = new FabricPoint(command[3] as number, command[4] as number);
            const worldEnd = util.transformPoint(localEnd, group.calcTransformMatrix());
            end = { x: worldEnd.x, y: worldEnd.y };
            break;
          }
        }
      } catch (error) {
        console.warn('Failed to derive start/end from path:', error);
      }
    }
    
    if (!start || !end) {
      console.warn('Curved line missing start/end data, skipping reconnect');
      return;
    }
    
    // Update stored coordinates
    curveData.curvedLineStart = start;
    curveData.curvedLineEnd = end;
    
    // Recompute local coordinates with current transform
    const inv = util.invertTransform(group.calcTransformMatrix());
    curveData.curvedLocalStart = util.transformPoint(new FabricPoint(start.x, start.y), inv);
    curveData.curvedLocalEnd = util.transformPoint(new FabricPoint(end.x, end.y), inv);
    curveData.curvedLocalControl = util.transformPoint(new FabricPoint(controlPoint.x, controlPoint.y), inv);
    
    // Create control handle
    const controlHandle = new Circle({
      left: controlPoint.x,
      top: controlPoint.y,
      radius: 8,
      fill: '#10b981',
      stroke: '#ffffff',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'move',
      visible: false, // Start hidden
    });
    (controlHandle as any).isControlHandle = true;
    
    // Create guide lines
    const line1 = new Line([start.x, start.y, controlPoint.x, controlPoint.y], {
      stroke: '#10b981',
      strokeWidth: 1,
      strokeDashArray: [5, 3],
      selectable: false,
      evented: false,
      visible: false,
    });
    (line1 as any).isHandleLine = true;
    
    const line2 = new Line([controlPoint.x, controlPoint.y, end.x, end.y], {
      stroke: '#10b981',
      strokeWidth: 1,
      strokeDashArray: [5, 3],
      selectable: false,
      evented: false,
      visible: false,
    });
    (line2 as any).isHandleLine = true;
    
    // Store references in the group
    curveData.controlHandle = controlHandle;
    curveData.handleLines = [line1, line2];
    
    // Add to canvas
    canvas.add(line1, line2, controlHandle);
    
    // Re-attach event handler for dragging (same logic as setupControlHandleDrag)
    controlHandle.on('moving', () => {
      const newControl = { x: controlHandle.left!, y: controlHandle.top! };
      curveData.curvedLineControlPoint = newControl;
      
      // Update handle lines
      line1.set({
        x1: start.x,
        y1: start.y,
        x2: newControl.x,
        y2: newControl.y,
      });
      
      line2.set({
        x1: newControl.x,
        y1: newControl.y,
        x2: end.x,
        y2: end.y,
      });
      
      // Update the main curve path
      const pathData = `M ${start.x} ${start.y} Q ${newControl.x} ${newControl.y} ${end.x} ${end.y}`;
      
      if (mainPath) {
        const objects = group.getObjects();
        const pathIndex = objects.indexOf(mainPath);
        
        if (pathIndex !== -1) {
          const newPath = new Path(pathData, {
            stroke: mainPath.stroke,
            strokeWidth: mainPath.strokeWidth,
            fill: '',
            strokeDashArray: mainPath.strokeDashArray,
            strokeUniform: true,
          });
          
          group.remove(mainPath);
          group.insertAt(pathIndex, newPath);
          curveData.mainPath = newPath;
        }
      }
      
      // Force group to recalculate bounds and coordinates
      group.setCoords();
      
      // Recompute inverse transform with current group matrix
      const inv = util.invertTransform(group.calcTransformMatrix());
      curveData.curvedLocalStart = util.transformPoint(new FabricPoint(start.x, start.y), inv);
      curveData.curvedLocalEnd = util.transformPoint(new FabricPoint(end.x, end.y), inv);
      curveData.curvedLocalControl = util.transformPoint(new FabricPoint(newControl.x, newControl.y), inv);
      
      canvas.requestRenderAll();
    });

    // Re-attach transform sync
    attachCurvedLineTransformSync(canvas, group);
  });

  canvas.requestRenderAll();
}

/**
 * Calculate start angle for curved line marker
 */
function calculateCurveStartAngle(start: Point, control: Point, end: Point): number {
  // Tangent at start (t=0): derivative = 2(control - start)
  const tangentX = 2 * (control.x - start.x);
  const tangentY = 2 * (control.y - start.y);
  return Math.atan2(tangentY, tangentX) * (180 / Math.PI);
}

/**
 * Calculate end angle for curved line marker
 */
function calculateCurveEndAngle(start: Point, control: Point, end: Point): number {
  // Tangent at end (t=1): derivative = 2(end - control)
  const tangentX = 2 * (end.x - control.x);
  const tangentY = 2 * (end.y - control.y);
  return Math.atan2(tangentY, tangentX) * (180 / Math.PI);
}

/**
 * Attach transform sync to keep markers, control handles, and guide lines synchronized
 */
export function attachCurvedLineTransformSync(canvas: Canvas, group: Group): void {
  const startMarker = (group as any).startMarker as Group | null;
  const endMarker = (group as any).endMarker as Group | null;
  const startMarkerType = (group as any).startMarkerType as string;
  const endMarkerType = (group as any).endMarkerType as string;
  const controlHandle = (group as any).controlHandle as Circle | null;
  const handleLines = (group as any).handleLines as [Line, Line] | null;

  const getMarkerOffset = (markerType: string): number => {
    switch (markerType) {
      case 'arrow': return -12;
      case 'back-arrow': return 12;
      case 'dot': return 4;
      case 'circle': return 6;
      case 'diamond': return 6;
      case 'block': return 6;
      case 'bar': return 0;
      default: return 0;
    }
  };

  const syncMarkers = () => {
    const localStart = (group as any).curvedLocalStart;
    const localEnd = (group as any).curvedLocalEnd;
    const localControl = (group as any).curvedLocalControl;

    if (!localStart || !localEnd || !localControl) return;

    const scaleX = group.scaleX || 1;
    const scaleY = group.scaleY || 1;
    const matrix = group.calcTransformMatrix();

    // Calculate world coordinates from local coordinates
    const worldStart = util.transformPoint(new FabricPoint(localStart.x, localStart.y), matrix);
    const worldEnd = util.transformPoint(new FabricPoint(localEnd.x, localEnd.y), matrix);
    const worldControl = util.transformPoint(new FabricPoint(localControl.x, localControl.y), matrix);

    if (startMarker) {
      const startAngle = calculateCurveStartAngle(localStart, localControl, localEnd);

      // Calculate direction vector from control to start
      const dx = localStart.x - localControl.x;
      const dy = localStart.y - localControl.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Apply offset along the tangent direction
      const offset = getMarkerOffset(startMarkerType);
      const offsetX = distance > 0 ? (dx / distance) * offset : 0;
      const offsetY = distance > 0 ? (dy / distance) * offset : 0;

      startMarker.set({
        left: localStart.x + offsetX,
        top: localStart.y + offsetY,
        angle: startAngle,
        scaleX: 1 / scaleX,
        scaleY: 1 / scaleY,
      });
    }

    if (endMarker) {
      const endAngle = calculateCurveEndAngle(localStart, localControl, localEnd);

      // Calculate direction vector from control to end
      const dx = localEnd.x - localControl.x;
      const dy = localEnd.y - localControl.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Apply offset along the tangent direction
      const offset = getMarkerOffset(endMarkerType);
      const offsetX = distance > 0 ? (dx / distance) * offset : 0;
      const offsetY = distance > 0 ? (dy / distance) * offset : 0;

      endMarker.set({
        left: localEnd.x + offsetX,
        top: localEnd.y + offsetY,
        angle: endAngle,
        scaleX: 1 / scaleX,
        scaleY: 1 / scaleY,
      });
    }

    // Synchronize control handle position
    if (controlHandle) {
      controlHandle.set({
        left: worldControl.x,
        top: worldControl.y,
      });
      controlHandle.setCoords();
    }

    // Synchronize guide lines
    if (handleLines && handleLines.length === 2) {
      handleLines[0].set({
        x1: worldStart.x,
        y1: worldStart.y,
        x2: worldControl.x,
        y2: worldControl.y,
      });

      handleLines[1].set({
        x1: worldControl.x,
        y1: worldControl.y,
        x2: worldEnd.x,
        y2: worldEnd.y,
      });

      handleLines[0].setCoords();
      handleLines[1].setCoords();
    }

    // Update world coordinates stored on group (critical for handle dragging)
    (group as any).curvedLineStart = { x: worldStart.x, y: worldStart.y };
    (group as any).curvedLineEnd = { x: worldEnd.x, y: worldEnd.y };
    (group as any).curvedLineControlPoint = { x: worldControl.x, y: worldControl.y };

    group.setCoords();
    canvas.requestRenderAll();
  };

  // Sync on all transform events
  group.on('scaling', syncMarkers);
  group.on('rotating', syncMarkers);
  group.on('moving', syncMarkers);
  group.on('modified', syncMarkers);

  // Initialize
  syncMarkers();
}
