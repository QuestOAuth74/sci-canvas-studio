import { Path, Circle, Line as FabricLine, Canvas as FabricCanvas, Point } from "fabric";
import { calculateSmoothCurve, snapToGrid } from "./advancedLineSystem";
import { BezierPoint as BezierPointType } from "@/types/bezier";
import { v4 as uuidv4 } from 'uuid';

// Re-export BezierPoint for backwards compatibility
export type BezierPoint = BezierPointType;

export class EnhancedBezierTool {
  private canvas: FabricCanvas;
  private points: BezierPoint[] = [];
  private tempPath: Path | null = null;
  private handles: Circle[] = [];
  private controlLines: FabricLine[] = [];
  private isDrawing: boolean = false;
  private smoothFactor: number = 0.5;
  private snapEnabled: boolean = true;

  constructor(canvas: FabricCanvas, options?: { smooth?: number; snap?: boolean }) {
    this.canvas = canvas;
    if (options?.smooth !== undefined) this.smoothFactor = options.smooth;
    if (options?.snap !== undefined) this.snapEnabled = options.snap;
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

  // Start drawing mode
  start() {
    this.isDrawing = true;
    this.points = [];
    this.clearTemporaryObjects();
    this.disableObjectInteraction();
  }

  // Add point on click
  addPoint(x: number, y: number) {
    if (!this.isDrawing) return;

    const snappedX = this.snapEnabled ? snapToGrid(x, 10) : x;
    const snappedY = this.snapEnabled ? snapToGrid(y, 10) : y;

    // Add point with type and unique ID
    this.points.push({
      x: snappedX,
      y: snappedY,
      type: 'smooth',  // Default to smooth points
      id: uuidv4(),    // Generate unique ID
    });

    // Auto-calculate control points for smooth curve
    if (this.points.length > 1) {
      this.calculateControlPoints();
    }

    // Update visual representation
    this.updatePath();
    this.addPointHandle(snappedX, snappedY);
  }

  // Calculate control points for smooth bezier (Catmull-Rom style)
  private calculateControlPoints() {
    const tension = this.smoothFactor;
    
    for (let i = 1; i < this.points.length - 1; i++) {
      const prev = this.points[i - 1];
      const curr = this.points[i];
      const next = this.points[i + 1];

      // Calculate tangent
      const tx = (next.x - prev.x) * tension;
      const ty = (next.y - prev.y) * tension;

      // Set control points
      curr.controlPoint1 = {
        x: curr.x - tx / 2,
        y: curr.y - ty / 2,
      };
      curr.controlPoint2 = {
        x: curr.x + tx / 2,
        y: curr.y + ty / 2,
      };
    }

    // First and last points
    if (this.points.length > 1) {
      const first = this.points[0];
      const second = this.points[1];
      first.controlPoint2 = {
        x: first.x + (second.x - first.x) * tension,
        y: first.y + (second.y - first.y) * tension,
      };

      const last = this.points[this.points.length - 1];
      const beforeLast = this.points[this.points.length - 2];
      last.controlPoint1 = {
        x: last.x - (last.x - beforeLast.x) * tension,
        y: last.y - (last.y - beforeLast.y) * tension,
      };
    }
  }

  // Update the path visualization
  private updatePath() {
    if (this.points.length < 2) return;

    // Remove old path
    if (this.tempPath) {
      this.canvas.remove(this.tempPath);
    }

    // Build SVG path with smooth curves
    let pathData = `M ${this.points[0].x} ${this.points[0].y}`;

    for (let i = 0; i < this.points.length - 1; i++) {
      const curr = this.points[i];
      const next = this.points[i + 1];

      if (curr.controlPoint2 && next.controlPoint1) {
        // Cubic bezier with control points
        pathData += ` C ${curr.controlPoint2.x} ${curr.controlPoint2.y}, ${next.controlPoint1.x} ${next.controlPoint1.y}, ${next.x} ${next.y}`;
      } else {
        // Simple line if no control points
        pathData += ` L ${next.x} ${next.y}`;
      }
    }

    // Create new path
    this.tempPath = new Path(pathData, {
      stroke: '#0D9488',
      strokeWidth: 2,
      fill: '',
      selectable: false,
      evented: false,
      strokeUniform: true,
    } as any);

    this.canvas.add(this.tempPath);
    this.canvas.renderAll();
  }

  // Add visual handle for point
  private addPointHandle(x: number, y: number) {
    const handle = new Circle({
      left: x,
      top: y,
      radius: 5,
      fill: '#0D9488',
      stroke: '#ffffff',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    } as any);

    this.handles.push(handle);
    this.canvas.add(handle);
  }

  // Show control points (for editing)
  showControlPoints() {
    this.clearControlLines();

    this.points.forEach((point, index) => {
      if (point.controlPoint1) {
        this.addControlPoint(point.x, point.y, point.controlPoint1.x, point.controlPoint1.y, index, 1);
      }
      if (point.controlPoint2) {
        this.addControlPoint(point.x, point.y, point.controlPoint2.x, point.controlPoint2.y, index, 2);
      }
    });
  }

  // Add draggable control point
  private addControlPoint(
    anchorX: number,
    anchorY: number,
    cpX: number,
    cpY: number,
    pointIndex: number,
    controlIndex: number
  ) {
    // Line from anchor to control point
    const line = new FabricLine([anchorX, anchorY, cpX, cpY], {
      stroke: '#999',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    } as any);
    this.controlLines.push(line);
    this.canvas.add(line);

    // Control point handle
    const handle = new Circle({
      left: cpX,
      top: cpY,
      radius: 4,
      fill: '#ffffff',
      stroke: '#0D9488',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'move',
    } as any);

    (handle as any).pointIndex = pointIndex;
    (handle as any).controlIndex = controlIndex;

    this.handles.push(handle);
    this.canvas.add(handle);
  }

  // Clear temporary objects
  private clearTemporaryObjects() {
    if (this.tempPath) {
      this.canvas.remove(this.tempPath);
      this.tempPath = null;
    }
    this.clearHandles();
    this.clearControlLines();
  }

  private clearHandles() {
    this.handles.forEach(h => this.canvas.remove(h));
    this.handles = [];
  }

  private clearControlLines() {
    this.controlLines.forEach(l => this.canvas.remove(l));
    this.controlLines = [];
  }

  // Finish drawing and return final path
  finish(): Path | null {
    if (!this.isDrawing || this.points.length < 2) {
      this.cancel();
      return null;
    }

    this.isDrawing = false;

    // Create final path from points (in world coordinates)
    let pathData = `M ${this.points[0].x} ${this.points[0].y}`;

    for (let i = 0; i < this.points.length - 1; i++) {
      const curr = this.points[i];
      const next = this.points[i + 1];

      if (curr.controlPoint2 && next.controlPoint1) {
        pathData += ` C ${curr.controlPoint2.x} ${curr.controlPoint2.y}, ${next.controlPoint1.x} ${next.controlPoint1.y}, ${next.x} ${next.y}`;
      } else {
        pathData += ` L ${next.x} ${next.y}`;
      }
    }

    const finalPath = new Path(pathData, {
      stroke: '#000000',
      strokeWidth: 2,
      fill: '',
      selectable: true,
      evented: true,
      strokeUniform: true,
    } as any);

    // Store bezier data for future editing
    (finalPath as any).bezierPoints = this.points;
    (finalPath as any).isBezierPath = true;

    this.clearTemporaryObjects();
    this.canvas.add(finalPath);
    this.canvas.setActiveObject(finalPath);
    this.enableObjectInteraction();

    return finalPath;
  }

  // Cancel drawing
  cancel() {
    this.isDrawing = false;
    this.points = [];
    this.clearTemporaryObjects();
    this.enableObjectInteraction();
  }

  // Get current state
  getState() {
    return {
      isDrawing: this.isDrawing,
      pointCount: this.points.length,
    };
  }
}
