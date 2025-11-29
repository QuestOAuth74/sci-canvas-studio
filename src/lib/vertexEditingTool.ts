import { Canvas, Path, Polygon, Control, FabricObject, util, Point } from "fabric";

export interface VertexData {
  index: number;
  x: number;
  y: number;
  isControl?: boolean; // For bezier control points
}

export class VertexEditingManager {
  private canvas: Canvas;
  private activeObject: Path | Polygon | null = null;
  private originalVertices: VertexData[] = [];
  private vertexHandles: Map<number, Control> = new Map();

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  /**
   * Enable vertex editing for a Path or Polygon object
   */
  enableVertexEditing(object: FabricObject): boolean {
    if (!this.isEditableObject(object)) {
      console.warn('Object is not editable for vertices');
      return false;
    }

    this.activeObject = object as Path | Polygon;
    
    // Extract vertices based on object type
    if (this.isPath(object)) {
      this.extractPathVertices(object as Path);
    } else if (this.isPolygon(object)) {
      this.extractPolygonVertices(object as Polygon);
    }

    // Add custom vertex controls
    this.addVertexControls();
    
    // Refresh canvas
    this.canvas.requestRenderAll();
    
    return true;
  }

  /**
   * Disable vertex editing and remove all vertex controls
   */
  disableVertexEditing(): void {
    if (!this.activeObject) return;

    // Remove custom controls
    this.removeVertexControls();
    
    // Clear state
    this.activeObject = null;
    this.originalVertices = [];
    this.vertexHandles.clear();
    
    this.canvas.requestRenderAll();
  }

  /**
   * Add a new vertex at a specific position
   */
  addVertex(index: number, x: number, y: number): boolean {
    if (!this.activeObject) return false;

    if (this.isPath(this.activeObject)) {
      return this.addPathVertex(index, x, y);
    } else if (this.isPolygon(this.activeObject)) {
      return this.addPolygonVertex(index, x, y);
    }

    return false;
  }

  /**
   * Remove a vertex at a specific index
   */
  removeVertex(index: number): boolean {
    if (!this.activeObject) return false;
    if (this.originalVertices.length <= 3) {
      console.warn('Cannot remove vertex: minimum 3 vertices required');
      return false;
    }

    if (this.isPath(this.activeObject)) {
      return this.removePathVertex(index);
    } else if (this.isPolygon(this.activeObject)) {
      return this.removePolygonVertex(index);
    }

    return false;
  }

  /**
   * Get current vertex count
   */
  getVertexCount(): number {
    return this.originalVertices.length;
  }

  /**
   * Check if an object can be edited for vertices
   */
  private isEditableObject(object: FabricObject): boolean {
    return this.isPath(object) || this.isPolygon(object);
  }

  private isPath(object: FabricObject): boolean {
    return object instanceof Path || object.type === 'path';
  }

  private isPolygon(object: FabricObject): boolean {
    return object instanceof Polygon || object.type === 'polygon';
  }

  /**
   * Extract vertices from a Path object
   */
  private extractPathVertices(path: Path): void {
    this.originalVertices = [];
    
    // Parse SVG path commands
    const pathData = path.path;
    if (!pathData || pathData.length === 0) return;

    let index = 0;
    pathData.forEach((command) => {
      const cmd = command[0];
      
      // Handle different path commands
      if (cmd === 'M' || cmd === 'L') {
        // Move or Line command - simple x,y point
        this.originalVertices.push({
          index: index++,
          x: command[1] as number,
          y: command[2] as number,
        });
      } else if (cmd === 'Q') {
        // Quadratic bezier - control point + end point
        this.originalVertices.push({
          index: index++,
          x: command[1] as number,
          y: command[2] as number,
          isControl: true,
        });
        this.originalVertices.push({
          index: index++,
          x: command[3] as number,
          y: command[4] as number,
        });
      } else if (cmd === 'C') {
        // Cubic bezier - 2 control points + end point
        this.originalVertices.push({
          index: index++,
          x: command[1] as number,
          y: command[2] as number,
          isControl: true,
        });
        this.originalVertices.push({
          index: index++,
          x: command[3] as number,
          y: command[4] as number,
          isControl: true,
        });
        this.originalVertices.push({
          index: index++,
          x: command[5] as number,
          y: command[6] as number,
        });
      }
    });

    // For freeform paths, sample every Nth point to avoid clutter
    if (this.originalVertices.length > 20) {
      const samplingRate = Math.ceil(this.originalVertices.length / 15);
      this.originalVertices = this.originalVertices.filter((_, i) => i % samplingRate === 0);
      // Always include first and last
      this.originalVertices.push({
        index: pathData.length - 1,
        x: pathData[pathData.length - 1][1] as number,
        y: pathData[pathData.length - 1][2] as number,
      });
    }
  }

  /**
   * Extract vertices from a Polygon object
   */
  private extractPolygonVertices(polygon: Polygon): void {
    this.originalVertices = [];
    
    const points = polygon.points;
    if (!points) return;

    points.forEach((point, index) => {
      this.originalVertices.push({
        index,
        x: point.x,
        y: point.y,
      });
    });
  }

  /**
   * Add custom Fabric.js controls for each vertex
   */
  private addVertexControls(): void {
    if (!this.activeObject) return;

    const controls: Record<string, Control> = {};

    this.originalVertices.forEach((vertex, idx) => {
      const controlKey = `vertex_${idx}`;
      
      controls[controlKey] = new Control({
        positionHandler: this.createPositionHandler(vertex),
        actionHandler: this.createActionHandler(vertex),
        render: this.createRenderFunction(vertex),
        cursorStyle: 'move',
        // @ts-ignore - Custom property for tracking
        __vertexIndex: idx,
      });
    });

    // Assign controls to the object
    this.activeObject.controls = {
      ...this.activeObject.controls,
      ...controls,
    };

    this.activeObject.setCoords();
  }

