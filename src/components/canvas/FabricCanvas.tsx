import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Rect, Circle, Line, Textbox, Polygon, Ellipse, loadSVGFromString, util, Group, Path, PencilBrush } from "fabric";
import { toast } from "sonner";
import { useCanvas } from "@/contexts/CanvasContext";
import { loadAllFonts } from "@/lib/fontLoader";
import { createConnector } from "@/lib/connectorSystem";
import { createSVGArrowMarker } from "@/lib/advancedLineSystem";
import { ArrowMarkerType, RoutingStyle } from "@/types/connector";
import { EnhancedBezierTool } from "@/lib/enhancedBezierTool";
import { StraightLineTool } from "@/lib/straightLineTool";
import { OrthogonalLineTool } from "@/lib/orthogonalLineTool";
import { CurvedLineTool } from "@/lib/curvedLineTool";
import { calculateArcPath, snapToGrid } from "@/lib/advancedLineSystem";
import { ConnectorVisualFeedback } from "@/lib/connectorVisualFeedback";

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

  const bezierToolRef = useRef<EnhancedBezierTool | null>(null);
  const straightLineToolRef = useRef<StraightLineTool | null>(null);
  const orthogonalLineToolRef = useRef<OrthogonalLineTool | null>(null);
  const curvedLineToolRef = useRef<CurvedLineTool | null>(null);
  const connectorFeedbackRef = useRef<ConnectorVisualFeedback | null>(null);
  
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

    const initCanvas = async () => {
      // Load fonts before initializing canvas
      await loadAllFonts();
      
      const canvas = new Canvas(canvasRef.current!, {
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
    
    // Initialize connector visual feedback
    connectorFeedbackRef.current = new ConnectorVisualFeedback(canvas);
    
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
        const startTime = performance.now();
        
        // Sanitize SVG before parsing to fix namespace issues
        const sanitizedSVG = sanitizeSVGNamespaces(svgData);
        
        // Create a timeout promise for large SVG parsing
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SVG parsing timeout')), 20000); // 20 second timeout
        });
        
        // Parse sanitized SVG string with timeout
        const parsePromise = loadSVGFromString(sanitizedSVG);
        const { objects, options } = await Promise.race([parsePromise, timeoutPromise]) as Awaited<ReturnType<typeof loadSVGFromString>>;
        
        const parseTime = performance.now() - startTime;
        console.log(`SVG parsed in ${parseTime.toFixed(2)}ms`);
        
        if (parseTime > 5000) {
          console.warn('Large SVG detected - parsing took over 5 seconds');
        }
        
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
        canvas.setActiveObject(group);
        canvas.renderAll();
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
          canvas.renderAll();
          toast.success("Asset added to canvas");
        } else {
          // Handle as data URL image
          const img = new Image();
          
          img.onload = () => {
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
            canvas.renderAll();
            toast.success("Asset added to canvas");
          };
          
          img.onerror = () => {
            console.error("Failed to load image from data URL");
            toast.error("Failed to load image asset");
          };
          
          // Set timeout for slow loading images
          const timeout = setTimeout(() => {
            console.error("Image loading timeout");
            toast.error("Image loading timed out");
          }, 10000);
          
          img.onload = () => {
            clearTimeout(timeout);
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
            canvas.renderAll();
            toast.success("Asset added to canvas");
          };
          
          img.src = content;
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
          canvas.renderAll();
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
          canvas.renderAll();
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
          
          reader.onload = (event) => {
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
                canvas.renderAll();
                toast.success("SVG image added to canvas");
                
                // Prompt to save to library
                toast("Save to your library?", {
                  action: {
                    label: "Save",
                    onClick: () => {
                      window.dispatchEvent(new CustomEvent('saveUploadToLibrary', {
                        detail: { file, content: imgUrl }
                      }));
                    }
                  },
                  duration: 5000
                });
                
                if (onShapeCreated) onShapeCreated();
              }).catch((error) => {
                console.error("Error loading SVG:", error);
                toast.error("Failed to load SVG image");
              });
            } else {
              // Handle JPG/PNG files
              const img = new Image();
              img.onload = () => {
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
                canvas.renderAll();
                toast.success("Image added to canvas");
                
                // Prompt to save to library
                toast("Save to your library?", {
                  action: {
                    label: "Save",
                    onClick: () => {
                      window.dispatchEvent(new CustomEvent('saveUploadToLibrary', {
                        detail: { file, content: imgUrl }
                      }));
                    }
                  },
                  duration: 5000
                });
                
                if (onShapeCreated) onShapeCreated();
              };
              img.onerror = () => {
                toast.error("Failed to load image");
              };
              img.src = imgUrl;
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

    // Initialize orthogonal line tool
    orthogonalLineToolRef.current = new OrthogonalLineTool(canvas, options);
    orthogonalLineToolRef.current.start();

    // Click to add waypoints
    const handleMouseDown = (e: any) => {
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
    if (activeTool.includes('double-arrow')) {
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

          canvas.renderAll();
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
            `M ${pointer.x} ${pointer.y + height} L ${pointer.x} ${pointer.y} L ${pointer.x + width} ${pointer.y} L ${pointer.x + width} ${pointer.y + height}`,
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
            `M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y + height} L ${pointer.x + width} ${pointer.y + height} L ${pointer.x + width} ${pointer.y}`,
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
    
    // Attach handler if not in select mode, freeform mode, or pen mode
    // (those tools have their own mouse event handlers)
    if (activeTool !== "select" && activeTool !== "freeform-line" && activeTool !== "pen") {
      canvas.on("mouse:down", handleCanvasClick);
    }

    return () => {
      canvas.off("mouse:down", handleCanvasClick);
    };
  }, [canvas, activeTool, textFont, textAlign, textUnderline, textOverline, textBold, textItalic, connectorState.isDrawing, connectorState.startX, connectorState.startY]);

  return (
    <div
      className="w-full h-full overflow-auto relative"
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
