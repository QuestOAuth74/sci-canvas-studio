import { Circle, Line as FabricLine, Canvas as FabricCanvas, Point } from "fabric";

// Visual feedback for connector drawing (draw.io style)
export class ConnectorVisualFeedback {
  private canvas: FabricCanvas;
  private previewLine: FabricLine | null = null;
  private snapIndicators: Circle[] = [];
  private startMarker: Circle | null = null;

  constructor(canvas: FabricCanvas) {
    this.canvas = canvas;
  }

  // Show start point marker
  showStartMarker(x: number, y: number) {
    this.startMarker = new Circle({
      left: x,
      top: y,
      radius: 6,
      fill: '#0D9488',
      stroke: '#ffffff',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    } as any);

    this.canvas.add(this.startMarker);
    this.canvas.renderAll();
  }

  // Update preview line while dragging
  updatePreviewLine(startX: number, startY: number, endX: number, endY: number, isDashed: boolean = true) {
    // Remove old preview
    if (this.previewLine) {
      this.canvas.remove(this.previewLine);
    }

    // Create new preview
    this.previewLine = new FabricLine([startX, startY, endX, endY], {
      stroke: '#0D9488',
      strokeWidth: 2,
      strokeDashArray: isDashed ? [5, 5] : undefined,
      opacity: 0.7,
      selectable: false,
      evented: false,
    } as any);

    this.canvas.add(this.previewLine);
    this.canvas.renderAll();
  }

  // Show snap indicators (green circles) at connection points
  showSnapIndicators(points: Point[]) {
    // Clear existing indicators
    this.clearSnapIndicators();

    points.forEach(point => {
      const indicator = new Circle({
        left: point.x,
        top: point.y,
        radius: 8,
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      } as any);

      this.snapIndicators.push(indicator);
      this.canvas.add(indicator);
    });

    this.canvas.renderAll();
  }

  // Show snapped connection (green highlight)
  showSnappedConnection(x: number, y: number) {
    const snapCircle = new Circle({
      left: x,
      top: y,
      radius: 10,
      fill: '#10b981',
      opacity: 0.3,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    } as any);

    this.snapIndicators.push(snapCircle);
    this.canvas.add(snapCircle);
    this.canvas.renderAll();
  }

  // Clear all snap indicators
  clearSnapIndicators() {
    this.snapIndicators.forEach(indicator => {
      this.canvas.remove(indicator);
    });
    this.snapIndicators = [];
    this.canvas.renderAll();
  }

  // Clear all visual feedback
  clearAll() {
    if (this.previewLine) {
      this.canvas.remove(this.previewLine);
      this.previewLine = null;
    }
    if (this.startMarker) {
      this.canvas.remove(this.startMarker);
      this.startMarker = null;
    }
    this.clearSnapIndicators();
    this.canvas.renderAll();
  }

  // Animate snap effect (pulsing circle)
  animateSnap(x: number, y: number) {
    const pulseCircle = new Circle({
      left: x,
      top: y,
      radius: 5,
      fill: 'transparent',
      stroke: '#10b981',
      strokeWidth: 3,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    } as any);

    this.canvas.add(pulseCircle);

    // Animate expansion
    let scale = 1;
    const animate = () => {
      scale += 0.1;
      pulseCircle.set({
        scaleX: scale,
        scaleY: scale,
        opacity: 1 - (scale - 1) * 0.5,
      } as any);
      this.canvas.renderAll();

      if (scale < 2) {
        requestAnimationFrame(animate);
      } else {
        this.canvas.remove(pulseCircle);
        this.canvas.renderAll();
      }
    };

    animate();
  }
}