  /**
   * Remove vertex controls from the object
   */
  private removeVertexControls(): void {
    if (!this.activeObject) return;

    const controls = this.activeObject.controls;
    if (!controls) return;

    // Remove all vertex controls
    Object.keys(controls).forEach((key) => {
      if (key.startsWith('vertex_')) {
        delete controls[key];
      }
    });

    this.activeObject.setCoords();
  }

  /**
   * Create position handler for a vertex control
   */
  private createPositionHandler(vertex: VertexData) {
    return (dim: any, finalMatrix: any, fabricObject: FabricObject) => {
      if (this.isPolygon(fabricObject)) {
        const polygon = fabricObject as Polygon;
        const point = polygon.points![vertex.index];
        return new Point(
          util.transformPoint(
            { x: point.x, y: point.y },
            polygon.calcTransformMatrix()
          )
        );
      } else if (this.isPath(fabricObject)) {
        // For paths, transform the local vertex position
        return new Point(
          util.transformPoint(
            { x: vertex.x, y: vertex.y },
            fabricObject.calcTransformMatrix()
          )
        );
      }
      return new Point(0, 0);
    };
  }

  /**
   * Create action handler for dragging a vertex
   */
  private createActionHandler(vertex: VertexData) {
    return (eventData: MouseEvent, transform: any, x: number, y: number): boolean => {
      const target = transform.target;
      
      // Transform world coordinates back to local object space
      const localPoint = util.transformPoint(
        { x, y },
        util.invertTransform(target.calcTransformMatrix())
      );

      if (this.isPolygon(target)) {
        const polygon = target as Polygon;
        if (polygon.points && polygon.points[vertex.index]) {
          polygon.points[vertex.index] = localPoint;
          polygon.setCoords();
          polygon.dirty = true;
        }
      } else if (this.isPath(target)) {
        // Update path data for the vertex
        this.updatePathVertex(target as Path, vertex.index, localPoint.x, localPoint.y);
      }

      this.canvas.requestRenderAll();
      return true;
    };
  }

  /**
   * Create render function for a vertex handle
   */
  private createRenderFunction(vertex: VertexData) {
    return (
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      styleOverride: any,
      fabricObject: FabricObject
    ): void => {
      ctx.save();
      
      // Draw vertex handle
      ctx.beginPath();
      const size = vertex.isControl ? 4 : 6;
      ctx.arc(left, top, size, 0, Math.PI * 2);
      
      // Different colors for control points vs regular vertices
      ctx.fillStyle = vertex.isControl ? '#8b5cf6' : '#0D9488';
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.restore();
    };
  }

  /**
   * Update a path vertex position
   */
  private updatePathVertex(path: Path, index: number, x: number, y: number): void {
    if (!path.path || path.path.length === 0) return;

    // Find the command that contains this vertex
    let currentIndex = 0;
    for (let i = 0; i < path.path.length; i++) {
      const command = path.path[i];
      const cmd = command[0];

      if (cmd === 'M' || cmd === 'L') {
        if (currentIndex === index) {
          command[1] = x;
          command[2] = y;
          break;
        }
        currentIndex++;
      } else if (cmd === 'Q') {
        if (currentIndex === index) {
          command[1] = x;
          command[2] = y;
          break;
        } else if (currentIndex + 1 === index) {
          command[3] = x;
          command[4] = y;
          break;
        }
        currentIndex += 2;
      } else if (cmd === 'C') {
        if (currentIndex === index) {
          command[1] = x;
          command[2] = y;
          break;
        } else if (currentIndex + 1 === index) {
          command[3] = x;
          command[4] = y;
          break;
        } else if (currentIndex + 2 === index) {
          command[5] = x;
          command[6] = y;
          break;
        }
        currentIndex += 3;
      }
    }

    path.setCoords();
    path.dirty = true;
  }

  /**
   * Add a vertex to a path
   */
  private addPathVertex(index: number, x: number, y: number): boolean {
    // TODO: Implement path vertex insertion
    console.log('Add path vertex not yet implemented');
    return false;
  }

  /**
   * Remove a vertex from a path
   */
  private removePathVertex(index: number): boolean {
    // TODO: Implement path vertex removal
    console.log('Remove path vertex not yet implemented');
    return false;
  }

  /**
   * Add a vertex to a polygon
   */
  private addPolygonVertex(index: number, x: number, y: number): boolean {
    if (!this.activeObject || !this.isPolygon(this.activeObject)) return false;
    
    const polygon = this.activeObject as Polygon;
    if (!polygon.points) return false;

    const newPoint = new Point(x, y);
    polygon.points.splice(index + 1, 0, newPoint);
    
    this.disableVertexEditing();
    this.enableVertexEditing(polygon);
    
    return true;
  }

  /**
   * Remove a vertex from a polygon
   */
  private removePolygonVertex(index: number): boolean {
    if (!this.activeObject || !this.isPolygon(this.activeObject)) return false;
    
    const polygon = this.activeObject as Polygon;
    if (!polygon.points || polygon.points.length <= 3) return false;

    polygon.points.splice(index, 1);
    
    this.disableVertexEditing();
    this.enableVertexEditing(polygon);
    
    return true;
  }

  /**
   * Get active object being edited
   */
  getActiveObject(): Path | Polygon | null {
    return this.activeObject;
  }

  /**
   * Check if currently in vertex editing mode
   */
  isEditingVertices(): boolean {
    return this.activeObject !== null;
  }
}
