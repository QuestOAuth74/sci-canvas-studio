import { Canvas, Group, FabricObject, util, loadSVGFromString } from "fabric";
import { toast } from "sonner";

export interface Point {
  x: number;
  y: number;
}

export interface MembraneBrushOptions {
  iconSVG: string;
  iconSize: number;
  spacing: number;
  rotateToPath: boolean;
  doubleSided: boolean;
}

export class MembraneBrushTool {
  private canvas: Canvas;
  private options: MembraneBrushOptions;
  private pathPoints: Point[] = [];
  private previewGroup: Group | null = null;
  private isDrawing: boolean = false;

  constructor(canvas: Canvas, options: MembraneBrushOptions) {
    this.canvas = canvas;
    this.options = options;
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
    this.pathPoints = [];
    this.isDrawing = false;
    this.cleanup();
    this.disableObjectInteraction();
  }

  addPoint(x: number, y: number): void {
    this.pathPoints.push({ x, y });
    this.isDrawing = true;
  }

  updatePreview(): void {
    if (this.pathPoints.length < 2) return;
    
    this.cleanup();
    this.createPreviewIcons();
  }

  private async createPreviewIcons(): Promise<void> {
    const icons = await this.placeIconsAlongPath(true);
    if (icons.length === 0) return;

    this.previewGroup = new Group(icons, {
      selectable: false,
      evented: false,
    });
    (this.previewGroup as any).isTemp = true;
    this.canvas.add(this.previewGroup);
    this.canvas.renderAll();
  }

  async finish(): Promise<Group | null> {
    if (this.pathPoints.length < 2) {
      this.cancel();
      return null;
    }

    this.cleanup();
    
    try {
      const icons = await this.placeIconsAlongPath(false);
      if (icons.length === 0) {
        this.enableObjectInteraction();
        return null;
      }

      const membrane = new Group(icons, {
        selectable: true,
        evented: true,
      });
      
      (membrane as any).isMembrane = true;
      (membrane as any).membraneOptions = this.options;
      
      this.canvas.add(membrane);
      this.canvas.setActiveObject(membrane);
      this.enableObjectInteraction();
      this.canvas.renderAll();
      
      return membrane;
    } catch (error) {
      console.error("Error finishing membrane:", error);
      this.enableObjectInteraction();
      return null;
    }
  }

  cancel(): void {
    this.cleanup();
    this.enableObjectInteraction();
    this.pathPoints = [];
    this.isDrawing = false;
  }

  private cleanup(): void {
    if (this.previewGroup) {
      this.canvas.remove(this.previewGroup);
      this.previewGroup = null;
    }
    
    // Remove any temporary objects
    this.canvas.getObjects().forEach((obj) => {
      if ((obj as any).isTemp) {
        this.canvas.remove(obj);
      }
    });
    
    this.canvas.renderAll();
  }

  private smoothPath(points: Point[]): Point[] {
    if (points.length < 3) return points;
    
    const smoothed: Point[] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // Add interpolated points using Catmull-Rom spline
      const numSegments = 3;
      for (let t = 0; t < numSegments; t++) {
        const u = t / numSegments;
        const u2 = u * u;
        const u3 = u2 * u;
        
        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - (i + 1 < points.length - 1 ? points[i + 1].x : p2.x)) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + (i + 1 < points.length - 1 ? points[i + 1].x : p2.x)) * u3
        );
        
        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - (i + 1 < points.length - 1 ? points[i + 1].y : p2.y)) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + (i + 1 < points.length - 1 ? points[i + 1].y : p2.y)) * u3
        );
        
        smoothed.push({ x, y });
      }
    }
    
    smoothed.push(points[points.length - 1]);
    return smoothed;
  }

  private calculatePathLength(points: Point[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  private getPointAtDistance(points: Point[], distance: number): { point: Point; angle: number } | null {
    let accumulated = 0;
    
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      
      if (accumulated + segmentLength >= distance) {
        const ratio = (distance - accumulated) / segmentLength;
        const x = p1.x + dx * ratio;
        const y = p1.y + dy * ratio;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        return { point: { x, y }, angle };
      }
      
      accumulated += segmentLength;
    }
    
    return null;
  }

  private async placeIconsAlongPath(isPreview: boolean): Promise<FabricObject[]> {
    const smoothedPoints = this.smoothPath(this.pathPoints);
    const pathLength = this.calculatePathLength(smoothedPoints);
    const effectiveSpacing = this.options.iconSize + this.options.spacing;
    const numIcons = Math.max(2, Math.floor(pathLength / effectiveSpacing));
    
    const icons: FabricObject[] = [];
    
    return new Promise((resolve) => {
      loadSVGFromString(this.options.iconSVG).then(({ objects, options: svgOptions }) => {
        if (!objects || objects.length === 0) {
          toast.error("Failed to load icon");
          resolve([]);
          return;
        }
        
        const iconTemplate = new Group(objects);
        const scale = this.options.iconSize / Math.max(iconTemplate.width || 1, iconTemplate.height || 1);
        
        for (let i = 0; i < numIcons; i++) {
          const distance = (i / (numIcons - 1)) * pathLength;
          const result = this.getPointAtDistance(smoothedPoints, distance);
          
          if (!result) continue;
          
          // Clone the icon template
          iconTemplate.clone().then((icon) => {
            icon.set({
              left: result.point.x,
              top: result.point.y,
              scaleX: scale,
              scaleY: scale,
              originX: 'center',
              originY: 'center',
              selectable: false,
              evented: false,
            });
            
            if (this.options.rotateToPath) {
              icon.set({ angle: result.angle + 90 });
            }
            
            if (isPreview) {
              icon.set({ opacity: 0.6 });
            }
            
            icons.push(icon);
            
            // If double-sided, add mirrored icon
            if (this.options.doubleSided) {
              iconTemplate.clone().then((mirroredIcon) => {
                const offset = this.options.iconSize * 0.7;
                const perpAngle = (result.angle + 90) * (Math.PI / 180);
                const offsetX = Math.cos(perpAngle) * offset;
                const offsetY = Math.sin(perpAngle) * offset;
                
                mirroredIcon.set({
                  left: result.point.x + offsetX,
                  top: result.point.y + offsetY,
                  scaleX: scale,
                  scaleY: scale,
                  originX: 'center',
                  originY: 'center',
                  selectable: false,
                  evented: false,
                  angle: this.options.rotateToPath ? result.angle - 90 : 0,
                });
                
                if (isPreview) {
                  mirroredIcon.set({ opacity: 0.6 });
                }
                
                icons.push(mirroredIcon);
                
                // Resolve when all icons are placed
                if (icons.length >= (this.options.doubleSided ? numIcons * 2 : numIcons)) {
                  resolve(icons);
                }
              });
            } else if (icons.length >= numIcons) {
              resolve(icons);
            }
          });
        }
      }).catch(error => {
        console.error("Error loading SVG:", error);
        toast.error("Failed to load icon");
        resolve([]);
      });
    });
  }

  getState() {
    return {
      isDrawing: this.isDrawing,
      pointCount: this.pathPoints.length,
    };
  }
}
