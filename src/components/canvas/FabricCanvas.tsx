import { useEffect, useRef } from "react";
import { Canvas, FabricImage, Rect, Circle, Line, Textbox, Polygon, Ellipse, loadSVGFromString, util, Group, Path, PencilBrush } from "fabric";
import { toast } from "sonner";
import { useCanvas } from "@/contexts/CanvasContext";

interface FabricCanvasProps {
  activeTool: string;
  onShapeCreated?: () => void;
}

export const FabricCanvas = ({ activeTool, onShapeCreated }: FabricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    canvas,
    setCanvas, 
    setSelectedObject, 
    gridEnabled, 
    rulersEnabled, 
    backgroundColor, 
    canvasDimensions, 
    zoom,
    textFont,
    textAlign,
    textUnderline,
    textOverline,
    textBold,
    textItalic,
  } = useCanvas();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      backgroundColor: backgroundColor,
      // Make corner controls larger and more distinct for easier resizing
      controlsAboveOverlay: true,
      centeredScaling: false,
      centeredRotation: true,
    });

    // Configure control appearance for easier object manipulation
    canvas.set({
      borderColor: '#0D9488',
      cornerColor: '#0D9488',
      cornerStrokeColor: '#ffffff',
      cornerStyle: 'circle',
      cornerSize: 12,
      transparentCorners: false,
      borderOpacityWhenMoving: 0.5,
      borderScaleFactor: 2,
      padding: 4,
    } as any);

    canvas.isDrawingMode = false;
    
    setCanvas(canvas);

    // Track selected objects
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });
    
    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });
    
    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });


    // Listen for custom event to add icons to canvas
    const handleAddIcon = async (event: CustomEvent) => {
      const { svgData } = event.detail;

      try {
        // Parse SVG string directly with Fabric.js
        const { objects, options } = await loadSVGFromString(svgData);
        const group = util.groupSVGElements(objects, options);
        
        // Scale to fit within 60% of canvas area
        const maxW = (canvas.width || 0) * 0.6;
        const maxH = (canvas.height || 0) * 0.6;
        const scale = Math.min(maxW / (group.width || 1), maxH / (group.height || 1), 1);
        group.scale(scale);
        
        // Center on canvas
        group.set({
          left: (canvas.width || 0) / 2 - (group.width || 0) * scale / 2,
          top: (canvas.height || 0) / 2 - (group.height || 0) * scale / 2,
        });
        
        canvas.add(group);
        canvas.renderAll();
        toast.success("Icon added to canvas");
      } catch (error) {
        console.error("Error adding icon:", error);
        toast.error("Failed to add icon to canvas");
      }
    };

    window.addEventListener("addIconToCanvas", handleAddIcon as EventListener);

    return () => {
      window.removeEventListener("addIconToCanvas", handleAddIcon as EventListener);
      setCanvas(null);
      canvas.dispose();
    };
  }, [setCanvas, setSelectedObject]);

  // Handle canvas dimension changes
  useEffect(() => {
    if (!canvas || !canvas.lowerCanvasEl) return;

    try {
      canvas.setDimensions({
        width: canvasDimensions.width,
        height: canvasDimensions.height,
      });
      canvas.renderAll();
    } catch (error) {
      console.error("Error setting canvas dimensions:", error);
    }
  }, [canvas, canvasDimensions]);

  // Handle zoom changes
  useEffect(() => {
    if (!canvas) return;

    const zoomLevel = zoom / 100;
    canvas.setZoom(zoomLevel);
    canvas.renderAll();
  }, [canvas, zoom]);

  // Handle background color changes
  useEffect(() => {
    if (!canvas) return;
    canvas.backgroundColor = backgroundColor;
    canvas.renderAll();
  }, [canvas, backgroundColor]);

  // Handle grid rendering - redraws on zoom changes to prevent double grid
  useEffect(() => {
    if (!canvas) return;

    // Collect all grid lines to remove
    const objectsToRemove = canvas.getObjects().filter(obj => (obj as any).isGridLine);
    
    // Remove them all at once
    objectsToRemove.forEach(obj => canvas.remove(obj));

    // Draw grid if enabled
    if (gridEnabled) {
      const gridSize = 20;
      const width = canvas.width || 1200;
      const height = canvas.height || 800;

      const gridLines: Line[] = [];

      // Vertical lines
      for (let i = 0; i <= width / gridSize; i++) {
        const line = new Line([i * gridSize, 0, i * gridSize, height], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          hoverCursor: 'default',
          excludeFromExport: true,
        });
        (line as any).isGridLine = true;
        gridLines.push(line);
      }

      // Horizontal lines
      for (let i = 0; i <= height / gridSize; i++) {
        const line = new Line([0, i * gridSize, width, i * gridSize], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          hoverCursor: 'default',
          excludeFromExport: true,
        });
        (line as any).isGridLine = true;
        gridLines.push(line);
      }

      // Add all grid lines at once and send to back
      gridLines.forEach(line => {
        canvas.add(line);
        canvas.sendObjectToBack(line);
      });
    }

    canvas.renderAll();
  }, [canvas, gridEnabled, zoom]);

  // Handle rulers - separate from grid so they scale with zoom
  useEffect(() => {
    if (!canvas) return;

    // Collect all ruler objects to remove
    const rulersToRemove = canvas.getObjects().filter(obj => (obj as any).isRuler);
    
    // Remove them all at once
    rulersToRemove.forEach(obj => canvas.remove(obj));

    // Draw rulers if enabled
    if (rulersEnabled) {
      const width = canvas.width || 1200;
      const height = canvas.height || 800;

      // Top ruler
      const topRuler = new Rect({
        left: 0,
        top: 0,
        width: width,
        height: 30,
        fill: '#f5f5f5',
        stroke: '#ddd',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        excludeFromExport: true,
      });
      (topRuler as any).isRuler = true;
      canvas.add(topRuler);
      canvas.bringObjectToFront(topRuler);

      // Left ruler
      const leftRuler = new Rect({
        left: 0,
        top: 0,
        width: 30,
        height: height,
        fill: '#f5f5f5',
        stroke: '#ddd',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        excludeFromExport: true,
      });
      (leftRuler as any).isRuler = true;
      canvas.add(leftRuler);
      canvas.bringObjectToFront(leftRuler);

      // Add ruler marks - every 50px
      for (let i = 50; i < width; i += 50) {
        const mark = new Line([i, 0, i, 10], {
          stroke: '#999',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        (mark as any).isRuler = true;
        canvas.add(mark);
        canvas.bringObjectToFront(mark);
      }

      for (let i = 50; i < height; i += 50) {
        const mark = new Line([0, i, 10, i], {
          stroke: '#999',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        (mark as any).isRuler = true;
        canvas.add(mark);
        canvas.bringObjectToFront(mark);
      }
    }

    canvas.renderAll();
  }, [canvas, rulersEnabled]);

  // Handle freeform line drawing
  useEffect(() => {
    if (!canvas) return;

    if (activeTool === "freeform-line") {
      canvas.isDrawingMode = true;
      
      // Create and configure the pencil brush
      const brush = new PencilBrush(canvas);
      brush.color = "#000000";
      brush.width = 2;
      canvas.freeDrawingBrush = brush;

      // Handle path creation
      const handlePathCreated = (e: any) => {
        const path = e.path as Path;
        if (path) {
          // Mark as freeform line
          (path as any).isFreeformLine = true;
          (path as any).startMarker = "none";
          (path as any).endMarker = "none";
          (path as any).lineThickness = 2;
          
          // Set path properties
          path.set({
            fill: null,
            stroke: "#000000",
            strokeWidth: 2,
            strokeUniform: true,
          });
          
          canvas.setActiveObject(path);
          canvas.renderAll();
          if (onShapeCreated) onShapeCreated();
        }
      };

      canvas.on("path:created", handlePathCreated);

      return () => {
        canvas.off("path:created", handlePathCreated);
        canvas.isDrawingMode = false;
      };
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, activeTool, onShapeCreated]);

  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;

    // Update cursor based on tool
    canvas.defaultCursor = activeTool === "text" ? "text" : "default";

    const handleCanvasClick = (e: any) => {
      if (activeTool === "select") return;

      const pointer = canvas.getPointer(e.e);
      
      if (activeTool === "text") {
        const textDecoration = [];
        if (textUnderline) textDecoration.push('underline');
        if (textOverline) textDecoration.push('overline');
        
        const text = new Textbox("Type here", {
          left: pointer.x,
          top: pointer.y,
          width: 200,
          fontSize: 24,
          fontFamily: textFont,
          textAlign: textAlign as any,
          underline: textUnderline,
          overline: textOverline,
          fontWeight: textBold ? 'bold' : 'normal',
          fontStyle: textItalic ? 'italic' : 'normal',
          fill: "#000000",
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        // Immediately enter editing so user can type
        if ((text as any).enterEditing) {
          (text as any).enterEditing();
          if ((text as any).selectAll) {
            (text as any).selectAll();
          }
        }
        canvas.requestRenderAll();
        if (onShapeCreated) onShapeCreated();
        return;
      }
      
      switch (activeTool) {
        case "rectangle":
        case "square":
          const rect = new Rect({
            left: pointer.x - 50,
            top: pointer.y - 50,
            width: activeTool === "square" ? 100 : 120,
            height: 100,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(rect);
          canvas.setActiveObject(rect);
          break;

        case "rounded-rect":
          const roundedRect = new Rect({
            left: pointer.x - 60,
            top: pointer.y - 40,
            width: 120,
            height: 80,
            rx: 10,
            ry: 10,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(roundedRect);
          canvas.setActiveObject(roundedRect);
          break;
          
        case "circle":
        case "ellipse":
          const circle = new Circle({
            left: pointer.x - 50,
            top: pointer.y - 50,
            radius: 50,
            scaleX: activeTool === "ellipse" ? 1.4 : 1,
            scaleY: 1,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(circle);
          canvas.setActiveObject(circle);
          break;

        case "rhombus":
          const rhombus = new Polygon([
            { x: pointer.x, y: pointer.y - 50 },
            { x: pointer.x + 50, y: pointer.y },
            { x: pointer.x, y: pointer.y + 50 },
            { x: pointer.x - 50, y: pointer.y },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(rhombus);
          canvas.setActiveObject(rhombus);
          break;

        case "parallelogram":
          const parallelogram = new Polygon([
            { x: pointer.x - 40, y: pointer.y - 40 },
            { x: pointer.x + 60, y: pointer.y - 40 },
            { x: pointer.x + 40, y: pointer.y + 40 },
            { x: pointer.x - 60, y: pointer.y + 40 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(parallelogram);
          canvas.setActiveObject(parallelogram);
          break;

        case "trapezoid":
          const trapezoid = new Polygon([
            { x: pointer.x - 30, y: pointer.y - 40 },
            { x: pointer.x + 30, y: pointer.y - 40 },
            { x: pointer.x + 50, y: pointer.y + 40 },
            { x: pointer.x - 50, y: pointer.y + 40 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(trapezoid);
          canvas.setActiveObject(trapezoid);
          break;

        case "pentagon":
          const pentagonPoints = [];
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            pentagonPoints.push({
              x: pointer.x + 50 * Math.cos(angle),
              y: pointer.y + 50 * Math.sin(angle),
            });
          }
          const pentagon = new Polygon(pentagonPoints, {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(pentagon);
          canvas.setActiveObject(pentagon);
          break;

        case "hexagon":
          const hexagonPoints = [];
          for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI) / 6;
            hexagonPoints.push({
              x: pointer.x + 50 * Math.cos(angle),
              y: pointer.y + 50 * Math.sin(angle),
            });
          }
          const hexagon = new Polygon(hexagonPoints, {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(hexagon);
          canvas.setActiveObject(hexagon);
          break;

        case "octagon":
          const octagonPoints = [];
          for (let i = 0; i < 8; i++) {
            const angle = (i * 2 * Math.PI) / 8;
            octagonPoints.push({
              x: pointer.x + 50 * Math.cos(angle),
              y: pointer.y + 50 * Math.sin(angle),
            });
          }
          const octagon = new Polygon(octagonPoints, {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(octagon);
          canvas.setActiveObject(octagon);
          break;
          
        case "star":
          const starPoints = [];
          const outerRadius = 50;
          const innerRadius = 25;
          for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            starPoints.push({
              x: pointer.x + radius * Math.cos(angle),
              y: pointer.y + radius * Math.sin(angle),
            });
          }
          const star = new Polygon(starPoints, {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(star);
          canvas.setActiveObject(star);
          break;

        case "triangle":
        case "right-triangle":
          const trianglePoints = activeTool === "right-triangle"
            ? [
                { x: pointer.x - 50, y: pointer.y - 50 },
                { x: pointer.x + 50, y: pointer.y + 50 },
                { x: pointer.x - 50, y: pointer.y + 50 },
              ]
            : [
                { x: pointer.x, y: pointer.y - 50 },
                { x: pointer.x + 50, y: pointer.y + 50 },
                { x: pointer.x - 50, y: pointer.y + 50 },
              ];
          const triangle = new Polygon(trianglePoints, {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(triangle);
          canvas.setActiveObject(triangle);
          break;

        case "arrow-right":
          const arrow = new Polygon([
            { x: pointer.x - 50, y: pointer.y - 15 },
            { x: pointer.x + 30, y: pointer.y - 15 },
            { x: pointer.x + 30, y: pointer.y - 25 },
            { x: pointer.x + 50, y: pointer.y },
            { x: pointer.x + 30, y: pointer.y + 25 },
            { x: pointer.x + 30, y: pointer.y + 15 },
            { x: pointer.x - 50, y: pointer.y + 15 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(arrow);
          canvas.setActiveObject(arrow);
          break;

        case "arrow-left":
          const arrowLeft = new Polygon([
            { x: pointer.x + 50, y: pointer.y - 15 },
            { x: pointer.x - 30, y: pointer.y - 15 },
            { x: pointer.x - 30, y: pointer.y - 25 },
            { x: pointer.x - 50, y: pointer.y },
            { x: pointer.x - 30, y: pointer.y + 25 },
            { x: pointer.x - 30, y: pointer.y + 15 },
            { x: pointer.x + 50, y: pointer.y + 15 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(arrowLeft);
          canvas.setActiveObject(arrowLeft);
          break;

        case "arrow-up":
          const arrowUp = new Polygon([
            { x: pointer.x - 15, y: pointer.y + 50 },
            { x: pointer.x - 15, y: pointer.y - 30 },
            { x: pointer.x - 25, y: pointer.y - 30 },
            { x: pointer.x, y: pointer.y - 50 },
            { x: pointer.x + 25, y: pointer.y - 30 },
            { x: pointer.x + 15, y: pointer.y - 30 },
            { x: pointer.x + 15, y: pointer.y + 50 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(arrowUp);
          canvas.setActiveObject(arrowUp);
          break;

        case "arrow-down":
          const arrowDown = new Polygon([
            { x: pointer.x - 15, y: pointer.y - 50 },
            { x: pointer.x - 15, y: pointer.y + 30 },
            { x: pointer.x - 25, y: pointer.y + 30 },
            { x: pointer.x, y: pointer.y + 50 },
            { x: pointer.x + 25, y: pointer.y + 30 },
            { x: pointer.x + 15, y: pointer.y + 30 },
            { x: pointer.x + 15, y: pointer.y - 50 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(arrowDown);
          canvas.setActiveObject(arrowDown);
          break;

        case "arrow-double-h":
          const doubleArrowH = new Polygon([
            { x: pointer.x - 50, y: pointer.y },
            { x: pointer.x - 30, y: pointer.y - 20 },
            { x: pointer.x - 30, y: pointer.y - 10 },
            { x: pointer.x + 30, y: pointer.y - 10 },
            { x: pointer.x + 30, y: pointer.y - 20 },
            { x: pointer.x + 50, y: pointer.y },
            { x: pointer.x + 30, y: pointer.y + 20 },
            { x: pointer.x + 30, y: pointer.y + 10 },
            { x: pointer.x - 30, y: pointer.y + 10 },
            { x: pointer.x - 30, y: pointer.y + 20 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(doubleArrowH);
          canvas.setActiveObject(doubleArrowH);
          break;

        case "arrow-thick":
          const thickArrow = new Polygon([
            { x: pointer.x - 50, y: pointer.y - 20 },
            { x: pointer.x + 20, y: pointer.y - 20 },
            { x: pointer.x + 20, y: pointer.y - 35 },
            { x: pointer.x + 50, y: pointer.y },
            { x: pointer.x + 20, y: pointer.y + 35 },
            { x: pointer.x + 20, y: pointer.y + 20 },
            { x: pointer.x - 50, y: pointer.y + 20 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(thickArrow);
          canvas.setActiveObject(thickArrow);
          break;

        case "process":
          const process = new Rect({
            left: pointer.x - 60,
            top: pointer.y - 40,
            width: 120,
            height: 80,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(process);
          canvas.setActiveObject(process);
          break;

        case "decision":
          const decision = new Polygon([
            { x: pointer.x, y: pointer.y - 50 },
            { x: pointer.x + 50, y: pointer.y },
            { x: pointer.x, y: pointer.y + 50 },
            { x: pointer.x - 50, y: pointer.y },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(decision);
          canvas.setActiveObject(decision);
          break;

        case "data":
          const data = new Polygon([
            { x: pointer.x - 40, y: pointer.y - 40 },
            { x: pointer.x + 50, y: pointer.y - 40 },
            { x: pointer.x + 40, y: pointer.y + 40 },
            { x: pointer.x - 50, y: pointer.y + 40 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(data);
          canvas.setActiveObject(data);
          break;

        case "terminator":
          const terminator = new Rect({
            left: pointer.x - 60,
            top: pointer.y - 30,
            width: 120,
            height: 60,
            rx: 30,
            ry: 30,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(terminator);
          canvas.setActiveObject(terminator);
          break;

        case "document":
          const documentShape = new Polygon([
            { x: pointer.x - 40, y: pointer.y - 50 },
            { x: pointer.x + 40, y: pointer.y - 50 },
            { x: pointer.x + 50, y: pointer.y - 40 },
            { x: pointer.x + 50, y: pointer.y + 50 },
            { x: pointer.x - 50, y: pointer.y + 50 },
          ], {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(documentShape);
          canvas.setActiveObject(documentShape);
          break;

        case "database":
          // Database with cylinder shape - use stacked ellipses
          const dbTop = new Ellipse({
            left: pointer.x - 40,
            top: pointer.y - 40,
            rx: 40,
            ry: 10,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          const dbBody = new Rect({
            left: pointer.x - 40,
            top: pointer.y - 30,
            width: 80,
            height: 70,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(dbBody, dbTop);
          canvas.setActiveObject(dbTop);
          break;

        case "callout":
        case "cloud":
        case "heart":
        case "cross":
          // For complex paths, use simple geometric approximations
          const simpleShape = new Rect({
            left: pointer.x - 50,
            top: pointer.y - 50,
            width: 100,
            height: 100,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(simpleShape);
          canvas.setActiveObject(simpleShape);
          break;
          
        case "line":
          const line = new Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(line);
          canvas.setActiveObject(line);
          break;

        case "line-arrow-right": {
          const lineArrowRight = new Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
            stroke: "#000000",
            strokeWidth: 2,
          });
          const arrowHeadRight = new Polygon([
            { x: pointer.x + 100, y: pointer.y },
            { x: pointer.x + 90, y: pointer.y - 6 },
            { x: pointer.x + 90, y: pointer.y + 6 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const groupArrowRight = new Group([lineArrowRight, arrowHeadRight], {
            selectable: true,
          });
          canvas.add(groupArrowRight);
          canvas.setActiveObject(groupArrowRight);
          break;
        }

        case "line-arrow-left": {
          const lineArrowLeft = new Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
            stroke: "#000000",
            strokeWidth: 2,
          });
          const arrowHeadLeft = new Polygon([
            { x: pointer.x, y: pointer.y },
            { x: pointer.x + 10, y: pointer.y - 6 },
            { x: pointer.x + 10, y: pointer.y + 6 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const groupArrowLeft = new Group([lineArrowLeft, arrowHeadLeft], {
            selectable: true,
          });
          canvas.add(groupArrowLeft);
          canvas.setActiveObject(groupArrowLeft);
          break;
        }

        case "line-arrow-both": {
          const lineArrowBoth = new Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
            stroke: "#000000",
            strokeWidth: 2,
          });
          const arrowHeadBothLeft = new Polygon([
            { x: pointer.x, y: pointer.y },
            { x: pointer.x + 10, y: pointer.y - 6 },
            { x: pointer.x + 10, y: pointer.y + 6 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHeadBothRight = new Polygon([
            { x: pointer.x + 100, y: pointer.y },
            { x: pointer.x + 90, y: pointer.y - 6 },
            { x: pointer.x + 90, y: pointer.y + 6 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const groupArrowBoth = new Group([lineArrowBoth, arrowHeadBothLeft, arrowHeadBothRight], {
            selectable: true,
          });
          canvas.add(groupArrowBoth);
          canvas.setActiveObject(groupArrowBoth);
          break;
        }

        case "dashed-line": {
          const dashedLine = new Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
            stroke: "#000000",
            strokeWidth: 2,
            strokeDashArray: [5, 5],
          });
          canvas.add(dashedLine);
          canvas.setActiveObject(dashedLine);
          break;
        }

        case "dashed-line-arrow": {
          const dashedLineArrow = new Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
            stroke: "#000000",
            strokeWidth: 2,
            strokeDashArray: [5, 5],
          });
          const dashedArrowHead = new Polygon([
            { x: pointer.x + 100, y: pointer.y },
            { x: pointer.x + 90, y: pointer.y - 6 },
            { x: pointer.x + 90, y: pointer.y + 6 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const groupDashedArrow = new Group([dashedLineArrow, dashedArrowHead], {
            selectable: true,
          });
          canvas.add(groupDashedArrow);
          canvas.setActiveObject(groupDashedArrow);
          break;
        }

        case "curved-arrow-right": {
          const curvedPathRight = new Path(
            `M ${pointer.x} ${pointer.y} Q ${pointer.x + 50} ${pointer.y - 40} ${pointer.x + 100} ${pointer.y}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const curvedArrowHeadRight = new Polygon([
            { x: pointer.x + 100, y: pointer.y },
            { x: pointer.x + 90, y: pointer.y - 6 },
            { x: pointer.x + 90, y: pointer.y + 6 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const curvedGroupRight = new Group([curvedPathRight, curvedArrowHeadRight], {
            selectable: true,
          });
          canvas.add(curvedGroupRight);
          canvas.setActiveObject(curvedGroupRight);
          break;
        }

        case "curved-arrow-left": {
          const curvedPathLeft = new Path(
            `M ${pointer.x} ${pointer.y} Q ${pointer.x + 50} ${pointer.y + 40} ${pointer.x + 100} ${pointer.y}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const curvedArrowHeadLeft = new Polygon([
            { x: pointer.x + 100, y: pointer.y },
            { x: pointer.x + 90, y: pointer.y - 6 },
            { x: pointer.x + 90, y: pointer.y + 6 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const curvedGroupLeft = new Group([curvedPathLeft, curvedArrowHeadLeft], {
            selectable: true,
          });
          canvas.add(curvedGroupLeft);
          canvas.setActiveObject(curvedGroupLeft);
          break;
        }

        case "curved-arrow-up": {
          const curvedPathUp = new Path(
            `M ${pointer.x} ${pointer.y} Q ${pointer.x + 40} ${pointer.y - 50} ${pointer.x} ${pointer.y - 100}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const curvedArrowHeadUp = new Polygon([
            { x: pointer.x, y: pointer.y - 100 },
            { x: pointer.x - 6, y: pointer.y - 90 },
            { x: pointer.x + 6, y: pointer.y - 90 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const curvedGroupUp = new Group([curvedPathUp, curvedArrowHeadUp], {
            selectable: true,
          });
          canvas.add(curvedGroupUp);
          canvas.setActiveObject(curvedGroupUp);
          break;
        }

        case "curved-arrow-down": {
          const curvedPathDown = new Path(
            `M ${pointer.x} ${pointer.y} Q ${pointer.x + 40} ${pointer.y + 50} ${pointer.x} ${pointer.y + 100}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const curvedArrowHeadDown = new Polygon([
            { x: pointer.x, y: pointer.y + 100 },
            { x: pointer.x - 6, y: pointer.y + 90 },
            { x: pointer.x + 6, y: pointer.y + 90 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const curvedGroupDown = new Group([curvedPathDown, curvedArrowHeadDown], {
            selectable: true,
          });
          canvas.add(curvedGroupDown);
          canvas.setActiveObject(curvedGroupDown);
          break;
        }

        case "elbow-connector-right": {
          const elbowPathRight = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x + 50} ${pointer.y} L ${pointer.x + 50} ${pointer.y + 50} L ${pointer.x + 100} ${pointer.y + 50}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const elbowArrowRight = new Polygon([
            { x: pointer.x + 100, y: pointer.y + 50 },
            { x: pointer.x + 90, y: pointer.y + 44 },
            { x: pointer.x + 90, y: pointer.y + 56 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const elbowGroupRight = new Group([elbowPathRight, elbowArrowRight], {
            selectable: true,
          });
          canvas.add(elbowGroupRight);
          canvas.setActiveObject(elbowGroupRight);
          break;
        }

        case "elbow-connector-left": {
          const elbowPathLeft = new Path(
            `M ${pointer.x + 100} ${pointer.y} L ${pointer.x + 50} ${pointer.y} L ${pointer.x + 50} ${pointer.y + 50} L ${pointer.x} ${pointer.y + 50}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const elbowArrowLeft = new Polygon([
            { x: pointer.x, y: pointer.y + 50 },
            { x: pointer.x + 10, y: pointer.y + 44 },
            { x: pointer.x + 10, y: pointer.y + 56 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const elbowGroupLeft = new Group([elbowPathLeft, elbowArrowLeft], {
            selectable: true,
          });
          canvas.add(elbowGroupLeft);
          canvas.setActiveObject(elbowGroupLeft);
          break;
        }

        case "elbow-connector-up": {
          const elbowPathUp = new Path(
            `M ${pointer.x} ${pointer.y + 100} L ${pointer.x} ${pointer.y + 50} L ${pointer.x + 50} ${pointer.y + 50} L ${pointer.x + 50} ${pointer.y}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const elbowArrowUp = new Polygon([
            { x: pointer.x + 50, y: pointer.y },
            { x: pointer.x + 44, y: pointer.y + 10 },
            { x: pointer.x + 56, y: pointer.y + 10 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const elbowGroupUp = new Group([elbowPathUp, elbowArrowUp], {
            selectable: true,
          });
          canvas.add(elbowGroupUp);
          canvas.setActiveObject(elbowGroupUp);
          break;
        }

        case "elbow-connector-down": {
          const elbowPathDown = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y + 50} L ${pointer.x + 50} ${pointer.y + 50} L ${pointer.x + 50} ${pointer.y + 100}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const elbowArrowDown = new Polygon([
            { x: pointer.x + 50, y: pointer.y + 100 },
            { x: pointer.x + 44, y: pointer.y + 90 },
            { x: pointer.x + 56, y: pointer.y + 90 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const elbowGroupDown = new Group([elbowPathDown, elbowArrowDown], {
            selectable: true,
          });
          canvas.add(elbowGroupDown);
          canvas.setActiveObject(elbowGroupDown);
          break;
        }

        case "y-split-right-curved": {
          const ySplitPath = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y + 40} M ${pointer.x} ${pointer.y + 40} Q ${pointer.x + 20} ${pointer.y + 50} ${pointer.x + 60} ${pointer.y + 30} M ${pointer.x} ${pointer.y + 40} Q ${pointer.x + 20} ${pointer.y + 50} ${pointer.x + 60} ${pointer.y + 70}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const arrowHead1 = new Polygon([
            { x: pointer.x + 60, y: pointer.y + 30 },
            { x: pointer.x + 50, y: pointer.y + 27 },
            { x: pointer.x + 50, y: pointer.y + 33 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead2 = new Polygon([
            { x: pointer.x + 60, y: pointer.y + 70 },
            { x: pointer.x + 50, y: pointer.y + 67 },
            { x: pointer.x + 50, y: pointer.y + 73 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const ySplitGroup = new Group([ySplitPath, arrowHead1, arrowHead2], {
            selectable: true,
          });
          canvas.add(ySplitGroup);
          canvas.setActiveObject(ySplitGroup);
          break;
        }

        case "y-split-left-curved": {
          const ySplitPath = new Path(
            `M ${pointer.x + 60} ${pointer.y} L ${pointer.x + 60} ${pointer.y + 40} M ${pointer.x + 60} ${pointer.y + 40} Q ${pointer.x + 40} ${pointer.y + 50} ${pointer.x} ${pointer.y + 30} M ${pointer.x + 60} ${pointer.y + 40} Q ${pointer.x + 40} ${pointer.y + 50} ${pointer.x} ${pointer.y + 70}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const arrowHead1 = new Polygon([
            { x: pointer.x, y: pointer.y + 30 },
            { x: pointer.x + 10, y: pointer.y + 27 },
            { x: pointer.x + 10, y: pointer.y + 33 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead2 = new Polygon([
            { x: pointer.x, y: pointer.y + 70 },
            { x: pointer.x + 10, y: pointer.y + 67 },
            { x: pointer.x + 10, y: pointer.y + 73 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const ySplitGroup = new Group([ySplitPath, arrowHead1, arrowHead2], {
            selectable: true,
          });
          canvas.add(ySplitGroup);
          canvas.setActiveObject(ySplitGroup);
          break;
        }

        case "y-split-down-curved": {
          const ySplitPath = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x + 50} ${pointer.y} M ${pointer.x + 50} ${pointer.y} Q ${pointer.x + 60} ${pointer.y + 20} ${pointer.x + 30} ${pointer.y + 60} M ${pointer.x + 50} ${pointer.y} Q ${pointer.x + 60} ${pointer.y + 20} ${pointer.x + 80} ${pointer.y + 60}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const arrowHead1 = new Polygon([
            { x: pointer.x + 30, y: pointer.y + 60 },
            { x: pointer.x + 27, y: pointer.y + 50 },
            { x: pointer.x + 33, y: pointer.y + 50 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead2 = new Polygon([
            { x: pointer.x + 80, y: pointer.y + 60 },
            { x: pointer.x + 77, y: pointer.y + 50 },
            { x: pointer.x + 83, y: pointer.y + 50 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const ySplitGroup = new Group([ySplitPath, arrowHead1, arrowHead2], {
            selectable: true,
          });
          canvas.add(ySplitGroup);
          canvas.setActiveObject(ySplitGroup);
          break;
        }

        case "t-split-right-elbow": {
          const tSplitPath = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y + 80} M ${pointer.x} ${pointer.y + 20} L ${pointer.x + 60} ${pointer.y + 20} M ${pointer.x} ${pointer.y + 60} L ${pointer.x + 60} ${pointer.y + 60}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const arrowHead1 = new Polygon([
            { x: pointer.x + 60, y: pointer.y + 20 },
            { x: pointer.x + 50, y: pointer.y + 14 },
            { x: pointer.x + 50, y: pointer.y + 26 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead2 = new Polygon([
            { x: pointer.x + 60, y: pointer.y + 60 },
            { x: pointer.x + 50, y: pointer.y + 54 },
            { x: pointer.x + 50, y: pointer.y + 66 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const tSplitGroup = new Group([tSplitPath, arrowHead1, arrowHead2], {
            selectable: true,
          });
          canvas.add(tSplitGroup);
          canvas.setActiveObject(tSplitGroup);
          break;
        }

        case "t-split-left-elbow": {
          const tSplitPath = new Path(
            `M ${pointer.x + 60} ${pointer.y} L ${pointer.x + 60} ${pointer.y + 80} M ${pointer.x + 60} ${pointer.y + 20} L ${pointer.x} ${pointer.y + 20} M ${pointer.x + 60} ${pointer.y + 60} L ${pointer.x} ${pointer.y + 60}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const arrowHead1 = new Polygon([
            { x: pointer.x, y: pointer.y + 20 },
            { x: pointer.x + 10, y: pointer.y + 14 },
            { x: pointer.x + 10, y: pointer.y + 26 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead2 = new Polygon([
            { x: pointer.x, y: pointer.y + 60 },
            { x: pointer.x + 10, y: pointer.y + 54 },
            { x: pointer.x + 10, y: pointer.y + 66 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const tSplitGroup = new Group([tSplitPath, arrowHead1, arrowHead2], {
            selectable: true,
          });
          canvas.add(tSplitGroup);
          canvas.setActiveObject(tSplitGroup);
          break;
        }

        case "t-split-down-elbow": {
          const tSplitPath = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x + 80} ${pointer.y} M ${pointer.x + 20} ${pointer.y} L ${pointer.x + 20} ${pointer.y + 60} M ${pointer.x + 60} ${pointer.y} L ${pointer.x + 60} ${pointer.y + 60}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const arrowHead1 = new Polygon([
            { x: pointer.x + 20, y: pointer.y + 60 },
            { x: pointer.x + 14, y: pointer.y + 50 },
            { x: pointer.x + 26, y: pointer.y + 50 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead2 = new Polygon([
            { x: pointer.x + 60, y: pointer.y + 60 },
            { x: pointer.x + 54, y: pointer.y + 50 },
            { x: pointer.x + 66, y: pointer.y + 50 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const tSplitGroup = new Group([tSplitPath, arrowHead1, arrowHead2], {
            selectable: true,
          });
          canvas.add(tSplitGroup);
          canvas.setActiveObject(tSplitGroup);
          break;
        }

        case "3-way-split-curved": {
          const threeSplitPath = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y + 40} M ${pointer.x} ${pointer.y + 40} Q ${pointer.x + 10} ${pointer.y + 50} ${pointer.x + 50} ${pointer.y + 40} M ${pointer.x} ${pointer.y + 40} L ${pointer.x + 50} ${pointer.y + 80} M ${pointer.x} ${pointer.y + 40} Q ${pointer.x + 10} ${pointer.y + 50} ${pointer.x + 50} ${pointer.y + 120}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const arrowHead1 = new Polygon([
            { x: pointer.x + 50, y: pointer.y + 40 },
            { x: pointer.x + 40, y: pointer.y + 38 },
            { x: pointer.x + 40, y: pointer.y + 42 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead2 = new Polygon([
            { x: pointer.x + 50, y: pointer.y + 80 },
            { x: pointer.x + 44, y: pointer.y + 70 },
            { x: pointer.x + 56, y: pointer.y + 70 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead3 = new Polygon([
            { x: pointer.x + 50, y: pointer.y + 120 },
            { x: pointer.x + 40, y: pointer.y + 118 },
            { x: pointer.x + 40, y: pointer.y + 122 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const threeSplitGroup = new Group([threeSplitPath, arrowHead1, arrowHead2, arrowHead3], {
            selectable: true,
          });
          canvas.add(threeSplitGroup);
          canvas.setActiveObject(threeSplitGroup);
          break;
        }

        case "3-way-split-elbow": {
          const threeSplitPath = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y + 40} M ${pointer.x} ${pointer.y + 40} L ${pointer.x + 50} ${pointer.y + 40} M ${pointer.x} ${pointer.y + 40} L ${pointer.x + 50} ${pointer.y + 80} M ${pointer.x} ${pointer.y + 40} L ${pointer.x + 50} ${pointer.y + 120}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              strokeUniform: true,
            }
          );
          const arrowHead1 = new Polygon([
            { x: pointer.x + 50, y: pointer.y + 40 },
            { x: pointer.x + 40, y: pointer.y + 34 },
            { x: pointer.x + 40, y: pointer.y + 46 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead2 = new Polygon([
            { x: pointer.x + 50, y: pointer.y + 80 },
            { x: pointer.x + 44, y: pointer.y + 70 },
            { x: pointer.x + 56, y: pointer.y + 70 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const arrowHead3 = new Polygon([
            { x: pointer.x + 50, y: pointer.y + 120 },
            { x: pointer.x + 44, y: pointer.y + 110 },
            { x: pointer.x + 56, y: pointer.y + 110 },
          ], {
            fill: "#000000",
            stroke: "#000000",
            strokeWidth: 0,
          });
          const threeSplitGroup = new Group([threeSplitPath, arrowHead1, arrowHead2, arrowHead3], {
            selectable: true,
          });
          canvas.add(threeSplitGroup);
          canvas.setActiveObject(threeSplitGroup);
          break;
        }

        default:
          // For any unhandled shapes, create a basic rectangle as fallback
          const defaultShape = new Rect({
            left: pointer.x - 40,
            top: pointer.y - 40,
            width: 80,
            height: 80,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          canvas.add(defaultShape);
          canvas.setActiveObject(defaultShape);
          break;
      }
      
      canvas.renderAll();
      if (onShapeCreated) onShapeCreated();
    };

    // Detach previous handler
    canvas.off("mouse:down", handleCanvasClick);
    
    // Attach handler if not in select mode
    if (activeTool !== "select") {
      canvas.on("mouse:down", handleCanvasClick);
    }

    return () => {
      canvas.off("mouse:down", handleCanvasClick);
    };
  }, [canvas, activeTool, textFont, textAlign, textUnderline, textOverline, textBold, textItalic]);

  return (
    <div
      className="flex-1 overflow-hidden"
      style={gridEnabled ? {
        background: 'linear-gradient(90deg, #f0f0f0 1px, transparent 1px), linear-gradient(#f0f0f0 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      } : undefined}
    >
      <div className="w-full h-full flex items-start justify-center p-4">
        <div className="shadow-2xl bg-white" style={{ boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};
