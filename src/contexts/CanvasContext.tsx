import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo, useRef } from "react";
import { Canvas as FabricCanvas, FabricObject, Rect, Circle, Path, Group, ActiveSelection, util, Gradient, Shadow, FabricImage } from "fabric";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { loadAllFonts, getBaseFontName, getCanvasFontFamily, normalizeCanvasTextFonts } from "@/lib/fontLoader";
import { smoothFabricPath } from "@/lib/pathSmoothing";
import { GradientConfig, ShadowConfig } from "@/types/effects";
import { throttle, debounce, RenderScheduler } from "@/lib/performanceUtils";
import { safeDownloadDataUrl, reloadCanvasImagesWithCORS } from "@/lib/utils";
import { removeBackground } from "@/lib/backgroundRemoval";
import { HistoryManager } from "@/lib/historyManager";
import { createVersion, isSignificantChange, cleanupVersions } from "@/lib/versionManager";

interface CanvasContextType {
  canvas: FabricCanvas | null;
  setCanvas: (canvas: FabricCanvas | null) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (obj: FabricObject | null) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  gridEnabled: boolean;
  setGridEnabled: (enabled: boolean) => void;
  rulersEnabled: boolean;
  setRulersEnabled: (enabled: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (enabled: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  backgroundGradient: boolean;
  setBackgroundGradient: (enabled: boolean) => void;
  gridPattern: 'lines' | 'dots' | 'isometric';
  setGridPattern: (pattern: 'lines' | 'dots' | 'isometric') => void;
  canvasDimensions: { width: number; height: number };
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  paperSize: string;
  setPaperSize: (sizeId: string) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  isSaving: boolean;
  saveProject: (isManualSave?: boolean) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  
  // Canvas operations
  undo: () => void;
  redo: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  deleteSelected: () => void;
  selectAll: () => void;
  
  // Zoom operations
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
  
  // Alignment operations
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignMiddle: () => void;
  alignBottom: () => void;
  
  // Flip operations
  flipHorizontal: () => void;
  flipVertical: () => void;
  
  // Layer operations
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  
  // Group operations
  groupSelected: () => void;
  ungroupSelected: () => void;
  
  // Export operations
  exportAsPNG: (dpi?: 150 | 300 | 600, selectionOnly?: boolean) => void;
  exportAsPNGTransparent: (dpi?: 150 | 300 | 600, selectionOnly?: boolean) => void;
  exportAsJPG: (dpi?: 150 | 300 | 600, selectionOnly?: boolean) => void;
  exportAsSVG: (selectionOnly?: boolean) => void;
  cleanExport: () => void;
  
  // Recent colors
  recentColors: string[];
  addToRecentColors: (color: string) => void;
  
  // Export dialog state
  exportDialogOpen: boolean;
  setExportDialogOpen: (open: boolean) => void;
  
  // Text formatting properties
  textFont: string;
  setTextFont: (font: string) => void;
  textAlign: string;
  setTextAlign: (align: string) => void;
  textUnderline: boolean;
  setTextUnderline: (underline: boolean) => void;
  textOverline: boolean;
  setTextOverline: (overline: boolean) => void;
  textBold: boolean;
  setTextBold: (bold: boolean) => void;
  textItalic: boolean;
  setTextItalic: (italic: boolean) => void;
  textListType: 'none' | 'bullet' | 'numbered';
  setTextListType: (type: 'none' | 'bullet' | 'numbered') => void;
  textSubscript: boolean;
  setTextSubscript: (subscript: boolean) => void;
  textSuperscript: boolean;
  setTextSuperscript: (superscript: boolean) => void;
  
  // Pin/Lock operations
  pinObject: () => void;
  unpinObject: () => void;
  togglePin: () => void;
  isPinned: boolean;
  
  // Layer panel operations
  getCanvasObjects: () => FabricObject[];
  selectObjectById: (id: string) => void;
  toggleObjectVisibility: (id: string) => void;
  
  // Crop operations
  cropMode: boolean;
  setCropMode: (mode: boolean) => void;
  cropImage: (
    cropRect: { left: number; top: number; width: number; height: number }, 
    isCircular?: boolean
  ) => void;
  
  // Path smoothing
  smoothenPath: (strength: number) => void;
  
  // Nudge operations
  nudgeObject: (direction: 'up' | 'down' | 'left' | 'right', amount?: number) => void;
  
  // History
  saveState: () => void;
  
  // Flash effect
  flashCanvas: (type?: 'success' | 'info') => void;
  
  // Recovery operations
  recoverCanvas: (recoveryData: any) => void;
  checkForRecovery: () => { data: any; ageMinutes: number } | null;
  
  // Advanced shortcuts
  duplicateSelected: () => void;
  pasteInPlace: () => void;
  deselectAll: () => void;
  toggleLockSelected: () => void;
  hideSelected: () => void;
  showAllHidden: () => void;
  rotateSelected: (degrees: number) => void;
  duplicateBelow: () => void;
  loadTemplate: (template: any) => Promise<void>;
  
  // Gradient operations
  applyGradient: (config: GradientConfig, target: 'fill' | 'stroke') => void;
  clearGradient: (target: 'fill' | 'stroke') => void;
  
  // Shadow operations
  applyShadow: (config: ShadowConfig) => void;
  clearEffects: () => void;
  
  // Background removal
  removeImageBackground: () => Promise<void>;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
};

interface CanvasProviderProps {
  children: ReactNode;
}

export const CanvasProvider = ({ children }: CanvasProviderProps) => {
  const { user } = useAuth();
  console.log('CanvasProvider initializing...', { hasUser: !!user });
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  
  type ClipboardJSON = { type: 'single', object: any } | { type: 'multiple', objects: any[] };
  const [clipboard, setClipboard] = useState<ClipboardJSON | null>(null);
  
  const [zoom, setZoom] = useState(100);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [rulersEnabled, setRulersEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [backgroundColor, setBackgroundColor] = useState("#f0f9ff");
  const [backgroundGradient, setBackgroundGradient] = useState(false);
  const [gridPattern, setGridPattern] = useState<'lines' | 'dots' | 'isometric'>('lines');
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 800 });
  const [paperSize, setPaperSize] = useState("custom");
  
  // New differential history manager for better performance
  const historyManager = useRef<HistoryManager>(new HistoryManager(20));
  const [historyStep, setHistoryStep] = useState(0);
  
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Diagram");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Performance optimization: track if canvas has unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  
  // Render scheduler for batching renders
  const renderScheduler = useRef<RenderScheduler | null>(null);
  
  useEffect(() => {
    if (canvas) {
      renderScheduler.current = new RenderScheduler(canvas);
    }
  }, [canvas]);
  
  // Recent colors state (persisted to localStorage)
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    const stored = localStorage.getItem('canvas_recent_colors');
    return stored ? JSON.parse(stored) : [];
  });
  
  // Text formatting state
  const [textFont, setTextFont] = useState("Inter");
  const [textAlign, setTextAlign] = useState("left");
  const [textUnderline, setTextUnderline] = useState(false);
  const [textOverline, setTextOverline] = useState(false);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textListType, setTextListType] = useState<'none' | 'bullet' | 'numbered'>('none');
  const [textSubscript, setTextSubscript] = useState(false);
  const [textSuperscript, setTextSuperscript] = useState(false);
  
  // Pin state
  const [isPinned, setIsPinned] = useState(false);
  
  // Crop state
  const [cropMode, setCropMode] = useState(false);
  
  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // History management with differential compression
  const saveState = useCallback(() => {
    if (!canvas) return;
    historyManager.current.saveState(canvas);
    setHistoryStep(historyManager.current.getCurrentStep());
    setSaveStatus('unsaved');
    setIsDirty(true);
  }, [canvas]);
  
  // Throttled version of saveState for object modifications
  const throttledSaveState = useMemo(
    () => throttle(saveState, 500),
    [saveState]
  );

  const undo = useCallback(async () => {
    if (!canvas) return;
    const success = await historyManager.current.undo(canvas);
    if (success) {
      reloadCanvasImagesWithCORS(canvas);
      renderScheduler.current?.scheduleRender();
      setHistoryStep(historyManager.current.getCurrentStep());
    }
  }, [canvas]);

  const redo = useCallback(async () => {
    if (!canvas) return;
    const success = await historyManager.current.redo(canvas);
    if (success) {
      reloadCanvasImagesWithCORS(canvas);
      renderScheduler.current?.scheduleRender();
      setHistoryStep(historyManager.current.getCurrentStep());
    }
  }, [canvas]);

  // Clipboard operations
  const cut = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    try {
      if (activeObject.type === 'activeSelection') {
        const selection = activeObject as ActiveSelection;
        const objects = selection.getObjects().filter(obj => 
          !(obj as any).isGridLine && !(obj as any).isRuler
        );
        const jsons = objects.map(serializeObject);
        setClipboard({ type: 'multiple', objects: jsons });
        
        // Remove all objects from the selection
        objects.forEach(obj => {
          canvas.remove(obj);
        });
        
        canvas.discardActiveObject();
        toast.success(`${jsons.length} objects cut`);
      } else {
        const json = serializeObject(activeObject);
        setClipboard({ type: 'single', object: json });
        canvas.remove(activeObject);
        canvas.discardActiveObject();
        toast.success('Object cut');
      }
      
      canvas.requestRenderAll();
      saveState();
    } catch (error) {
      console.error('Cut failed:', error);
      toast.error('Failed to cut object');
    }
  }, [canvas, saveState]);

  // Properties to include when serializing objects for copy/paste
  const CLIPBOARD_PROPS = [
    // Custom/meta
    'id','name','data',
    // Geometry/transform
    'left','top','width','height','scaleX','scaleY','angle','flipX','flipY','skewX','skewY','originX','originY',
    // Appearance
    'fill','stroke','strokeWidth','strokeUniform','strokeDashArray','opacity','visible','shadow',
    // Text
    'text','fontFamily','fontSize','fontWeight','fontStyle','textAlign','underline','overline','linethrough','charSpacing','lineHeight','styles',
    // Path/shape specifics
    'rx','ry','radius','path',
    // Image specifics
    'src','crossOrigin','filters',
    // Misc
    'globalCompositeOperation','clipPath'
  ];

  // Helper to serialize object to JSON
  const serializeObject = (obj: FabricObject) => obj.toObject(CLIPBOARD_PROPS);

  // Robust wrapper around util.enlivenObjects to support both Promise and callback forms
  const enliven = (jsons: any[]): Promise<FabricObject[]> => {
    return new Promise((resolve, reject) => {
      try {
        const maybe = (util as any).enlivenObjects(jsons, (objects: FabricObject[]) => {
          resolve(objects);
        });
        if (maybe && typeof (maybe as any).then === 'function') {
          (maybe as Promise<FabricObject[]>).then(resolve).catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });
  };
  // Canvas flash effect for visual feedback
  const flashCanvas = useCallback((type: 'success' | 'info' = 'success') => {
    if (!canvas) return;
    
    const wrapper = (canvas as any).wrapperEl?.parentElement;
    if (!wrapper) return;
    
    const overlay = document.createElement('div');
    overlay.className = `absolute inset-0 pointer-events-none transition-opacity duration-300`;
    overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)';
    overlay.style.opacity = '1';
    wrapper.style.position = 'relative';
    wrapper.appendChild(overlay);
    
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }, 100);
  }, [canvas]);

  const copy = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    try {
      if (activeObject.type === 'activeSelection') {
        const selection = activeObject as ActiveSelection;
        const objects = selection.getObjects().filter(obj => 
          !(obj as any).isGridLine && !(obj as any).isRuler
        );
        const jsons = objects.map(serializeObject);
        setClipboard({ type: 'multiple', objects: jsons });
        console.log('Copied multiple objects:', jsons.length, jsons.map(j => j.type));
        flashCanvas('info');
        toast.success(`${jsons.length} objects copied`, { duration: 1000, className: 'animate-fade-in' });
      } else {
        const json = serializeObject(activeObject);
        setClipboard({ type: 'single', object: json });
        console.log('Copied single object:', json.type);
        flashCanvas('info');
        toast.success('Object copied', { duration: 1000, className: 'animate-fade-in' });
      }
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy object');
    }
  }, [canvas, flashCanvas]);

  const paste = useCallback(async () => {
    if (!canvas || !clipboard) return;

    try {
      if (clipboard.type === 'multiple') {
        const objects = await enliven(clipboard.objects);
        const pasted: FabricObject[] = [];
        console.log('Enlivened multiple objects:', objects.length, objects.map(o => o.type));

        objects.forEach(obj => {
          obj.set({
            left: (obj.left || 0) + 10,
            top: (obj.top || 0) + 10,
          });
          obj.setCoords();
          canvas.add(obj);
          pasted.push(obj);
        });

        if (pasted.length > 1) {
          const selection = new ActiveSelection(pasted, { canvas });
          canvas.setActiveObject(selection);
        } else if (pasted.length === 1) {
          canvas.setActiveObject(pasted[0]);
        }

        canvas.requestRenderAll();
        saveState();
        flashCanvas('success');
        toast.success(`${pasted.length} objects pasted`, { duration: 1000, className: 'animate-fade-in' });
      } else if (clipboard.type === 'single') {
        const [obj] = await enliven([clipboard.object]);
        if (!obj) {
          toast.error('Failed to paste object');
          return;
        }
        console.log('Enlivened single object:', obj.type);

        obj.set({
          left: (obj.left || 0) + 10,
          top: (obj.top || 0) + 10,
        });
        obj.setCoords();
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        saveState();
        flashCanvas('success');
        toast.success('Object pasted', { duration: 1000, className: 'animate-fade-in' });
      }
    } catch (error) {
      console.error('Paste failed:', error);
      toast.error('Failed to paste object');
    }
  }, [canvas, clipboard, saveState, flashCanvas]);

  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      saveState();
    }
  }, [canvas, saveState]);

  const selectAll = useCallback(() => {
    if (!canvas) return;
    const allObjects = canvas.getObjects().filter(obj => obj.selectable !== false);
    canvas.discardActiveObject();
    const selection = new (canvas.constructor as any).ActiveSelection(allObjects, { canvas });
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
  }, [canvas]);

  // Zoom operations
  const zoomIn = useCallback(() => {
    if (!canvas) return;
    const newZoom = Math.min(zoom + 10, 300);
    setZoom(newZoom);
    canvas.setZoom(newZoom / 100);
    canvas.requestRenderAll();
  }, [canvas, zoom]);

  const zoomOut = useCallback(() => {
    if (!canvas) return;
    const newZoom = Math.max(zoom - 10, 10);
    setZoom(newZoom);
    canvas.setZoom(newZoom / 100);
    canvas.requestRenderAll();
  }, [canvas, zoom]);

  const resetZoom = useCallback(() => {
    if (!canvas) return;
    setZoom(100);
    canvas.setZoom(1);
    canvas.requestRenderAll();
  }, [canvas]);

  const zoomToFit = useCallback(() => {
    if (!canvas) return;
    const objects = canvas.getObjects().filter(obj => 
      obj.selectable !== false && 
      !(obj as any).isGridLine && 
      !(obj as any).isRuler
    );
    
    if (objects.length === 0) {
      toast.info("No objects to fit");
      return;
    }

    // Calculate the bounding box of all objects
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objects.forEach(obj => {
      const bound = obj.getBoundingRect();
      minX = Math.min(minX, bound.left);
      minY = Math.min(minY, bound.top);
      maxX = Math.max(maxX, bound.left + bound.width);
      maxY = Math.max(maxY, bound.top + bound.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Get the actual viewport container dimensions
    const container = (canvas as any).wrapperEl?.parentElement;
    const viewportWidth = container ? container.clientWidth : canvas.width || 800;
    const viewportHeight = container ? container.clientHeight : canvas.height || 600;
    
    // Calculate zoom to fit with 10% padding
    const scaleX = (viewportWidth * 0.9) / contentWidth;
    const scaleY = (viewportHeight * 0.9) / contentHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Apply zoom
    const newZoom = Math.max(10, Math.min(300, Math.round(scale * 100)));
    setZoom(newZoom);
    canvas.setZoom(scale);
    
    // Center the content
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    canvas.viewportTransform = [
      scale, 0, 0, scale,
      viewportCenterX - contentCenterX * scale,
      viewportCenterY - contentCenterY * scale
    ];
    
    canvas.requestRenderAll();
    toast.success("Fit to screen");
  }, [canvas]);

  // Alignment operations
  const alignLeft = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    const minLeft = Math.min(...activeObjects.map(obj => obj.left || 0));
    activeObjects.forEach(obj => obj.set({ left: minLeft }));
    canvas.requestRenderAll();
    saveState();
  }, [canvas, saveState]);

  const alignCenter = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    const centerX = (canvas.width || 0) / 2;
    activeObjects.forEach(obj => {
      obj.set({ left: centerX - (obj.width || 0) / 2 });
    });
    canvas.requestRenderAll();
    saveState();
  }, [canvas, saveState]);

  const alignRight = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    const maxRight = Math.max(...activeObjects.map(obj => (obj.left || 0) + (obj.width || 0)));
    activeObjects.forEach(obj => {
      obj.set({ left: maxRight - (obj.width || 0) });
    });
    canvas.requestRenderAll();
    saveState();
  }, [canvas, saveState]);

  const alignTop = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    const minTop = Math.min(...activeObjects.map(obj => obj.top || 0));
    activeObjects.forEach(obj => obj.set({ top: minTop }));
    canvas.requestRenderAll();
    saveState();
  }, [canvas, saveState]);

  const alignMiddle = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    const centerY = (canvas.height || 0) / 2;
    activeObjects.forEach(obj => {
      obj.set({ top: centerY - (obj.height || 0) / 2 });
    });
    canvas.requestRenderAll();
    saveState();
  }, [canvas, saveState]);

  const alignBottom = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    const maxBottom = Math.max(...activeObjects.map(obj => (obj.top || 0) + (obj.height || 0)));
    activeObjects.forEach(obj => {
      obj.set({ top: maxBottom - (obj.height || 0) });
    });
    canvas.requestRenderAll();
    saveState();
  }, [canvas, saveState]);

  // Flip operations
  const flipHorizontal = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.set({ flipX: !activeObject.flipX });
      canvas.requestRenderAll();
      saveState();
      toast.success("Flipped horizontally");
    }
  }, [canvas, saveState]);

  const flipVertical = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.set({ flipY: !activeObject.flipY });
      canvas.requestRenderAll();
      saveState();
      toast.success("Flipped vertically");
    }
  }, [canvas, saveState]);

  // Layer operations
  const bringToFront = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringObjectToFront(activeObject);
      canvas.requestRenderAll();
      saveState();
      toast.success("Moved to front layer");
    }
  }, [canvas, saveState]);

  const sendToBack = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectToBack(activeObject);
      canvas.requestRenderAll();
      saveState();
      toast.success("Moved to back layer");
    }
  }, [canvas, saveState]);

  const bringForward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringObjectForward(activeObject);
      canvas.requestRenderAll();
      saveState();
      toast.success("Moved forward one layer");
    }
  }, [canvas, saveState]);

  const sendBackward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectBackwards(activeObject);
      canvas.requestRenderAll();
      saveState();
      toast.success("Moved backward one layer");
    }
  }, [canvas, saveState]);

  // Group operations
  const groupSelected = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    
    if (activeObjects.length < 2) {
      toast.error("Select at least 2 objects to group");
      return;
    }
    
    // Create a new group from selected objects
    const group = new Group(activeObjects, {
      canvas: canvas,
    });
    
    // Remove individual objects
    activeObjects.forEach(obj => canvas.remove(obj));
    
    // Add the group
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    saveState();
    toast.success("Objects grouped");
  }, [canvas, saveState]);

  const ungroupSelected = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    
    if (!activeObject || activeObject.type !== 'group') {
      toast.error("Select a group to ungroup");
      return;
    }
    
    const group = activeObject as Group;
    const items = group.getObjects().slice(); // Create a copy of the array
    
    // Store group's transformation properties
    const groupLeft = group.left || 0;
    const groupTop = group.top || 0;
    const groupScaleX = group.scaleX || 1;
    const groupScaleY = group.scaleY || 1;
    const groupAngle = group.angle || 0;
    
    // Remove all items from the group (this properly extracts them)
    group.removeAll();
    
    // Remove the now-empty group from canvas
    canvas.remove(group);
    
    // Process each item to calculate its absolute position
    const ungroupedObjects: FabricObject[] = [];
    
    items.forEach(item => {
      // Get item's position relative to group center
      const itemLeft = item.left || 0;
      const itemTop = item.top || 0;
      
      // Calculate absolute position using group's transform
      const rad = (groupAngle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      // Rotate and scale the item's position
      const rotatedX = itemLeft * cos - itemTop * sin;
      const rotatedY = itemLeft * sin + itemTop * cos;
      
      const absoluteLeft = groupLeft + rotatedX * groupScaleX;
      const absoluteTop = groupTop + rotatedY * groupScaleY;
      
      // Set absolute properties on the item
      item.set({
        left: absoluteLeft,
        top: absoluteTop,
        angle: (item.angle || 0) + groupAngle,
        scaleX: (item.scaleX || 1) * groupScaleX,
        scaleY: (item.scaleY || 1) * groupScaleY,
      });
      
      item.setCoords();
      ungroupedObjects.push(item);
    });
    
    // Add all objects back to canvas
    ungroupedObjects.forEach(obj => canvas.add(obj));
    
    // Create an active selection with all ungrouped objects
    if (ungroupedObjects.length > 0) {
      const selection = new ActiveSelection(ungroupedObjects, { canvas });
      canvas.setActiveObject(selection);
    }
    
    canvas.requestRenderAll();
    saveState();
    toast.success("Group ungrouped");
  }, [canvas, saveState]);

  // Add to recent colors with localStorage persistence
  const addToRecentColors = useCallback((color: string) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
      const updated = [color, ...filtered].slice(0, 8);
      localStorage.setItem('canvas_recent_colors', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Export operations
  const exportAsPNG = useCallback(async (dpi: 150 | 300 | 600 = 300, selectionOnly: boolean = false) => {
    if (!canvas) return;

    const originalSelection = canvas.getActiveObject();
    const hiddenForSelection: FabricObject[] = [];
    const hidden: FabricObject[] = [];
    
    const toastId = toast.loading(`Preparing PNG export at ${dpi} DPI...`);

    try {
      // If exporting selection only, temporarily hide non-selected objects
      if (selectionOnly && originalSelection) {
        canvas.getObjects().forEach((obj) => {
          if (obj !== originalSelection && obj.visible && 
              !(obj as any).isGridLine && !(obj as any).isRuler) {
            hiddenForSelection.push(obj);
            obj.visible = false;
          }
        });
      }

      // Temporarily hide guides, previews, handles, and eraser paths
      canvas.getObjects().forEach((obj) => {
        const o: any = obj as any;
        if (
          o.isGridLine || o.isRuler || o.isGuideLine || o.isHandleLine || o.isPreviewLine || o.isPortIndicator || o.isFeedback || o.isControlHandle || o.isEraserPath || obj.globalCompositeOperation === 'destination-out'
        ) {
          if (obj.visible) {
            hidden.push(obj);
            obj.visible = false;
          }
        }
      });
      canvas.renderAll();

      // Calculate multiplier based on DPI (300 is base)
      const multiplier = dpi / 300;
      
      // Guard against extreme dimensions
      const outW = (canvas.width || 0) * multiplier;
      const outH = (canvas.height || 0) * multiplier;
      
      // Estimate file size
      const estimatedPixels = outW * outH;
      const estimatedMB = (estimatedPixels * 4) / (1024 * 1024);
      
      if (estimatedMB > 100) {
        toast.dismiss(toastId);
        toast.error(`Export size too large (${estimatedMB.toFixed(0)}MB). Try a lower DPI or smaller canvas.`);
        return;
      }
      
      if (outW > 10000 || outH > 10000) {
        toast.dismiss(toastId);
        toast.error('Export dimensions too large. Try a lower DPI setting.');
        return;
      }

      console.log(`Generating PNG at ${dpi} DPI, canvas size: ${canvas.width}x${canvas.height}, output: ${outW}x${outH}`);
      const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier });
      console.log(`Data URL generated, length: ${dataURL.length} characters (${(dataURL.length / (1024 * 1024)).toFixed(2)} MB)`);
      
      const filename = selectionOnly ? `selection-${dpi}dpi.png` : `diagram-${dpi}dpi.png`;
      
      await safeDownloadDataUrl(dataURL, filename);
      toast.dismiss(toastId);
      toast.success(`Exported as PNG at ${dpi} DPI`, { duration: 1500, className: 'animate-fade-in' });
    } catch (err) {
      toast.dismiss(toastId);
      console.error('PNG Export failed:', {
        error: err,
        canvasSize: { width: canvas.width, height: canvas.height },
        dpi,
        multiplier: dpi / 300
      });
      
      if (err instanceof Error && /tainted|cross-origin/i.test(err.message)) {
        toast.error("Export failed due to a cross-origin image. Re-add the image via upload or a URL with CORS enabled.");
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to export PNG. Try a lower DPI or smaller canvas.');
      }
    } finally {
      // Restore visibility
      hidden.forEach((o) => (o.visible = true));
      hiddenForSelection.forEach((o) => (o.visible = true));
      canvas.renderAll();
    }
  }, [canvas]);

  const exportAsPNGTransparent = useCallback(async (dpi: 150 | 300 | 600 = 300, selectionOnly: boolean = false) => {
    if (!canvas) return;

    const originalSelection = canvas.getActiveObject();
    const hiddenForSelection: FabricObject[] = [];
    const hidden: FabricObject[] = [];
    const originalBg = canvas.backgroundColor;
    
    const toastId = toast.loading(`Preparing transparent PNG export at ${dpi} DPI...`);

    try {
      // If exporting selection only, temporarily hide non-selected objects
      if (selectionOnly && originalSelection) {
        canvas.getObjects().forEach((obj) => {
          if (obj !== originalSelection && obj.visible && 
              !(obj as any).isGridLine && !(obj as any).isRuler) {
            hiddenForSelection.push(obj);
            obj.visible = false;
          }
        });
      }

      // Temporarily hide guides, previews, handles, and eraser paths
      canvas.getObjects().forEach((obj) => {
        const o: any = obj as any;
        if (o.isGridLine || o.isRuler || o.isGuideLine || o.isHandleLine || o.isPreviewLine || o.isPortIndicator || o.isFeedback || o.isControlHandle || o.isEraserPath) {
          if (obj.visible) {
            hidden.push(obj);
            obj.visible = false;
          }
        }
      });

      canvas.backgroundColor = null as any;
      canvas.renderAll();

      // Calculate multiplier based on DPI (300 is base)
      const multiplier = dpi / 300;
      
      // Guard against extreme dimensions
      const outW = (canvas.width || 0) * multiplier;
      const outH = (canvas.height || 0) * multiplier;
      
      // Estimate file size
      const estimatedPixels = outW * outH;
      const estimatedMB = (estimatedPixels * 4) / (1024 * 1024);
      
      if (estimatedMB > 100) {
        toast.dismiss(toastId);
        toast.error(`Export size too large (${estimatedMB.toFixed(0)}MB). Try a lower DPI or smaller canvas.`);
        return;
      }
      
      if (outW > 10000 || outH > 10000) {
        toast.dismiss(toastId);
        toast.error('Export dimensions too large. Try a lower DPI setting.');
        return;
      }

      console.log(`Generating transparent PNG at ${dpi} DPI, canvas size: ${canvas.width}x${canvas.height}, output: ${outW}x${outH}`);
      const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier });
      console.log(`Data URL generated, length: ${dataURL.length} characters (${(dataURL.length / (1024 * 1024)).toFixed(2)} MB)`);
      
      const filename = selectionOnly ? `selection-transparent-${dpi}dpi.png` : `diagram-transparent-${dpi}dpi.png`;
      
      await safeDownloadDataUrl(dataURL, filename);
      toast.dismiss(toastId);
      toast.success(`Exported as PNG (transparent) at ${dpi} DPI`, { duration: 1500, className: 'animate-fade-in' });
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Transparent PNG Export failed:', {
        error: err,
        canvasSize: { width: canvas.width, height: canvas.height },
        dpi,
        multiplier: dpi / 300
      });
      
      if (err instanceof Error && /tainted|cross-origin/i.test(err.message)) {
        toast.error("Export failed due to a cross-origin image. Re-add the image via upload or a URL with CORS enabled.");
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to export transparent PNG. Try a lower DPI or smaller canvas.');
      }
    } finally {
      // Restore background and guides
      canvas.backgroundColor = originalBg;
      hidden.forEach((o) => (o.visible = true));
      hiddenForSelection.forEach((o) => (o.visible = true));
      canvas.renderAll();
    }
  }, [canvas]);

  const exportAsJPG = useCallback(async (dpi: 150 | 300 | 600 = 300, selectionOnly: boolean = false) => {
    if (!canvas) return;

    const originalSelection = canvas.getActiveObject();
    const hiddenForSelection: FabricObject[] = [];
    const hidden: FabricObject[] = [];
    
    const toastId = toast.loading(`Preparing JPG export at ${dpi} DPI...`);

    try {
      // If exporting selection only, temporarily hide non-selected objects
      if (selectionOnly && originalSelection) {
        canvas.getObjects().forEach((obj) => {
          if (obj !== originalSelection && obj.visible && 
              !(obj as any).isGridLine && !(obj as any).isRuler) {
            hiddenForSelection.push(obj);
            obj.visible = false;
          }
        });
      }

      // Temporarily hide guides, previews, handles, and eraser paths
      canvas.getObjects().forEach((obj) => {
        const o: any = obj as any;
        if (o.isGridLine || o.isRuler || o.isGuideLine || o.isHandleLine || o.isPreviewLine || o.isPortIndicator || o.isFeedback || o.isControlHandle || o.isEraserPath) {
          if (obj.visible) {
            hidden.push(obj);
            obj.visible = false;
          }
        }
      });
      canvas.renderAll();

      // Calculate multiplier based on DPI (300 is base)
      const multiplier = dpi / 300;
      
      // Guard against extreme dimensions
      const outW = (canvas.width || 0) * multiplier;
      const outH = (canvas.height || 0) * multiplier;
      
      // Estimate file size
      const estimatedPixels = outW * outH;
      const estimatedMB = (estimatedPixels * 0.5) / (1024 * 1024); // JPG uses ~0.5 bytes per pixel
      
      if (estimatedMB > 100) {
        toast.dismiss(toastId);
        toast.error(`Export size too large (${estimatedMB.toFixed(0)}MB). Try a lower DPI or smaller canvas.`);
        return;
      }
      
      if (outW > 10000 || outH > 10000) {
        toast.dismiss(toastId);
        toast.error('Export dimensions too large. Try a lower DPI setting.');
        return;
      }

      console.log(`Generating JPG at ${dpi} DPI, canvas size: ${canvas.width}x${canvas.height}, output: ${outW}x${outH}`);
      const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 1, multiplier });
      console.log(`Data URL generated, length: ${dataURL.length} characters (${(dataURL.length / (1024 * 1024)).toFixed(2)} MB)`);
      
      const filename = selectionOnly ? `selection-${dpi}dpi.jpg` : `diagram-${dpi}dpi.jpg`;
      
      await safeDownloadDataUrl(dataURL, filename);
      toast.dismiss(toastId);
      toast.success(`Exported as JPG at ${dpi} DPI`, { duration: 1500, className: 'animate-fade-in' });
    } catch (err) {
      toast.dismiss(toastId);
      console.error('JPG Export failed:', {
        error: err,
        canvasSize: { width: canvas.width, height: canvas.height },
        dpi,
        multiplier: dpi / 300
      });
      
      if (err instanceof Error && /tainted|cross-origin/i.test(err.message)) {
        toast.error("Export failed due to a cross-origin image. Re-add the image via upload or a URL with CORS enabled.");
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to export JPG. Try a lower DPI or smaller canvas.');
      }
    } finally {
      // Restore visibility
      hidden.forEach((o) => (o.visible = true));
      hiddenForSelection.forEach((o) => (o.visible = true));
      canvas.renderAll();
    }
  }, [canvas]);

  const exportAsSVG = useCallback((selectionOnly: boolean = false) => {
    if (!canvas) return;

    const originalSelection = canvas.getActiveObject();
    
    // If exporting selection only, temporarily hide non-selected objects
    const hiddenForSelection: FabricObject[] = [];
    if (selectionOnly && originalSelection) {
      canvas.getObjects().forEach((obj) => {
        if (obj !== originalSelection && obj.visible && 
            !(obj as any).isGridLine && !(obj as any).isRuler) {
          hiddenForSelection.push(obj);
          obj.visible = false;
        }
      });
    }

    // Temporarily hide guides, previews, handles, and eraser paths
    const hidden: FabricObject[] = [];
    canvas.getObjects().forEach((obj) => {
      const o: any = obj as any;
      if (o.isGridLine || o.isRuler || o.isGuideLine || o.isHandleLine || o.isPreviewLine || o.isPortIndicator || o.isFeedback || o.isControlHandle || o.isEraserPath) {
        if (obj.visible) {
          hidden.push(obj);
          obj.visible = false;
        }
      }
    });
    canvas.renderAll();

    const svg = canvas.toSVG();

    // Restore visibility
    hidden.forEach((o) => (o.visible = true));
    hiddenForSelection.forEach((o) => (o.visible = true));
    canvas.renderAll();

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = selectionOnly ? 'selection.svg' : 'diagram.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as SVG`, { duration: 1500, className: 'animate-fade-in' });
  }, [canvas]);

  // Clean Export - One-click optimal export with transparent background
  const cleanExport = useCallback(() => {
    exportAsPNGTransparent(300, false);
  }, [exportAsPNGTransparent]);

  // Pin/Lock operations
  const pinObject = useCallback(() => {
    if (!canvas || !selectedObject) return;
    
    selectedObject.set({
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false,
      hasBorders: true,
      selectable: true,
    });
    (selectedObject as any).isPinned = true;
    setIsPinned(true);
    canvas.renderAll();
    toast.success("Object pinned");
  }, [canvas, selectedObject]);

  const unpinObject = useCallback(() => {
    if (!canvas || !selectedObject) return;
    
    selectedObject.set({
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      hasControls: true,
      hasBorders: true,
      selectable: true,
    });
    (selectedObject as any).isPinned = false;
    setIsPinned(false);
    canvas.renderAll();
    toast.success("Object unpinned");
  }, [canvas, selectedObject]);

  const togglePin = useCallback(() => {
    if (isPinned) {
      unpinObject();
    } else {
      pinObject();
    }
  }, [isPinned, pinObject, unpinObject]);

  // Update isPinned state when selectedObject changes
  useEffect(() => {
    if (selectedObject) {
      setIsPinned((selectedObject as any).isPinned || false);
    } else {
      setIsPinned(false);
    }
  }, [selectedObject]);

  // Layer panel operations
  const getCanvasObjects = useCallback(() => {
    if (!canvas) return [];
    return canvas.getObjects().filter(obj => 
      !(obj as any).isGridLine && 
      !(obj as any).isRuler && 
      !(obj as any).isEraserPath
    );
  }, [canvas]);

  const selectObjectById = useCallback((id: string) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const targetObject = objects.find(obj => (obj as any).uuid === id || obj === objects[parseInt(id)]);
    if (targetObject) {
      canvas.setActiveObject(targetObject);
      canvas.renderAll();
    }
  }, [canvas]);

  const toggleObjectVisibility = useCallback((id: string) => {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const targetObject = objects.find(obj => 
      (obj as any).uuid === id || 
      obj === objects[parseInt(id)]
    );
    
    if (targetObject) {
      const newVisibility = !targetObject.visible;
      targetObject.set({ visible: newVisibility });
      
      // If hiding the currently selected object, deselect it
      if (!newVisibility && canvas.getActiveObject() === targetObject) {
        canvas.discardActiveObject();
      }
      
      // Fire object:modified event to trigger layer panel update
      canvas.fire('object:modified', { target: targetObject });
      canvas.renderAll();
      
      toast.success(newVisibility ? "Object shown" : "Object hidden");
    }
  }, [canvas]);

  // Crop operation
  const cropImage = useCallback((
    cropRect: { left: number; top: number; width: number; height: number }, 
    isCircular: boolean = false
  ) => {
    if (!canvas || !selectedObject) return;
    
    // Support both image and group types (groups are SVG icons)
    const supportedTypes = ['image', 'group'];
    if (!supportedTypes.includes(selectedObject.type)) {
      toast.error("Please select an image or icon to crop");
      return;
    }

    const object = selectedObject as any;
    
    // Clear any existing clipPath before applying new crop
    if (object.clipPath) {
      object.set({ clipPath: null });
    }
    
    // Get object properties for debugging and decision-making
    const angle = object.angle || 0;
    const skewX = object.skewX || 0;
    const skewY = object.skewY || 0;
    const scaleX = object.scaleX || 1;
    const scaleY = object.scaleY || 1;
    
    console.debug('Crop operation:', {
      type: object.type,
      angle,
      skewX,
      skewY,
      scaleX,
      scaleY,
      cropRect,
      isCircular
    });
    
    // Only use intrinsic image cropping for plain, unrotated, unskewed images with rectangular crop
    const isPlainImage = selectedObject.type === 'image';
    const canUseIntrinsicCrop = isPlainImage && !isCircular && angle === 0 && skewX === 0 && skewY === 0;
    
    if (canUseIntrinsicCrop) {
      try {
        console.debug('Using intrinsic image crop');
        const img = object as any;
        
        // Get the image's current position accounting for origin
        const imgLeft = img.left - (img.width * img.scaleX * (img.originX === 'center' ? 0.5 : img.originX === 'right' ? 1 : 0));
        const imgTop = img.top - (img.height * img.scaleY * (img.originY === 'center' ? 0.5 : img.originY === 'bottom' ? 1 : 0));
        
        // Calculate crop in image-local coordinates (before scaling)
        const localCropX = (cropRect.left - imgLeft) / scaleX;
        const localCropY = (cropRect.top - imgTop) / scaleY;
        const localCropWidth = cropRect.width / scaleX;
        const localCropHeight = cropRect.height / scaleY;
        
        console.debug('Intrinsic crop coords:', {
          localCropX,
          localCropY,
          localCropWidth,
          localCropHeight
        });
        
        // Apply intrinsic crop properties
        img.set({
          cropX: localCropX,
          cropY: localCropY,
          width: localCropWidth,
          height: localCropHeight,
          originX: 'left',
          originY: 'top',
          left: cropRect.left,
          top: cropRect.top
        });
        
        img.setCoords();
        canvas.requestRenderAll();
        saveState();
        setCropMode(false);
        toast.success('Image cropped');
        return;
      } catch (e) {
        console.error('Intrinsic crop error, falling back to clipPath:', e);
      }
    }
    
    // Use object-local clipPath for all other cases (moves with the object)
    console.debug('Using object-local clipPath');
    
    // Get object's transformation matrix and invert it to convert canvas coords to object-local coords
    const matrix = object.calcTransformMatrix();
    const invertedMatrix = util.invertTransform(matrix);
    
    let clipPath;
    if (isCircular) {
      // Circular crop: transform center point to object-local space
      const canvasCenter = {
        x: cropRect.left + cropRect.width / 2,
        y: cropRect.top + cropRect.height / 2
      };
      const localCenter = util.transformPoint(canvasCenter, invertedMatrix);
      
      // Calculate radius in object-local scale
      const radius = Math.min(cropRect.width, cropRect.height) / 2 / Math.min(scaleX, scaleY);
      
      clipPath = new Circle({
        left: localCenter.x,
        top: localCenter.y,
        radius,
        originX: 'center',
        originY: 'center'
      });
      
      console.debug('Created circular clipPath (local)', { localCenter, radius });
    } else {
      // Rectangular crop: transform corners to object-local space
      const topLeft = util.transformPoint(
        { x: cropRect.left, y: cropRect.top },
        invertedMatrix
      );
      const bottomRight = util.transformPoint(
        { x: cropRect.left + cropRect.width, y: cropRect.top + cropRect.height },
        invertedMatrix
      );
      
      clipPath = new Rect({
        left: topLeft.x,
        top: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
        originX: 'left',
        originY: 'top'
      });
      
      console.debug('Created rectangular clipPath (local)', { topLeft, bottomRight });
    }
    
    // ClipPath is now in object-local coordinates, so it will move with the object
    (clipPath as any).inverted = false;

    // Apply the clipPath to the object
    object.set({ clipPath });

    canvas.requestRenderAll();
    saveState();
    setCropMode(false);
    
    const objectType = selectedObject.type === 'image' ? 'Image' : 'Icon';
    toast.success(isCircular ? `${objectType} cropped (circular)` : `${objectType} cropped (rectangular)`);
  }, [canvas, selectedObject, saveState]);


  // Path smoothing operation
  const smoothenPath = useCallback((strength: number) => {
    if (!canvas || !selectedObject) return;
    
    // Check if selected object is a freeform line (Path)
    if (selectedObject.type !== 'path' || !(selectedObject as any).isFreeformLine) {
      toast.error("Please select a freeform line to smooth");
      return;
    }

    const pathObj = selectedObject as Path;
    
    try {
      smoothFabricPath(pathObj, strength);
      canvas.requestRenderAll();
      saveState();
      toast.success("Path smoothed");
    } catch (error) {
      console.error('Smoothing error:', error);
      toast.error("Failed to smooth path");
    }
  }, [canvas, selectedObject, saveState]);

  // Nudge operation for precise object movement
  const nudgeObject = useCallback((direction: 'up' | 'down' | 'left' | 'right', amount: number = 1) => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    // Get current position
    const currentLeft = activeObject.left || 0;
    const currentTop = activeObject.top || 0;

    // Calculate new position based on direction
    let newLeft = currentLeft;
    let newTop = currentTop;

    switch (direction) {
      case 'up':
        newTop = currentTop - amount;
        break;
      case 'down':
        newTop = currentTop + amount;
        break;
      case 'left':
        newLeft = currentLeft - amount;
        break;
      case 'right':
        newLeft = currentLeft + amount;
        break;
    }

    // Update object position
    activeObject.set({
      left: newLeft,
      top: newTop
    });

    // Update coordinates and render
    activeObject.setCoords();
    canvas.requestRenderAll();
    saveState();
  }, [canvas, saveState]);

  // Project save/load operations
  const saveProject = useCallback(async (isManualSave = false) => {
    if (!canvas || !user) {
      toast.error("Please sign in to save projects");
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    try {
      // Hide guides and eraser paths so they are not persisted as visible in saved data
      const hidden: FabricObject[] = [];
      canvas.getObjects().forEach((obj) => {
        if ((obj as any).isGridLine || (obj as any).isRuler || (obj as any).isEraserPath) {
          if (obj.visible) {
            hidden.push(obj);
            obj.visible = false;
          }
        }
      });

      const canvasData = canvas.toJSON();

      // Restore visibility after snapshot
      hidden.forEach((o) => (o.visible = true));

      const projectData = {
        user_id: user.id,
        name: projectName,
        canvas_data: canvasData,
        paper_size: paperSize,
        canvas_width: canvasDimensions.width,
        canvas_height: canvasDimensions.height,
        updated_at: new Date().toISOString()
      };

      // Check payload size before saving
      const payloadSize = new Blob([JSON.stringify(projectData)]).size / (1024 * 1024);
      console.log(`Save payload size: ${payloadSize.toFixed(2)}MB, Objects: ${canvas.getObjects().length}`);
      
      if (payloadSize > 4) {
        toast.error('Project too large to save (>4MB)', {
          description: 'Remove complex icons or reduce object count'
        });
        setIsSaving(false);
        return;
      }

      if (currentProjectId) {
        // Check if we should create a version snapshot
        let shouldCreateVersion = isManualSave;
        
        if (!shouldCreateVersion) {
          // For auto-saves, check if changes are significant
          const { data: currentProject } = await supabase
            .from('canvas_projects')
            .select('canvas_data')
            .eq('id', currentProjectId)
            .single();
          
          if (currentProject) {
            shouldCreateVersion = isSignificantChange(currentProject.canvas_data, canvasData);
          }
        }

        // Create version snapshot before updating main project
        if (shouldCreateVersion) {
          try {
            await createVersion({
              projectId: currentProjectId,
              userId: user.id,
              canvasData,
              canvasWidth: canvasDimensions.width,
              canvasHeight: canvasDimensions.height,
              paperSize,
              isAutoSave: !isManualSave,
            });
            console.log('Version snapshot created');
          } catch (versionError) {
            console.error('Failed to create version snapshot:', versionError);
            // Don't fail the save if version creation fails
          }
        }

        // Update existing project
        const { error } = await supabase
          .from('canvas_projects')
          .update(projectData)
          .eq('id', currentProjectId);

        if (error) throw error;
        
        // Cleanup old versions in the background
        cleanupVersions(currentProjectId).catch(err => 
          console.error('Version cleanup failed:', err)
        );
        
        setSaveStatus('saved');
        toast.success("Project saved", { duration: 1000, className: 'animate-fade-in' });
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('canvas_projects')
          .insert([projectData])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentProjectId(data.id);
          setSaveStatus('saved');
          toast.success("Project created and saved", { duration: 1500, className: 'animate-fade-in' });
        }
      }
    } catch (error: any) {
      console.error('Save error:', {
        message: error.message,
        details: error.toString(),
        hint: error.hint,
        code: error.code
      });
      
      // Provide specific error messages
      if (error.message?.includes('payload') || error.message?.includes('too large') || error.message?.includes('size')) {
        toast.error('Project too large to save', {
          description: 'Remove some complex icons and try again'
        });
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch') || error.message?.includes('network')) {
        toast.error('Network timeout during save', {
          description: 'Project may be too large or connection is slow'
        });
      } else {
        toast.error(error.message || "Failed to save project");
      }
    } finally {
      setIsSaving(false);
    }
  }, [canvas, user, projectName, paperSize, canvasDimensions, currentProjectId]);

  const loadProject = useCallback(async (id: string) => {
    if (!canvas || !user) return;

    try {
      const { data, error } = await supabase
        .from('canvas_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error("Project not found");
        return;
      }

      // Wait for all fonts to load before rendering
      toast("Loading project...");
      await loadAllFonts();

      // Load canvas data
      await canvas.loadFromJSON(data.canvas_data as Record<string, any>);
      
      // Reload images with CORS to prevent tainting
      reloadCanvasImagesWithCORS(canvas);
      
      // Normalize all text fonts to use full font stacks (including text in groups)
      normalizeCanvasTextFonts(canvas);

      // Update context state
      setCurrentProjectId(data.id);
      setProjectName(data.name);
      setPaperSize(data.paper_size);
      setCanvasDimensions({
        width: data.canvas_width,
        height: data.canvas_height
      });

      toast.success("Project loaded");
    } catch (error: any) {
      console.error('Load error:', error);
      toast.error(error.message || "Failed to load project");
    }
  }, [canvas, user]);

  // Optimized auto-save - only save if canvas is dirty
  useEffect(() => {
    if (!canvas || !user || !currentProjectId) return;

    const interval = setInterval(() => {
      if (isDirty && canvas && user && currentProjectId) {
        // Use requestIdleCallback if available, fallback to setTimeout
        const idleCallback = window.requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(cb, 1));
        idleCallback(() => {
          saveProject();
          setIsDirty(false);
        });
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [canvas, user, currentProjectId, isDirty, saveProject]);

  // Optimized auto-recovery - only save if dirty
  useEffect(() => {
    if (!canvas || !isDirty) return;

    const debouncedRecover = debounce(() => {
      if (saveStatus === 'unsaved' && isDirty) {
        // Use toDatalessJSON for lighter serialization if available
        const state = canvas.toJSON();
        const recovery = {
          state,
          timestamp: Date.now(),
          projectName,
          projectId: currentProjectId
        };
        localStorage.setItem('canvas_recovery', JSON.stringify(recovery));
      }
    }, 30000);

    debouncedRecover();
  }, [canvas, saveStatus, projectName, currentProjectId, isDirty]);

  // Warn on page unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const recoverCanvas = useCallback((recoveryData: any) => {
    if (!canvas) return;
    
    canvas.loadFromJSON(recoveryData.state).then(() => {
      reloadCanvasImagesWithCORS(canvas);
      
      // Normalize all text fonts to use full font stacks (including text in groups)
      normalizeCanvasTextFonts(canvas);
      
      toast.success('Canvas recovered successfully!');
      localStorage.removeItem('canvas_recovery');
      setSaveStatus('unsaved');
    });
  }, [canvas]);

  const checkForRecovery = useCallback(() => {
    const recovery = localStorage.getItem('canvas_recovery');
    if (recovery) {
      const data = JSON.parse(recovery);
      const ageMinutes = (Date.now() - data.timestamp) / 60000;
      if (ageMinutes < 60) {
        return {
          data,
          ageMinutes: Math.floor(ageMinutes)
        };
      } else {
        localStorage.removeItem('canvas_recovery');
      }
    }
    return null;
  }, []);

  const loadTemplate = useCallback(async (template: any) => {
    if (!canvas) return;

    try {
      toast("Loading template...");
      await loadAllFonts();
      
      canvas.clear();
      await canvas.loadFromJSON(template.canvasData);
      
      // Reload images with CORS to prevent tainting
      reloadCanvasImagesWithCORS(canvas);
      
      // Normalize all text fonts to use full font stacks (including text in groups)
      normalizeCanvasTextFonts(canvas);
      
      setProjectName(`Untitled from ${template.name}`);
      setCurrentProjectId(null);
      setPaperSize(template.paperSize);
      setCanvasDimensions(template.dimensions);
      canvas.setDimensions(template.dimensions);
      
      historyManager.current.clear();
      saveState();
      setSaveStatus('unsaved');
      
      toast.success(`Template "${template.name}" loaded!`);
    } catch (error: any) {
      console.error('Template load error:', error);
      toast.error("Failed to load template");
    }
  }, [canvas, saveState]);


  const duplicateSelected = useCallback(async () => {
    if (!canvas || !selectedObject) return;

    if (selectedObject.type === 'activeSelection') {
      const activeSelection = selectedObject as ActiveSelection;
      const objects = activeSelection.getObjects();
      
      const clones: FabricObject[] = [];
      
      for (const obj of objects) {
        const cloned = await obj.clone();
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        canvas.add(cloned);
        clones.push(cloned);
      }
      
      if (clones.length > 0) {
        const selection = new ActiveSelection(clones, { canvas });
        canvas.setActiveObject(selection);
        canvas.requestRenderAll();
        flashCanvas('success');
        toast.success('Duplicated selection');
        saveState();
      }
    } else {
      const cloned = await selectedObject.clone();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      flashCanvas('success');
      toast.success('Duplicated object');
      saveState();
    }
  }, [canvas, selectedObject, saveState, flashCanvas]);

  const pasteInPlace = useCallback(() => {
    paste();
  }, [paste]);

  const deselectAll = useCallback(() => {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [canvas]);

  const toggleLockSelected = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const currentLocked = (selectedObject as any).pinned || false;
    selectedObject.set({
      pinned: !currentLocked,
      selectable: currentLocked,
      evented: currentLocked,
    } as any);
    canvas.requestRenderAll();
    toast.success(currentLocked ? 'Unlocked object' : 'Locked object');
    saveState();
  }, [canvas, selectedObject, saveState]);

  const hideSelected = useCallback(() => {
    if (!canvas || !selectedObject) return;

    selectedObject.set({ visible: false });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    toast.success('Object hidden (Cmd+H to show all)');
    saveState();
  }, [canvas, selectedObject, saveState]);

  const showAllHidden = useCallback(() => {
    if (!canvas) return;

    let count = 0;
    canvas.getObjects().forEach((obj: FabricObject) => {
      if (!obj.visible) {
        obj.set({ visible: true });
        count++;
      }
    });
    canvas.requestRenderAll();
    if (count > 0) {
      toast.success(`Showed ${count} hidden object${count > 1 ? 's' : ''}`);
      saveState();
    }
  }, [canvas, saveState]);

  const rotateSelected = useCallback((degrees: number) => {
    if (!canvas || !selectedObject) return;

    const currentAngle = selectedObject.angle || 0;
    selectedObject.rotate(currentAngle + degrees);
    canvas.requestRenderAll();
    saveState();
  }, [canvas, selectedObject, saveState]);

  const duplicateBelow = useCallback(async () => {
    if (!canvas || !selectedObject) return;

    const cloned = await selectedObject.clone();
    const height = selectedObject.getScaledHeight();
    cloned.set({
      left: selectedObject.left,
      top: (selectedObject.top || 0) + height + 20,
    });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.requestRenderAll();
    toast.success('Duplicated below');
    saveState();
  }, [canvas, selectedObject, saveState]);

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

  // Gradient operations
  const applyGradient = useCallback((config: GradientConfig, target: 'fill' | 'stroke') => {
    if (!selectedObject || !canvas) return;
    
    const targetObj = getShapeFromGroup(selectedObject);
    let gradient;
    
    if (config.type === 'linear') {
      const angleRad = (config.angle * Math.PI) / 180;
      const coords = {
        x1: Math.cos(angleRad) * -50,
        y1: Math.sin(angleRad) * -50,
        x2: Math.cos(angleRad) * 50,
        y2: Math.sin(angleRad) * 50,
      };
      gradient = new Gradient({
        type: 'linear',
        coords: coords,
        colorStops: config.stops.map(stop => ({
          offset: stop.offset,
          color: stop.color,
          opacity: stop.opacity || 1
        }))
      });
    } else {
      gradient = new Gradient({
        type: 'radial',
        coords: {
          x1: config.centerX * 100,
          y1: config.centerY * 100,
          x2: config.centerX * 100,
          y2: config.centerY * 100,
          r1: 0,
          r2: config.radius
        },
        colorStops: config.stops.map(stop => ({
          offset: stop.offset,
          color: stop.color,
          opacity: stop.opacity || 1
        }))
      });
    }
    
    targetObj.set(target, gradient);
    canvas.requestRenderAll();
    saveState();
    toast.success(`Gradient applied to ${target}`);
  }, [selectedObject, canvas, saveState]);

  const clearGradient = useCallback((target: 'fill' | 'stroke') => {
    if (!selectedObject || !canvas) return;
    
    const targetObj = getShapeFromGroup(selectedObject);
    targetObj.set(target, '');
    canvas.requestRenderAll();
    saveState();
    toast.success(`Gradient cleared from ${target}`);
  }, [selectedObject, canvas, saveState]);

  // Shadow operations
  const applyShadow = useCallback((config: ShadowConfig) => {
    if (!selectedObject || !canvas) return;
    
    if (config.enabled) {
      const shadow = new Shadow({
        color: config.color,
        blur: config.blur,
        offsetX: config.offsetX,
        offsetY: config.offsetY,
      });
      // Manually set opacity by manipulating the color with alpha
      const hexOpacity = Math.round(config.opacity * 255).toString(16).padStart(2, '0');
      shadow.color = config.color + hexOpacity;
      
      selectedObject.set('shadow', shadow);
      toast.success('Shadow applied');
    } else {
      selectedObject.set('shadow', null);
      toast.success('Shadow removed');
    }
    
    canvas.requestRenderAll();
    saveState();
  }, [selectedObject, canvas, saveState]);

  const clearEffects = useCallback(() => {
    if (!selectedObject || !canvas) return;
    
    selectedObject.set('shadow', null);
    canvas.requestRenderAll();
    saveState();
    toast.success('All effects cleared');
  }, [selectedObject, canvas, saveState]);

  // Background removal
  const removeImageBackground = useCallback(async () => {
    if (!canvas || !selectedObject || selectedObject.type !== 'image') {
      toast.error('Please select an image first');
      return;
    }

    const toastId = toast.loading('Loading AI model... This may take up to 30 seconds on first use.');
    
    try {
      const imageObj = selectedObject as FabricImage;
      const imageElement = imageObj.getElement() as HTMLImageElement;
      
      // Update toast to show processing
      toast.loading('Processing image...', { id: toastId });
      
      // Remove background using existing library
      const resultBlob = await removeBackground(imageElement);
      
      // Convert blob to data URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(resultBlob);
      });
      
      // Create new image with transparent background
      const newImg = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
      
      // Preserve all properties from original
      newImg.set({
        left: imageObj.left,
        top: imageObj.top,
        scaleX: imageObj.scaleX,
        scaleY: imageObj.scaleY,
        angle: imageObj.angle,
        opacity: imageObj.opacity,
        flipX: imageObj.flipX,
        flipY: imageObj.flipY,
        originX: imageObj.originX,
        originY: imageObj.originY,
        lockMovementX: imageObj.lockMovementX,
        lockMovementY: imageObj.lockMovementY,
        selectable: imageObj.selectable,
      });
      
      // Replace old image with new one at same z-index
      const objects = canvas.getObjects();
      const index = objects.indexOf(imageObj);
      canvas.remove(imageObj);
      if (index >= 0) {
        canvas.insertAt(index, newImg);
      } else {
        canvas.add(newImg);
      }
      canvas.setActiveObject(newImg);
      
      canvas.renderAll();
      saveState();
      toast.dismiss(toastId);
      toast.success('Background removed successfully! ✨');
    } catch (error: any) {
      console.error('Background removal failed:', error);
      toast.dismiss(toastId);
      const errorMsg = error?.message || 'Failed to remove background';
      toast.error(errorMsg, { duration: 5000 });
    }
  }, [selectedObject, canvas, saveState]);

  const value: CanvasContextType = {
    canvas,
    setCanvas,
    selectedObject,
    setSelectedObject,
    zoom,
    setZoom,
    gridEnabled,
    setGridEnabled,
    rulersEnabled,
    setRulersEnabled,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    backgroundColor,
    setBackgroundColor,
    backgroundGradient,
    setBackgroundGradient,
    gridPattern,
    setGridPattern,
    canvasDimensions,
    setCanvasDimensions,
    paperSize,
    setPaperSize,
    currentProjectId,
    setCurrentProjectId,
    projectName,
    setProjectName,
    isSaving,
    saveProject,
    loadProject,
    saveStatus,
    undo,
    redo,
    cut,
    copy,
    paste,
    deleteSelected,
    selectAll,
    zoomIn,
    zoomOut,
    zoomToFit,
    resetZoom,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    flipHorizontal,
    flipVertical,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupSelected,
    ungroupSelected,
    exportAsPNG,
    exportAsPNGTransparent,
    exportAsJPG,
    exportAsSVG,
    cleanExport,
    exportDialogOpen,
    setExportDialogOpen,
    textFont,
    setTextFont,
    textAlign,
    setTextAlign,
    textUnderline,
    setTextUnderline,
    textOverline,
    setTextOverline,
    textBold,
    setTextBold,
    textItalic,
    setTextItalic,
    textListType,
    setTextListType,
    textSubscript,
    setTextSubscript,
    textSuperscript,
    setTextSuperscript,
    pinObject,
    unpinObject,
    togglePin,
    isPinned,
    getCanvasObjects,
    selectObjectById,
    toggleObjectVisibility,
    cropMode,
    setCropMode,
    cropImage,
    smoothenPath,
    nudgeObject,
    saveState,
    recentColors,
    addToRecentColors,
    flashCanvas,
    recoverCanvas,
    checkForRecovery,
    duplicateSelected,
    pasteInPlace,
    deselectAll,
    toggleLockSelected,
    hideSelected,
    showAllHidden,
    rotateSelected,
    duplicateBelow,
    loadTemplate,
    applyGradient,
    clearGradient,
    applyShadow,
    clearEffects,
    removeImageBackground,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};
