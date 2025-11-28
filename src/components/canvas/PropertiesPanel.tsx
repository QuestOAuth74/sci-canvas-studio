import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StylePanel } from "./StylePanel";
import { ArrangePanel } from "./ArrangePanel";
import { LinePropertiesPanel } from "./LinePropertiesPanel";
import { LineGradientPanel } from "./LineGradientPanel";
import { StylePresets } from "./StylePresets";
import { ImageEraserDialog } from "./ImageEraserDialog";
import { DiagramSettingsSection } from "./properties/DiagramSettingsSection";
import { TextPropertiesSection } from "./properties/TextPropertiesSection";
import { ShapePropertiesSection } from "./properties/ShapePropertiesSection";
import { ColorPickerSection } from "./properties/ColorPickerSection";
import { PAPER_SIZES, getPaperSize } from "@/types/paperSizes";
import { useState, useEffect } from "react";
import { useCanvas } from "@/contexts/CanvasContext";
import { Textbox, FabricImage, filters, Group, FabricObject, Path, Circle as FabricCircle, Polygon, Rect, Line } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Pin, PinOff, Eraser, Paintbrush } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { ensureFontLoaded, getCanvasFontFamily } from "@/lib/fontLoader";
import { isTextOnPath, getTextOnPathData, updateTextOnPath, isValidPath } from "@/lib/textOnPath";
import { isTextBox, getTextBoxData, updateTextBox } from "@/lib/textBoxTool";

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
    addToRecentColors,
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
  const [activeTab, setActiveTab] = useState<string>("diagram");
  const [showImageEraser, setShowImageEraser] = useState(false);
  

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
           (obj?.type === 'group' && obj.getObjects().some((o: any) => o.type === 'textbox')) ||
           isTextOnPath(obj) ||
           isTextBox(obj);
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
    // Close eraser tool if selection changes or is no longer an image
    if (!selectedObject || !(selectedObject instanceof FabricImage)) {
      setShowImageEraser(false);
    }
    
  }, [selectedObject]);

  // Update active tab when selectedObject changes
  useEffect(() => {
    // Don't update properties for control handles or guide lines
    if (selectedObject && ((selectedObject as any).isControlHandle || (selectedObject as any).isHandleLine)) {
      return;
    }
    
    if (!selectedObject) {
      setActiveTab("diagram");
    } else {
      // Determine the best default tab based on object type
      if (isTextObject(selectedObject)) {
        setActiveTab("text");
      } else if (isLineObject(selectedObject)) {
        setActiveTab("line");
      } else {
        setActiveTab("style");
      }
    }
  }, [selectedObject]);

  const handleFontChange = async (font: string) => {
    const loaded = await ensureFontLoaded(font);
    if (!loaded) {
      toast.error(`Font "${font}" failed to load`);
      return;
    }
    
    const canvasFont = getCanvasFontFamily(font);
    setTextFont(font);
    
    const textObj = getTextObject(selectedObject);
    if (canvas && textObj) {
      textObj.set({ fontFamily: canvasFont });
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
    <div className="w-full h-full bg-[hsl(var(--cream))]/95 backdrop-blur-sm flex flex-col notebook-sidebar ruled-lines overflow-auto" data-onboarding="properties-panel">
      {/* Toggle button - always visible */}
      <div className="p-4 border-b-2 border-[hsl(var(--pencil-gray))] flex items-center justify-between">
        <h3 className="notebook-section-header">Properties</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-7 w-7"
          title={isCollapsed ? "Expand properties panel" : "Collapse properties panel"}
        >
          {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content - hidden when collapsed */}
      {!isCollapsed && (
        <ScrollArea type="always" className="flex-1 min-h-0 animate-fade-in">
          {/* Pin Object Section - shown when object is selected */}
          {selectedObject && (
            <div className="p-3 border-b border-border/40 bg-accent/10 smooth-transition hover:bg-accent/20">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pin Object</Label>
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full m-3 bg-accent/20" style={{ gridTemplateColumns: `repeat(${
              !selectedObject ? 2 : 
              (
               isTextObject(selectedObject) ? 3 : 
               isLineObject(selectedObject) ? 3 : 2)
            }, minmax(0, 1fr))` }}>
              {!selectedObject && <TabsTrigger value="diagram" className="text-xs">Diagram</TabsTrigger>}
              
              {selectedObject && (
                <>
                
                  {(isShapeObject(selectedObject) || isImageObject(selectedObject) || selectedObject.type === 'group') && (
                    <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                  )}
                  
                  {isTextObject(selectedObject) && (
                    <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
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
            <TabsContent value="diagram" className="space-y-2 mt-0">
              <DiagramSettingsSection
                gridEnabled={gridEnabled}
                setGridEnabled={setGridEnabled}
                rulersEnabled={rulersEnabled}
                setRulersEnabled={setRulersEnabled}
                backgroundColor={backgroundColor}
                setBackgroundColor={setBackgroundColor}
                paperSize={paperSize}
                setPaperSize={handlePaperSizeChange}
                canvasDimensions={canvasDimensions}
                showBgColor={showBgColor}
                setShowBgColor={setShowBgColor}
              />
            </TabsContent>
            
            {/* Text Properties Tab */}
            <TabsContent value="text" className="space-y-2 mt-0">
              {(selectedObject && (selectedObject.type === 'textbox' || getTextObject(selectedObject))) && (
                <TextPropertiesSection
                  textFont={textFont}
                  textSize={textSize}
                  textColor={textColor}
                  onFontChange={handleFontChange}
                  onSizeChange={handleTextSizeChange}
                  onColorChange={handleTextColorChange}
                  recentColors={recentColors}
                />
              )}
              
              {/* Text on Path Properties */}
              {selectedObject && isTextOnPath(selectedObject) && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Text on Path</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Path Offset</Label>
                      <Slider
                        value={[getTextOnPathData(selectedObject)?.offset || 0]}
                        onValueChange={(value) => {
                          if (!canvas || !selectedObject) return;
                          const pathData = getTextOnPathData(selectedObject);
                          if (!pathData) return;
                          
                          // Find a path object on canvas to update with
                          const objects = canvas.getObjects();
                          const pathObj = objects.find(obj => isValidPath(obj));
                          
                          if (pathObj) {
                            try {
                              canvas.remove(selectedObject);
                              const updated = updateTextOnPath(selectedObject as any, pathObj, { offset: value[0] });
                              canvas.add(updated);
                              canvas.setActiveObject(updated);
                              canvas.requestRenderAll();
                            } catch (error) {
                              console.error('Failed to update offset:', error);
                              toast.error('Failed to update offset');
                            }
                          }
                        }}
                        min={-100}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        {getTextOnPathData(selectedObject)?.offset || 0}px
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Position Along Path</Label>
                      <Slider
                        value={[(getTextOnPathData(selectedObject)?.alignmentOffset || 0) * 100]}
                        onValueChange={(value) => {
                          if (!canvas || !selectedObject) return;
                          const pathData = getTextOnPathData(selectedObject);
                          if (!pathData) return;
                          
                          const objects = canvas.getObjects();
                          const pathObj = objects.find(obj => isValidPath(obj));
                          
                          if (pathObj) {
                            try {
                              canvas.remove(selectedObject);
                              const updated = updateTextOnPath(selectedObject as any, pathObj, { 
                                alignmentOffset: value[0] / 100 
                              });
                              canvas.add(updated);
                              canvas.setActiveObject(updated);
                              canvas.requestRenderAll();
                            } catch (error) {
                              console.error('Failed to update position:', error);
                              toast.error('Failed to update position');
                            }
                          }
                        }}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        {Math.round((getTextOnPathData(selectedObject)?.alignmentOffset || 0) * 100)}%
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!canvas || !selectedObject) return;
                        const pathData = getTextOnPathData(selectedObject);
                        if (!pathData) return;
                        
                        const objects = canvas.getObjects();
                        const pathObj = objects.find(obj => isValidPath(obj));
                        
                        if (pathObj) {
                          try {
                            canvas.remove(selectedObject);
                            const updated = updateTextOnPath(selectedObject as any, pathObj, { 
                              flipText: !pathData.flipText 
                            });
                            canvas.add(updated);
                            canvas.setActiveObject(updated);
                            canvas.requestRenderAll();
                            toast.success('Text orientation flipped');
                          } catch (error) {
                            console.error('Failed to flip text:', error);
                            toast.error('Failed to flip text');
                          }
                        }
                      }}
                      className="w-full"
                    >
                      Flip Text Orientation
                    </Button>
                  </div>
                </div>
              )}

              {/* Text Box Properties */}
              {selectedObject && isTextBox(selectedObject) && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Text Box Properties</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Text Content</Label>
                      <Textarea
                        value={getTextBoxData(selectedObject).text}
                        onChange={(e) => {
                          if (!canvas) return;
                          try {
                            updateTextBox(selectedObject as any, { text: e.target.value });
                            canvas.requestRenderAll();
                          } catch (error) {
                            console.error('Failed to update text:', error);
                          }
                        }}
                        rows={4}
                        className="text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Width: {Math.round(getTextBoxData(selectedObject).width)}px</Label>
                        <Slider
                          value={[getTextBoxData(selectedObject).width]}
                          onValueChange={([value]) => {
                            if (!canvas) return;
                            try {
                              updateTextBox(selectedObject as any, { width: value });
                              canvas.requestRenderAll();
                            } catch (error) {
                              console.error('Failed to update width:', error);
                            }
                          }}
                          min={150}
                          max={800}
                          step={10}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Height: {Math.round(getTextBoxData(selectedObject).height)}px</Label>
                        <Slider
                          value={[getTextBoxData(selectedObject).height]}
                          onValueChange={([value]) => {
                            if (!canvas) return;
                            try {
                              updateTextBox(selectedObject as any, { height: value });
                              canvas.requestRenderAll();
                            } catch (error) {
                              console.error('Failed to update height:', error);
                            }
                          }}
                          min={80}
                          max={600}
                          step={10}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Padding: {getTextBoxData(selectedObject).padding}px</Label>
                      <Slider
                        value={[getTextBoxData(selectedObject).padding]}
                        onValueChange={([value]) => {
                          if (!canvas) return;
                          try {
                            updateTextBox(selectedObject as any, { padding: value });
                            canvas.requestRenderAll();
                          } catch (error) {
                            console.error('Failed to update padding:', error);
                          }
                        }}
                        min={5}
                        max={50}
                        step={5}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Background</Label>
                        <Input
                          type="color"
                          value={getTextBoxData(selectedObject).backgroundColor}
                          onChange={(e) => {
                            if (!canvas) return;
                            try {
                              updateTextBox(selectedObject as any, { backgroundColor: e.target.value });
                              canvas.requestRenderAll();
                            } catch (error) {
                              console.error('Failed to update background:', error);
                            }
                          }}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Border</Label>
                        <Input
                          type="color"
                          value={getTextBoxData(selectedObject).borderColor}
                          onChange={(e) => {
                            if (!canvas) return;
                            try {
                              updateTextBox(selectedObject as any, { borderColor: e.target.value });
                              canvas.requestRenderAll();
                            } catch (error) {
                              console.error('Failed to update border:', error);
                            }
                          }}
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Border Width: {getTextBoxData(selectedObject).borderWidth}px</Label>
                      <Slider
                        value={[getTextBoxData(selectedObject).borderWidth]}
                        onValueChange={([value]) => {
                          if (!canvas) return;
                          try {
                            updateTextBox(selectedObject as any, { borderWidth: value });
                            canvas.requestRenderAll();
                          } catch (error) {
                            console.error('Failed to update border width:', error);
                          }
                        }}
                        min={0}
                        max={5}
                        step={0.5}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Line Properties Tab */}
            <TabsContent value="line" className="space-y-4 mt-0">
              <LinePropertiesPanel />
              <LineGradientPanel />
              
              {/* Freeform Line Controls */}
              {selectedObject && (selectedObject as any).isFreeformLine && (
                <Accordion type="multiple" defaultValue={["color", "thickness"]} className="w-full">
                  <AccordionItem value="color" className="border-none">
                    <AccordionTrigger className="py-3 px-3 hover:bg-accent/50 rounded-lg hover:no-underline">
                      <span className="text-xs font-semibold uppercase tracking-wider">Line Color</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-1">
                      <ColorPickerSection
                        label="Color"
                        value={freeformLineColor}
                        onChange={handleFreeformLineColorChange}
                        recentColors={recentColors}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="thickness" className="border-none">
                    <AccordionTrigger className="py-3 px-3 hover:bg-accent/50 rounded-lg hover:no-underline">
                      <span className="text-xs font-semibold uppercase tracking-wider">Line Thickness</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-1">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Thickness</Label>
                            <span className="text-xs font-mono text-muted-foreground">{freeformLineThickness}px</span>
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
                            <Label className="text-xs">Smoothing</Label>
                            <span className="text-xs font-mono text-muted-foreground">{smoothingStrength}%</span>
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
                            <Paintbrush className="h-3.5 w-3.5 mr-1.5" />
                            Beautify Path
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Straighten lines and smooth curves
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              
              {/* Curved Line Properties */}
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
            </TabsContent>


            {/* Arrange Tab */}
            <TabsContent value="arrange" className="space-y-2 mt-0">
              <div className="p-3 bg-accent/5 rounded-lg border border-border/30">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Arrange</h3>
                <ArrangePanel />
              </div>
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4 mt-0">
              <StylePresets />
              <div className="h-px bg-border my-2" />
              <StylePanel />

              {/* Icon Color & Tone - Only show for SVG groups (icons) */}
              {selectedObject && selectedObject.type === 'group' && !isShapeWithTextGroup(selectedObject) && (
                <Accordion type="multiple" defaultValue={["icon-color"]} className="w-full mt-3 border-t pt-3">
                  <AccordionItem value="icon-color" className="border-none">
                    <AccordionTrigger className="py-3 px-3 hover:bg-accent/50 rounded-lg hover:no-underline">
                      <span className="text-xs font-semibold uppercase tracking-wider">Icon Styling</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-1">
                      <Tabs value={iconToneMode} onValueChange={(v) => setIconToneMode(v as "direct" | "tone")}>
                        <TabsList className="grid w-full grid-cols-2 mb-3 bg-accent/20">
                          <TabsTrigger value="direct" className="text-xs">Direct Color</TabsTrigger>
                          <TabsTrigger value="tone" className="text-xs">Color Tone</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="direct" className="space-y-3 mt-0">
                          <ColorPickerSection
                            label="Icon Color"
                            value={iconColor}
                            onChange={handleIconColorChange}
                            recentColors={recentColors}
                          />
                        </TabsContent>
                        
                        <TabsContent value="tone" className="space-y-3 mt-0">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Tone Presets</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {TONE_PRESETS.map((preset) => (
                                <Button
                                  key={preset.name}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleIconToneChange(preset.color)}
                                  className="h-9 text-xs gap-1"
                                >
                                  <span>{preset.emoji}</span>
                                  <span>{preset.name}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          <ColorPickerSection
                            label="Custom Tone Color"
                            value={iconToneColor}
                            onChange={handleIconToneChange}
                            recentColors={[]}
                          />

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Tone Intensity</Label>
                              <span className="text-xs font-mono text-muted-foreground">{Math.round(iconToneIntensity * 100)}%</span>
                            </div>
                            <Slider
                              value={[iconToneIntensity * 100]}
                              onValueChange={([value]) => handleIconToneIntensityChange(value / 100)}
                              min={0}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRemoveIconTone}
                            className="w-full text-xs h-9"
                          >
                            Remove Tone
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Image Color Tone - Only show for images */}
              {selectedObject && (selectedObject.type === 'image' || selectedObject instanceof FabricImage) && (
                <Accordion type="multiple" defaultValue={["image-tone"]} className="w-full mt-3 border-t pt-3">
                  <AccordionItem value="image-tone" className="border-none">
                    <AccordionTrigger className="py-3 px-3 hover:bg-accent/50 rounded-lg hover:no-underline">
                      <span className="text-xs font-semibold uppercase tracking-wider">Image Color Tone</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-1">
                      <div className="space-y-3">
                        <ColorPickerSection
                          label="Tone Color"
                          value={imageToneColor}
                          onChange={handleImageToneChange}
                          recentColors={recentColors}
                        />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Tone Intensity</Label>
                            <span className="text-xs font-mono text-muted-foreground">{Math.round(imageToneOpacity * 100)}%</span>
                          </div>
                          <Slider
                            value={[imageToneOpacity * 100]}
                            onValueChange={([value]) => handleImageToneOpacityChange(value / 100)}
                            min={0}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRemoveImageTone}
                          className="w-full text-xs h-9"
                        >
                          Remove Tone
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  {/* Background Removal */}
                  <AccordionItem value="background" className="border-none">
                    <AccordionTrigger className="py-3 px-3 hover:bg-accent/50 rounded-lg hover:no-underline">
                      <span className="text-xs font-semibold uppercase tracking-wider">Background Removal</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-1">
                      <div className="space-y-2">
                        {!showImageEraser && (
                          <>
                            <Button 
                              onClick={() => setShowImageEraser(true)}
                              className="w-full"
                              variant="outline"
                              size="sm"
                            >
                              <Paintbrush className="mr-2 h-4 w-4" />
                              Manual Eraser
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Manually erase parts of the image with a brush tool
                            </p>
                          </>
                        )}
                        <ImageEraserDialog
                          open={showImageEraser}
                          onOpenChange={setShowImageEraser}
                          image={selectedObject instanceof FabricImage ? selectedObject : null}
                          onComplete={async (dataUrl) => {
                            if (!canvas) return;
                            
                            try {
                              // Create new image with erased background
                              const newImg = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
                              
                              // Preserve all properties from original
                              newImg.set({
                                left: selectedObject.left,
                                top: selectedObject.top,
                                scaleX: selectedObject.scaleX,
                                scaleY: selectedObject.scaleY,
                                angle: selectedObject.angle,
                                opacity: selectedObject.opacity,
                                flipX: selectedObject.flipX,
                                flipY: selectedObject.flipY,
                              });
                              
                              // Replace old image with new one at same z-index
                              const objects = canvas.getObjects();
                              const index = objects.indexOf(selectedObject);
                              canvas.remove(selectedObject);
                              if (index >= 0) {
                                canvas.insertAt(index, newImg);
                              } else {
                                canvas.add(newImg);
                              }
                              canvas.setActiveObject(newImg);
                              canvas.renderAll();
                              
                              toast.success('Manual erasure applied!');
                            } catch (error) {
                              console.error('Failed to apply erased image:', error);
                              toast.error('Failed to apply changes');
                            }
                          }}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Shape Colors - Only show for non-text, non-image objects */}
              {selectedObject && selectedObject.type !== 'textbox' && selectedObject.type !== 'image' && !(selectedObject instanceof FabricImage) && !(selectedObject as any).isFreeformLine && (selectedObject.type !== 'group' || isShapeWithTextGroup(selectedObject)) && (
                <ShapePropertiesSection
                  fillColor={shapeFillColor}
                  strokeColor={shapeStrokeColor}
                  onFillChange={handleShapeFillColorChange}
                  onStrokeChange={handleShapeStrokeColorChange}
                  recentColors={recentColors}
                />
              )}

              {/* Eraser Controls - Only show when eraser tool is active */}
              {activeTool === "eraser" && (
                <Accordion type="single" defaultValue="eraser" className="w-full">
                  <AccordionItem value="eraser" className="border-none">
                    <AccordionTrigger className="py-3 px-3 hover:bg-accent/50 rounded-lg hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Eraser className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Eraser</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-1">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Eraser Size</Label>
                          <span className="text-xs font-mono text-muted-foreground">{eraserWidth}px</span>
                        </div>
                        <Slider
                          value={[eraserWidth]}
                          onValueChange={handleEraserWidthChange}
                          min={5}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Adjust the size of the eraser brush
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>
      )}
    </div>
  );
};
