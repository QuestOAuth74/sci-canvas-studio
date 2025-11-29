import { Canvas, Path, Polygon, Control, FabricObject, util, Point, Group } from "fabric";

export interface VertexData {
  index: number;
  x: number;
  y: number;
  isControl?: boolean; // For bezier control points
}

export class VertexEditingManager {
  private canvas: Canvas;
  private activeObject: Path | Polygon | null = null;
  private parentGroup: Group | null = null; // For group-based lines
  private mainPath: Path | null = null; // The actual path inside a group
  private originalVertices: VertexData[] = [];
  private vertexHandles: Map<number, Control> = new Map();
  private hoveredVertexIndex: number | null = null; // Track which vertex is hovered
  private mousePosition: { x: number; y: number } | null = null;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.setupMouseTracking();
  }

  /**
   * Setup mouse tracking for vertex hover detection
   */
  private setupMouseTracking(): void {
    this.canvas.on('mouse:move', (e) => {
      if (!this.activeObject || !e.pointer) {
        this.hoveredVertexIndex = null;
        return;
      }

      this.mousePosition = { x: e.pointer.x, y: e.pointer.y };
      
      // Check if mouse is near any vertex handle
      let foundHover = false;
      const target = this.parentGroup || this.activeObject;
      
      for (let i = 0; i < this.originalVertices.length; i++) {
        const vertex = this.originalVertices[i];
        
        // Calculate vertex world position
        let worldPos: Point;
        if (this.parentGroup && this.mainPath) {
          worldPos = util.transformPoint(
            { x: vertex.x, y: vertex.y },
            util.multiplyTransformMatrices(
              this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0],
              this.parentGroup.calcTransformMatrix()
            )
          );
        } else if (this.isPolygon(this.activeObject)) {
          const polygon = this.activeObject as Polygon;
          const point = polygon.points![vertex.index];
          const pathOffset = polygon.pathOffset || { x: 0, y: 0 };
          worldPos = util.transformPoint(
            { x: point.x - pathOffset.x, y: point.y - pathOffset.y },
            util.multiplyTransformMatrices(
              this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0],
              polygon.calcTransformMatrix()
            )
          );
        } else {
          worldPos = util.transformPoint(
            { x: vertex.x, y: vertex.y },
            util.multiplyTransformMatrices(
              this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0],
              target.calcTransformMatrix()
            )
          );
        }
        
        // Check if mouse is within 15 pixels of vertex
        const distance = Math.sqrt(
          Math.pow(e.pointer.x - worldPos.x, 2) + 
          Math.pow(e.pointer.y - worldPos.y, 2)
        );
        
        if (distance < 15) {
          this.hoveredVertexIndex = i;
          foundHover = true;
          this.canvas.requestRenderAll();
          break;
        }
      }
      
      if (!foundHover && this.hoveredVertexIndex !== null) {
        this.hoveredVertexIndex = null;
        this.canvas.requestRenderAll();
      }
    });
  }

  /**
   * Enable vertex editing for a Path or Polygon object
   */
  enableVertexEditing(object: FabricObject): boolean {
    if (!this.isEditableObject(object)) {
      console.warn('Object is not editable for vertices');
      return false;
    }

    // Handle group-based lines (curved, orthogonal, straight)
    const isGroupLine = (object as any).isCurvedLine || 
      (object as any).isOrthogonalLine || 
      (object as any).isStraightLine;
    
    if (isGroupLine && object.type === 'group') {
      const group = object as Group;
      // Find the main path (not arrow markers)
      const mainPath = group.getObjects().find(obj => 
        obj.type === 'path' && !(obj as any).isArrowMarker
      ) as Path | undefined;
      
      if (!mainPath) {
        console.warn('VertexEditingManager: No main path found in line group');
        return false;
      }
      
      // Store references for group-based line editing
      this.parentGroup = group;
      this.mainPath = mainPath;
      this.activeObject = group as any; // Controls go on the group so they render
      this.extractPathVertices(mainPath);
      console.log('VertexEditingManager: Enabled for group-based line, vertices:', this.originalVertices.length);
    } else if (this.isPath(object)) {
      this.parentGroup = null;
      this.mainPath = null;
      this.activeObject = object as Path | Polygon;
      this.extractPathVertices(object as Path);
      console.log('VertexEditingManager: Enabled for path, vertices:', this.originalVertices.length);
    } else if (this.isPolygon(object)) {
      this.parentGroup = null;
      this.mainPath = null;
      this.activeObject = object as Path | Polygon;
      this.extractPolygonVertices(object as Polygon);
      console.log('VertexEditingManager: Enabled for polygon, vertices:', this.originalVertices.length);
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
    this.parentGroup = null;
    this.mainPath = null;
    this.originalVertices = [];
    this.vertexHandles.clear();
    this.hoveredVertexIndex = null;
    this.mousePosition = null;
    
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
   * Insert a vertex on the closest edge to the given point
   */
  insertVertexOnEdge(clickX: number, clickY: number): boolean {
    if (!this.activeObject) return false;

    const target = this.parentGroup || this.activeObject;
    const vertices = this.originalVertices;
    
    // Transform click coordinates to object local space
    const localPoint = util.transformPoint(
      { x: clickX, y: clickY },
      util.invertTransform(target.calcTransformMatrix())
    );

    // Find the closest edge
    let closestEdgeIndex = -1;
    let minDistance = Infinity;
    let insertPoint = { x: 0, y: 0 };

    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      
      // Skip control points
      if (v1.isControl || v2.isControl) continue;

      // Calculate distance from point to line segment
      const result = this.pointToLineSegmentDistance(
        localPoint.x, localPoint.y,
        v1.x, v1.y,
        v2.x, v2.y
      );

      if (result.distance < minDistance) {
        minDistance = result.distance;
        closestEdgeIndex = i;
        insertPoint = result.closest;
      }
    }

    // If click is within reasonable distance (20 pixels), insert vertex
    if (closestEdgeIndex !== -1 && minDistance < 20) {
      // Account for path offset in polygons
      if (this.isPolygon(this.activeObject)) {
        const polygon = this.activeObject as Polygon;
        const pathOffset = polygon.pathOffset || { x: 0, y: 0 };
        insertPoint.x += pathOffset.x;
        insertPoint.y += pathOffset.y;
      }

      return this.addVertex(closestEdgeIndex, insertPoint.x, insertPoint.y);
    }

    return false;
  }

  /**
   * Calculate distance from a point to a line segment
   */
  private pointToLineSegmentDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): { distance: number; closest: { x: number; y: number } } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Line segment is a point
      const dist = Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
      return { distance: dist, closest: { x: x1, y: y1 } };
    }

    // Calculate projection of point onto line segment
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]

    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    
    const distance = Math.sqrt(
      (px - closestX) * (px - closestX) + 
      (py - closestY) * (py - closestY)
    );

    return { distance, closest: { x: closestX, y: closestY } };
  }

  /**
   * Check if an object can be edited for vertices
   */
  private isEditableObject(object: FabricObject): boolean {
    // Direct path or polygon
    if (this.isPath(object) || this.isPolygon(object)) {
      return true;
    }
    
    // Group-based lines (curved, orthogonal, straight)
    const isGroupLine = (object as any).isCurvedLine || 
      (object as any).isOrthogonalLine || 
      (object as any).isStraightLine;
    
    if (isGroupLine && object.type === 'group') {
      const group = object as Group;
      // Check if group contains a main path
      return group.getObjects().some(obj => 
        obj.type === 'path' && !(obj as any).isArrowMarker
      );
    }
    
    return false;
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
      
      const control = new Control({
        positionHandler: this.createPositionHandler(vertex),
        actionHandler: this.createActionHandler(vertex),
        render: this.createRenderFunction(vertex),
        cursorStyle: 'move',
      });
      
      // Store the vertex index on the control for position handler
      (control as any).__vertexIndex = vertex.index;
      
      controls[controlKey] = control;
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
   * Create position handler for a vertex control.
   * Uses official Fabric.js pattern with pathOffset and viewportTransform.
   */
  private createPositionHandler(vertex: VertexData) {
    const self = this;
    return function(this: Control, dim: any, finalMatrix: any, fabricObject: FabricObject) {
      const pointIndex = (this as any).__vertexIndex;
      
      // For group-based lines, use the mainPath coordinates but apply group transform
      if (self.parentGroup && self.mainPath) {
        const localPoint = { x: vertex.x, y: vertex.y };
        return util.transformPoint(
          localPoint,
          util.multiplyTransformMatrices(
            fabricObject.canvas?.viewportTransform || [1, 0, 0, 1, 0, 0],
            self.parentGroup.calcTransformMatrix()
          )
        );
      }
      
      if (self.isPolygon(fabricObject)) {
        const polygon = fabricObject as Polygon;
        const point = polygon.points![pointIndex];
        const pathOffset = polygon.pathOffset || { x: 0, y: 0 };
        
        const x = point.x - pathOffset.x;
        const y = point.y - pathOffset.y;
        
        return util.transformPoint(
          { x, y },
          util.multiplyTransformMatrices(
            fabricObject.canvas?.viewportTransform || [1, 0, 0, 1, 0, 0],
            fabricObject.calcTransformMatrix()
          )
        );
      } else if (self.isPath(fabricObject)) {
        return util.transformPoint(
          { x: vertex.x, y: vertex.y },
          util.multiplyTransformMatrices(
            fabricObject.canvas?.viewportTransform || [1, 0, 0, 1, 0, 0],
            fabricObject.calcTransformMatrix()
          )
        );
      }
      return new Point(0, 0);
    };
  }

  /**
   * Create action handler for dragging a vertex with proper coordinate transforms.
   */
  private createActionHandler(vertex: VertexData) {
    return (eventData: MouseEvent, transform: any, x: number, y: number): boolean => {
      const target = transform.target;
      
      // For group-based lines, transform coordinates and update the mainPath
      if (this.parentGroup && this.mainPath) {
        // Transform from canvas space to group local space
        const groupLocalPoint = util.transformPoint(
          { x, y },
          util.invertTransform(this.parentGroup.calcTransformMatrix())
        );
        
        // Update the mainPath with the new vertex position
        this.updatePathVertex(this.mainPath, vertex.index, groupLocalPoint.x, groupLocalPoint.y);
        
        // Mark both path and group as dirty
        this.mainPath.dirty = true;
        this.parentGroup.dirty = true;
        this.parentGroup.setCoords();
        
        this.canvas.requestRenderAll();
        return true;
      }
      
      if (this.isPolygon(target)) {
        const polygon = target as Polygon;
        
        // Transform world coordinates back to local object space
        const localPoint = util.transformPoint(
          { x, y },
          util.invertTransform(polygon.calcTransformMatrix())
        );
        
        // Account for path offset
        const pathOffset = polygon.pathOffset || { x: 0, y: 0 };
        const finalPoint = {
          x: localPoint.x + pathOffset.x,
          y: localPoint.y + pathOffset.y
        };
        
        polygon.points![vertex.index] = finalPoint;
        polygon.dirty = true;
        polygon.setCoords();
      } else if (this.isPath(target)) {
        // Transform world coordinates back to local object space
        const localPoint = util.transformPoint(
          { x, y },
          util.invertTransform(target.calcTransformMatrix())
        );
        
        // Update the path vertex
        this.updatePathVertex(target as Path, vertex.index, localPoint.x, localPoint.y);
        
        target.dirty = true;
        target.setCoords();
      }

      this.canvas.requestRenderAll();
      return true;
    };
  }

  /**
   * Create render function for a vertex handle with tooltip
   */
  private createRenderFunction(vertex: VertexData) {
    const self = this;
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
      const size = vertex.isControl ? 5 : 7;
      ctx.arc(left, top, size, 0, Math.PI * 2);
      
      // Add subtle shadow for depth
      ctx.shadowBlur = 3;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowOffsetY = 1;
      
      // Different colors for control points vs regular vertices
      ctx.fillStyle = vertex.isControl ? '#8b5cf6' : '#0D9488';
      ctx.fill();
      
      // White border for contrast
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw tooltip if this vertex is hovered
      const vertexIndex = self.originalVertices.findIndex(v => v.index === vertex.index && v.x === vertex.x && v.y === vertex.y);
      if (self.hoveredVertexIndex === vertexIndex) {
        // Format coordinates
        const coordX = Math.round(vertex.x);
        const coordY = Math.round(vertex.y);
        const label = vertex.isControl 
          ? `Control #${vertex.index}\n(${coordX}, ${coordY})`
          : `Vertex #${vertex.index}\n(${coordX}, ${coordY})`;
        
        // Set tooltip text style
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        
        // Split label into lines
        const lines = label.split('\n');
        const lineHeight = 14;
        const padding = 6;
        
        // Measure text width
        const widths = lines.map(line => ctx.measureText(line).width);
        const maxWidth = Math.max(...widths);
        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2;
        
        // Position tooltip above and to the right of vertex
        const tooltipX = left + 12;
        const tooltipY = top - 12;
        
        // Draw tooltip background
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(tooltipX, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight);
        
        // Draw tooltip text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        lines.forEach((line, i) => {
          ctx.fillText(
            line,
            tooltipX + padding,
            tooltipY - tooltipHeight + padding + (i + 1) * lineHeight - 2
          );
        });
      }
      
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
    if (!this.activeObject || !this.isPath(this.activeObject)) return false;
    
    const path = this.activeObject as Path;
    if (!path.path || path.path.length === 0) return false;

    // Find the segment to split
    let currentIndex = 0;
    for (let i = 0; i < path.path.length; i++) {
      const command = path.path[i];
      const cmd = command[0];

      if (cmd === 'M' || cmd === 'L') {
        if (currentIndex === index) {
          // Insert a new L command after this point
          const newCommand: any = ['L', x, y];
          path.path.splice(i + 1, 0, newCommand);
          path.setCoords();
          path.dirty = true;
          this.canvas.requestRenderAll();
          
          // Re-enable vertex editing with updated vertices
          this.disableVertexEditing();
          this.enableVertexEditing(path);
          return true;
        }
        currentIndex++;
      } else if (cmd === 'Q') {
        currentIndex += 2;
      } else if (cmd === 'C') {
        currentIndex += 3;
      }
    }
    
    return false;
  }

  /**
   * Remove a vertex from a path
   */
  private removePathVertex(index: number): boolean {
    if (!this.activeObject || !this.isPath(this.activeObject)) return false;
    
    const path = this.activeObject as Path;
    if (!path.path || path.path.length <= 3) return false; // Need at least 3 commands (M + 2 points)

    // Find the command to remove
    let currentIndex = 0;
    for (let i = 0; i < path.path.length; i++) {
      const command = path.path[i];
      const cmd = command[0];

      if (cmd === 'M') {
        if (currentIndex === index && i > 0) {
          // Can't remove the first M command, but can remove subsequent ones
          path.path.splice(i, 1);
          path.setCoords();
          path.dirty = true;
          this.canvas.requestRenderAll();
          
          // Re-enable vertex editing with updated vertices
          this.disableVertexEditing();
          this.enableVertexEditing(path);
          return true;
        }
        currentIndex++;
      } else if (cmd === 'L') {
        if (currentIndex === index) {
          path.path.splice(i, 1);
          path.setCoords();
          path.dirty = true;
          this.canvas.requestRenderAll();
          
          // Re-enable vertex editing with updated vertices
          this.disableVertexEditing();
          this.enableVertexEditing(path);
          return true;
        }
        currentIndex++;
      } else if (cmd === 'Q') {
        currentIndex += 2;
      } else if (cmd === 'C') {
        currentIndex += 3;
      }
    }
    
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
