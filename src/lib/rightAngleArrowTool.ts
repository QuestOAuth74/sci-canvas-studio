import { Canvas as FabricCanvas, Path, Polygon, Group, Point as FabricPoint } from 'fabric';

interface Point {
  x: number;
  y: number;
}

export interface RightAngleArrowOptions {
  strokeWidth?: number;
  strokeColor?: string;
  snap?: boolean;
  gridSize?: number;
}

export class RightAngleArrowTool {
  private canvas: FabricCanvas;
  private options: RightAngleArrowOptions;
  private isDrawing: boolean = false;
  private points: Point[] = [];
  private tempPath: Path | null = null;
  private tempArrow: Polygon | null = null;

  constructor(canvas: FabricCanvas, options: RightAngleArrowOptions = {}) {
    this.canvas = canvas;
    this.options = {
      strokeWidth: options.strokeWidth || 2,
      strokeColor: options.strokeColor || '#000000',
      snap: options.snap !== undefined ? options.snap : false,
      gridSize: options.gridSize || 20,
    };
  }

  start(): void {
    this.isDrawing = true;
    this.points = [];
    
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
    
    // Disable canvas selection
    this.canvas.selection = false;
    this.canvas.selectionColor = 'transparent';
    this.canvas.selectionBorderColor = 'transparent';
    this.canvas.defaultCursor = 'crosshair';
    this.canvas.hoverCursor = 'crosshair';
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  // Returns true if arrow is complete (3 points added)
  addPoint(x: number, y: number): boolean {
    let finalX = x;
    let finalY = y;

    if (this.options.snap) {
      const gridSize = this.options.gridSize!;
      finalX = Math.round(x / gridSize) * gridSize;
      finalY = Math.round(y / gridSize) * gridSize;
    }

    this.points.push({ x: finalX, y: finalY });

    if (this.points.length === 3) {
      this.finish(this.points[0], this.points[1], this.points[2]);
      return true;
    }

    return false;
  }

  updatePreview(x: number, y: number): void {
    if (this.points.length === 0) return;

    let finalX = x;
    let finalY = y;

    if (this.options.snap) {
      const gridSize = this.options.gridSize!;
      finalX = Math.round(x / gridSize) * gridSize;
      finalY = Math.round(y / gridSize) * gridSize;
    }

    this.cleanup();

    if (this.points.length === 1) {
      // Preview line from start to current position
      const pathData = `M ${this.points[0].x} ${this.points[0].y} L ${finalX} ${finalY}`;
      this.tempPath = new Path(pathData, {
        stroke: this.options.strokeColor,
        strokeWidth: this.options.strokeWidth,
        fill: null,
        strokeUniform: true,
        selectable: false,
        evented: false,
        strokeDashArray: [5, 5],
      });
      this.canvas.add(this.tempPath);
    } else if (this.points.length === 2) {
      // Preview L-shape from start -> elbow -> current position
      const pathData = `M ${this.points[0].x} ${this.points[0].y} L ${this.points[1].x} ${this.points[1].y} L ${finalX} ${finalY}`;
      this.tempPath = new Path(pathData, {
        stroke: this.options.strokeColor,
        strokeWidth: this.options.strokeWidth,
        fill: null,
        strokeUniform: true,
        selectable: false,
        evented: false,
        strokeDashArray: [5, 5],
      });
      this.canvas.add(this.tempPath);

      // Add preview arrow at end
      const angle = this.calculateAngle(this.points[1], { x: finalX, y: finalY });
      const arrowSize = 10;
      const arrowAngle = 25 * (Math.PI / 180);

      const arrow1X = finalX - arrowSize * Math.cos(angle - arrowAngle);
      const arrow1Y = finalY - arrowSize * Math.sin(angle - arrowAngle);
      const arrow2X = finalX - arrowSize * Math.cos(angle + arrowAngle);
      const arrow2Y = finalY - arrowSize * Math.sin(angle + arrowAngle);

      this.tempArrow = new Polygon([
        { x: finalX, y: finalY },
        { x: arrow1X, y: arrow1Y },
        { x: arrow2X, y: arrow2Y },
      ], {
        fill: this.options.strokeColor,
        stroke: this.options.strokeColor,
        strokeWidth: 0,
        selectable: false,
        evented: false,
        opacity: 0.7,
      });
      this.canvas.add(this.tempArrow);
    }

    this.canvas.requestRenderAll();
  }

  private calculateAngle(from: Point, to: Point): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  private finish(start: Point, elbow: Point, end: Point): void {
    this.cleanup();

    // Restore original states
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

    // Create the final path
    const pathData = `M ${start.x} ${start.y} L ${elbow.x} ${elbow.y} L ${end.x} ${end.y}`;
    const finalPath = new Path(pathData, {
      stroke: this.options.strokeColor,
      strokeWidth: this.options.strokeWidth,
      fill: null,
      strokeUniform: true,
      objectCaching: false,
    });

    // Create arrow at the end
    const angle = this.calculateAngle(elbow, end);
    const arrowSize = 10;
    const arrowAngle = 25 * (Math.PI / 180);

    const arrow1X = end.x - arrowSize * Math.cos(angle - arrowAngle);
    const arrow1Y = end.y - arrowSize * Math.sin(angle - arrowAngle);
    const arrow2X = end.x - arrowSize * Math.cos(angle + arrowAngle);
    const arrow2Y = end.y - arrowSize * Math.sin(angle + arrowAngle);

    const finalArrow = new Polygon([
      { x: end.x, y: end.y },
      { x: arrow1X, y: arrow1Y },
      { x: arrow2X, y: arrow2Y },
    ], {
      fill: this.options.strokeColor,
      stroke: this.options.strokeColor,
      strokeWidth: 0,
      objectCaching: false,
    });

    // Group path and arrow together
    const group = new Group([finalPath, finalArrow], {
      selectable: true,
      objectCaching: false,
    });

    // Keep arrow size and orientation consistent when scaling
    group.on('scaling', function() {
      const grp = this as Group;
      const scaleX = grp.scaleX || 1;
      const scaleY = grp.scaleY || 1;
      
      const arrow = grp.getObjects()[1];
      if (arrow) {
        // Counter-scale the arrow to maintain its size
        arrow.scaleX = 1 / scaleX;
        arrow.scaleY = 1 / scaleY;
      }
    });

    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();

    this.isDrawing = false;
    this.points = [];
  }

  cancel(): void {
    this.cleanup();
    
    // Restore original states
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
    this.points = [];
    this.canvas.requestRenderAll();
  }

  private cleanup(): void {
    if (this.tempPath) {
      this.canvas.remove(this.tempPath);
      this.tempPath = null;
    }
    if (this.tempArrow) {
      this.canvas.remove(this.tempArrow);
      this.tempArrow = null;
    }
  }
}
