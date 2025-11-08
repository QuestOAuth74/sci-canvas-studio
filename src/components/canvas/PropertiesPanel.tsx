import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StylePanel } from "./StylePanel";
import { ArrangePanel } from "./ArrangePanel";
import { LinePropertiesPanel } from "./LinePropertiesPanel";
import { StylePresets } from "./StylePresets";
import { PAPER_SIZES, getPaperSize } from "@/types/paperSizes";
import { useState, useEffect } from "react";
import { useCanvas } from "@/contexts/CanvasContext";
import { Textbox, FabricImage, filters, Group, FabricObject, Path, Circle as FabricCircle, Polygon } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Pin, PinOff } from "lucide-react";

const GOOGLE_FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Raleway", label: "Raleway" },
  { value: "Ubuntu", label: "Ubuntu" },
  { value: "Oswald", label: "Oswald" },
  { value: "Merriweather", label: "Merriweather (Serif)" },
  { value: "Playfair Display", label: "Playfair Display (Serif)" },
  { value: "Crimson Text", label: "Crimson Text (Serif)" },
  { value: "Source Sans 3", label: "Source Sans 3" },
  { value: "Arial", label: "Arial (System)" },
  { value: "Helvetica", label: "Helvetica (System)" },
  { value: "Georgia", label: "Georgia (System)" },
  { value: "Times New Roman", label: "Times New Roman (System)" },
];

