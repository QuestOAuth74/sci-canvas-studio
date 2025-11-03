import { Canvas as FabricCanvas, Circle, Path, Group, Polygon, FabricObject, util, Point as FabricPoint } from "fabric";
import { toast } from "sonner";

export interface StraightLinePoint {
  x: number;
  y: number;
}

export type MarkerType = 'none' | 'dot' | 'arrow' | 'diamond' | 'circle';
export type LineStyleType = 'solid' | 'dashed' | 'dotted';

export interface StraightLineOptions {
  startMarker?: MarkerType;
  endMarker?: MarkerType;
  lineStyle?: LineStyleType;
  strokeWidth?: number;
  strokeColor?: string;
  snap?: boolean;
  gridSize?: number;
}

export class StraightLineTool {
  private canvas: FabricCanvas;
  private points: StraightLinePoint[] = [];
  private tempPath: Path | null = null;
  private handles: Circle[] = [];
  private tempMarkers: FabricObject[] = [];
  private isDrawing: boolean = false;
  private isFinishing: boolean = false;
  private isDragging: boolean = false;
  private dragStartPoint: StraightLinePoint | null = null;
  private options: Required<StraightLineOptions>;

  constructor(canvas: FabricCanvas, options?: StraightLineOptions) {
    this.canvas = canvas;
    this.options = {
      startMarker: options?.startMarker || 'none',
      endMarker: options?.endMarker || 'none',
      lineStyle: options?.lineStyle || 'solid',
      strokeWidth: options?.strokeWidth || 2,
      strokeColor: options?.strokeColor || '#000000',
      snap: options?.snap ?? true,
      gridSize: options?.gridSize || 20,
    };
  }

