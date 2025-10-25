import { Canvas as FabricCanvas, Circle, Path, Group, Polygon, FabricObject, Point } from "fabric";

export type MarkerType = 'none' | 'dot' | 'arrow' | 'diamond';

export interface ElbowLineOptions {
  endMarker?: MarkerType;
  strokeWidth?: number;
  strokeColor?: string;
  snap?: boolean;
  gridSize?: number;
}

export class ElbowLineTool {
  private canvas: FabricCanvas;
  private startPoint: Point | null = null;
  private tempPath: Path | null = null;
  private tempMarkers: FabricObject[] = [];
  private isDrawing: boolean = false;
  private options: Required<ElbowLineOptions>;

  constructor(canvas: FabricCanvas, options?: ElbowLineOptions) {
    this.canvas = canvas;
    this.options = {
      endMarker: options?.endMarker || 'none',
      strokeWidth: options?.strokeWidth || 2,
      strokeColor: options?.strokeColor || '#000000',
      snap: options?.snap ?? true,
      gridSize: options?.gridSize || 20,
    };
  }

  start(): void {
    this.isDrawing = true;
    this.startPoint = null;
    
    // Store original states and disable interaction
    this.canvas.getObjects().forEach((obj: any) => {
      if (obj._originalSelectable === undefined) {
        obj._originalSelectable = obj.selectable;
        obj._originalEvented = obj.evented;
        obj._originalHoverCursor = obj.hoverCursor;
      }
      obj.selectable = false;
      obj.evented = false;
      obj.hoverCursor = 'crosshair';
    });
    
    // Disable canvas selection and make selection box invisible
    this.canvas.selection = false;
    this.canvas.selectionColor = 'transparent';
    this.canvas.selectionBorderColor = 'transparent';
    this.canvas.defaultCursor = 'crosshair';
    this.canvas.hoverCursor = 'crosshair';
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  // Returns true if line is complete (2 points added)
  addPoint(x: number, y: number): boolean {
    if (!this.isDrawing) return false;

    // Snap to grid if enabled
    if (this.options.snap) {
      x = Math.round(x / this.options.gridSize) * this.options.gridSize;
      y = Math.round(y / this.options.gridSize) * this.options.gridSize;
    }

    // First click: store start point
    if (!this.startPoint) {
      this.startPoint = new Point(x, y);
      return false; // Not finished yet
    }

    // Second click: create line and finish
    const endPoint = new Point(x, y);
    this.finish(this.startPoint, endPoint);
    return true; // Finished!
  }

  updatePreview(x: number, y: number): void {
    if (!this.isDrawing || !this.startPoint) return;

    // Snap to grid if enabled
    if (this.options.snap) {
      x = Math.round(x / this.options.gridSize) * this.options.gridSize;
      y = Math.round(y / this.options.gridSize) * this.options.gridSize;
    }

    this.cleanup();

    // Calculate elbow path
    const endPoint = new Point(x, y);
    const elbowPoints = this.calculateElbow(this.startPoint, endPoint);

    // Create preview path
    const pathData = this.buildPathData(elbowPoints);
    this.tempPath = new Path(pathData, {
      stroke: '#14b8a6',
      strokeWidth: this.options.strokeWidth,
      fill: null,
      selectable: false,
      evented: false,
      strokeUniform: true,
    });
    this.canvas.add(this.tempPath);

    // Add preview markers
    this.addPreviewMarkers(elbowPoints);
    this.canvas.renderAll();
  }

  private calculateElbow(start: Point, end: Point): Point[] {
    // Simple L-shape: horizontal first, then vertical
    const bendPoint = new Point(end.x, start.y);
    return [start, bendPoint, end];
  }

  private buildPathData(points: Point[]): string {
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`;
    }
    return pathData;
  }

  private addPreviewMarkers(points: Point[]): void {
    if (this.options.endMarker !== 'none' && points.length >= 2) {
      const lastIdx = points.length - 1;
      const angle = this.calculateAngle(
        points[lastIdx - 1],
        points[lastIdx]
      );
      const marker = this.createMarker(
        this.options.endMarker,
        points[lastIdx].x,
        points[lastIdx].y,
        angle,
        true
      );
      this.tempMarkers.push(marker);
      this.canvas.add(marker);
    }
  }

  private calculateAngle(from: Point, to: Point): number {
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

      default:
        return new Circle({ radius: 0, selectable: false, evented: false });
    }
  }

  private attachMarkerScaleLock(group: Group): void {
    const objects = (group as any).getObjects ? (group as any).getObjects() : (group as any)._objects || [];
    const path = objects.find((o: any) => o.type === 'path');
    const markers = objects.filter((o: any) => o !== path);

    const lock = () => {
      const sx = group.scaleX || 1;
      const sy = group.scaleY || 1;
      markers.forEach((m: any) => {
        m.set({
          scaleX: 1 / sx,
          scaleY: 1 / sy,
          strokeUniform: true,
        });
      });
    };

    // Initialize and keep locked during transforms
    lock();
    group.on('scaling', lock);
    group.on('modified', lock);
  }

  private finish(start: Point, end: Point): void {
    this.cleanup();

    // Restore original selectable/evented state
    this.canvas.getObjects().forEach((obj: any) => {
      if (obj._originalSelectable !== undefined) {
        obj.selectable = obj._originalSelectable;
        obj.evented = obj._originalEvented;
        obj.hoverCursor = obj._originalHoverCursor || 'move';
        delete obj._originalSelectable;
        delete obj._originalEvented;
        delete obj._originalHoverCursor;
      }
    });

    // Restore canvas selection properties
    this.canvas.selection = true;
    this.canvas.selectionColor = 'rgba(100, 100, 255, 0.3)';
    this.canvas.selectionBorderColor = 'rgba(255, 255, 255, 0.3)';
    this.canvas.defaultCursor = 'default';
    this.canvas.hoverCursor = 'move';

    const elbowPoints = this.calculateElbow(start, end);
    const pathData = this.buildPathData(elbowPoints);

    const finalPath = new Path(pathData, {
      stroke: this.options.strokeColor,
      strokeWidth: this.options.strokeWidth,
      fill: null,
      selectable: true,
      strokeUniform: true,
    });

    const objects: FabricObject[] = [finalPath];

    // Add end marker
    if (this.options.endMarker !== 'none') {
      const lastIdx = elbowPoints.length - 1;
      const angle = this.calculateAngle(
        elbowPoints[lastIdx - 1],
        elbowPoints[lastIdx]
      );
      const marker = this.createMarker(
        this.options.endMarker,
        elbowPoints[lastIdx].x,
        elbowPoints[lastIdx].y,
        angle
      );
      objects.push(marker);
    }

    // Create group or single path
    let finalObject: Group | Path;
    if (objects.length > 1) {
      finalObject = new Group(objects, { selectable: true });
      this.attachMarkerScaleLock(finalObject);
    } else {
      finalObject = finalPath;
    }

    this.canvas.add(finalObject);
    this.canvas.setActiveObject(finalObject);
    this.canvas.selection = true;
    this.canvas.defaultCursor = 'default';
    this.canvas.renderAll();

    this.isDrawing = false;
    this.startPoint = null;
  }

  cancel(): void {
    this.cleanup();
    
    // Restore original selectable/evented state
    this.canvas.getObjects().forEach((obj: any) => {
      if (obj._originalSelectable !== undefined) {
        obj.selectable = obj._originalSelectable;
        obj.evented = obj._originalEvented;
        obj.hoverCursor = obj._originalHoverCursor || 'move';
        delete obj._originalSelectable;
        delete obj._originalEvented;
        delete obj._originalHoverCursor;
      }
    });
    
    // Restore canvas selection properties
    this.canvas.selection = true;
    this.canvas.selectionColor = 'rgba(100, 100, 255, 0.3)';
    this.canvas.selectionBorderColor = 'rgba(255, 255, 255, 0.3)';
    this.canvas.defaultCursor = 'default';
    this.canvas.hoverCursor = 'move';
    this.isDrawing = false;
    this.startPoint = null;
    this.canvas.requestRenderAll();
  }

  private cleanup(): void {
    // Remove temporary path
    if (this.tempPath) {
      this.canvas.remove(this.tempPath);
      this.tempPath = null;
    }

    // Remove temporary markers
    this.tempMarkers.forEach(marker => this.canvas.remove(marker));
    this.tempMarkers = [];
  }
}
