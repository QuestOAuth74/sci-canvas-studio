import { FabricObject } from "fabric";

export type PortPosition = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
export type PortType = 'input' | 'output' | 'both';
export type ArrowMarkerType = 'none' | 'arrow' | 'open-arrow' | 'diamond' | 'circle' | 'block' | 'tee';
export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'dash-dot';
export type RoutingStyle = 'straight' | 'curved' | 'orthogonal';

export interface Port {
  id: string;
  position: PortPosition;
  x: number; // Absolute x position
  y: number; // Absolute y position
  relX: number; // Relative position (0-1)
  relY: number; // Relative position (0-1)
  type: PortType;
  angle?: number; // For entry/exit angle
}

export interface ConnectorData {
  id: string;
  sourceShapeId?: string | null;
  sourcePort?: string | null;
  targetShapeId?: string | null;
  targetPort?: string | null;
  startMarker: ArrowMarkerType;
  endMarker: ArrowMarkerType;
  lineStyle: LineStyle;
  routingStyle: RoutingStyle;
  strokeWidth: number;
  strokeColor: string;
  waypoints?: Array<{ x: number; y: number }>;
  avoidObstacles?: boolean;
  cornerRadius?: number;
  locked?: boolean;
}

export interface ShapeWithPorts extends FabricObject {
  ports?: Port[];
  connectorData?: ConnectorData;
  isConnector?: boolean;
}
