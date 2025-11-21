import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Rect, Circle, Line, Textbox, Polygon, Ellipse, loadSVGFromString, util, Group, Path, PencilBrush, Control, FabricObject, Gradient } from "fabric";
import { toast } from "sonner";
import { useCanvas } from "@/contexts/CanvasContext";
import { loadAllFonts, getCanvasFontFamily, getBaseFontName, debugTextObject, fixInvisibleText, normalizeCanvasTextFonts, normalizeEditingTextFont } from "@/lib/fontLoader";
import { createConnector } from "@/lib/connectorSystem";
import { createSVGArrowMarker } from "@/lib/advancedLineSystem";
import { ArrowMarkerType, RoutingStyle } from "@/types/connector";
import { EnhancedBezierTool } from "@/lib/enhancedBezierTool";
import { StraightLineTool } from "@/lib/straightLineTool";
import { OrthogonalLineTool } from "@/lib/orthogonalLineTool";
import { CurvedLineTool } from "@/lib/curvedLineTool";
import { calculateArcPath } from "@/lib/advancedLineSystem";
import { ConnectorVisualFeedback } from "@/lib/connectorVisualFeedback";
import { loadImageWithCORS } from "@/lib/utils";
import { ObjectCullingManager, createThrottledCuller } from "@/lib/objectCulling";
import { calculateObjectComplexity, applyComplexityOptimizations, shouldSimplifyControls } from "@/lib/objectComplexity";
import { isTextBox, handleTextBoxResize, getTextBoxTextElement } from "@/lib/textBoxTool";

