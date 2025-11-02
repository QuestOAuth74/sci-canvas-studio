import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, FabricObject, Line } from "fabric";
import { useCanvas } from "@/contexts/CanvasContext";

export const useAlignmentGuides = () => {
  const { canvas } = useCanvas();
  const guideLinesRef = useRef<Line[]>([]);
  const snapThreshold = 5;

  useEffect(() => {
    if (!canvas) return;

    const clearGuides = () => {
      guideLinesRef.current.forEach(line => {
        canvas.remove(line);
      });
      guideLinesRef.current = [];
      canvas.renderAll();
    };

    const showAlignmentGuides = (movingObj: FabricObject) => {
      clearGuides();

      const allObjects = canvas.getObjects().filter(
        obj => obj !== movingObj && 
        obj.visible && 
        !(obj as any).isGridLine && 
        !(obj as any).isRuler &&
        !(obj as any).isGuideLine
      );

      const movingBounds = movingObj.getBoundingRect();
      const movingCenterX = movingBounds.left + movingBounds.width / 2;
      const movingCenterY = movingBounds.top + movingBounds.height / 2;
      const movingRight = movingBounds.left + movingBounds.width;
      const movingBottom = movingBounds.top + movingBounds.height;

      allObjects.forEach(target => {
        const targetBounds = target.getBoundingRect();
        const targetCenterX = targetBounds.left + targetBounds.width / 2;
        const targetCenterY = targetBounds.top + targetBounds.height / 2;
        const targetRight = targetBounds.left + targetBounds.width;
        const targetBottom = targetBounds.top + targetBounds.height;

        // Vertical alignment checks
        // Left edges
        if (Math.abs(movingBounds.left - targetBounds.left) < snapThreshold) {
          const line = createGuideLine([targetBounds.left, 0, targetBounds.left, canvas.height || 0]);
          guideLinesRef.current.push(line);
          canvas.add(line);
        }
        
        // Center vertical alignment
        if (Math.abs(movingCenterX - targetCenterX) < snapThreshold) {
          const line = createGuideLine([targetCenterX, 0, targetCenterX, canvas.height || 0]);
          guideLinesRef.current.push(line);
          canvas.add(line);
        }
        
        // Right edges
        if (Math.abs(movingRight - targetRight) < snapThreshold) {
          const line = createGuideLine([targetRight, 0, targetRight, canvas.height || 0]);
          guideLinesRef.current.push(line);
          canvas.add(line);
        }

        // Horizontal alignment checks
        // Top edges
        if (Math.abs(movingBounds.top - targetBounds.top) < snapThreshold) {
          const line = createGuideLine([0, targetBounds.top, canvas.width || 0, targetBounds.top]);
          guideLinesRef.current.push(line);
          canvas.add(line);
        }
        
        // Center horizontal alignment
        if (Math.abs(movingCenterY - targetCenterY) < snapThreshold) {
          const line = createGuideLine([0, targetCenterY, canvas.width || 0, targetCenterY]);
          guideLinesRef.current.push(line);
          canvas.add(line);
        }
        
        // Bottom edges
        if (Math.abs(movingBottom - targetBottom) < snapThreshold) {
          const line = createGuideLine([0, targetBottom, canvas.width || 0, targetBottom]);
          guideLinesRef.current.push(line);
          canvas.add(line);
        }
      });

      movingObj.setCoords();
      canvas.renderAll();
    };

    const createGuideLine = (coords: [number, number, number, number]): Line => {
      const line = new Line(coords, {
        stroke: '#FF00FF',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      (line as any).isGuideLine = true;
      return line;
    };

    canvas.on('object:moving', (e) => {
      if (e.target) {
        showAlignmentGuides(e.target);
      }
    });

    canvas.on('object:modified', clearGuides);
    canvas.on('selection:cleared', clearGuides);
    canvas.on('selection:updated', clearGuides);

    return () => {
      clearGuides();
      canvas.off('object:moving');
      canvas.off('object:modified');
      canvas.off('selection:cleared');
      canvas.off('selection:updated');
    };
  }, [canvas]);
};

export const AlignmentGuides = () => {
  useAlignmentGuides();
  return null;
};
