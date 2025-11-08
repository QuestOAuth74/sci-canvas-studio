import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, FabricObject, Path, Line, Circle, Group, Point as FabricPoint, util } from "fabric";
import { useCanvas } from "@/contexts/CanvasContext";
import { ShapeWithPorts } from "@/types/connector";
import { toast } from "sonner";

interface Waypoint {
  id: string;
  x: number;
  y: number;
  handle: Circle;
}

export const LineEditingHandles = () => {
  const { canvas, selectedObject } = useCanvas();
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [middleHandles, setMiddleHandles] = useState<Circle[]>([]);

  useEffect(() => {
    if (!canvas || !selectedObject) {
      cleanupHandles();
      return;
    }

    // Check if selected object is a line that supports waypoint editing
    const isOrthogonalLine = (selectedObject as any).isOrthogonalLine;
    const isCurvedLine = (selectedObject as any).isCurvedLine;
    const isStraightLine = (selectedObject as any).isStraightLine;
    const isConnector = (selectedObject as ShapeWithPorts).isConnector;

    if ((isOrthogonalLine || isCurvedLine || isStraightLine) && !isConnector) {
      createEditingHandles();
    } else {
      cleanupHandles();
    }

    return () => {
      cleanupHandles();
    };
  }, [canvas, selectedObject]);

  const cleanupHandles = () => {
    waypoints.forEach(wp => canvas?.remove(wp.handle));
    middleHandles.forEach(h => canvas?.remove(h));
    setWaypoints([]);
    setMiddleHandles([]);
  };

  const createEditingHandles = () => {
    if (!canvas || !selectedObject) return;

    cleanupHandles();

    const linePoints = getLinePoints(selectedObject);
    if (!linePoints || linePoints.length < 2) return;

    // Create middle handles between each segment
    const newMiddleHandles: Circle[] = [];
    for (let i = 0; i < linePoints.length - 1; i++) {
      const p1 = linePoints[i];
      const p2 = linePoints[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      const handle = new Circle({
        left: midX,
        top: midY,
        radius: 6,
        fill: '#ffffff',
        stroke: '#0D9488',
        strokeWidth: 2,
        strokeDashArray: [3, 3],
        originX: 'center',
        originY: 'center',
        opacity: 0.8,
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: false,
        hoverCursor: 'copy',
      } as any);

      (handle as any).isMiddleHandle = true;
      (handle as any).segmentIndex = i;

      // On mouse down, convert to waypoint handle
      handle.on('mousedown', () => {
        addWaypointAtSegment(i, midX, midY);
        canvas.remove(handle);
        const idx = newMiddleHandles.indexOf(handle);
        if (idx > -1) newMiddleHandles.splice(idx, 1);
      });

      canvas.add(handle);
      newMiddleHandles.push(handle);
    }

    setMiddleHandles(newMiddleHandles);

    // Create waypoint handles if they exist
    const existingWaypoints = (selectedObject as any).waypoints as Array<{x: number, y: number}>;
    if (existingWaypoints && existingWaypoints.length > 0) {
      const newWaypoints: Waypoint[] = existingWaypoints.map((wp, idx) => {
        const handle = createWaypointHandle(wp.x, wp.y, idx);
        return {
          id: `wp-${idx}`,
          x: wp.x,
          y: wp.y,
          handle
        };
      });
      setWaypoints(newWaypoints);
    }
  };

  const getLinePoints = (obj: FabricObject): Array<{x: number, y: number}> | null => {
    if ((obj as any).isOrthogonalLine) {
      const points = (obj as any).orthogonalLinePoints;
      return points ? points.map((p: any) => ({x: p.x, y: p.y})) : null;
    }
    if ((obj as any).isCurvedLine) {
      const start = (obj as any).curvedStart;
      const end = (obj as any).curvedEnd;
      const control = (obj as any).curvedControl;
      if (start && end) {
        return [
          {x: start.x, y: start.y},
          control ? {x: control.x, y: control.y} : {x: (start.x + end.x) / 2, y: (start.y + end.y) / 2},
          {x: end.x, y: end.y}
        ];
      }
    }
    if ((obj as any).isStraightLine) {
      const points = (obj as any).straightLinePoints;
      return points ? points.map((p: any) => ({x: p.x, y: p.y})) : null;
    }
    return null;
  };

  const createWaypointHandle = (x: number, y: number, index: number): Circle => {
    if (!canvas) throw new Error("Canvas not initialized");

    const handle = new Circle({
      left: x,
      top: y,
      radius: 7,
      fill: '#0D9488',
      stroke: '#ffffff',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'move',
    } as any);

    (handle as any).isWaypointHandle = true;
    (handle as any).waypointIndex = index;

    // Dragging waypoint
    handle.on('moving', (e: any) => {
      const newX = e.target.left;
      const newY = e.target.top;
      updateWaypoint(index, newX, newY);
    });

    // Double-click to remove waypoint
    let lastClick = 0;
    handle.on('mousedown', () => {
      const now = Date.now();
      if (now - lastClick < 300) {
        removeWaypoint(index);
      }
      lastClick = now;
    });

    canvas.add(handle);
    return handle;
  };

  const addWaypointAtSegment = (segmentIndex: number, x: number, y: number) => {
    if (!canvas || !selectedObject) return;

    const currentWaypoints = (selectedObject as any).waypoints || [];
    const newWaypoints = [...currentWaypoints];
    newWaypoints.splice(segmentIndex, 0, {x, y});
    
    (selectedObject as any).waypoints = newWaypoints;
    updateLineWithWaypoints(newWaypoints);
    createEditingHandles(); // Recreate all handles
    
    toast.success("Waypoint added. Double-click to remove.");
  };

  const updateWaypoint = (index: number, x: number, y: number) => {
    if (!selectedObject) return;

    const currentWaypoints = (selectedObject as any).waypoints || [];
    if (index >= 0 && index < currentWaypoints.length) {
      currentWaypoints[index] = {x, y};
      (selectedObject as any).waypoints = currentWaypoints;
      updateLineWithWaypoints(currentWaypoints);
    }
  };

  const removeWaypoint = (index: number) => {
    if (!canvas || !selectedObject) return;

    const currentWaypoints = (selectedObject as any).waypoints || [];
    currentWaypoints.splice(index, 1);
    (selectedObject as any).waypoints = currentWaypoints;
    
    updateLineWithWaypoints(currentWaypoints);
    createEditingHandles(); // Recreate all handles
    
    toast.info("Waypoint removed");
  };

  const updateLineWithWaypoints = (waypointsData: Array<{x: number, y: number}>) => {
    if (!canvas || !selectedObject) return;

    // For orthogonal lines, recalculate path
    if ((selectedObject as any).isOrthogonalLine) {
      updateOrthogonalLineWithWaypoints(waypointsData);
    }
    // For curved lines, add waypoints as intermediate control points
    else if ((selectedObject as any).isCurvedLine) {
      updateCurvedLineWithWaypoints(waypointsData);
    }
    // For straight lines, insert intermediate points
    else if ((selectedObject as any).isStraightLine) {
      updateStraightLineWithWaypoints(waypointsData);
    }

    canvas.renderAll();
  };

  const updateOrthogonalLineWithWaypoints = (waypointsData: Array<{x: number, y: number}>) => {
    if (!selectedObject || !(selectedObject instanceof Group)) return;

    const objects = selectedObject.getObjects();
    const path = objects[0] as Path;
    if (!path) return;

    const originalPoints = (selectedObject as any).orthogonalLinePoints || [];
    if (originalPoints.length < 2) return;

    // Insert waypoints between start and end
    const newPoints = [
      originalPoints[0],
      ...waypointsData,
      originalPoints[originalPoints.length - 1]
    ];

    // Build new path with waypoints as orthogonal segments
    let pathData = `M ${newPoints[0].x} ${newPoints[0].y}`;
    for (let i = 1; i < newPoints.length; i++) {
      pathData += ` L ${newPoints[i].x} ${newPoints[i].y}`;
    }

    path.set({ path: util.parsePath(pathData) });
    (selectedObject as any).orthogonalLinePoints = newPoints;

    // Update local coordinates
    const inv = util.invertTransform(selectedObject.calcTransformMatrix());
    const localPoints = newPoints.map((p: any) => util.transformPoint(new FabricPoint(p.x, p.y), inv));
    (selectedObject as any).orthogonalLineLocalPoints = localPoints;
  };

  const updateCurvedLineWithWaypoints = (waypointsData: Array<{x: number, y: number}>) => {
    if (!selectedObject || !(selectedObject instanceof Group)) return;

    const objects = selectedObject.getObjects();
    const path = objects[0] as Path;
    if (!path) return;

    const start = (selectedObject as any).curvedStart;
    const end = (selectedObject as any).curvedEnd;
    if (!start || !end) return;

    // Create smooth curve through all points
    const allPoints = [start, ...waypointsData, end];
    const pathData = calculateSmoothPathThroughPoints(allPoints);

    path.set({ path: util.parsePath(pathData) });
  };

  const updateStraightLineWithWaypoints = (waypointsData: Array<{x: number, y: number}>) => {
    if (!selectedObject) return;

    const originalPoints = (selectedObject as any).straightLinePoints || [];
    if (originalPoints.length < 2) return;

    const newPoints = [
      originalPoints[0],
      ...waypointsData,
      originalPoints[originalPoints.length - 1]
    ];

    if (selectedObject instanceof Group) {
      const objects = selectedObject.getObjects();
      const path = objects[0] as Path;
      if (path) {
        let pathData = `M ${newPoints[0].x} ${newPoints[0].y}`;
        for (let i = 1; i < newPoints.length; i++) {
          pathData += ` L ${newPoints[i].x} ${newPoints[i].y}`;
        }
        path.set({ path: util.parsePath(pathData) });
        (selectedObject as any).straightLinePoints = newPoints;

        // Update local coordinates
        const inv = util.invertTransform(selectedObject.calcTransformMatrix());
        const localPoints = newPoints.map((p: any) => util.transformPoint(new FabricPoint(p.x, p.y), inv));
        (selectedObject as any).straightLineLocalPoints = localPoints;
      }
    }
  };

  const calculateSmoothPathThroughPoints = (points: Array<{x: number, y: number}>): string => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    const tension = 0.4;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  return null;
};