  private disableObjectInteraction(): void {
    this.canvas.skipTargetFind = true;
    this.canvas.selection = false;
    this.canvas.forEachObject((obj) => {
      if (!(obj as any).isTemp) {
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
      if (!(obj as any).isTemp) {
        obj.set({
          selectable: true,
          evented: true
        });
      }
    });
    this.canvas.renderAll();
  }

  start(): void {
    this.isDrawing = true;
    this.points = [];
    this.handles = [];
    this.tempMarkers = [];
    this.disableObjectInteraction();
    this.canvas.defaultCursor = 'crosshair';
  }

  addPoint(x: number, y: number): void {
    if (!this.isDrawing) return;

    // Snap to grid if enabled
    if (this.options.snap) {
      x = Math.round(x / this.options.gridSize) * this.options.gridSize;
      y = Math.round(y / this.options.gridSize) * this.options.gridSize;
    }

    this.points.push({ x, y });
    this.addPointHandle(x, y);
    this.updatePath();

    if (this.points.length === 1) {
      toast.info("Click to add more points. Press Enter to finish.");
    }
  }

  private snapToGrid(x: number, y: number): StraightLinePoint {
    if (this.options.snap) {
      return {
        x: Math.round(x / this.options.gridSize) * this.options.gridSize,
        y: Math.round(y / this.options.gridSize) * this.options.gridSize
      };
    }
    return { x, y };
  }

  startDragLine(x: number, y: number): void {
    this.isDrawing = true;
    this.isDragging = true;
    this.disableObjectInteraction();
    this.canvas.defaultCursor = 'crosshair';
    
    const snappedPoint = this.snapToGrid(x, y);
    this.dragStartPoint = snappedPoint;
    this.points = [snappedPoint];
    
    this.addPointHandle(snappedPoint.x, snappedPoint.y);
  }

  updateDragLine(x: number, y: number): void {
    if (!this.isDragging || !this.dragStartPoint) return;
    
    const snappedPoint = this.snapToGrid(x, y);
    this.points = [this.dragStartPoint, snappedPoint];
    this.updatePath();
  }

  finishDragLine(x: number, y: number): Group | Path | null {
    if (!this.isDragging || !this.dragStartPoint) return null;
    
    const snappedPoint = this.snapToGrid(x, y);
    this.points = [this.dragStartPoint, snappedPoint];
    
    this.isDragging = false;
    this.dragStartPoint = null;
    return this.finish();
  }

  private addPointHandle(x: number, y: number): void {
    const handle = new Circle({
      left: x - 4,
      top: y - 4,
      radius: 4,
      fill: '#10b981',
      stroke: '#059669',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });
    this.handles.push(handle);
    this.canvas.add(handle);
  }

  private updatePath(): void {
    // Remove old temporary path and markers
    if (this.tempPath) {
      this.canvas.remove(this.tempPath);
    }
    this.tempMarkers.forEach(marker => this.canvas.remove(marker));
    this.tempMarkers = [];

    if (this.points.length < 2) {
      this.canvas.renderAll();
      return;
    }

    // Build path data for straight line segments
    let pathData = `M ${this.points[0].x} ${this.points[0].y}`;
    for (let i = 1; i < this.points.length; i++) {
      pathData += ` L ${this.points[i].x} ${this.points[i].y}`;
    }

    // Create temporary path with teal color
    this.tempPath = new Path(pathData, {
      stroke: '#14b8a6',
      strokeWidth: this.options.strokeWidth,
      fill: null,
      selectable: false,
      evented: false,
      strokeDashArray: this.getStrokeDashArray(),
      strokeUniform: true,
    });
    this.canvas.add(this.tempPath);

    // Add temporary markers
    if (this.points.length >= 2) {
      // Start marker
      if (this.options.startMarker !== 'none') {
        const angle = this.calculateAngle(this.points[1], this.points[0]);
        const marker = this.createMarker(
          this.options.startMarker,
          this.points[0].x,
          this.points[0].y,
          angle,
          true
        );
        this.tempMarkers.push(marker);
        this.canvas.add(marker);
      }

      // End marker
      if (this.options.endMarker !== 'none') {
        const lastIdx = this.points.length - 1;
        const angle = this.calculateAngle(this.points[lastIdx - 1], this.points[lastIdx]);
        const marker = this.createMarker(
          this.options.endMarker,
          this.points[lastIdx].x,
          this.points[lastIdx].y,
          angle,
          true
        );
        this.tempMarkers.push(marker);
        this.canvas.add(marker);
      }
    }

    this.canvas.renderAll();
  }

  private calculateAngle(from: StraightLinePoint, to: StraightLinePoint): number {
    return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
  }

  private createMarker(
    type: MarkerType,
    x: number,
    y: number,
    angle: number,
    isTemp: boolean = false
  ): FabricObject {
    const color = isTemp ? '#14b8a6' : this.options.strokeColor;
    
    switch (type) {
      case 'dot': {
        return new Circle({
          left: x,
          top: y,
          radius: 5,
          fill: color,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          strokeUniform: true,
        });
      }

      case 'arrow': {
        const arrowSize = 10;
        const arrow = new Polygon([
          { x: 0, y: 0 },
          { x: -arrowSize, y: -arrowSize / 2 },
          { x: -arrowSize, y: arrowSize / 2 },
        ], {
          fill: color,
          stroke: color,
          strokeWidth: 0,
          left: x,
          top: y,
          angle: angle,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
          strokeUniform: true,
        });
        return arrow;
      }

      case 'diamond': {
        const size = 8;
        const diamond = new Polygon([
          { x: 0, y: -size },
          { x: size, y: 0 },
          { x: 0, y: size },
          { x: -size, y: 0 },
        ], {
          fill: color,
          stroke: color,
          strokeWidth: 1,
          left: x,
          top: y,
          angle: angle,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
          strokeUniform: true,
        });
        return diamond;
      }

      case 'circle': {
        return new Circle({
          left: x,
          top: y,
          radius: 6,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          strokeUniform: true,
        });
      }

      default:
        return new Circle({ radius: 0, selectable: false, evented: false });
    }
  }

  private getStrokeDashArray(): number[] | undefined {
    switch (this.options.lineStyle) {
      case 'dashed':
        return [10, 5];
      case 'dotted':
        return [2, 4];
      case 'solid':
      default:
        return undefined;
    }
  }

  private attachTransformSync(group: Group): void {
    const startMarker = (group as any).startMarker as FabricObject | null;
    const endMarker = (group as any).endMarker as FabricObject | null;
    
    if (!startMarker && !endMarker) return;

    const syncMarkers = () => {
      const localPoints = (group as any).straightLineLocalPoints as FabricPoint[] | undefined;
      
      if (!localPoints || localPoints.length < 2) return;

      const scaleX = group.scaleX || 1;
      const scaleY = group.scaleY || 1;
      const groupAngle = group.angle || 0;

      if (startMarker && localPoints.length >= 2) {
        const localStart = localPoints[0];
        const localSecond = localPoints[1];
        const dx = localSecond.x - localStart.x;
        const dy = localSecond.y - localStart.y;
        const localAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        startMarker.set({
          left: localStart.x,
          top: localStart.y,
          angle: localAngle + groupAngle,
          scaleX: 1 / scaleX,
          scaleY: 1 / scaleY,
        });
      }

      if (endMarker && localPoints.length >= 2) {
        const localEnd = localPoints[localPoints.length - 1];
        const localSecondLast = localPoints[localPoints.length - 2];
        const dx = localEnd.x - localSecondLast.x;
        const dy = localEnd.y - localSecondLast.y;
        const localAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        endMarker.set({
          left: localEnd.x,
          top: localEnd.y,
          angle: localAngle + groupAngle,
          scaleX: 1 / scaleX,
          scaleY: 1 / scaleY,
        });
      }

      // Ensure line stroke stays consistent
      const objects = group.getObjects();
      const path = objects[0] as Path;
      if (path) {
        path.set({ strokeUniform: true });
      }

      group.setCoords();
      this.canvas.requestRenderAll();
    };

    group.on('scaling', syncMarkers);
    group.on('rotating', syncMarkers);
    group.on('moving', syncMarkers);
    group.on('modified', syncMarkers);

    syncMarkers();
  }

  finish(): Group | Path | null {
    this.isFinishing = true;
    
    if (!this.isDrawing || this.points.length < 2) {
      this.cancel();
      this.isFinishing = false;
      return null;
    }

    // Clean up temporary objects
    this.cleanup();

    // Build final path
    let pathData = `M ${this.points[0].x} ${this.points[0].y}`;
    for (let i = 1; i < this.points.length; i++) {
      pathData += ` L ${this.points[i].x} ${this.points[i].y}`;
    }

    const finalPath = new Path(pathData, {
      stroke: this.options.strokeColor,
      strokeWidth: this.options.strokeWidth,
      fill: null,
      selectable: true,
      strokeDashArray: this.getStrokeDashArray(),
      strokeUniform: true,
    });

    const objects: FabricObject[] = [finalPath];
    
    let startMarkerObj: FabricObject | null = null;
    let endMarkerObj: FabricObject | null = null;

    // Add start marker
    if (this.options.startMarker !== 'none' && this.points.length >= 2) {
      const angle = this.calculateAngle(this.points[1], this.points[0]);
      startMarkerObj = this.createMarker(
        this.options.startMarker,
        this.points[0].x,
        this.points[0].y,
        angle
      );
      objects.push(startMarkerObj);
    }

    // Add end marker
    if (this.options.endMarker !== 'none' && this.points.length >= 2) {
      const lastIdx = this.points.length - 1;
      const angle = this.calculateAngle(this.points[lastIdx - 1], this.points[lastIdx]);
      endMarkerObj = this.createMarker(
        this.options.endMarker,
        this.points[lastIdx].x,
        this.points[lastIdx].y,
        angle
      );
      objects.push(endMarkerObj);
    }

    // Create final object (group if has markers, path otherwise)
    let finalObject: Group | Path;
    if (objects.length > 1) {
      finalObject = new Group(objects, {
        selectable: true,
        subTargetCheck: false, // Prevent selecting individual marker elements
      });
      
      // Store custom properties
      (finalObject as any).isStraightLine = true;
      (finalObject as any).straightLinePoints = this.points;
      (finalObject as any).startMarker = startMarkerObj;
      (finalObject as any).endMarker = endMarkerObj;
      (finalObject as any).markerOptions = {
        startMarker: this.options.startMarker,
        endMarker: this.options.endMarker,
        lineStyle: this.options.lineStyle,
      };
      
      // Store local coordinates for transform sync
      const inv = util.invertTransform(finalObject.calcTransformMatrix());
      const localPoints = this.points.map(p => util.transformPoint(new FabricPoint(p.x, p.y), inv));
      (finalObject as any).straightLineLocalPoints = localPoints;
      
      // Sync marker transforms to keep them attached
      this.attachTransformSync(finalObject);
    } else {
      finalObject = finalPath;
      (finalObject as any).isStraightLine = true;
      (finalObject as any).straightLinePoints = this.points;
      (finalObject as any).markerOptions = {
        startMarker: this.options.startMarker,
        endMarker: this.options.endMarker,
        lineStyle: this.options.lineStyle,
      };
    }

    this.canvas.add(finalObject);
    this.canvas.setActiveObject(finalObject);
    this.enableObjectInteraction();
    this.canvas.defaultCursor = 'default';
    this.canvas.renderAll();

    this.isDrawing = false;
    this.points = [];

    return finalObject;
  }

  cancel(): void {
    if (this.isFinishing) return; // Don't cancel while finishing
    
    this.cleanup();
    this.enableObjectInteraction();
    this.canvas.defaultCursor = 'default';
    this.isDrawing = false;
    this.points = [];
  }

  private cleanup(): void {
    // Remove temporary path
    if (this.tempPath) {
      this.canvas.remove(this.tempPath);
      this.tempPath = null;
    }

    // Remove handles
    this.handles.forEach(handle => this.canvas.remove(handle));
    this.handles = [];

    // Remove temporary markers
    this.tempMarkers.forEach(marker => this.canvas.remove(marker));
    this.tempMarkers = [];

    this.canvas.renderAll();
  }

  getState() {
    return {
      isDrawing: this.isDrawing,
      pointCount: this.points.length,
    };
  }
}
