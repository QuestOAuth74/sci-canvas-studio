import { useState, useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Circle, FabricObject, Point } from "fabric";
import { createConnector } from "@/lib/connectorSystem";
import { showPortIndicators, hidePortIndicators, findNearestPort, calculateShapePorts } from "@/lib/portManager";
import { ArrowMarkerType, LineStyle, RoutingStyle } from "@/types/connector";
import { toast } from "sonner";
import { ConnectorVisualFeedback } from "@/lib/connectorVisualFeedback";

interface ConnectorState {
  isDrawing: boolean;
  startX: number | null;
  startY: number | null;
  startShapeId: string | null;
  startPortId: string | null;
  endShapeId: string | null;
  endPortId: string | null;
  portIndicators: Circle[];
  hoveredShape: FabricObject | null;
}

export const useConnectorTool = (
  canvas: FabricCanvas | null,
  activeTool: string
) => {
  const [connectorState, setConnectorState] = useState<ConnectorState>({
    isDrawing: false,
    startX: null,
    startY: null,
    startShapeId: null,
    startPortId: null,
    endShapeId: null,
    endPortId: null,
    portIndicators: [],
    hoveredShape: null,
  });

  const visualFeedback = useRef<ConnectorVisualFeedback | null>(null);

  // Initialize visual feedback
  useEffect(() => {
    if (canvas && !visualFeedback.current) {
      visualFeedback.current = new ConnectorVisualFeedback(canvas);
    }
    return () => {
      visualFeedback.current?.clearAll();
    };
  }, [canvas]);

  useEffect(() => {
    if (!canvas || !activeTool.startsWith('connector-')) {
      // Clean up when switching away from connector tool
      if (visualFeedback.current) {
        visualFeedback.current.clearAll();
      }
      hidePortIndicators(canvas, connectorState.portIndicators);
      setConnectorState({
        isDrawing: false,
        startX: null,
        startY: null,
        startShapeId: null,
        startPortId: null,
        endShapeId: null,
        endPortId: null,
        portIndicators: [],
        hoveredShape: null,
      });
      return;
    }

    // Determine connector properties from tool name
    const getConnectorProps = (): {
      startMarker: ArrowMarkerType;
      endMarker: ArrowMarkerType;
      lineStyle: LineStyle;
      routingStyle: RoutingStyle;
    } => {
      switch (activeTool) {
        case 'connector-straight':
          return {
            startMarker: 'none',
            endMarker: 'arrow',
            lineStyle: 'solid',
            routingStyle: 'straight',
          };
        case 'connector-curved':
          return {
            startMarker: 'none',
            endMarker: 'arrow',
            lineStyle: 'solid',
            routingStyle: 'curved',
          };
        case 'connector-orthogonal':
          return {
            startMarker: 'none',
            endMarker: 'arrow',
            lineStyle: 'solid',
            routingStyle: 'orthogonal',
          };
        case 'line-arrow':
          return {
            startMarker: 'none',
            endMarker: 'arrow',
            lineStyle: 'solid',
            routingStyle: 'straight',
          };
        case 'line-double-arrow':
          return {
            startMarker: 'arrow',
            endMarker: 'arrow',
            lineStyle: 'solid',
            routingStyle: 'straight',
          };
        case 'line-plain':
          return {
            startMarker: 'none',
            endMarker: 'none',
            lineStyle: 'solid',
            routingStyle: 'straight',
          };
        case 'line-circle-arrow':
          return {
            startMarker: 'circle',
            endMarker: 'arrow',
            lineStyle: 'solid',
            routingStyle: 'straight',
          };
        case 'line-diamond':
          return {
            startMarker: 'diamond',
            endMarker: 'none',
            lineStyle: 'solid',
            routingStyle: 'straight',
          };
        default:
          return {
            startMarker: 'none',
            endMarker: 'arrow',
            lineStyle: 'solid',
            routingStyle: 'straight',
          };
      }
    };

    // Find shape at pointer position (excluding connectors and grid/rulers)
    const findShapeAtPoint = (x: number, y: number): FabricObject | null => {
      const objects = canvas.getObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if ((obj as any).isConnector || (obj as any).isGridLine || (obj as any).isRuler || (obj as any).isAlignmentGuide) continue;
        if (obj.containsPoint(new Point(x, y))) {
          return obj;
        }
      }
      return null;
    };

    const handleMouseDown = (e: any) => {
      const pointer = canvas.getPointer(e.e);
      const clickedShape = findShapeAtPoint(pointer.x, pointer.y);

      if (!connectorState.isDrawing) {
        // First click - start connector
        let startX = pointer.x;
        let startY = pointer.y;
        let startShapeId = null;
        let startPortId = null;

        // Check if clicking near a shape
        if (clickedShape) {
          const nearestPort = findNearestPort(clickedShape, pointer, 30);
          if (nearestPort) {
            startX = nearestPort.x;
            startY = nearestPort.y;
            startShapeId = (clickedShape as any).id || `shape-${Date.now()}`;
            startPortId = nearestPort.id;
            // Store ID on shape if it doesn't have one
            if (!(clickedShape as any).id) {
              (clickedShape as any).id = startShapeId;
            }
            visualFeedback.current?.animateSnap(startX, startY);
          }
        }

        setConnectorState(prev => ({
          ...prev,
          isDrawing: true,
          startX,
          startY,
          startShapeId,
          startPortId,
        }));

        visualFeedback.current?.showStartMarker(startX, startY);
        canvas.selection = false;
        toast.info("Click to set end point");
      } else {
        // Second click - finish connector
        let endX = pointer.x;
        let endY = pointer.y;
        let endShapeId = null;
        let endPortId = null;

        // Check if clicking near a shape
        if (clickedShape) {
          const nearestPort = findNearestPort(clickedShape, pointer, 30);
          if (nearestPort) {
            endX = nearestPort.x;
            endY = nearestPort.y;
            endShapeId = (clickedShape as any).id || `shape-${Date.now()}`;
            endPortId = nearestPort.id;
            // Store ID on shape if it doesn't have one
            if (!(clickedShape as any).id) {
              (clickedShape as any).id = endShapeId;
            }
            visualFeedback.current?.animateSnap(endX, endY);
          }
        }

        const props = getConnectorProps();

        // Create the connector with port attachments
        createConnector(canvas, {
          startX: connectorState.startX!,
          startY: connectorState.startY!,
          endX,
          endY,
          ...props,
          sourceShapeId: connectorState.startShapeId,
          sourcePort: connectorState.startPortId,
          targetShapeId: endShapeId,
          targetPort: endPortId,
        });

        // Reset state
        setConnectorState({
          isDrawing: false,
          startX: null,
          startY: null,
          startShapeId: null,
          startPortId: null,
          endShapeId: null,
          endPortId: null,
          portIndicators: [],
          hoveredShape: null,
        });

        visualFeedback.current?.clearAll();
        hidePortIndicators(canvas, connectorState.portIndicators);
        canvas.selection = true;
        canvas.renderAll();
        toast.success("Connector created!");
      }
    };

    const handleMouseMove = (e: any) => {
      const pointer = canvas.getPointer(e.e);

      if (connectorState.isDrawing && connectorState.startX !== null && connectorState.startY !== null) {
        // Update preview line while drawing
        let endX = pointer.x;
        let endY = pointer.y;

        // Check if hovering over a shape
        const hoveredShape = findShapeAtPoint(pointer.x, pointer.y);
        
        // Hide previous port indicators
        if (connectorState.hoveredShape !== hoveredShape) {
          hidePortIndicators(canvas, connectorState.portIndicators);
        }

        if (hoveredShape) {
          // Show port indicators for hovered shape
          const indicators = showPortIndicators(hoveredShape, canvas);
          setConnectorState(prev => ({ ...prev, portIndicators: indicators, hoveredShape }));

          // Snap to nearest port
          const nearestPort = findNearestPort(hoveredShape, pointer, 30);
          if (nearestPort) {
            endX = nearestPort.x;
            endY = nearestPort.y;
            visualFeedback.current?.showSnappedConnection(endX, endY);
          } else {
            visualFeedback.current?.clearSnapIndicators();
          }
        } else {
          setConnectorState(prev => ({ ...prev, hoveredShape: null, portIndicators: [] }));
          visualFeedback.current?.clearSnapIndicators();
        }

        visualFeedback.current?.updatePreviewLine(
          connectorState.startX,
          connectorState.startY,
          endX,
          endY,
          true
        );
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.selection = true;
      visualFeedback.current?.clearAll();
      hidePortIndicators(canvas, connectorState.portIndicators);
    };
  }, [canvas, activeTool, connectorState]);

  return connectorState;
};
