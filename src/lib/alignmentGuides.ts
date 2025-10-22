import { Canvas as FabricCanvas, Line, Text, Group } from "fabric";
import { AlignmentGuide, DistanceInfo } from "./smartAlignment";

export class AlignmentGuideRenderer {
  private canvas: FabricCanvas;
  private activeGuides: Line[] = [];
  private distanceLabels: Group[] = [];
  private guideColor: string = '#FF00FF'; // Magenta like BioRender
  private distanceColor: string = '#0088FF'; // Blue for distances

  constructor(canvas: FabricCanvas) {
    this.canvas = canvas;
  }

  /**
   * Draw a vertical alignment guide
   */
  private drawVerticalGuide(x: number): Line {
    const canvasHeight = this.canvas.getHeight();
    const line = new Line([x, 0, x, canvasHeight], {
      stroke: this.guideColor,
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      opacity: 0.7,
      excludeFromExport: true
    });
    
    (line as any).isAlignmentGuide = true;
    return line;
  }

  /**
   * Draw a horizontal alignment guide
   */
  private drawHorizontalGuide(y: number): Line {
    const canvasWidth = this.canvas.getWidth();
    const line = new Line([0, y, canvasWidth, y], {
      stroke: this.guideColor,
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      opacity: 0.7,
      excludeFromExport: true
    });
    
    (line as any).isAlignmentGuide = true;
    return line;
  }

  /**
   * Draw a distance indicator between two points
   */
  private drawDistanceIndicator(distanceInfo: DistanceInfo): Group {
    const { fromPoint, toPoint, distance, direction } = distanceInfo;
    
    // Create the connecting line
    const line = new Line(
      [fromPoint.x, fromPoint.y, toPoint.x, toPoint.y],
      {
        stroke: this.distanceColor,
        strokeWidth: 1,
        selectable: false,
        evented: false
      }
    );

    // Create the distance label
    const midX = (fromPoint.x + toPoint.x) / 2;
    const midY = (fromPoint.y + toPoint.y) / 2;
    
    const text = new Text(`${Math.round(distance)}px`, {
      left: midX,
      top: midY,
      fontSize: 11,
      fill: '#FFFFFF',
      backgroundColor: this.distanceColor,
      padding: 3,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center'
    });

    // Create small end markers
    const markerSize = 4;
    const marker1 = new Line(
      direction === 'horizontal'
        ? [fromPoint.x, fromPoint.y - markerSize, fromPoint.x, fromPoint.y + markerSize]
        : [fromPoint.x - markerSize, fromPoint.y, fromPoint.x + markerSize, fromPoint.y],
      {
        stroke: this.distanceColor,
        strokeWidth: 1.5,
        selectable: false,
        evented: false
      }
    );
    
    const marker2 = new Line(
      direction === 'horizontal'
        ? [toPoint.x, toPoint.y - markerSize, toPoint.x, toPoint.y + markerSize]
        : [toPoint.x - markerSize, toPoint.y, toPoint.x + markerSize, toPoint.y],
      {
        stroke: this.distanceColor,
        strokeWidth: 1.5,
        selectable: false,
        evented: false
      }
    );

    const group = new Group([line, marker1, marker2, text], {
      selectable: false,
      evented: false,
      excludeFromExport: true
    });
    
    (group as any).isAlignmentGuide = true;
    return group;
  }

  /**
   * Update guides based on current alignment state
   */
  updateGuides(guides: AlignmentGuide[], distances: DistanceInfo[] = []): void {
    this.clearAllGuides();

    // Draw alignment guides
    guides.forEach(guide => {
      let line: Line;
      
      if (guide.type === 'vertical') {
        line = this.drawVerticalGuide(guide.position);
      } else {
        line = this.drawHorizontalGuide(guide.position);
      }
      
      this.activeGuides.push(line);
      this.canvas.add(line);
    });

    // Draw distance indicators
    distances.forEach(distanceInfo => {
      const indicator = this.drawDistanceIndicator(distanceInfo);
      this.distanceLabels.push(indicator);
      this.canvas.add(indicator);
    });

    // Send guides to back so they don't interfere with objects
    this.activeGuides.forEach(guide => this.canvas.sendObjectToBack(guide));
    this.distanceLabels.forEach(label => this.canvas.sendObjectToBack(label));
  }

  /**
   * Clear all active guides and distance labels
   */
  clearAllGuides(): void {
    this.activeGuides.forEach(guide => {
      this.canvas.remove(guide);
    });
    this.activeGuides = [];

    this.distanceLabels.forEach(label => {
      this.canvas.remove(label);
    });
    this.distanceLabels = [];
  }

  /**
   * Set custom guide color
   */
  setGuideColor(color: string): void {
    this.guideColor = color;
  }

  /**
   * Set custom distance indicator color
   */
  setDistanceColor(color: string): void {
    this.distanceColor = color;
  }

  /**
   * Cleanup when renderer is no longer needed
   */
  dispose(): void {
    this.clearAllGuides();
  }
}
