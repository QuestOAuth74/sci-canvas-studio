import { Canvas, Group, Circle, Line } from "fabric";

export class CurvedLineEditMode {
  private canvas: Canvas;
  private curvedLine: Group | null = null;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  /**
   * Activate edit mode for a curved line
   */
  activate(curvedLineGroup: Group): void {
    if (!curvedLineGroup || !(curvedLineGroup as any).isCurvedLine) {
      console.warn('Can only edit curved lines');
      return;
    }

    this.curvedLine = curvedLineGroup;
    const curveData = curvedLineGroup as any;

    // Mark as in edit mode
    curveData.isEditMode = true;

    // Deselect the curve to hide the selection box/controls
    this.canvas.discardActiveObject();

    // Disable curve selection/resizing/rotating while in edit mode
    // Keep evented:true so it can receive double-click events to exit
    this.curvedLine.set({
      selectable: false,
      evented: true,
      hasControls: false,
      hasBorders: false,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      lockSkewingX: true,
      lockSkewingY: true,
      hoverCursor: 'default',
    });

    // Show the control handle and guide lines
    const controlHandle = curveData.controlHandle as Circle;
    const handleLines = curveData.handleLines as [Line, Line];

    if (controlHandle) {
      controlHandle.set({
        visible: true,
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: false,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        lockSkewingX: true,
        lockSkewingY: true,
      });

      // Hide all selection controls on the handle
      controlHandle.setControlsVisibility({
        tl: false,
        tr: false,
        br: false,
        bl: false,
        ml: false,
        mt: false,
        mr: false,
        mb: false,
        mtr: false,
      });

      // Update coordinates to ensure proper rendering
      controlHandle.setCoords();
    }

    if (handleLines && handleLines.length === 2) {
      handleLines[0].set({
        visible: true,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      });
      handleLines[1].set({
        visible: true,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      });
      handleLines[0].setCoords();
      handleLines[1].setCoords();
    }

    // Bring control handles to front
    if (controlHandle) {
      this.canvas.bringObjectToFront(controlHandle);
    }
    if (handleLines && handleLines.length === 2) {
      this.canvas.bringObjectToFront(handleLines[0]);
      this.canvas.bringObjectToFront(handleLines[1]);
    }

    this.canvas.requestRenderAll();
  }

  /**
   * Deactivate edit mode
   */
  deactivate(): void {
    if (!this.curvedLine) return;

    const curveData = this.curvedLine as any;

    // Mark as not in edit mode
    curveData.isEditMode = false;

    // Re-enable curve selection and controls
    this.curvedLine.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      lockSkewingX: false,
      lockSkewingY: false,
      hoverCursor: 'move',
    });

    // Hide the control handle and guide lines
    const controlHandle = curveData.controlHandle as Circle;
    const handleLines = curveData.handleLines as [Line, Line];

    if (controlHandle) {
      controlHandle.set({
        visible: false,
        selectable: false,
        evented: false,
      });
      controlHandle.setCoords();
    }

    if (handleLines && handleLines.length === 2) {
      handleLines[0].set({ visible: false });
      handleLines[1].set({ visible: false });
      handleLines[0].setCoords();
      handleLines[1].setCoords();
    }

    // Clear any active selections
    this.canvas.discardActiveObject();

    this.curvedLine = null;
    this.canvas.requestRenderAll();
  }

  /**
   * Check if edit mode is active
   */
  isActive(): boolean {
    return this.curvedLine !== null;
  }

  /**
   * Get the currently editing curved line
   */
  getCurvedLine(): Group | null {
    return this.curvedLine;
  }
}
