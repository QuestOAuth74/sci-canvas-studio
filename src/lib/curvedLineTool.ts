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
    (group as any).startMarkerType = this.options.startMarker;
    (group as any).endMarkerType = this.options.endMarker;
    (group as any).markerOptions = {
      startMarker: this.options.startMarker,
      endMarker: this.options.endMarker,
      lineStyle: this.options.lineStyle,
    };
    
    // Store local coordinates for transform sync
    const inv = util.invertTransform(group.calcTransformMatrix());
    (group as any).curvedLocalStart = util.transformPoint(new FabricPoint(this.startPoint.x, this.startPoint.y), inv);
    (group as any).curvedLocalEnd = util.transformPoint(new FabricPoint(endPoint.x, endPoint.y), inv);
    (group as any).curvedLocalControl = util.transformPoint(new FabricPoint(this.controlPoint.x, this.controlPoint.y), inv);

    // Attach transform sync to main group
    this.attachTransformSync(group);

    // Add control handle and lines to canvas
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
      visible: false,
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
      visible: false,
    });

    const line2 = new Line([control.x, control.y, end.x, end.y], {
      stroke: '#10b981',
      strokeWidth: 1,
      strokeDashArray: [5, 3],
      selectable: false,
      evented: false,
      visible: false,
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
    const startMarker = (group as any).startMarker as Group | null;
    const endMarker = (group as any).endMarker as Group | null;
    const startMarkerType = (group as any).startMarkerType as MarkerType;
    const endMarkerType = (group as any).endMarkerType as MarkerType;
    
    if (!startMarker && !endMarker) return;

    const getMarkerOffset = (markerType: MarkerType): number => {
      switch (markerType) {
        case 'arrow': return -12;      // Tip touches endpoint
        case 'back-arrow': return 12;   // Tip touches endpoint  
        case 'dot': return 4;           // Radius
        case 'circle': return 6;        // Radius
        case 'diamond': return 6;       // Half diagonal
        case 'block': return 6;         // Half width
        case 'bar': return 0;           // Perpendicular, no offset
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

      if (startMarker) {
        const startAngle = this.calculateStartAngle(localStart, localControl, localEnd);
        
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
        const endAngle = this.calculateEndAngle(localStart, localControl, localEnd);
        
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

      group.setCoords();
      this.canvas.requestRenderAll();
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
