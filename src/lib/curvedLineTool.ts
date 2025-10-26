import { Canvas, Path, Circle, Line, Group } from "fabric";

export type MarkerType = 'none' | 'arrow' | 'diamond' | 'circle' | 'dot';
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
    };
  }

  start(): void {
    this.startPoint = null;
    this.controlPoint = null;
    this.cleanup();
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
    });

    // Store custom properties
    (group as any).isCurvedLine = true;
    (group as any).curvedLineStart = { x: this.startPoint.x, y: this.startPoint.y };
    (group as any).curvedLineEnd = { x: endPoint.x, y: endPoint.y };
    (group as any).curvedLineControlPoint = { x: this.controlPoint.x, y: this.controlPoint.y };
    (group as any).controlHandle = controlHandle;
    (group as any).handleLines = [line1, line2];
    (group as any).mainPath = curvePath;
    (group as any).startMarker = startMarkerRef;
    (group as any).endMarker = endMarkerRef;
    (group as any).markerOptions = {
      startMarker: this.options.startMarker,
      endMarker: this.options.endMarker,
      lineStyle: this.options.lineStyle,
    };

    // Add control handle and lines to canvas
    this.canvas.add(line1, line2, controlHandle);

    // Setup control handle drag behavior
    this.setupControlHandleDrag(group, controlHandle, line1, line2);

    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.renderAll();

    return group;
  }

  cancel(): void {
    this.cleanup();
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

    this.attachTransformSync(group);
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
        });
        
        group.remove(mainPath);
        group.insertAt(pathIndex, newPath);
        curveData.mainPath = newPath;
      }

      // Update marker angles based on new curve tangent
      const newStartAngle = this.calculateStartAngle(start, newControl, end);
      const newEndAngle = this.calculateEndAngle(start, newControl, end);

      if (curveData.startMarker) {
        curveData.startMarker.set({ angle: newStartAngle });
      }

      if (curveData.endMarker) {
        curveData.endMarker.set({ angle: newEndAngle });
      }

      this.canvas.renderAll();
    });

    // When group is selected, show handle and lines
    group.on('selected', () => {
      handle.visible = true;
      line1.visible = true;
      line2.visible = true;
      this.canvas.renderAll();
    });

    // When group is deselected, hide handle and lines
    group.on('deselected', () => {
      handle.visible = false;
      line1.visible = false;
      line2.visible = false;
      this.canvas.renderAll();
    });
  }

  private attachTransformSync(group: Group): void {
    const syncMarkers = () => {
      const curveData = group as any;
      const start = curveData.curvedLineStart;
      const end = curveData.curvedLineEnd;
      const control = curveData.curvedLineControlPoint;
      const startMarker = curveData.startMarker;
      const endMarker = curveData.endMarker;

      if (!start || !end || !control) return;

      // Get group's transformation matrix
      const matrix = group.calcTransformMatrix();
      const scaleX = group.scaleX || 1;
      const scaleY = group.scaleY || 1;

      // Transform original points to current positions
      const transformedStart = {
        x: start.x * scaleX + (group.left || 0) - (group.width || 0) * scaleX / 2,
        y: start.y * scaleY + (group.top || 0) - (group.height || 0) * scaleY / 2
      };

      const transformedEnd = {
        x: end.x * scaleX + (group.left || 0) - (group.width || 0) * scaleX / 2,
        y: end.y * scaleY + (group.top || 0) - (group.height || 0) * scaleY / 2
      };

      const transformedControl = {
        x: control.x * scaleX + (group.left || 0) - (group.width || 0) * scaleX / 2,
        y: control.y * scaleY + (group.top || 0) - (group.height || 0) * scaleY / 2
      };

      // Update start marker position and angle
      if (startMarker) {
        const startAngle = this.calculateStartAngle(transformedStart, transformedControl, transformedEnd);
        startMarker.set({
          left: start.x,
          top: start.y,
          angle: startAngle + (group.angle || 0),
          scaleX: 1 / scaleX,
          scaleY: 1 / scaleY,
        });
      }

      // Update end marker position and angle
      if (endMarker) {
        const endAngle = this.calculateEndAngle(transformedStart, transformedControl, transformedEnd);
        endMarker.set({
          left: end.x,
          top: end.y,
          angle: endAngle + (group.angle || 0),
          scaleX: 1 / scaleX,
          scaleY: 1 / scaleY,
        });
      }

      group.setCoords();
    };

    // Sync on all transform events
    group.on('scaling', syncMarkers);
    group.on('rotating', syncMarkers);
    group.on('moving', syncMarkers);
    group.on('modified', syncMarkers);

    // Initialize
    syncMarkers();
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