// Sanitize SVG namespace issues before parsing with Fabric.js
const sanitizeSVGNamespaces = (svgContent: string): string => {
  let sanitized = svgContent
    // Replace <ns0:svg> and other namespace prefixes with <svg>
    .replace(/<ns\d+:svg/g, '<svg')
    .replace(/<\/ns\d+:svg>/g, '</svg>')
    // Replace xmlns:ns0="..." with xmlns="..."
    .replace(/xmlns:ns\d+=/g, 'xmlns=')
    // Replace <ns0:element> with <element> for any SVG element
    .replace(/<(\/?)ns\d+:(\w+)/g, '<$1$2')
    // Remove any remaining ns0: references in attributes
    .replace(/ns\d+:/g, '');
  
  // Ensure proper xmlns attribute exists
  if (!sanitized.includes('xmlns="http://www.w3.org/2000/svg"')) {
    sanitized = sanitized.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  
  return sanitized;
};

interface FabricCanvasProps {
  activeTool: string;
  onShapeCreated?: () => void;
  onToolChange?: (tool: string) => void;
}

export const FabricCanvas = ({ activeTool, onShapeCreated, onToolChange }: FabricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [penToolState, setPenToolState] = useState<{
    isDrawing: boolean;
    points: Array<{ x: number; y: number }>;
    tempMarkers: Circle[];
    tempLines: Line[];
  }>({
    isDrawing: false,
    points: [],
    tempMarkers: [],
    tempLines: [],
  });
  
  const [connectorState, setConnectorState] = useState<{
    isDrawing: boolean;
    startX: number | null;
    startY: number | null;
  }>({
    isDrawing: false,
    startX: null,
    startY: null,
  });


  const [isDuplicating, setIsDuplicating] = useState(false);
  const clonedObjectRef = useRef<FabricObject | null>(null);

  const bezierToolRef = useRef<EnhancedBezierTool | null>(null);
  const straightLineToolRef = useRef<StraightLineTool | null>(null);
  const orthogonalLineToolRef = useRef<OrthogonalLineTool | null>(null);
  const curvedLineToolRef = useRef<CurvedLineTool | null>(null);
  const connectorFeedbackRef = useRef<ConnectorVisualFeedback | null>(null);
  
  // Object culling manager for viewport-based performance optimization
  const cullingManagerRef = useRef<ObjectCullingManager>(new ObjectCullingManager());
  const throttledCullRef = useRef<(() => void) | null>(null);
  
  const { 
    canvas,
    setCanvas, 
    setSelectedObject, 
    gridEnabled, 
    rulersEnabled, 
    backgroundColor,
    backgroundGradient,
    gridPattern,
    canvasDimensions, 
    zoom,
    textFont,
    textAlign,
    textUnderline,
    textOverline,
    textBold,
    textItalic,
    saveState,
  } = useCanvas();

  useEffect(() => {
    if (!canvasRef.current) return;

    const initCanvas = async () => {
      // Load fonts before initializing canvas
      await loadAllFonts();
      
      // Set global control styles on FabricObject prototype (applies to all objects)
      FabricObject.prototype.cornerColor = '#EF4444';        // Red square dots
      FabricObject.prototype.cornerStrokeColor = '#ffffff';
      FabricObject.prototype.cornerStyle = 'rect';           // Square corners
      FabricObject.prototype.cornerSize = 8;
      FabricObject.prototype.transparentCorners = false;
      FabricObject.prototype.borderColor = '#EF4444';        // Red selection border
      FabricObject.prototype.borderScaleFactor = 2;
      FabricObject.prototype.padding = 4;

      const canvas = new Canvas(canvasRef.current!, {
        width: canvasDimensions.width,
        height: canvasDimensions.height,
        backgroundColor: backgroundColor,
        controlsAboveOverlay: true,
        centeredScaling: false,
        centeredRotation: true,
      });

    // Apply control styling to all objects added to canvas
    canvas.on('object:added', (e) => {
      if (e.target) {
        e.target.set({
          cornerColor: '#EF4444',
          cornerStrokeColor: '#ffffff',
          cornerStyle: 'rect',
          cornerSize: 8,
          transparentCorners: false,
          borderColor: '#EF4444',
          borderScaleFactor: 2,
          padding: 4,
        });
        
        // Normalize fonts for text objects using helper
        if (e.target.type === "textbox" || e.target.type === "text") {
          const textObj = e.target as any;
          const base = getBaseFontName(textObj.fontFamily);
          textObj.fontFamily = getCanvasFontFamily(base);
        }
        
        // Also normalize text in groups using helper
        if (e.target.type === "group" && (e.target as any).getObjects) {
          (e.target as any).getObjects().forEach((child: any) => {
            if (child.type === "textbox" || child.type === "text") {
              const base = getBaseFontName(child.fontFamily);
              child.fontFamily = getCanvasFontFamily(base);
            }
          });
        }
      }
    });

    // Custom rotation control rendering (semi-circle with arrow like BioRender)
    const renderRotationControl = (
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      _styleOverride: any,
      fabricObject: any
    ) => {
      const size = 20;
      const isHovering = fabricObject.canvas?.getActiveObject() === fabricObject;
      
      // Fade out when not hovering
      const opacity = isHovering ? 1.0 : 0.5;
      
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(left, top);
      ctx.rotate(util.degreesToRadians(fabricObject.angle || 0));
      
      // Draw semi-circle background
      ctx.fillStyle = '#0D9488'; // Teal color
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, Math.PI, 0, false); // Semi-circle (bottom half)
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw arrow pointing up
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      
      // Arrow shaft
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(0, -8);
      ctx.stroke();
      
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-3, -5);
      ctx.lineTo(3, -5);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    };

    // Rotation action handler
    const rotationHandler = (eventData: MouseEvent, transform: any, x: number, y: number) => {
      const target = transform.target;
      const ex = x - target.getCenterPoint().x;
      const ey = y - target.getCenterPoint().y;
      const angle = Math.atan2(ey, ex) * (180 / Math.PI) - 90;
      
      target.angle = angle;
      return true;
    };

    // Apply custom rotation control to FabricObject prototype safely
    if (!FabricObject.prototype.controls) {
      FabricObject.prototype.controls = {};
    }
    
    FabricObject.prototype.controls.mtr = new Control({
      x: 0,
      y: -0.5,
      offsetY: -40,
      cursorStyle: 'grab',
      actionHandler: rotationHandler,
      actionName: 'rotate',
      render: renderRotationControl,
      withConnection: true,
    });

    canvas.isDrawingMode = false;
    
    // Initialize connector visual feedback
    connectorFeedbackRef.current = new ConnectorVisualFeedback(canvas);
    
    // Initialize object culling manager
    cullingManagerRef.current.setCanvas(canvas);
    throttledCullRef.current = createThrottledCuller(cullingManagerRef.current, 100);
    
    // Apply culling on viewport changes (pan/zoom)
    canvas.on('after:render', () => {
      if (throttledCullRef.current) {
        throttledCullRef.current();
      }
    });
    
    // Apply control styles to any existing objects on canvas
    canvas.getObjects().forEach((obj) => {
      obj.set({
        cornerColor: '#EF4444',
        cornerStrokeColor: '#ffffff',
        cornerStyle: 'rect',
        cornerSize: 8,
        transparentCorners: false,
        borderColor: '#EF4444',
      });
    });
    canvas.requestRenderAll();
    
    setCanvas(canvas);
    
    // Normalize all existing text objects with font stacks for special character support
    normalizeCanvasTextFonts(canvas);

    // Track selected objects with debug and auto-fix for invisible text
    canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0] || null;
      setSelectedObject(selected);
      
      // Debug text object properties
      debugTextObject(selected, "Selection Created");
      
      // Auto-fix invisible text
      if (selected && fixInvisibleText(selected, canvas)) {
        toast.info("Fixed invisible text (reset opacity/fill)");
      }
    });
    
    canvas.on('selection:updated', (e) => {
      const selected = e.selected?.[0] || null;
      setSelectedObject(selected);
      
      // Debug text object properties
      debugTextObject(selected, "Selection Updated");
      
      // Auto-fix invisible text
      if (selected && fixInvisibleText(selected, canvas)) {
        toast.info("Fixed invisible text (reset opacity/fill)");
      }
    });
    
    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Normalize fonts when text editing starts
    canvas.on('text:editing:entered', (e: any) => {
      if (e.target) {
        normalizeEditingTextFont(e.target);
        canvas.requestRenderAll();
      }
    });

    // Normalize fonts when text content changes (safety net)
    canvas.on('text:changed', (e: any) => {
      const target = e.target;
      if (target && (target.type === 'textbox' || target.type === 'text')) {
        normalizeEditingTextFont(target);
        target.dirty = true;
        canvas.requestRenderAll();
      }
    });

    // Finalize fonts and layout when exiting edit mode
    canvas.on('text:editing:exited', (e: any) => {
      const target = e.target;
      if (target && (target.type === 'textbox' || target.type === 'text')) {
        normalizeEditingTextFont(target);
        if (typeof target.initDimensions === 'function') {
          target.initDimensions();
        }
        if (typeof target.setCoords === 'function') {
          target.setCoords();
        }
        target.dirty = true;
        canvas.requestRenderAll();
      }
    });

    // Alt+Drag duplication handlers
    canvas.on('mouse:down', async (e) => {
      const activeObject = canvas.getActiveObject();
      
      if (e.e.altKey && activeObject && activeTool === 'select') {
        e.e.preventDefault();
        
        try {
          const cloned = await activeObject.clone();
          cloned.set({
            left: (activeObject.left || 0) + 10,
            top: (activeObject.top || 0) + 10,
            evented: true,
          });
          
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          clonedObjectRef.current = cloned;
          setIsDuplicating(true);
          canvas.requestRenderAll();
        } catch (error) {
          console.error('Failed to clone object:', error);
        }
      }
    });

    canvas.on('mouse:up', () => {
      if (isDuplicating) {
        setIsDuplicating(false);
        clonedObjectRef.current = null;
        toast.success("Object duplicated", { duration: 1000, className: 'animate-fade-in' });
      }
    });

    // Handle text box resize - track scaling state to avoid feedback loops
    let isScalingTextBox = false;

    canvas.on('object:scaling', (e) => {
      if (e.target && isTextBox(e.target)) {
        isScalingTextBox = true;
      }
    });

    canvas.on('mouse:up', () => {
      if (isScalingTextBox) {
        const obj = canvas.getActiveObject();
        if (obj && isTextBox(obj)) {
          handleTextBoxResize(obj);
          canvas.requestRenderAll();
        }
        isScalingTextBox = false;
      }
    });

    // Handle double-click to edit text box content
    canvas.on('mouse:dblclick', (e) => {
      const obj = e.target;
      if (obj && isTextBox(obj)) {
        const textElement = getTextBoxTextElement(obj);
        if (textElement) {
          canvas.setActiveObject(textElement);
          textElement.enterEditing();
          textElement.selectAll();
          canvas.requestRenderAll();
        }
      }
    });

    // Snap-to-grid removed per user request: free movement while dragging and on release
    // (previous object:modified snapping handler deleted)

    canvas.on('mouse:move', (e) => {
      if (e.e.altKey && canvas.getActiveObject() && activeTool === 'select') {
        canvas.setCursor('copy');
      }
    });


    // Listen for custom event to add icons to canvas
    const handleAddIcon = async (event: CustomEvent) => {
      const { svgData, iconId } = event.detail;

      try {
        const startTime = performance.now();
        
        // Check cache first
        const { iconCache } = await import('@/lib/iconCache');
        const cached = iconId ? await iconCache.get(iconId) : null;
        
        if (cached) {
          console.log('Using cached icon:', iconId);
          // Deserialize cached Fabric object
          const parsePromise = loadSVGFromString(cached.svgContent);
          const { objects, options } = await parsePromise;
          const group = util.groupSVGElements(objects, options);
          
          // Calculate complexity and apply optimizations
          const complexity = calculateObjectComplexity(group);
          if (shouldSimplifyControls(complexity)) {
            applyComplexityOptimizations(group, complexity);
          }
          
          // Scale and position
          const maxW = (canvas.width || 0) * 0.6;
          const maxH = (canvas.height || 0) * 0.6;
          const scale = Math.min(maxW / (group.width || 1), maxH / (group.height || 1), 1);
          group.scale(scale);
          group.set({
            left: (canvas.width || 0) / 2 - (group.width || 0) * scale / 2,
            top: (canvas.height || 0) / 2 - (group.height || 0) * scale / 2,
          });
          
          canvas.add(group);
          canvas.setActiveObject(group);
          canvas.requestRenderAll();
          toast.success("Icon added to canvas (cached)");
          return;
        }
        
        // Process SVG in Web Worker for validation
        const worker = new Worker(new URL('@/lib/svgWorker.ts', import.meta.url), { type: 'module' });
        
        const workerResult = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            worker.terminate();
            reject(new Error('Worker timeout'));
          }, 10000);
          
          worker.onmessage = (e) => {
            clearTimeout(timeout);
            worker.terminate();
            resolve(e.data);
          };
          
          worker.onerror = (err) => {
            clearTimeout(timeout);
            worker.terminate();
            reject(err);
          };
          
          worker.postMessage({ type: 'parse', svgContent: svgData, id: iconId || 'temp' });
        });
        
        // Show any warnings from worker (but continue loading)
        if (workerResult.data?.warnings?.length > 0) {
          workerResult.data.warnings.forEach((warning: string) => {
            toast.warning(warning, {
              description: 'Icon will still load, but performance may be affected.',
              duration: 5000
            });
          });
        }
        
        // Always use the processed SVG - no blocking
        const processedSVG = workerResult.data.svgContent;
        console.log('Worker processed SVG, complexity:', workerResult.data.complexity);
        
        // Sanitize SVG before parsing to fix namespace issues
        const sanitizedSVG = sanitizeSVGNamespaces(processedSVG);
        
        // Parse sanitized SVG string with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SVG parsing timeout')), 15000);
        });
        
        const parsePromise = loadSVGFromString(sanitizedSVG);
        const { objects, options } = await Promise.race([parsePromise, timeoutPromise]) as Awaited<ReturnType<typeof loadSVGFromString>>;
        
        const parseTime = performance.now() - startTime;
        console.log(`SVG parsed in ${parseTime.toFixed(2)}ms`);
        
        const group = util.groupSVGElements(objects, options);
        
        // Calculate complexity and apply optimizations
        const complexity = calculateObjectComplexity(group);
        console.log('Object complexity:', complexity);
        
        if (shouldSimplifyControls(complexity)) {
          applyComplexityOptimizations(group, complexity);
          toast.info(`Complex icon (${complexity.totalObjects} objects)`, {
            description: 'Simplified controls applied for better performance'
          });
        }
        
        // Cache the parsed icon
        if (iconId) {
          iconCache.set({
            id: iconId,
            svgContent: sanitizedSVG,
            parsedData: group.toObject(),
            timestamp: Date.now(),
            complexity: workerResult.data.complexity
          });
        }
        
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
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        toast.success("Icon added to canvas");
      } catch (error) {
        console.error("Error adding icon:", error);
        console.error("SVG content preview:", svgData.substring(0, 500));
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('timeout')) {
          toast.error("Icon is too large to process. Please try a simpler icon.");
        } else if (errorMessage.toLowerCase().includes('namespace') || errorMessage.toLowerCase().includes('parse')) {
          toast.error("Invalid SVG format. The icon may have formatting issues.");
        } else {
          toast.error(`Failed to add icon: ${errorMessage}`);
        }
      }
    };

    window.addEventListener("addIconToCanvas", handleAddIcon as EventListener);

    // Handle adding asset from library
    const handleAddAsset = async (event: CustomEvent) => {
      const { content, assetId } = event.detail;
      if (!canvas || !content) return;

      try {
        toast("Loading asset...");
        
        // Try to parse as SVG first
        if (content.trim().startsWith('<svg') || content.includes('xmlns="http://www.w3.org/2000/svg"')) {
          // Sanitize SVG before parsing
          const sanitizedContent = sanitizeSVGNamespaces(content);
          const { objects, options } = await loadSVGFromString(sanitizedContent);
          const group = util.groupSVGElements(objects, options);
          
          const maxW = (canvas.width || 0) * 0.6;
          const maxH = (canvas.height || 0) * 0.6;
          const scale = Math.min(maxW / (group.width || 1), maxH / (group.height || 1), 1);
          group.scale(scale);
          
          group.set({
            left: (canvas.width || 0) / 2 - (group.width || 0) * scale / 2,
            top: (canvas.height || 0) / 2 - (group.height || 0) * scale / 2,
          });
          
          canvas.add(group);
          canvas.setActiveObject(group);
          canvas.requestRenderAll();
          toast.success("Asset added to canvas");
        } else {
          // Handle as data URL image with CORS support
          try {
            const img = await loadImageWithCORS(content);
            const fabricImage = new FabricImage(img, {
              left: (canvas.width || 0) / 2,
              top: (canvas.height || 0) / 2,
              originX: "center",
              originY: "center",
            });
            
            const maxW = (canvas.width || 0) * 0.6;
            const maxH = (canvas.height || 0) * 0.6;
            const scale = Math.min(maxW / fabricImage.width!, maxH / fabricImage.height!, 1);
            fabricImage.scale(scale);
            
            canvas.add(fabricImage);
            canvas.setActiveObject(fabricImage);
            canvas.requestRenderAll();
            toast.success("Asset added to canvas");
          } catch (error) {
            console.error("Failed to load image:", error);
            toast.error("Failed to load image asset");
          }
        }
      } catch (error) {
        console.error("Error adding asset:", error);
        toast.error("Failed to add asset to canvas");
      }
    };

    window.addEventListener("addAssetToCanvas", handleAddAsset as EventListener);

      return () => {
        window.removeEventListener("addIconToCanvas", handleAddIcon as EventListener);
        window.removeEventListener("addAssetToCanvas", handleAddAsset as EventListener);
        setCanvas(null);
        canvas.dispose();
      };
    };

    initCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent default context menu on canvas
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvasElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvasElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Handle canvas dimension changes
  useEffect(() => {
    if (!canvas || !canvas.lowerCanvasEl) return;

    try {
      canvas.setDimensions({
      width: canvasDimensions.width,
      height: canvasDimensions.height,
    });
    canvas.requestRenderAll();
    } catch (error) {
      console.error("Error setting canvas dimensions:", error);
    }
  }, [canvas, canvasDimensions]);

  // Handle zoom changes with culling
  useEffect(() => {
    if (!canvas) return;

    const zoomLevel = zoom / 100;
    canvas.setZoom(zoomLevel);
    canvas.requestRenderAll();
    
    // Trigger culling after zoom change
    if (throttledCullRef.current) {
      throttledCullRef.current();
    }
  }, [canvas, zoom]);

  // Handle background color changes
  useEffect(() => {
    if (!canvas) return;
    
    if (backgroundGradient) {
      // Create a subtle gradient from light to white
      const gradient = new Gradient({
        type: 'linear',
        coords: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: canvas.height || 800,
        },
        colorStops: [
          { offset: 0, color: '#f8f9fa' },
          { offset: 1, color: '#ffffff' }
        ]
      });
      canvas.backgroundColor = gradient;
    } else {
      canvas.backgroundColor = backgroundColor;
    }
    
    canvas.requestRenderAll();
  }, [canvas, backgroundColor, backgroundGradient]);

  // Handle grid rendering - redraws on zoom changes to prevent double grid
  useEffect(() => {
    if (!canvas) return;

    // Collect all grid objects to remove
    const objectsToRemove = canvas.getObjects().filter(obj => (obj as any).isGridLine);
    
    // Remove them all at once
    objectsToRemove.forEach(obj => canvas.remove(obj));

    // Draw grid if enabled
    if (gridEnabled) {
      const gridSize = 20;
      const width = canvas.width || 1200;
      const height = canvas.height || 800;

      const gridObjects: FabricObject[] = [];

      if (gridPattern === 'lines') {
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
          gridObjects.push(line);
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
          gridObjects.push(line);
        }
      } else if (gridPattern === 'dots') {
        // Dot grid
        for (let i = 0; i <= width / gridSize; i++) {
          for (let j = 0; j <= height / gridSize; j++) {
            const dot = new Circle({
              left: i * gridSize,
              top: j * gridSize,
              radius: 1.5,
              fill: '#d0d0d0',
              selectable: false,
              evented: false,
              hoverCursor: 'default',
              excludeFromExport: true,
              originX: 'center',
              originY: 'center',
            });
            (dot as any).isGridLine = true;
            gridObjects.push(dot);
          }
        }
      } else if (gridPattern === 'isometric') {
        // Isometric grid (30-degree angles)
        const isoSize = gridSize * 2;
        const angleRad = (30 * Math.PI) / 180;
        
        // Draw diagonal lines at +30 degrees
        for (let i = -height; i <= width + height; i += isoSize) {
          const startX = i;
          const startY = 0;
          const endX = i + height * Math.tan(angleRad);
          const endY = height;
          
          const line = new Line([startX, startY, endX, endY], {
            stroke: '#e0e0e0',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            hoverCursor: 'default',
            excludeFromExport: true,
          });
          (line as any).isGridLine = true;
          gridObjects.push(line);
        }
        
        // Draw diagonal lines at -30 degrees
        for (let i = -height; i <= width + height; i += isoSize) {
          const startX = i;
          const startY = 0;
          const endX = i - height * Math.tan(angleRad);
          const endY = height;
          
          const line = new Line([startX, startY, endX, endY], {
            stroke: '#e0e0e0',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            hoverCursor: 'default',
            excludeFromExport: true,
          });
          (line as any).isGridLine = true;
          gridObjects.push(line);
        }
        
        // Draw horizontal lines
        for (let i = 0; i <= height / isoSize; i++) {
          const line = new Line([0, i * isoSize, width, i * isoSize], {
            stroke: '#e0e0e0',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            hoverCursor: 'default',
            excludeFromExport: true,
          });
          (line as any).isGridLine = true;
          gridObjects.push(line);
        }
      }

      // Add all grid objects at once and send to back
      gridObjects.forEach(obj => {
        canvas.add(obj);
        canvas.sendObjectToBack(obj);
      });
    }

    canvas.requestRenderAll();
  }, [canvas, gridEnabled, gridPattern, zoom]);

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

    canvas.requestRenderAll();
  }, [canvas, rulersEnabled]);

  // Handle freeform line drawing
  useEffect(() => {
    if (!canvas) return;

    if (activeTool === "freeform-line") {
      canvas.isDrawingMode = true;
      canvas.selection = false; // Disable selection while drawing
      
      // Create and configure the pencil brush
      const brush = new PencilBrush(canvas);
      brush.color = "#000000";
      brush.width = 2;
      
      // CRITICAL: Set decimate to very low for smooth curves
      // decimate controls path simplification (0 = no simplification, keeps all points)
      (brush as any).decimate = 0.01; // Keep almost all points for smooth curves
      
      // Ensure smooth rendering
      (brush as any).strokeLineCap = "round";
      (brush as any).strokeLineJoin = "round";
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
          
          // Set path properties with round caps
          path.set({
            fill: null,
            stroke: "#000000",
            strokeWidth: 2,
            strokeUniform: true,
            strokeLineCap: "round",
            strokeLineJoin: "round",
          });
          
          canvas.setActiveObject(path);
          canvas.requestRenderAll();
          if (onShapeCreated) onShapeCreated();
        }
      };

      canvas.on("path:created", handlePathCreated);

      return () => {
        canvas.off("path:created", handlePathCreated);
        canvas.isDrawingMode = false;
        canvas.selection = true; // Re-enable selection
      };
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = true;
    }
  }, [canvas, activeTool]);

  // Handle eraser tool
  useEffect(() => {
    if (!canvas) return;

    if (activeTool === "eraser") {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      
      const eraserBrush = new PencilBrush(canvas);
      eraserBrush.width = 20;
      eraserBrush.color = "rgba(255,255,255,1)"; // Use white to blend with background
      canvas.freeDrawingBrush = eraserBrush;
      
      canvas.defaultCursor = "crosshair";
      canvas.hoverCursor = "crosshair";

      const handleEraserPath = (e: any) => {
        const path = e.path as Path;
        if (path) {
          path.globalCompositeOperation = "destination-out";
          (path as any).isEraserPath = true;
          path.selectable = false;
          path.evented = false;
          canvas.requestRenderAll();
        }
      };

      canvas.on("path:created", handleEraserPath);

      return () => {
        canvas.off("path:created", handleEraserPath);
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.defaultCursor = "default";
        canvas.hoverCursor = "move";
      };
    }
  }, [canvas, activeTool]);

  // Handle image insertion tool
  useEffect(() => {
    if (!canvas) return;

    if (activeTool === "image") {
      // Create a hidden file input
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".svg,.jpg,.jpeg,.png,image/svg+xml,image/jpeg,image/png";
      fileInput.style.display = "none";
      
      fileInput.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) return;

        // Validate file type
        const validTypes = ["image/svg+xml", "image/jpeg", "image/jpg", "image/png"];
        const validExtensions = [".svg", ".jpg", ".jpeg", ".png"];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
        
        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
          toast.error("Invalid file format. Only SVG, JPG, and PNG files are allowed.");
          return;
        }

        try {
          const reader = new FileReader();
          
          reader.onload = async (event) => {
            const imgUrl = event.target?.result as string;
            
            if (file.type === "image/svg+xml" || fileExtension === ".svg") {
              // Handle SVG files
              loadSVGFromString(imgUrl).then(({ objects, options }) => {
                const group = util.groupSVGElements(objects, options);
                
                // Scale to fit within 60% of canvas
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
                canvas.setActiveObject(group);
                canvas.requestRenderAll();
                toast.success("SVG image added to canvas");
                
                // Auto-save to library
                window.dispatchEvent(new CustomEvent('saveUploadToLibrary', {
                  detail: { file, content: imgUrl }
                }));
                
                if (onShapeCreated) onShapeCreated();
              }).catch((error) => {
                console.error("Error loading SVG:", error);
                toast.error("Failed to load SVG image");
              });
            } else {
              // Handle JPG/PNG files with CORS support
              try {
                const img = await loadImageWithCORS(imgUrl);
                const fabricImage = new FabricImage(img, {
                  left: (canvas.width || 0) / 2,
                  top: (canvas.height || 0) / 2,
                  originX: "center",
                  originY: "center",
                });
                
                // Scale to fit within 60% of canvas
                const maxW = (canvas.width || 0) * 0.6;
                const maxH = (canvas.height || 0) * 0.6;
                const scale = Math.min(maxW / fabricImage.width!, maxH / fabricImage.height!, 1);
                fabricImage.scale(scale);
                
                canvas.add(fabricImage);
                canvas.setActiveObject(fabricImage);
                canvas.requestRenderAll();
                toast.success("Image added to canvas");
                
                // Auto-save to library
                window.dispatchEvent(new CustomEvent('saveUploadToLibrary', {
                  detail: { file, content: imgUrl }
                }));
                
                if (onShapeCreated) onShapeCreated();
              } catch (error) {
                console.error("Failed to load image:", error);
                toast.error("Failed to load image");
              }
            }
          };
          
          reader.onerror = () => {
            toast.error("Failed to read file");
          };
          
          reader.readAsDataURL(file);
        } catch (error) {
          console.error("Error loading image:", error);
          toast.error("Failed to load image");
        }
      };

      // Trigger the file input
      document.body.appendChild(fileInput);
      fileInput.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(fileInput);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, activeTool]);

  // Enhanced Pen Tool with smooth bezier curves (draw.io style)
  useEffect(() => {
    if (!canvas || activeTool !== "pen") {
      // Clean up bezier tool when switching away
      if (bezierToolRef.current) {
        bezierToolRef.current.cancel();
        bezierToolRef.current = null;
      }
      return;
    }

    // Initialize enhanced bezier tool
    bezierToolRef.current = new EnhancedBezierTool(canvas, {
      smooth: 0.5,
      snap: true,
    });

    bezierToolRef.current.start();

    const handleCanvasClick = (e: any) => {
      const pointer = canvas.getPointer(e.e);
      bezierToolRef.current?.addPoint(pointer.x, pointer.y);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        bezierToolRef.current?.cancel();
        toast.info("Bezier drawing cancelled");
      } else if (e.key === "Enter") {
        const path = bezierToolRef.current?.finish();
        if (path) {
          toast.success("Smooth bezier curve created!");
          if (onShapeCreated) onShapeCreated();
        }
      }
    };

    canvas.on("mouse:down", handleCanvasClick);
    window.addEventListener("keydown", handleKeyDown);

    toast.info("Click to add points. Press Enter to finish, Escape to cancel.");

    return () => {
      canvas.off("mouse:down", handleCanvasClick);
      window.removeEventListener("keydown", handleKeyDown);
      if (bezierToolRef.current) {
        bezierToolRef.current.cancel();
      }
    };
  }, [canvas, activeTool, onShapeCreated]);

  // Straight Line Tool with customizable markers
  useEffect(() => {
    if (!canvas || !activeTool.startsWith("straight-line")) {
      if (straightLineToolRef.current) {
        straightLineToolRef.current.cancel();
        straightLineToolRef.current = null;
      }
      return;
    }

    // Parse tool options from activeTool string
    const options: any = {
      startMarker: 'none',
      endMarker: 'none',
      lineStyle: 'solid',
      strokeWidth: 2,
      strokeColor: '#000000',
      snap: true,
      gridSize: 20,
    };

    // Parse activeTool to set markers and styles
    if (activeTool.includes('double-arrow')) {
      options.startMarker = 'arrow';
      options.endMarker = 'arrow';
    } else if (activeTool.includes('arrow')) {
      options.endMarker = 'arrow';
    }
    
    if (activeTool.includes('dot')) {
      options.startMarker = 'dot';
      options.endMarker = 'dot';
    }
    
    if (activeTool.includes('diamond')) {
      options.startMarker = 'diamond';
      options.endMarker = 'diamond';
    }
    
    if (activeTool.includes('circle')) {
      options.startMarker = 'circle';
      options.endMarker = 'circle';
    }
    
    if (activeTool.includes('dashed')) {
      options.lineStyle = 'dashed';
    } else if (activeTool.includes('dotted')) {
      options.lineStyle = 'dotted';
    }

    // Initialize straight line tool
    straightLineToolRef.current = new StraightLineTool(canvas, options);
    straightLineToolRef.current.start();

    // Drag-to-draw handlers
    const handleMouseDown = (e: any) => {
      e.e?.stopImmediatePropagation?.();
      e.e?.preventDefault?.();
      const pointer = canvas.getPointer(e.e);
      straightLineToolRef.current?.startDragLine(pointer.x, pointer.y);
    };

    const handleMouseMove = (e: any) => {
      const pointer = canvas.getPointer(e.e);
      straightLineToolRef.current?.updateDragLine(pointer.x, pointer.y);
    };

    const handleMouseUp = (e: any) => {
      const pointer = canvas.getPointer(e.e);
      const line = straightLineToolRef.current?.finishDragLine(pointer.x, pointer.y);
      if (line) {
        toast.success("Straight line created!");
        if (onShapeCreated) onShapeCreated();
        // Re-initialize tool for drawing more lines
        straightLineToolRef.current = new StraightLineTool(canvas, options);
        straightLineToolRef.current.start();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        straightLineToolRef.current?.cancel();
        onToolChange?.("select");
        toast.info("Straight line tool cancelled");
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    toast.info("Click and drag to draw a straight line. Press Escape to exit.");

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      if (straightLineToolRef.current) {
        straightLineToolRef.current.cancel();
      }
    };
  }, [canvas, activeTool, onShapeCreated, onToolChange]);

  // Orthogonal Line Tool with 90-degree bends
  useEffect(() => {
    if (!canvas || !activeTool.startsWith("orthogonal-line")) {
      if (orthogonalLineToolRef.current) {
        orthogonalLineToolRef.current.cancel();
        orthogonalLineToolRef.current = null;
      }
      return;
    }

    // Parse tool options from activeTool string
    const options: any = {
      startMarker: 'none',
      endMarker: 'none',
      lineStyle: 'solid',
      strokeWidth: 2,
      strokeColor: '#000000',
      snap: true,
      gridSize: 20,
      smoothCorners: false,
      cornerRadius: 10,
    };

    // Parse activeTool to set markers and styles
    if (activeTool.startsWith('orthogonal-line-custom-')) {
      // Extract custom markers from tool name
      // Format: orthogonal-line-custom-{startMarker}-{endMarker}
      const parts = activeTool.split('-');
      if (parts.length >= 5) {
        options.startMarker = parts[3]; // e.g., 'dot', 'arrow', 'none', 'bar'
        options.endMarker = parts[4];
      }
    } else if (activeTool.includes('double-arrow')) {
      options.startMarker = 'arrow';
      options.endMarker = 'arrow';
    } else if (activeTool.includes('arrow')) {
      options.endMarker = 'arrow';
    }
    
    if (activeTool.includes('dot')) {
      options.startMarker = 'dot';
      options.endMarker = 'dot';
    }
    
    if (activeTool.includes('diamond')) {
      options.startMarker = 'diamond';
      options.endMarker = 'diamond';
    }
    
    if (activeTool.includes('circle')) {
      options.startMarker = 'circle';
      options.endMarker = 'circle';
    }
    
    if (activeTool.includes('dashed')) {
      options.lineStyle = 'dashed';
    } else if (activeTool.includes('dotted')) {
      options.lineStyle = 'dotted';
    }

    // Initialize orthogonal line tool
    orthogonalLineToolRef.current = new OrthogonalLineTool(canvas, options);
    orthogonalLineToolRef.current.start();

    // Click to add waypoints
    const handleMouseDown = (e: any) => {
      e.e?.stopImmediatePropagation?.();
      e.e?.preventDefault?.();
      const pointer = canvas.getPointer(e.e);
      orthogonalLineToolRef.current?.addPoint(pointer.x, pointer.y);
    };

    // Update preview as mouse moves
    const handleMouseMove = (e: any) => {
      const pointer = canvas.getPointer(e.e);
      orthogonalLineToolRef.current?.updatePreview(pointer.x, pointer.y);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const line = orthogonalLineToolRef.current?.finish();
        if (line) {
          toast.success("Orthogonal line created!");
          if (onShapeCreated) onShapeCreated();
        }
        onToolChange?.("select");
      } else if (e.key === "Escape") {
        orthogonalLineToolRef.current?.cancel();
        onToolChange?.("select");
        toast.info("Orthogonal line tool cancelled");
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    toast.info("Click to add waypoints. Press Enter to finish, Escape to cancel.");

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      if (orthogonalLineToolRef.current) {
        orthogonalLineToolRef.current.cancel();
      }
    };
  }, [canvas, activeTool, onShapeCreated, onToolChange]);

  // Curved Line Tool with adjustable control points
  useEffect(() => {
    if (!canvas || !activeTool.startsWith("curved-line")) {
      if (curvedLineToolRef.current) {
        curvedLineToolRef.current.cancel();
        curvedLineToolRef.current = null;
      }
      return;
    }

    // Parse tool options from activeTool string
    const options: any = {
      startMarker: 'none',
      endMarker: 'none',
      lineStyle: 'solid',
      strokeWidth: 2,
      strokeColor: '#000000',
      snap: true,
      gridSize: 20,
    };

    // Parse activeTool to set markers and styles
    if (activeTool.startsWith('curved-line-custom-')) {
      // Extract custom markers from tool name
      // Format: curved-line-custom-{startMarker}-{endMarker}
      const parts = activeTool.split('-');
      if (parts.length >= 5) {
        options.startMarker = parts[3]; // e.g., 'dot', 'arrow', 'none', 'bar', 'block', 'back-arrow'
        options.endMarker = parts[4];
      }
    } else if (activeTool.includes('double-arrow')) {
      options.startMarker = 'arrow';
      options.endMarker = 'arrow';
    } else if (activeTool.includes('arrow')) {
      options.endMarker = 'arrow';
    }
    
    if (activeTool.includes('dots')) {
      options.startMarker = 'dot';
      options.endMarker = 'dot';
    }
    
    if (activeTool.includes('diamonds')) {
      options.startMarker = 'diamond';
      options.endMarker = 'diamond';
    }
    
    if (activeTool.includes('circles')) {
      options.startMarker = 'circle';
      options.endMarker = 'circle';
    }
    
    if (activeTool.includes('dashed')) {
      options.lineStyle = 'dashed';
    } else if (activeTool.includes('dotted')) {
      options.lineStyle = 'dotted';
    }

    // Initialize curved line tool
    curvedLineToolRef.current = new CurvedLineTool(canvas, options);
    curvedLineToolRef.current.start();

    // Two-click drawing handlers
    let hasStartPoint = false;

    const handleMouseDown = (e: any) => {
      e.e?.stopImmediatePropagation?.();
      e.e?.preventDefault?.();
      const pointer = canvas.getPointer(e.e);
      if (!hasStartPoint) {
        curvedLineToolRef.current?.setStartPoint(pointer.x, pointer.y);
        hasStartPoint = true;
      } else {
        const curve = curvedLineToolRef.current?.setEndPoint(pointer.x, pointer.y);
        if (curve) {
          toast.success("Curved line created! Drag the control point to adjust.");
          if (onShapeCreated) onShapeCreated();
          // Re-initialize for next line
          curvedLineToolRef.current = new CurvedLineTool(canvas, options);
          curvedLineToolRef.current.start();
          hasStartPoint = false;
        }
      }
    };

    const handleMouseMove = (e: any) => {
      if (hasStartPoint) {
        const pointer = canvas.getPointer(e.e);
        curvedLineToolRef.current?.updatePreview(pointer.x, pointer.y);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        curvedLineToolRef.current?.cancel();
        onToolChange?.("select");
        hasStartPoint = false;
        toast.info("Curved line tool cancelled");
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    toast.info("Click start point, then end point. Drag control point to adjust curve.");

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      if (curvedLineToolRef.current) {
        curvedLineToolRef.current.cancel();
      }
    };
  }, [canvas, activeTool, onShapeCreated, onToolChange]);

  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;

    // Update cursor based on tool
    if (activeTool === "text") {
      canvas.defaultCursor = "text";
    } else if (activeTool === "freeform-line") {
      canvas.defaultCursor = "crosshair";
    } else if (activeTool === "pen") {
      canvas.defaultCursor = "crosshair";
    } else if (activeTool === "eraser") {
      canvas.defaultCursor = "crosshair";
    } else if (activeTool.startsWith('connector-') || activeTool.startsWith('line-') || activeTool.startsWith('straight-line') || activeTool.startsWith('orthogonal-line') || activeTool.startsWith('curved-line')) {
      canvas.defaultCursor = "crosshair";
    } else {
      canvas.defaultCursor = "default";
    }

    const handleCanvasClick = (e: any) => {
      if (activeTool === "select" || activeTool === "freeform-line" || activeTool === "pen" || activeTool === "eraser" || activeTool === "image" || activeTool.startsWith('straight-line') || activeTool.startsWith('orthogonal-line') || activeTool.startsWith('curved-line')) return;

      const pointer = canvas.getPointer(e.e);
      
      // Handle shapes with text
      if (activeTool.endsWith('-with-text')) {
        let bgShape;
        let textWidth = 100;
        
        switch (activeTool) {
          case "circle-with-text": {
            bgShape = new Circle({
              radius: 60,
              fill: "#3b82f6",
              stroke: "#000000",
              strokeWidth: 2,
              strokeUniform: true,
              originX: 'center',
              originY: 'center',
            });
            textWidth = 100;
            break;
          }
          
          case "rectangle-with-text": {
            bgShape = new Rect({
              width: 120,
              height: 80,
              fill: "#3b82f6",
              stroke: "#000000",
              strokeWidth: 2,
              strokeUniform: true,
              originX: 'center',
              originY: 'center',
            });
            textWidth = 100;
            break;
          }
          
          case "rounded-rect-with-text": {
            bgShape = new Rect({
              width: 120,
              height: 80,
              rx: 10,
              ry: 10,
              fill: "#3b82f6",
              stroke: "#000000",
              strokeWidth: 2,
              strokeUniform: true,
              originX: 'center',
              originY: 'center',
            });
            textWidth = 100;
            break;
          }
          
          case "square-with-text": {
            bgShape = new Rect({
              width: 100,
              height: 100,
              fill: "#3b82f6",
              stroke: "#000000",
              strokeWidth: 2,
              strokeUniform: true,
              originX: 'center',
              originY: 'center',
            });
            textWidth = 80;
            break;
          }
        }
        
        if (bgShape) {
          const shapeText = new Textbox("Text", {
            fontSize: 18,
            fill: "#ffffff",
            textAlign: "center",
            originX: 'center',
            originY: 'center',
            width: textWidth,
            fontFamily: getCanvasFontFamily(textFont),
            selectable: true,
            evented: true,
            hoverCursor: 'text',
          });
          (shapeText as any).listType = 'none';
          
          const group = new Group([bgShape, shapeText], {
            left: pointer.x,
            top: pointer.y,
            originX: 'center',
            originY: 'center',
            subTargetCheck: true,
          });
          
          canvas.add(group);
          canvas.setActiveObject(group);
          canvas.requestRenderAll();
          if (onShapeCreated) onShapeCreated();
          toast.success("Shape with text created! Double-click to edit text.");
        }
        return;
      }
      
      // Handle connector tools
      if (activeTool.startsWith('connector-') || activeTool.startsWith('line-')) {
        if (!connectorState.isDrawing) {
          // Start drawing
          setConnectorState({
            isDrawing: true,
            startX: pointer.x,
            startY: pointer.y,
          });
          toast.info("Click to set end point");
          return;
        } else {
          // Finish drawing
          const getConnectorProps = () => {
            let startMarker: ArrowMarkerType = 'none';
            let endMarker: ArrowMarkerType = 'arrow';
            let routingStyle: RoutingStyle = 'straight';

            if (activeTool === 'connector-curved') routingStyle = 'curved';
            else if (activeTool === 'connector-orthogonal') routingStyle = 'orthogonal';
            else if (activeTool === 'line-double-arrow') startMarker = 'arrow';
            else if (activeTool === 'line-plain') endMarker = 'none';
            else if (activeTool === 'line-circle-arrow') startMarker = 'circle';
            else if (activeTool === 'line-diamond') {
              startMarker = 'diamond';
              endMarker = 'none';
            }

            return { startMarker, endMarker, routingStyle };
          };

          const props = getConnectorProps();
          createConnector(canvas, {
            startX: connectorState.startX!,
            startY: connectorState.startY!,
            endX: pointer.x,
            endY: pointer.y,
            ...props,
            strokeColor: '#000000',
            strokeWidth: 2,
          });

          setConnectorState({
            isDrawing: false,
            startX: null,
            startY: null,
          });

          canvas.requestRenderAll();
          if (onShapeCreated) onShapeCreated();
          toast.success("Connector created!");
          return;
        }
      }
      
      
      if (activeTool === "text") {
        const textDecoration = [];
        if (textUnderline) textDecoration.push('underline');
        if (textOverline) textDecoration.push('overline');
        
        const text = new Textbox("Type here", {
          left: pointer.x,
          top: pointer.y,
          width: 200,
          fontSize: 24,
          fontFamily: getCanvasFontFamily(textFont),
          textAlign: textAlign as any,
          underline: textUnderline,
          overline: textOverline,
          fontWeight: textBold ? 'bold' : 'normal',
          fontStyle: textItalic ? 'italic' : 'normal',
          fill: "#000000",
        });
        (text as any).listType = 'none';
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
          });
          canvas.add(octagon);
          canvas.setActiveObject(octagon);
          break;
          
        case "zoom-callout-dotted": {
          // Create small circle (source/highlight area)
          const circle = new Circle({
            left: pointer.x - 20,
            top: pointer.y - 20,
            radius: 20,
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2,
            strokeUniform: true,
          });

          // Create rectangle (detail/magnified area)
          const rect = new Rect({
            left: pointer.x + 80,
            top: pointer.y - 60,
            width: 160,
            height: 120,
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2,
            strokeUniform: true,
          });

          // Calculate connection points - simple straight lines
          const circleRight = pointer.x + 20;
          const circleTopY = pointer.y - 14;
          const circleBottomY = pointer.y + 14;

          const rectLeft = pointer.x + 80;
          const rectTopY = pointer.y - 60;
          const rectBottomY = pointer.y + 60;

          // Create simple dotted connector lines (straight from circle to rectangle)
          const line1 = new Line(
            [circleRight, circleTopY, rectLeft, rectTopY],
            {
              stroke: '#000000',
              strokeWidth: 1.5,
              strokeDashArray: [6, 6],
              strokeUniform: true,
              selectable: false,
              evented: false,
            }
          );

          const line2 = new Line(
            [circleRight, circleBottomY, rectLeft, rectBottomY],
            {
              stroke: '#000000',
              strokeWidth: 1.5,
              strokeDashArray: [6, 6],
              strokeUniform: true,
              selectable: false,
              evented: false,
            }
          );

          // Group all elements together
          const calloutGroup = new Group([circle, line1, line2, rect], {
            left: pointer.x - 20,
            top: pointer.y - 60,
            selectable: true,
          });

          canvas.add(calloutGroup);
          canvas.setActiveObject(calloutGroup);
          break;
        }

        case "zoom-callout-trapezoid": {
          // Create small circle (source/highlight area)
          const circle = new Circle({
            left: pointer.x - 20,
            top: pointer.y - 20,
            radius: 20,
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2,
            strokeUniform: true,
          });

          // Create convergence square (the funnel point)
          const convergenceX = pointer.x + 50;
          const convergenceY = pointer.y;
          const convergenceSize = 8;
          
          const convergenceSquare = new Rect({
            left: convergenceX - convergenceSize / 2,
            top: convergenceY - convergenceSize / 2,
            width: convergenceSize,
            height: convergenceSize,
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 1,
            strokeUniform: true,
          });

          // Create rectangle (detail/magnified area)
          const rect = new Rect({
            left: pointer.x + 100,
            top: pointer.y - 80,
            width: 180,
            height: 160,
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2,
            strokeUniform: true,
          });

          // Calculate connection points for funnel effect
          const circleRight = pointer.x + 20;
          const circleTopY = pointer.y - 14;
          const circleBottomY = pointer.y + 14;

          const convergenceTop = convergenceY - convergenceSize / 2;
          const convergenceBottom = convergenceY + convergenceSize / 2;

          const rectLeft = pointer.x + 100;
          const rectTopY = pointer.y - 80;
          const rectBottomY = pointer.y + 80;

          // Create 4 dotted lines for trapezoid funnel effect
          // Lines from circle to convergence square (narrowing)
          const line1 = new Line(
            [circleRight, circleTopY, convergenceX - convergenceSize / 2, convergenceTop],
            {
              stroke: '#000000',
              strokeWidth: 1.5,
              strokeDashArray: [6, 6],
              strokeUniform: true,
              selectable: false,
              evented: false,
            }
          );

          const line2 = new Line(
            [circleRight, circleBottomY, convergenceX - convergenceSize / 2, convergenceBottom],
            {
              stroke: '#000000',
              strokeWidth: 1.5,
              strokeDashArray: [6, 6],
              strokeUniform: true,
              selectable: false,
              evented: false,
            }
          );

          // Lines from convergence square to rectangle (widening)
          const line3 = new Line(
            [convergenceX + convergenceSize / 2, convergenceTop, rectLeft, rectTopY],
            {
              stroke: '#000000',
              strokeWidth: 1.5,
              strokeDashArray: [6, 6],
              strokeUniform: true,
              selectable: false,
              evented: false,
            }
          );

          const line4 = new Line(
            [convergenceX + convergenceSize / 2, convergenceBottom, rectLeft, rectBottomY],
            {
              stroke: '#000000',
              strokeWidth: 1.5,
              strokeDashArray: [6, 6],
              strokeUniform: true,
              selectable: false,
              evented: false,
            }
          );

          // Group all elements together
          const calloutGroup = new Group([circle, line1, line2, convergenceSquare, line3, line4, rect], {
            left: pointer.x - 20,
            top: pointer.y - 80,
            selectable: true,
          });

          canvas.add(calloutGroup);
          canvas.setActiveObject(calloutGroup);
          break;
        }
        
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
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
            strokeUniform: true,
          });
          const dbBody = new Rect({
            left: pointer.x - 40,
            top: pointer.y - 30,
            width: 80,
            height: 70,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
            strokeUniform: true,
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
            strokeUniform: true,
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

        case "paren-left": {
          const height = 80;
          const width = 30;
          const parenLeft = new Path(
            `M ${pointer.x + width} ${pointer.y} Q ${pointer.x} ${pointer.y + height/2} ${pointer.x + width} ${pointer.y + height}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          canvas.add(parenLeft);
          canvas.setActiveObject(parenLeft);
          break;
        }

        case "paren-right": {
          const height = 80;
          const width = 30;
          const parenRight = new Path(
            `M ${pointer.x} ${pointer.y} Q ${pointer.x + width} ${pointer.y + height/2} ${pointer.x} ${pointer.y + height}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          canvas.add(parenRight);
          canvas.setActiveObject(parenRight);
          break;
        }

        case "paren-top": {
          const width = 80;
          const height = 30;
          const parenTop = new Path(
            `M ${pointer.x} ${pointer.y + height} Q ${pointer.x + width/2} ${pointer.y} ${pointer.x + width} ${pointer.y + height}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          canvas.add(parenTop);
          canvas.setActiveObject(parenTop);
          break;
        }

        case "paren-bottom": {
          const width = 80;
          const height = 30;
          const parenBottom = new Path(
            `M ${pointer.x} ${pointer.y} Q ${pointer.x + width/2} ${pointer.y + height} ${pointer.x + width} ${pointer.y}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          canvas.add(parenBottom);
          canvas.setActiveObject(parenBottom);
          break;
        }

        case "bracket-left": {
          const height = 80;
          const width = 20;
          const bracketLeft = new Path(
            `M ${pointer.x + width} ${pointer.y} L ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y + height} L ${pointer.x + width} ${pointer.y + height}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          canvas.add(bracketLeft);
          canvas.setActiveObject(bracketLeft);
          break;
        }

        case "bracket-right": {
          const height = 80;
          const width = 20;
          const bracketRight = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x + width} ${pointer.y} L ${pointer.x + width} ${pointer.y + height} L ${pointer.x} ${pointer.y + height}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          canvas.add(bracketRight);
          canvas.setActiveObject(bracketRight);
          break;
        }

        case "bracket-top": {
          const width = 80;
          const height = 20;
          const bracketTop = new Path(
            `M ${pointer.x} ${pointer.y} L ${pointer.x + width} ${pointer.y} M ${pointer.x + width/2} ${pointer.y} L ${pointer.x + width/2} ${pointer.y + height}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          canvas.add(bracketTop);
          canvas.setActiveObject(bracketTop);
          break;
        }

        case "bracket-bottom": {
          const width = 80;
          const height = 20;
          const bracketBottom = new Path(
            `M ${pointer.x + width/2} ${pointer.y} L ${pointer.x + width/2} ${pointer.y + height} M ${pointer.x} ${pointer.y + height} L ${pointer.x + width} ${pointer.y + height}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          canvas.add(bracketBottom);
          canvas.setActiveObject(bracketBottom);
          break;
        }

        case "paren-left-arrow": {
          const height = 80;
          const width = 30;
          const parenLeftArrow = new Path(
            `M ${pointer.x + width} ${pointer.y} Q ${pointer.x} ${pointer.y + height/2} ${pointer.x + width} ${pointer.y + height}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          
          const arrowSize = 8;
          const arrowAngle = Math.PI / 4;
          const arrow = new Path(
            `M ${pointer.x + width} ${pointer.y + height} L ${pointer.x + width - arrowSize * Math.cos(arrowAngle)} ${pointer.y + height - arrowSize * Math.sin(arrowAngle)} M ${pointer.x + width} ${pointer.y + height} L ${pointer.x + width + arrowSize * Math.cos(arrowAngle)} ${pointer.y + height - arrowSize * Math.sin(arrowAngle)}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: false,
            }
          );
          
          const group = new Group([parenLeftArrow, arrow], {
            selectable: true,
          });
          canvas.add(group);
          canvas.setActiveObject(group);
          break;
        }

        case "paren-right-arrow": {
          const height = 80;
          const width = 30;
          const parenRightArrow = new Path(
            `M ${pointer.x} ${pointer.y} Q ${pointer.x + width} ${pointer.y + height/2} ${pointer.x} ${pointer.y + height}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: true,
              strokeUniform: true,
            }
          );
          
          const arrowSize = 8;
          const arrowAngle = Math.PI / 4;
          const arrow = new Path(
            `M ${pointer.x} ${pointer.y + height} L ${pointer.x - arrowSize * Math.cos(arrowAngle)} ${pointer.y + height - arrowSize * Math.sin(arrowAngle)} M ${pointer.x} ${pointer.y + height} L ${pointer.x + arrowSize * Math.cos(arrowAngle)} ${pointer.y + height - arrowSize * Math.sin(arrowAngle)}`,
            {
              stroke: "#000000",
              strokeWidth: 2,
              fill: null,
              selectable: false,
            }
          );
          
          const group = new Group([parenRightArrow, arrow], {
            selectable: true,
          });
          canvas.add(group);
          canvas.setActiveObject(group);
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
    
    canvas.requestRenderAll();
    if (onShapeCreated) onShapeCreated();
    };

    // Double-click handler to edit text inside labeled shape groups
    const handleDblClick = (e: any) => {
      const target = e.target as any;
      if (!target) return;
      if (target.type === 'group') {
        const textObj = target.getObjects().find((o: any) => o.type === 'textbox');
        if (textObj) {
          canvas.setActiveObject(textObj);
          if ((textObj as any).enterEditing) {
            (textObj as any).enterEditing();
            (textObj as any).selectAll?.();
          }
          canvas.requestRenderAll();
        }
      } else if (target.type === 'textbox') {
        (target as any).enterEditing?.();
        canvas.requestRenderAll();
      }
    };

    // Improve hit testing for nested objects
    (canvas as any).targetFindTolerance = 8;
    (canvas as any).subTargetCheck = true;

    // Detach previous handlers
    canvas.off("mouse:down", handleCanvasClick);
    canvas.off("mouse:dblclick", handleDblClick);
    
    // Attach handlers
    if (activeTool !== "select" && activeTool !== "freeform-line" && activeTool !== "pen") {
      canvas.on("mouse:down", handleCanvasClick);
    }
    canvas.on("mouse:dblclick", handleDblClick);

    return () => {
      canvas.off("mouse:down", handleCanvasClick);
      canvas.off("mouse:dblclick", handleDblClick);
    };
  }, [canvas, activeTool, textFont, textAlign, textUnderline, textOverline, textBold, textItalic, connectorState.isDrawing, connectorState.startX, connectorState.startY]);

  // Visual feedback for active tool mode
  const isToolActive = activeTool && activeTool !== 'select';
  const toolModeClass = isToolActive 
    ? 'shadow-[0_0_0_2px_hsl(var(--primary)/0.5)] rounded-sm' 
    : '';

  return (
    <div
      className="w-full h-full overflow-auto relative"
      style={gridEnabled ? {
        background: 'linear-gradient(90deg, #f0f0f0 1px, transparent 1px), linear-gradient(#f0f0f0 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      } : undefined}
    >
      <div className="w-full h-full flex items-start justify-center p-4">
        <div className={`shadow-2xl bg-white transition-all duration-200 ${toolModeClass}`} style={{ boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};
