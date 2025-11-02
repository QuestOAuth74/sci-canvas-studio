import { Path, Point, FabricObject, Canvas as FabricCanvas, Polygon, Group } from "fabric";
import { ConnectorData, ShapeWithPorts, ArrowMarkerType, LineStyle, RoutingStyle } from "@/types/connector";
import { calculateShapePorts, findNearestPort } from "./portManager";
import { routeStraight, routeCurved, routeOrthogonal, pointsToPath, smoothOrthogonalPath } from "./lineRouting";

// Create arrow marker polygon
function createArrowMarker(
  x: number,
  y: number,
  angle: number,
  markerType: ArrowMarkerType,
  color: string,
  size: number = 10
): Polygon | null {
  if (markerType === 'none') return null;

  const angleRad = (angle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  let points: { x: number; y: number }[] = [];

  switch (markerType) {
    case 'arrow':
      points = [
        { x: 0, y: 0 },
        { x: -size, y: -size / 2 },
        { x: -size, y: size / 2 },
      ];
      break;
    case 'open-arrow':
      points = [
        { x: -size, y: -size / 2 },
        { x: 0, y: 0 },
        { x: -size, y: size / 2 },
      ];
      break;
    case 'diamond':
      points = [
        { x: 0, y: 0 },
        { x: -size / 2, y: -size / 2 },
        { x: -size, y: 0 },
        { x: -size / 2, y: size / 2 },
      ];
      break;
    case 'circle':
      // Approximate circle with polygon
      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        points.push({
          x: -size / 2 + (size / 2) * Math.cos(a),
          y: (size / 2) * Math.sin(a),
        });
      }
      break;
    case 'block':
      points = [
        { x: 0, y: -size / 2 },
        { x: -size, y: -size / 2 },
        { x: -size, y: size / 2 },
        { x: 0, y: size / 2 },
      ];
      break;
    case 'tee':
      // Perpendicular bar at the end (like inhibition marker)
      points = [
        { x: 0, y: -size / 2 },
        { x: 0, y: size / 2 },
      ];
      break;
  }

  // Rotate and translate points
  const transformedPoints = points.map(p => ({
    x: x + p.x * cos - p.y * sin,
    y: y + p.x * sin + p.y * cos,
  }));

  return new Polygon(transformedPoints, {
    fill: markerType === 'open-arrow' ? 'transparent' : color,
    stroke: color,
    strokeWidth: 2,
    selectable: false,
    evented: false,
    strokeUniform: true,
  } as any);
}

// Get stroke dash array based on line style
function getStrokeDashArray(lineStyle: LineStyle): number[] | undefined {
  switch (lineStyle) {
    case 'dashed':
      return [10, 5];
    case 'dotted':
      return [2, 3];
    case 'dash-dot':
      return [10, 5, 2, 5];
    default:
      return undefined;
  }
}

// Create a connector line between two points or shapes
export function createConnector(
  canvas: FabricCanvas,
  options: Partial<ConnectorData> & {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }
): FabricObject {
  const {
    startX,
    startY,
    endX,
    endY,
    startMarker = 'none',
    endMarker = 'arrow',
    lineStyle = 'solid',
    routingStyle = 'straight',
    strokeWidth = 2,
    strokeColor = '#000000',
  } = options;

  const start = new Point(startX, startY);
  const end = new Point(endX, endY);

  let pathData: string;
  
  // Generate path based on routing style
  switch (routingStyle) {
    case 'curved':
      pathData = routeCurved(start, end, 0.3);
      break;
    case 'orthogonal':
      const orthPoints = routeOrthogonal(start, end);
      pathData = smoothOrthogonalPath(orthPoints, 8);
      break;
    default:
      pathData = pointsToPath(routeStraight(start, end));
  }

  // Create the main path
  const path = new Path(pathData, {
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    fill: '',
    strokeDashArray: getStrokeDashArray(lineStyle),
    selectable: true,
    evented: true,
    strokeUniform: true,
  } as any);

  // Calculate angle for end marker
  const dx = endX - startX;
  const dy = endY - startY;
  const endAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const startAngle = endAngle + 180;

  // Create markers
  const startMarkerObj = createArrowMarker(startX, startY, startAngle, startMarker, strokeColor);
  const endMarkerObj = createArrowMarker(endX, endY, endAngle, endMarker, strokeColor);

  // Store connector data
  const connectorData: ConnectorData = {
    id: `connector-${Date.now()}`,
    startMarker,
    endMarker,
    lineStyle,
    routingStyle,
    strokeWidth,
    strokeColor,
  };

  (path as ShapeWithPorts).connectorData = connectorData;
  (path as ShapeWithPorts).isConnector = true;

  // Group path and markers together
  const elements: FabricObject[] = [path];
  if (startMarkerObj) elements.push(startMarkerObj);
  if (endMarkerObj) elements.push(endMarkerObj);

  const connectorGroup = new Group(elements, {
    selectable: true,
    subTargetCheck: false, // Prevent selecting individual elements
  } as any);

  // Store connector data on the group instead of path
  (connectorGroup as ShapeWithPorts).connectorData = connectorData;
  (connectorGroup as ShapeWithPorts).isConnector = true;

  canvas.add(connectorGroup);
  return connectorGroup;
}

// Update connector when connected shapes move
export function updateConnector(
  canvas: FabricCanvas,
  connector: ShapeWithPorts
): void {
  if (!connector.connectorData || !connector.isConnector) return;

  const data = connector.connectorData;
  
  // Get the path from the group (first object)
  const group = connector as any;
  const path = group._objects?.[0] as Path;
  
  // Find connected shapes
  const sourceShape = data.sourceShapeId 
    ? canvas.getObjects().find(obj => (obj as any).id === data.sourceShapeId)
    : null;
  const targetShape = data.targetShapeId
    ? canvas.getObjects().find(obj => (obj as any).id === data.targetShapeId)
    : null;

  if (!sourceShape || !targetShape) return;

  // Get port positions
  const sourcePorts = calculateShapePorts(sourceShape);
  const targetPorts = calculateShapePorts(targetShape);
  
  const sourcePort = sourcePorts.find(p => p.id === data.sourcePort);
  const targetPort = targetPorts.find(p => p.id === data.targetPort);

  if (!sourcePort || !targetPort) return;

  // Update path
  const start = new Point(sourcePort.x, sourcePort.y);
  const end = new Point(targetPort.x, targetPort.y);

  let pathData: string;
  switch (data.routingStyle) {
    case 'curved':
      pathData = routeCurved(start, end, 0.3);
      break;
    case 'orthogonal':
      const orthPoints = routeOrthogonal(start, end, sourcePort, targetPort);
      pathData = smoothOrthogonalPath(orthPoints, 8);
      break;
    default:
      pathData = pointsToPath(routeStraight(start, end));
  }

  // Update the path within the group
  if (path instanceof Path) {
    path.set({ path: (Path as any).parsePath(pathData) } as any);
  }

  // Recalculate group bounds
  if (group instanceof Group) {
    group.setCoords();
  }

  canvas.renderAll();
}

// Find all connectors attached to a shape
export function findConnectedLines(canvas: FabricCanvas, shapeId: string): ShapeWithPorts[] {
  return canvas.getObjects().filter(obj => {
    const connector = obj as ShapeWithPorts;
    return connector.isConnector && 
           (connector.connectorData?.sourceShapeId === shapeId || 
            connector.connectorData?.targetShapeId === shapeId);
  }) as ShapeWithPorts[];
}