export const PropertiesPanel = ({ isCollapsed, onToggleCollapse, activeTool }: { isCollapsed?: boolean; onToggleCollapse?: () => void; activeTool?: string }) => {
  const { 
    gridEnabled, 
    setGridEnabled, 
    rulersEnabled, 
    setRulersEnabled, 
    backgroundColor, 
    setBackgroundColor,
    paperSize,
    setPaperSize,
    setCanvasDimensions,
    canvasDimensions,
    canvas,
    selectedObject,
    togglePin,
    isPinned,
    smoothenPath,
    recentColors,
    addToRecentColors
  } = useCanvas();
  const [showBgColor, setShowBgColor] = useState(false);
  const [textFont, setTextFont] = useState("Inter");
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState("#000000");
  const [shapeFillColor, setShapeFillColor] = useState("#3b82f6");
  const [shapeStrokeColor, setShapeStrokeColor] = useState("#000000");
  const [imageToneColor, setImageToneColor] = useState("#3b82f6");
  const [imageToneOpacity, setImageToneOpacity] = useState(0.3);
  const [iconColor, setIconColor] = useState("#000000");
  const [iconToneColor, setIconToneColor] = useState("#3b82f6");
  const [iconToneIntensity, setIconToneIntensity] = useState(0.5);
  const [iconToneMode, setIconToneMode] = useState<"direct" | "tone">("direct");
  const [freeformLineColor, setFreeformLineColor] = useState("#000000");
  const [freeformLineThickness, setFreeformLineThickness] = useState(2);
  const [freeformStartMarker, setFreeformStartMarker] = useState<"none" | "dot" | "arrow">("none");
  const [freeformEndMarker, setFreeformEndMarker] = useState<"none" | "dot" | "arrow">("none");
  const [eraserWidth, setEraserWidth] = useState(20);
  const [smoothingStrength, setSmoothingStrength] = useState(50);

  const COLOR_PALETTE = [
    "#3b82f6", // Blue
    "#0D9488", // Teal
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#ffffff", // White
    "#000000", // Black
    "#6b7280", // Gray
    "#f3f4f6", // Light gray
  ];

  // Helper function to get text object from selection
  const getTextObject = (obj: any): Textbox | null => {
    if (obj?.type === 'textbox') {
      return obj as Textbox;
    }
    // Check if it's a group containing text
    if (obj?.type === 'group') {
      const textObj = obj.getObjects().find((o: any) => o.type === 'textbox');
      return textObj as Textbox || null;
    }
    return null;
  };

  // Helper to detect if object is a shape-with-text group
  const isShapeWithTextGroup = (obj: any): boolean => {
    if (obj.type !== 'group') return false;
    const objects = obj.getObjects();
    return objects.length === 2 && 
           (objects[0].type === 'circle' || objects[0].type === 'rect') &&
           objects[1].type === 'textbox';
  };

  // Helper to get the shape from a group
  const getShapeFromGroup = (obj: any) => {
    if (isShapeWithTextGroup(obj)) {
      return obj.getObjects()[0]; // First object is the shape
    }
    return obj; // Return the object itself if not a group
  };

  // Helper functions to determine object types for context-aware panel
  const isTextObject = (obj: any) => {
    return obj?.type === 'textbox' || 
           (obj?.type === 'group' && obj.getObjects().some((o: any) => o.type === 'textbox'));
  };

  const isLineObject = (obj: any) => {
    return obj?.type === 'path' || 
           obj?.type === 'line' || 
           (obj as any)?.isFreeformLine;
  };

  const isShapeObject = (obj: any) => {
    return obj?.type === 'rect' || 
           obj?.type === 'circle' || 
           obj?.type === 'ellipse' || 
           obj?.type === 'polygon';
  };

  const isImageObject = (obj: any) => {
    return obj?.type === 'image';
  };

  const isCurvedTextObject = (obj: any) => {
    return obj?.type === 'curvedText';
  };

  // Update text properties when selected object changes
  useEffect(() => {
    const textObj = getTextObject(selectedObject);
    if (textObj) {
      setTextFont(textObj.fontFamily || "Inter");
      setTextSize(textObj.fontSize || 24);
      setTextColor(textObj.fill as string || "#000000");
    }
    // Update shape color properties for non-text objects
    if (selectedObject && selectedObject.type !== 'textbox' && selectedObject.type !== 'group') {
      setShapeFillColor((selectedObject.fill as string) || "#3b82f6");
      setShapeStrokeColor((selectedObject.stroke as string) || "#000000");
    } else if (selectedObject && isShapeWithTextGroup(selectedObject)) {
      const targetShape = getShapeFromGroup(selectedObject);
      setShapeFillColor((targetShape.fill as string) || "#3b82f6");
      setShapeStrokeColor((targetShape.stroke as string) || "#000000");
    }
    // Update icon color for group objects (icons)
    if (selectedObject && selectedObject.type === 'group') {
      const group = selectedObject as Group;
      // Get the color from the first object in the group that has a fill
      const firstObjWithColor = group.getObjects().find(obj => obj.fill && obj.fill !== 'transparent' && obj.fill !== 'none');
      if (firstObjWithColor && typeof firstObjWithColor.fill === 'string') {
        setIconColor(firstObjWithColor.fill);
      }
    }
    // Update freeform line properties
    if (selectedObject && (selectedObject as any).isFreeformLine) {
      const pathObj = selectedObject as Path;
      setFreeformLineColor((pathObj.stroke as string) || "#000000");
      setFreeformLineThickness((pathObj.strokeWidth as number) || 2);
      setFreeformStartMarker((pathObj as any).startMarker || "none");
      setFreeformEndMarker((pathObj as any).endMarker || "none");
    }
  }, [selectedObject]);

  const handleFontChange = (font: string) => {
    setTextFont(font);
    const textObj = getTextObject(selectedObject);
    if (canvas && textObj) {
      textObj.set({ fontFamily: font });
      canvas.renderAll();
    }
  };

  const handleTextSizeChange = (size: string) => {
    const numSize = parseInt(size);
    if (!isNaN(numSize)) {
      setTextSize(numSize);
      const textObj = getTextObject(selectedObject);
      if (canvas && textObj) {
        textObj.set({ fontSize: numSize });
        canvas.renderAll();
      }
    }
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    addToRecentColors(color);
    const textObj = getTextObject(selectedObject);
    if (canvas && textObj) {
      textObj.set({ fill: color });
      canvas.renderAll();
    }
  };

  const handleShapeFillColorChange = (color: string) => {
    setShapeFillColor(color);
    addToRecentColors(color);
    if (canvas && selectedObject && selectedObject.type !== 'textbox') {
      const targetShape = getShapeFromGroup(selectedObject);
      targetShape.set({ fill: color });
      canvas.renderAll();
    }
  };

  const handleShapeStrokeColorChange = (color: string) => {
    setShapeStrokeColor(color);
    addToRecentColors(color);
    if (canvas && selectedObject && selectedObject.type !== 'textbox') {
      const targetShape = getShapeFromGroup(selectedObject);
      targetShape.set({ stroke: color });
      canvas.renderAll();
    }
  };

  const handleImageToneChange = (color: string, opacity: number = imageToneOpacity) => {
    setImageToneColor(color);
    addToRecentColors(color);
    if (canvas && selectedObject && (selectedObject.type === 'image' || selectedObject instanceof FabricImage)) {
      const imageObj = selectedObject as FabricImage;
      
      // Convert hex color to RGB
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // Clear existing filters
      imageObj.filters = [];
      
      // Apply blend color filter
      const blendFilter = new filters.BlendColor({
        color: color,
        mode: 'tint',
        alpha: opacity,
      });
      
      imageObj.filters.push(blendFilter);
      imageObj.applyFilters();
      canvas.renderAll();
    }
  };

  const handleImageToneOpacityChange = (opacity: number) => {
    setImageToneOpacity(opacity);
    handleImageToneChange(imageToneColor, opacity);
  };

  const handleRemoveImageTone = () => {
    if (canvas && selectedObject && (selectedObject.type === 'image' || selectedObject instanceof FabricImage)) {
      const imageObj = selectedObject as FabricImage;
      imageObj.filters = [];
      imageObj.applyFilters();
      canvas.renderAll();
      setImageToneOpacity(0.3);
    }
  };

  const handleIconColorChange = (color: string) => {
    setIconColor(color);
    addToRecentColors(color);
    if (canvas && selectedObject && selectedObject.type === 'group') {
      const group = selectedObject as Group;
      
      // Recursively change colors of all objects in the group
      const changeObjectColor = (obj: FabricObject) => {
        if (obj.type === 'group') {
          const subGroup = obj as Group;
          subGroup.getObjects().forEach(changeObjectColor);
        } else {
          const hasFill = obj.fill && obj.fill !== 'transparent' && obj.fill !== 'none';
          const hasStroke = obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'none';
          
          // If object uses stroke (line-based icons)
          if (hasStroke && !hasFill) {
            obj.set({ stroke: color });
          }
          // If object uses fill (shape-based icons)
          else if (hasFill && !hasStroke) {
            obj.set({ fill: color });
          }
          // If object uses both (mixed icons)
          else if (hasFill && hasStroke) {
            obj.set({ fill: color, stroke: color });
          }
        }
      };
      
      group.getObjects().forEach(changeObjectColor);
      canvas.renderAll();
    }
  };

  // Helper to convert hex to HSL
  const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const handleIconToneChange = (color: string, intensity: number = iconToneIntensity) => {
    setIconToneColor(color);
    if (canvas && selectedObject && selectedObject.type === 'group') {
      const group = selectedObject as Group;
      const { h } = hexToHSL(color);
      
      // Apply CSS filter-like effects using custom properties
      (group as any).iconToneColor = color;
      (group as any).iconToneIntensity = intensity;
      (group as any).iconToneHue = h;
      
      // Apply blend color filter to simulate tone
      const blendFilter = new filters.BlendColor({
        color: color,
        mode: 'tint',
        alpha: intensity,
      });
      
      // Store original colors if not already stored
      if (!(group as any).originalColors) {
        const originalColors = new Map();
        const storeColors = (obj: FabricObject, path: string = '') => {
          if (obj.type === 'group') {
            (obj as Group).getObjects().forEach((child, idx) => storeColors(child, `${path}/${idx}`));
          } else {
            originalColors.set(path, { fill: obj.fill, stroke: obj.stroke });
          }
        };
        storeColors(group);
        (group as any).originalColors = originalColors;
      }
      
      // Apply tint to all objects in group
      const applyTintToObject = (obj: FabricObject) => {
        if (obj.type === 'group') {
          (obj as Group).getObjects().forEach(applyTintToObject);
        } else if (obj.type === 'image' || obj instanceof FabricImage) {
          // For raster images in the group, apply filter
          const imgObj = obj as FabricImage;
          imgObj.filters = [blendFilter];
          imgObj.applyFilters();
        } else {
          // For vector paths, blend colors manually
          const blendColor = (originalColor: string, tintColor: string, intensity: number): string => {
            if (!originalColor || originalColor === 'transparent' || originalColor === 'none') return originalColor;
            
            const orig = parseInt(originalColor.slice(1), 16);
            const tint = parseInt(tintColor.slice(1), 16);
            
            const origR = (orig >> 16) & 0xFF;
            const origG = (orig >> 8) & 0xFF;
            const origB = orig & 0xFF;
            
            const tintR = (tint >> 16) & 0xFF;
            const tintG = (tint >> 8) & 0xFF;
            const tintB = tint & 0xFF;
            
            const newR = Math.round(origR * (1 - intensity) + tintR * intensity);
            const newG = Math.round(origG * (1 - intensity) + tintG * intensity);
            const newB = Math.round(origB * (1 - intensity) + tintB * intensity);
            
            return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
          };
          
          const hasFill = obj.fill && obj.fill !== 'transparent' && obj.fill !== 'none';
          const hasStroke = obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'none';
          
          if (hasFill && typeof obj.fill === 'string') {
            obj.set({ fill: blendColor(obj.fill, color, intensity) });
          }
          if (hasStroke && typeof obj.stroke === 'string') {
            obj.set({ stroke: blendColor(obj.stroke, color, intensity) });
          }
        }
      };
      
      group.getObjects().forEach(applyTintToObject);
      canvas.renderAll();
    }
  };

  const handleIconToneIntensityChange = (intensity: number) => {
    setIconToneIntensity(intensity);
    handleIconToneChange(iconToneColor, intensity);
  };

  const handleRemoveIconTone = () => {
    if (canvas && selectedObject && selectedObject.type === 'group') {
      const group = selectedObject as Group;
      
      // Restore original colors
      if ((group as any).originalColors) {
        const originalColors = (group as any).originalColors as Map<string, any>;
        
        const restoreColors = (obj: FabricObject, path: string = '') => {
          if (obj.type === 'group') {
            (obj as Group).getObjects().forEach((child, idx) => restoreColors(child, `${path}/${idx}`));
          } else {
            const stored = originalColors.get(path);
            if (stored) {
              obj.set({ fill: stored.fill, stroke: stored.stroke });
            }
            // Clear image filters
            if (obj.type === 'image' || obj instanceof FabricImage) {
              (obj as FabricImage).filters = [];
              (obj as FabricImage).applyFilters();
            }
          }
        };
        
        restoreColors(group);
        delete (group as any).originalColors;
        delete (group as any).iconToneColor;
        delete (group as any).iconToneIntensity;
        delete (group as any).iconToneHue;
      }
      
      canvas.renderAll();
      setIconToneIntensity(0.5);
    }
  };

  const TONE_PRESETS = [
    { name: "Warm", color: "#f59e0b", emoji: "🌅" },
    { name: "Cool", color: "#06b6d4", emoji: "❄️" },
    { name: "Sepia", color: "#92400e", emoji: "☕" },
    { name: "Vibrant", color: "#ec4899", emoji: "🎨" },
    { name: "Night", color: "#1e3a8a", emoji: "🌙" },
    { name: "Forest", color: "#15803d", emoji: "🌲" },
  ];

  const handlePaperSizeChange = (sizeId: string) => {
    setPaperSize(sizeId);
    const selected = getPaperSize(sizeId);
    
    // Scale down large poster sizes to fit viewport
    let width = selected.width;
    let height = selected.height;
    
    const maxWidth = window.innerWidth - 400;
    const maxHeight = window.innerHeight - 200;
    
    if (width > maxWidth || height > maxHeight) {
      const scaleX = maxWidth / width;
      const scaleY = maxHeight / height;
      const scale = Math.min(scaleX, scaleY);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    }
    
    setCanvasDimensions({ width, height });
  };

  // Helper function to calculate angle from path endpoints
  const getPathEndpointAngle = (path: Path, isStart: boolean): number => {
    const pathData = path.path as any[];
    if (!pathData || pathData.length < 2) return 0;

    let x1, y1, x2, y2;
    
    if (isStart) {
      // Get angle at start
      const firstCmd = pathData[0];
      const secondCmd = pathData[1];
      x1 = firstCmd[1];
      y1 = firstCmd[2];
      if (secondCmd[0] === 'Q') {
        x2 = secondCmd[1];
        y2 = secondCmd[2];
      } else {
        x2 = secondCmd[1];
        y2 = secondCmd[2];
      }
    } else {
      // Get angle at end
      const lastCmd = pathData[pathData.length - 1];
      const prevCmd = pathData[pathData.length - 2];
      if (lastCmd[0] === 'Q') {
        x2 = lastCmd[3];
        y2 = lastCmd[4];
        x1 = lastCmd[1];
        y1 = lastCmd[2];
      } else {
        x2 = lastCmd[1];
        y2 = lastCmd[2];
        x1 = prevCmd[prevCmd.length - 2];
        y1 = prevCmd[prevCmd.length - 1];
      }
    }

    return Math.atan2(y2 - y1, x2 - x1);
  };

  // Helper function to get path endpoints
  const getPathEndpoints = (path: Path): { start: { x: number; y: number }; end: { x: number; y: number } } => {
    const pathData = path.path as any[];
    if (!pathData || pathData.length === 0) {
      return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
    }

    const firstCmd = pathData[0];
    const lastCmd = pathData[pathData.length - 1];
    
    const start = { x: firstCmd[1], y: firstCmd[2] };
    const end = lastCmd[0] === 'Q' 
      ? { x: lastCmd[3], y: lastCmd[4] }
      : { x: lastCmd[1], y: lastCmd[2] };

    return { start, end };
  };

  // Update freeform line with markers
  const updateFreeformLineMarkers = (
    path: Path,
    startMarker: "none" | "dot" | "arrow",
    endMarker: "none" | "dot" | "arrow",
    color: string,
    thickness: number
  ) => {
    if (!canvas) return;

    // Store marker info on path
    (path as any).startMarker = startMarker;
    (path as any).endMarker = endMarker;
    (path as any).lineThickness = thickness;

    // Remove existing markers
    const existingGroup = canvas.getObjects().find(obj => (obj as any).isMarkerGroup && (obj as any).pathId === path);
    if (existingGroup) {
      canvas.remove(existingGroup);
    }

    // Don't create markers if both are "none"
    if (startMarker === "none" && endMarker === "none") {
      canvas.renderAll();
      return;
    }

    const endpoints = getPathEndpoints(path);
    const markers: FabricObject[] = [];

    // Create start marker
    if (startMarker === "dot") {
      const dot = new FabricCircle({
        left: endpoints.start.x,
        top: endpoints.start.y,
        originX: 'center',
        originY: 'center',
        radius: thickness * 2,
        fill: color,
        stroke: color,
        selectable: false,
        evented: false,
      });
      markers.push(dot);
    } else if (startMarker === "arrow") {
      const angle = getPathEndpointAngle(path, true);
      const arrowSize = thickness * 4;
      const arrowPoints = [
        { x: endpoints.start.x, y: endpoints.start.y },
        { x: endpoints.start.x - arrowSize, y: endpoints.start.y - arrowSize / 2 },
        { x: endpoints.start.x - arrowSize, y: endpoints.start.y + arrowSize / 2 },
      ];
      const arrow = new Polygon(arrowPoints, {
        fill: color,
        stroke: color,
        angle: (angle * 180) / Math.PI,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });
      markers.push(arrow);
    }

    // Create end marker
    if (endMarker === "dot") {
      const dot = new FabricCircle({
        left: endpoints.end.x,
        top: endpoints.end.y,
        originX: 'center',
        originY: 'center',
        radius: thickness * 2,
        fill: color,
        stroke: color,
        selectable: false,
        evented: false,
      });
      markers.push(dot);
    } else if (endMarker === "arrow") {
      const angle = getPathEndpointAngle(path, false);
      const arrowSize = thickness * 4;
      const arrowPoints = [
        { x: endpoints.end.x, y: endpoints.end.y },
        { x: endpoints.end.x - arrowSize, y: endpoints.end.y - arrowSize / 2 },
        { x: endpoints.end.x - arrowSize, y: endpoints.end.y + arrowSize / 2 },
      ];
      const arrow = new Polygon(arrowPoints, {
        fill: color,
        stroke: color,
        angle: (angle * 180) / Math.PI,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });
      markers.push(arrow);
    }

    // Add markers to canvas
    if (markers.length > 0) {
      const group = new Group(markers, {
        selectable: false,
        evented: false,
      });
      (group as any).isMarkerGroup = true;
      (group as any).pathId = path;
      canvas.add(group);
      canvas.sendObjectToBack(group);
    }

    canvas.renderAll();
  };

  const handleFreeformLineColorChange = (color: string) => {
    setFreeformLineColor(color);
    addToRecentColors(color);
    if (canvas && selectedObject && (selectedObject as any).isFreeformLine) {
      const pathObj = selectedObject as Path;
      pathObj.set({ stroke: color });
      updateFreeformLineMarkers(pathObj, freeformStartMarker, freeformEndMarker, color, freeformLineThickness);
      canvas.renderAll();
    }
  };

  const handleFreeformLineThicknessChange = (value: number[]) => {
    const thickness = value[0];
    setFreeformLineThickness(thickness);
    if (canvas && selectedObject && (selectedObject as any).isFreeformLine) {
      const pathObj = selectedObject as Path;
      pathObj.set({ strokeWidth: thickness });
      updateFreeformLineMarkers(pathObj, freeformStartMarker, freeformEndMarker, freeformLineColor, thickness);
      canvas.renderAll();
    }
  };

  const handleFreeformStartMarkerChange = (marker: "none" | "dot" | "arrow") => {
    setFreeformStartMarker(marker);
    if (canvas && selectedObject && (selectedObject as any).isFreeformLine) {
      const pathObj = selectedObject as Path;
      updateFreeformLineMarkers(pathObj, marker, freeformEndMarker, freeformLineColor, freeformLineThickness);
    }
  };

  const handleFreeformEndMarkerChange = (marker: "none" | "dot" | "arrow") => {
    setFreeformEndMarker(marker);
    if (canvas && selectedObject && (selectedObject as any).isFreeformLine) {
      const pathObj = selectedObject as Path;
      updateFreeformLineMarkers(pathObj, freeformStartMarker, marker, freeformLineColor, freeformLineThickness);
    }
  };

  const handleEraserWidthChange = (value: number[]) => {
    const width = value[0];
    setEraserWidth(width);
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = width;
    }
  };

  return (
    <div className="glass-panel flex flex-col h-full min-h-0">{/* Toggle button - always visible */}
      <div className="p-2 border-b border-border/40 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
          title={isCollapsed ? "Expand properties panel" : "Collapse properties panel"}
        >
          {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content - hidden when collapsed */}
      {!isCollapsed && (
        <ScrollArea type="always" className="flex-1 min-h-0">
          {/* Pin Object Section - shown when object is selected */}
          {selectedObject && (
            <div className="p-3 border-b border-border/40">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Pin Object</Label>
                <Button
                  variant={isPinned ? "default" : "outline"}
                  size="sm"
                  onClick={togglePin}
                  className="gap-2"
                >
                  {isPinned ? (
                    <>
                      <Pin className="h-4 w-4" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <PinOff className="h-4 w-4" />
                      Pin
                    </>
                  )}
                </Button>
              </div>
              {isPinned && (
                <p className="text-xs text-muted-foreground">
                  This object is pinned and cannot be moved or resized
                </p>
              )}
            </div>
          )}

          <Tabs defaultValue={selectedObject ? "style" : "diagram"} className="w-full">
            <TabsList className="grid w-full m-3" style={{ gridTemplateColumns: `repeat(${
              !selectedObject ? 2 : 
              (isTextObject(selectedObject) ? 3 : 
               isLineObject(selectedObject) ? 3 : 
               isCurvedTextObject(selectedObject) ? 3 : 2)
            }, minmax(0, 1fr))` }}>
              {!selectedObject && <TabsTrigger value="diagram" className="text-xs">Diagram</TabsTrigger>}
              
              {selectedObject && (
                <>
                  {(isShapeObject(selectedObject) || isImageObject(selectedObject) || (selectedObject.type === 'group' && !isCurvedTextObject(selectedObject))) && (
                    <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                  )}
                  
                  {isTextObject(selectedObject) && (
                    <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
                  )}
                  
                  {isCurvedTextObject(selectedObject) && (
                    <TabsTrigger value="curved-text" className="text-xs">Curved Text</TabsTrigger>
                  )}
                  
                  {isLineObject(selectedObject) && (
                    <TabsTrigger value="line" className="text-xs">Line</TabsTrigger>
                  )}
                  
                  <TabsTrigger value="arrange" className="text-xs">Arrange</TabsTrigger>
                </>
              )}
              
              {!selectedObject && <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>}
            </TabsList>
          
          <div className="px-3 pb-4">
            <TabsContent value="diagram" className="space-y-4 mt-0">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">View</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="grid" className="text-xs">Grid</Label>
                    <Checkbox 
                      id="grid" 
                      checked={gridEnabled}
                      onCheckedChange={(checked) => setGridEnabled(checked as boolean)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rulers" className="text-xs">Rulers</Label>
                    <Checkbox 
                      id="rulers" 
                      checked={rulersEnabled}
                      onCheckedChange={(checked) => setRulersEnabled(checked as boolean)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Background</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bg-color-toggle" className="text-xs">Custom Color</Label>
                    <Checkbox 
                      id="bg-color-toggle"
                      checked={showBgColor}
                      onCheckedChange={(checked) => setShowBgColor(checked as boolean)}
                    />
                  </div>
                  {showBgColor && (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-8 w-12 p-1" 
                      />
                      <Input 
                        type="text" 
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-8 text-xs flex-1" 
                        placeholder="#ffffff"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Paper Size</h3>
                <Select value={paperSize} onValueChange={handlePaperSizeChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_SIZES.map((size) => (
                      <SelectItem key={size.id} value={size.id} className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium">{size.name}</span>
                          <span className="text-xs text-muted-foreground">{size.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Canvas: {canvasDimensions.width} × {canvasDimensions.height}px
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4 mt-0">
              <StylePresets />
              <div className="h-px bg-border my-2" />
              <StylePanel />

              {/* Icon Color & Tone - Only show for SVG groups (icons) */}
              {selectedObject && selectedObject.type === 'group' && !isShapeWithTextGroup(selectedObject) && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Icon Styling</h3>
                  <Tabs value={iconToneMode} onValueChange={(v) => setIconToneMode(v as "direct" | "tone")}>
                    <TabsList className="grid w-full grid-cols-2 mb-3">
                      <TabsTrigger value="direct" className="text-xs">Direct Color</TabsTrigger>
                      <TabsTrigger value="tone" className="text-xs">Color Tone</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="direct" className="space-y-3 mt-0">
                      <div className="space-y-2">
                        <Label className="text-xs">Color</Label>
                        <div className="grid grid-cols-6 gap-2">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleIconColorChange(color)}
                              className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                              style={{ 
                                backgroundColor: color,
                                borderColor: iconColor === color ? '#0D9488' : '#e5e7eb'
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="color" 
                            value={iconColor}
                            onChange={(e) => handleIconColorChange(e.target.value)}
                            className="h-8 w-12 p-1" 
                          />
                          <Input 
                            type="text" 
                            value={iconColor}
                            onChange={(e) => handleIconColorChange(e.target.value)}
                            className="h-8 text-xs flex-1" 
                            placeholder="#000000"
                          />
                        </div>
                        
                        {/* Recent Colors */}
                        {recentColors.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Recent</Label>
                            <div className="flex gap-1 flex-wrap">
                              {recentColors.map((color, idx) => (
                                <Button
                                  key={`icon-${color}-${idx}`}
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 p-0 border-2 hover:scale-110 transition-transform"
                                  style={{ 
                                    backgroundColor: color,
                                    borderColor: iconColor === color ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                  }}
                                  onClick={() => handleIconColorChange(color)}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tone" className="space-y-3 mt-0">
                      <div className="space-y-2">
                        <Label className="text-xs">Tone Presets</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {TONE_PRESETS.map((preset) => (
                            <Button
                              key={preset.name}
                              variant="outline"
                              size="sm"
                              onClick={() => handleIconToneChange(preset.color)}
                              className="h-8 text-xs gap-1"
                            >
                              <span>{preset.emoji}</span>
                              <span>{preset.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Custom Tone Color</Label>
                        <div className="grid grid-cols-6 gap-2">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleIconToneChange(color)}
                              className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                              style={{ 
                                backgroundColor: color,
                                borderColor: iconToneColor === color ? '#0D9488' : '#e5e7eb'
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="color" 
                            value={iconToneColor}
                            onChange={(e) => handleIconToneChange(e.target.value)}
                            className="h-8 w-12 p-1" 
                          />
                          <Input 
                            type="text" 
                            value={iconToneColor}
                            onChange={(e) => handleIconToneChange(e.target.value)}
                            className="h-8 text-xs flex-1" 
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Tone Intensity</Label>
                          <span className="text-xs text-muted-foreground">{Math.round(iconToneIntensity * 100)}%</span>
                        </div>
                        <Input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={iconToneIntensity}
                          onChange={(e) => handleIconToneIntensityChange(parseFloat(e.target.value))}
                          className="h-8"
                        />
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRemoveIconTone}
                        className="w-full text-xs h-8"
                      >
                        Remove Tone
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Image Color Tone - Only show for images */}
              {selectedObject && (selectedObject.type === 'image' || selectedObject instanceof FabricImage) && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Image Color Tone</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Tone Color</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleImageToneChange(color)}
                            className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                            style={{ 
                              backgroundColor: color,
                              borderColor: imageToneColor === color ? '#0D9488' : '#e5e7eb'
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={imageToneColor}
                          onChange={(e) => handleImageToneChange(e.target.value)}
                          className="h-8 w-12 p-1" 
                        />
                        <Input 
                          type="text" 
                          value={imageToneColor}
                          onChange={(e) => handleImageToneChange(e.target.value)}
                          className="h-8 text-xs flex-1" 
                          placeholder="#3b82f6"
                        />
                      </div>
                      
                      {/* Recent Colors */}
                      {recentColors.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Recent</Label>
                          <div className="flex gap-1 flex-wrap">
                            {recentColors.map((color, idx) => (
                              <Button
                                key={`image-tone-${color}-${idx}`}
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 p-0 border-2 hover:scale-110 transition-transform"
                                style={{ 
                                  backgroundColor: color,
                                  borderColor: imageToneColor === color ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                }}
                                onClick={() => handleImageToneChange(color)}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Tone Intensity</Label>
                        <span className="text-xs text-muted-foreground">{Math.round(imageToneOpacity * 100)}%</span>
                      </div>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={imageToneOpacity}
                        onChange={(e) => handleImageToneOpacityChange(parseFloat(e.target.value))}
                        className="h-8"
                      />
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemoveImageTone}
                      className="w-full text-xs h-8"
                    >
                      Remove Tone
                    </Button>
                  </div>
                </div>
              )}

              {/* Shape Colors - Only show for non-text, non-image objects */}
              {selectedObject && selectedObject.type !== 'textbox' && selectedObject.type !== 'image' && !(selectedObject instanceof FabricImage) && !(selectedObject as any).isFreeformLine && (selectedObject.type !== 'group' || isShapeWithTextGroup(selectedObject)) && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Shape Colors</h3>
                  <div className="space-y-3">
                    {/* Fill Color */}
                    <div className="space-y-2">
                      <Label className="text-xs">Fill Color</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleShapeFillColorChange(color)}
                            className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                            style={{ 
                              backgroundColor: color,
                              borderColor: shapeFillColor === color ? '#0D9488' : '#e5e7eb'
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={shapeFillColor}
                          onChange={(e) => handleShapeFillColorChange(e.target.value)}
                          className="h-8 w-12 p-1" 
                        />
                        <Input 
                          type="text" 
                          value={shapeFillColor}
                          onChange={(e) => handleShapeFillColorChange(e.target.value)}
                          className="h-8 text-xs flex-1" 
                          placeholder="#3b82f6"
                        />
                      </div>
                      
                      {/* Recent Colors */}
                      {recentColors.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Recent</Label>
                          <div className="flex gap-1 flex-wrap">
                            {recentColors.map((color, idx) => (
                              <Button
                                key={`shape-fill-${color}-${idx}`}
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 p-0 border-2 hover:scale-110 transition-transform"
                                style={{ 
                                  backgroundColor: color,
                                  borderColor: shapeFillColor === color ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                }}
                                onClick={() => handleShapeFillColorChange(color)}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stroke Color */}
                    <div className="space-y-2">
                      <Label className="text-xs">Stroke Color</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleShapeStrokeColorChange(color)}
                            className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                            style={{ 
                              backgroundColor: color,
                              borderColor: shapeStrokeColor === color ? '#0D9488' : '#e5e7eb'
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={shapeStrokeColor}
                          onChange={(e) => handleShapeStrokeColorChange(e.target.value)}
                          className="h-8 w-12 p-1" 
                        />
                        <Input 
                          type="text" 
                          value={shapeStrokeColor}
                          onChange={(e) => handleShapeStrokeColorChange(e.target.value)}
                          className="h-8 text-xs flex-1" 
                          placeholder="#000000"
                        />
                      </div>
                      
                      {/* Recent Colors */}
                      {recentColors.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Recent</Label>
                          <div className="flex gap-1 flex-wrap">
                            {recentColors.map((color, idx) => (
                              <Button
                                key={`shape-stroke-${color}-${idx}`}
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 p-0 border-2 hover:scale-110 transition-transform"
                                style={{ 
                                  backgroundColor: color,
                                  borderColor: shapeStrokeColor === color ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                }}
                                onClick={() => handleShapeStrokeColorChange(color)}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Eraser Controls - Only show when eraser tool is active */}
              {activeTool === "eraser" && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Eraser</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Eraser Size</Label>
                        <span className="text-xs text-muted-foreground">{eraserWidth}px</span>
                      </div>
                      <Slider
                        value={[eraserWidth]}
                        onValueChange={handleEraserWidthChange}
                        min={5}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Freeform Line Controls - Only show for freeform lines */}
              {selectedObject && (selectedObject as any).isFreeformLine && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Freeform Line</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Line Color</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleFreeformLineColorChange(color)}
                            className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                            style={{ 
                              backgroundColor: color,
                              borderColor: freeformLineColor === color ? '#0D9488' : '#e5e7eb'
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={freeformLineColor}
                          onChange={(e) => handleFreeformLineColorChange(e.target.value)}
                          className="h-8 w-12 p-1" 
                        />
                        <Input 
                          type="text" 
                          value={freeformLineColor}
                          onChange={(e) => handleFreeformLineColorChange(e.target.value)}
                          className="h-8 text-xs flex-1" 
                          placeholder="#000000"
                        />
                      </div>
                      
                      {/* Recent Colors */}
                      {recentColors.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Recent</Label>
                          <div className="flex gap-1 flex-wrap">
                            {recentColors.map((color, idx) => (
                              <Button
                                key={`freeform-${color}-${idx}`}
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 p-0 border-2 hover:scale-110 transition-transform"
                                style={{ 
                                  backgroundColor: color,
                                  borderColor: freeformLineColor === color ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                }}
                                onClick={() => handleFreeformLineColorChange(color)}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Line Thickness</Label>
                        <span className="text-xs text-muted-foreground">{freeformLineThickness}px</span>
                      </div>
                      <Slider
                        value={[freeformLineThickness]}
                        onValueChange={handleFreeformLineThicknessChange}
                        min={1}
                        max={20}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Smoothing Strength</Label>
                        <span className="text-xs text-muted-foreground">{smoothingStrength}%</span>
                      </div>
                      <Slider
                        value={[smoothingStrength]}
                        onValueChange={(value) => setSmoothingStrength(value[0])}
                        min={0}
                        max={100}
                        step={10}
                        className="w-full"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => smoothenPath(smoothingStrength)}
                        className="w-full text-xs h-8"
                      >
                        Beautify Path
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Straighten lines and smooth curves for professional results
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Start Marker</Label>
                      <Select value={freeformStartMarker} onValueChange={(value) => handleFreeformStartMarkerChange(value as "none" | "dot" | "arrow")}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">None</SelectItem>
                          <SelectItem value="dot" className="text-xs">Dot</SelectItem>
                          <SelectItem value="arrow" className="text-xs">Arrow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">End Marker</Label>
                      <Select value={freeformEndMarker} onValueChange={(value) => handleFreeformEndMarkerChange(value as "none" | "dot" | "arrow")}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">None</SelectItem>
                          <SelectItem value="dot" className="text-xs">Dot</SelectItem>
                          <SelectItem value="arrow" className="text-xs">Arrow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Curved Line Properties - Only show for curved lines */}
              {selectedObject && (selectedObject as any).isCurvedLine && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Curved Line Control</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const curveData = selectedObject as any;
                        const controlHandle = curveData.controlHandle;
                        const handleLines = curveData.handleLines;
                        if (controlHandle) {
                          controlHandle.visible = !controlHandle.visible;
                          if (handleLines) {
                            handleLines.forEach((line: any) => {
                              line.visible = controlHandle.visible;
                            });
                          }
                          canvas?.renderAll();
                        }
                      }}
                    >
                      {((selectedObject as any).controlHandle?.visible) ? 'Hide' : 'Show'} Control Point
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Drag the green control point to adjust the curve shape.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Text Properties - Show for textbox or groups containing text */}
              {(selectedObject && (selectedObject.type === 'textbox' || getTextObject(selectedObject))) && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Text</h3>
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Font Family</Label>
                      <Select value={textFont} onValueChange={handleFontChange}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {GOOGLE_FONTS.map((font) => (
                            <SelectItem 
                              key={font.value} 
                              value={font.value}
                              className="text-xs"
                              style={{ fontFamily: font.value }}
                            >
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Size</Label>
                        <Input 
                          type="number" 
                          value={textSize} 
                          onChange={(e) => handleTextSizeChange(e.target.value)}
                          className="h-8 text-xs" 
                          min="8"
                          max="200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Color</Label>
                        <Input 
                          type="color" 
                          value={textColor} 
                          onChange={(e) => handleTextColorChange(e.target.value)}
                          className="h-8" 
                        />
                      </div>
                    </div>
                    
                    {/* Recent Colors for Text */}
                    {recentColors.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Recent Colors</Label>
                        <div className="flex gap-1 flex-wrap">
                          {recentColors.map((color, idx) => (
                            <Button
                              key={`text-${color}-${idx}`}
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 p-0 border-2 hover:scale-110 transition-transform"
                              style={{ 
                                backgroundColor: color,
                                borderColor: textColor === color ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                              }}
                              onClick={() => handleTextColorChange(color)}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t">
                <h3 className="font-semibold text-sm mb-3">Arrange</h3>
                <ArrangePanel />
              </div>
            </TabsContent>
            
            <TabsContent value="curved-text" className="space-y-4 mt-0">
              {isCurvedTextObject(selectedObject) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Curved Text Properties</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select the curved text and use the properties panel to view details. To edit, double-click the object or use Edit menu.
                  </p>
                </div>
              )}
              
              <div className="pt-3 border-t">
                <h3 className="font-semibold text-sm mb-3">Arrange</h3>
                <ArrangePanel />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>
      )}
    </div>
  );
};
