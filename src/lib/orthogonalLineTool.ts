import { Canvas as FabricCanvas, Circle, Path, Group, Polygon, FabricObject, Point as FabricPoint, util } from "fabric";
import { toast } from "sonner";
import { routeOrthogonal, smoothOrthogonalPath } from "./lineRouting";

export interface OrthogonalLinePoint {
  x: number;
  y: number;
}

export type MarkerType = 'none' | 'dot' | 'arrow' | 'diamond' | 'circle';
export type LineStyleType = 'solid' | 'dashed' | 'dotted';

export interface OrthogonalLineOptions {
  startMarker?: MarkerType;
  endMarker?: MarkerType;
  lineStyle?: LineStyleType;
  strokeWidth?: number;
  strokeColor?: string;
  snap?: boolean;
  gridSize?: number;
  smoothCorners?: boolean;
  cornerRadius?: number;
}

export class OrthogonalLineTool {
  private canvas: FabricCanvas;
  private waypoints: OrthogonalLinePoint[] = [];
  private currentPoint: OrthogonalLinePoint | null = null;
  private tempPath: Path | null = null;
  private handles: Circle[] = [];
  private tempMarkers: FabricObject[] = [];
  private isDrawing: boolean = false;
  private isFinishing: boolean = false;
  private options: Required<OrthogonalLineOptions>;

  constructor(canvas: FabricCanvas, options?: OrthogonalLineOptions) {
    this.canvas = canvas;
    this.options = {
      startMarker: options?.startMarker || 'none',
      endMarker: options?.endMarker || 'none',
      lineStyle: options?.lineStyle || 'solid',
      strokeWidth: options?.strokeWidth || 2,
      strokeColor: options?.strokeColor || '#000000',
      snap: options?.snap ?? true,
      gridSize: options?.gridSize || 20,
      smoothCorners: options?.smoothCorners ?? false,
      cornerRadius: options?.cornerRadius || 10,
    };
  }

  start(): void {
    this.isDrawing = true;
    this.waypoints = [];
    this.currentPoint = null;
    this.handles = [];
    this.tempMarkers = [];
    this.canvas.selection = false;
    this.canvas.defaultCursor = 'crosshair';
  }

  addPoint(x: number, y: number): void {
    if (!this.isDrawing) return;

    // Snap to grid if enabled
    if (this.options.snap) {
      x = Math.round(x / this.options.gridSize) * this.options.gridSize;
      y = Math.round(y / this.options.gridSize) * this.options.gridSize;
    }

    this.waypoints.push({ x, y });
    this.addPointHandle(x, y);

    if (this.waypoints.length === 1) {
      toast.info("Click to add corners. Press Enter to finish, Escape to cancel.");
    }
  }

  updatePreview(x: number, y: number): void {
    if (!this.isDrawing || this.waypoints.length === 0) return;

    // Snap to grid if enabled
    if (this.options.snap) {
      x = Math.round(x / this.options.gridSize) * this.options.gridSize;
      y = Math.round(y / this.options.gridSize) * this.options.gridSize;
    }

    this.currentPoint = { x, y };
    this.updatePath();
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

  private calculateOrthogonalPath(points: OrthogonalLinePoint[]): FabricPoint[] {
    if (points.length < 2) return [];

    const fabricPoints: FabricPoint[] = [];
    
    // Add first point
    fabricPoints.push(new FabricPoint(points[0].x, points[0].y));

    // For each segment, create orthogonal path
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      const dx = Math.abs(curr.x - prev.x);
      const dy = Math.abs(curr.y - prev.y);

      // If only first and current point, use routeOrthogonal
      if (i === 1 && points.length === 2) {
        const orthogonalPoints = routeOrthogonal(
          new FabricPoint(prev.x, prev.y),
          new FabricPoint(curr.x, curr.y)
        );
        // Skip first point as it's already added
        fabricPoints.push(...orthogonalPoints.slice(1));
      } else {
        // Determine dominant direction
        if (dx > dy) {
          // Horizontal first
          fabricPoints.push(new FabricPoint(curr.x, prev.y));
        } else {
          // Vertical first
          fabricPoints.push(new FabricPoint(prev.x, curr.y));
        }
        fabricPoints.push(new FabricPoint(curr.x, curr.y));
      }
    }

    return fabricPoints;
  }

  private updatePath(): void {
    // Remove old temporary path and markers
    if (this.tempPath) {
      this.canvas.remove(this.tempPath);
    }
    this.tempMarkers.forEach(marker => this.canvas.remove(marker));
    this.tempMarkers = [];

    if (this.waypoints.length < 1 || !this.currentPoint) {
      this.canvas.renderAll();
      return;
    }

    // Calculate orthogonal path
    const allPoints = [...this.waypoints, this.currentPoint];
    const orthogonalPoints = this.calculateOrthogonalPath(allPoints);

    if (orthogonalPoints.length < 2) {
      this.canvas.renderAll();
      return;
    }

    // Build path data
    let pathData: string;
    if (this.options.smoothCorners && orthogonalPoints.length > 2) {
      pathData = smoothOrthogonalPath(orthogonalPoints, this.options.cornerRadius);
    } else {
      pathData = `M ${orthogonalPoints[0].x} ${orthogonalPoints[0].y}`;
      for (let i = 1; i < orthogonalPoints.length; i++) {
        pathData += ` L ${orthogonalPoints[i].x} ${orthogonalPoints[i].y}`;
      }
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
    if (orthogonalPoints.length >= 2) {
      // Start marker
      if (this.options.startMarker !== 'none') {
        const angle = this.calculateAngle(
          orthogonalPoints[1], 
          orthogonalPoints[0]
        );
        const marker = this.createMarker(
          this.options.startMarker,
          orthogonalPoints[0].x,
          orthogonalPoints[0].y,
          angle,
          true
        );
        this.tempMarkers.push(marker);
        this.canvas.add(marker);
      }

      // End marker
      if (this.options.endMarker !== 'none') {
        const lastIdx = orthogonalPoints.length - 1;
        const angle = this.calculateAngle(
          orthogonalPoints[lastIdx - 1], 
          orthogonalPoints[lastIdx]
        );
        const marker = this.createMarker(
          this.options.endMarker,
          orthogonalPoints[lastIdx].x,
          orthogonalPoints[lastIdx].y,
          angle,
          true
        );
        this.tempMarkers.push(marker);
        this.canvas.add(marker);
      }
    }

    this.canvas.renderAll();
  }

  private calculateAngle(from: FabricPoint, to: FabricPoint): number {
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
      const localPoints = (group as any).orthogonalLineLocalPoints as FabricPoint[] | undefined;
      
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
    
    if (!this.isDrawing || this.waypoints.length < 1) {
      this.cancel();
      this.isFinishing = false;
      return null;
    }

    // If only one waypoint, need current point
    if (this.waypoints.length === 1 && !this.currentPoint) {
      toast.error("Click at least one more point to create a line");
      this.isFinishing = false;
      return null;
    }

    // Clean up temporary objects
    this.cleanup();

    // Build final orthogonal path
    const allPoints = this.currentPoint 
      ? [...this.waypoints, this.currentPoint]
      : this.waypoints;

    if (allPoints.length < 2) {
      this.isFinishing = false;
      return null;
    }

    const orthogonalPoints = this.calculateOrthogonalPath(allPoints);

    // Build final path data
    let pathData: string;
    if (this.options.smoothCorners && orthogonalPoints.length > 2) {
      pathData = smoothOrthogonalPath(orthogonalPoints, this.options.cornerRadius);
    } else {
      pathData = `M ${orthogonalPoints[0].x} ${orthogonalPoints[0].y}`;
      for (let i = 1; i < orthogonalPoints.length; i++) {
        pathData += ` L ${orthogonalPoints[i].x} ${orthogonalPoints[i].y}`;
      }
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

    // Add start marker
    if (this.options.startMarker !== 'none' && orthogonalPoints.length >= 2) {
      const angle = this.calculateAngle(
        orthogonalPoints[1],
        orthogonalPoints[0]
      );
      const marker = this.createMarker(
        this.options.startMarker,
        orthogonalPoints[0].x,
        orthogonalPoints[0].y,
        angle
      );
      objects.push(marker);
    }

    // Add end marker
    if (this.options.endMarker !== 'none' && orthogonalPoints.length >= 2) {
      const lastIdx = orthogonalPoints.length - 1;
      const angle = this.calculateAngle(
        orthogonalPoints[lastIdx - 1],
        orthogonalPoints[lastIdx]
      );
      const marker = this.createMarker(
        this.options.endMarker,
        orthogonalPoints[lastIdx].x,
        orthogonalPoints[lastIdx].y,
        angle
      );
      objects.push(marker);
    }

    // Create final object (group if has markers, path otherwise)
    let finalObject: Group | Path;
    if (objects.length > 1) {
      finalObject = new Group(objects, {
        selectable: true,
      });
      
      // Store custom properties
      (finalObject as any).isOrthogonalLine = true;
      (finalObject as any).orthogonalLineWaypoints = this.waypoints;
      (finalObject as any).startMarker = objects.length >= 2 ? objects[1] : null;
      (finalObject as any).endMarker = objects.length >= 3 ? objects[objects.length - 1] : null;
      (finalObject as any).markerOptions = {
        startMarker: this.options.startMarker,
        endMarker: this.options.endMarker,
        lineStyle: this.options.lineStyle,
      };
      
      // Store local coordinates for transform sync
      const inv = util.invertTransform(finalObject.calcTransformMatrix());
      const localOrtho = orthogonalPoints.map(p => util.transformPoint(new FabricPoint(p.x, p.y), inv));
      (finalObject as any).orthogonalLineLocalPoints = localOrtho;
      
      // Sync marker transforms to keep them attached
      this.attachTransformSync(finalObject);
    } else {
      finalObject = finalPath;
      (finalObject as any).isOrthogonalLine = true;
      (finalObject as any).orthogonalLineWaypoints = this.waypoints;
      (finalObject as any).markerOptions = {
        startMarker: this.options.startMarker,
        endMarker: this.options.endMarker,
        lineStyle: this.options.lineStyle,
      };
    }

    this.canvas.add(finalObject);
    this.canvas.setActiveObject(finalObject);
    this.canvas.selection = true;
    this.canvas.defaultCursor = 'default';
    this.canvas.renderAll();

    this.isDrawing = false;
    this.waypoints = [];
    this.currentPoint = null;

    return finalObject;
  }

  cancel(): void {
    if (this.isFinishing) return;
    
    this.cleanup();
    this.canvas.selection = true;
    this.canvas.defaultCursor = 'default';
    this.isDrawing = false;
    this.waypoints = [];
    this.currentPoint = null;
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
      waypointCount: this.waypoints.length,
    };
  }
}
