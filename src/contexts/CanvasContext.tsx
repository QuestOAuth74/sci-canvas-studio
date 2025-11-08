import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Canvas as FabricCanvas, FabricObject, Rect, Circle, Path, Group, ActiveSelection, util } from "fabric";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { loadAllFonts } from "@/lib/fontLoader";
import { smoothFabricPath } from "@/lib/pathSmoothing";

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
  canvasDimensions: { width: number; height: number };
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  paperSize: string;
  setPaperSize: (sizeId: string) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  isSaving: boolean;
  saveProject: () => Promise<void>;
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
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  
  type ClipboardJSON = { type: 'single', object: any } | { type: 'multiple', objects: any[] };
  const [clipboard, setClipboard] = useState<ClipboardJSON | null>(null);
  
  const [zoom, setZoom] = useState(100);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [rulersEnabled, setRulersEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 800 });
  const [paperSize, setPaperSize] = useState("custom");
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const MAX_HISTORY_SIZE = 50;
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Diagram");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
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
  
  // Pin state
  const [isPinned, setIsPinned] = useState(false);
  
  // Crop state
  const [cropMode, setCropMode] = useState(false);
  
  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // History management with size limit for performance
  const saveState = useCallback(() => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(json);
    
    // Limit history size for performance
    const limitedHistory = newHistory.slice(-MAX_HISTORY_SIZE);
    setHistory(limitedHistory);
    setHistoryStep(limitedHistory.length - 1);
    setSaveStatus('unsaved');
  }, [canvas, history, historyStep, MAX_HISTORY_SIZE]);

  const undo = useCallback(() => {
    if (!canvas || historyStep === 0) return;
    const prevState = history[historyStep - 1];
    if (prevState) {
      canvas.loadFromJSON(prevState).then(() => {
        canvas.renderAll();
        setHistoryStep(prev => prev - 1);
      });
    }
  }, [canvas, history, historyStep]);

  const redo = useCallback(() => {
    if (!canvas || historyStep >= history.length - 1) return;
    const nextState = history[historyStep + 1];
    if (nextState) {
      canvas.loadFromJSON(nextState).then(() => {
        canvas.renderAll();
        setHistoryStep(prev => prev + 1);
      });
    }
  }, [canvas, history, historyStep]);

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
      canvas.renderAll();
      saveState();
    }
  }, [canvas, saveState]);

  const selectAll = useCallback(() => {
    if (!canvas) return;
    const allObjects = canvas.getObjects().filter(obj => obj.selectable !== false);
    canvas.discardActiveObject();
    const selection = new (canvas.constructor as any).ActiveSelection(allObjects, { canvas });
    canvas.setActiveObject(selection);
    canvas.renderAll();
  }, [canvas]);

  // Zoom operations
  const zoomIn = useCallback(() => {
    if (!canvas) return;
    const newZoom = Math.min(zoom + 10, 300);
    setZoom(newZoom);
    canvas.setZoom(newZoom / 100);
    canvas.renderAll();
  }, [canvas, zoom]);

  const zoomOut = useCallback(() => {
    if (!canvas) return;
    const newZoom = Math.max(zoom - 10, 10);
    setZoom(newZoom);
    canvas.setZoom(newZoom / 100);
    canvas.renderAll();
  }, [canvas, zoom]);

  const resetZoom = useCallback(() => {
    if (!canvas) return;
    setZoom(100);
    canvas.setZoom(1);
    canvas.renderAll();
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
    
    canvas.renderAll();
    toast.success("Fit to screen");
  }, [canvas]);

  // Alignment operations
  const alignLeft = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    const minLeft = Math.min(...activeObjects.map(obj => obj.left || 0));
    activeObjects.forEach(obj => obj.set({ left: minLeft }));
    canvas.renderAll();
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
    canvas.renderAll();
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
    canvas.renderAll();
    saveState();
  }, [canvas, saveState]);

  const alignTop = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    const minTop = Math.min(...activeObjects.map(obj => obj.top || 0));
    activeObjects.forEach(obj => obj.set({ top: minTop }));
    canvas.renderAll();
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
    canvas.renderAll();
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
    canvas.renderAll();
    saveState();
  }, [canvas, saveState]);

  // Flip operations
  const flipHorizontal = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.set({ flipX: !activeObject.flipX });
      canvas.renderAll();
      saveState();
      toast.success("Flipped horizontally");
    }
  }, [canvas, saveState]);

  const flipVertical = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.set({ flipY: !activeObject.flipY });
      canvas.renderAll();
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
      canvas.renderAll();
      saveState();
      toast.success("Moved to front layer");
    }
  }, [canvas, saveState]);

  const sendToBack = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectToBack(activeObject);
      canvas.renderAll();
      saveState();
      toast.success("Moved to back layer");
    }
  }, [canvas, saveState]);

  const bringForward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringObjectForward(activeObject);
      canvas.renderAll();
      saveState();
      toast.success("Moved forward one layer");
    }
  }, [canvas, saveState]);

  const sendBackward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectBackwards(activeObject);
      canvas.renderAll();
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
    canvas.renderAll();
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
  const exportAsPNG = useCallback((dpi: 150 | 300 | 600 = 300, selectionOnly: boolean = false) => {
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
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier });

    // Restore visibility
    hidden.forEach((o) => (o.visible = true));
    hiddenForSelection.forEach((o) => (o.visible = true));
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = selectionOnly ? `selection-${dpi}dpi.png` : `diagram-${dpi}dpi.png`;
    link.href = dataURL;
    link.click();
    toast.success(`Exported as PNG at ${dpi} DPI`, { duration: 1500, className: 'animate-fade-in' });
  }, [canvas]);

  const exportAsPNGTransparent = useCallback((dpi: 150 | 300 | 600 = 300, selectionOnly: boolean = false) => {
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

    const originalBg = canvas.backgroundColor;
    canvas.backgroundColor = '';
    canvas.renderAll();

    // Calculate multiplier based on DPI (300 is base)
    const multiplier = dpi / 300;
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier });

    // Restore background and guides
    canvas.backgroundColor = originalBg;
    hidden.forEach((o) => (o.visible = true));
    hiddenForSelection.forEach((o) => (o.visible = true));
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = selectionOnly ? `selection-transparent-${dpi}dpi.png` : `diagram-transparent-${dpi}dpi.png`;
    link.href = dataURL;
    link.click();
    toast.success(`Exported as PNG (transparent) at ${dpi} DPI`, { duration: 1500, className: 'animate-fade-in' });
  }, [canvas]);

  const exportAsJPG = useCallback((dpi: 150 | 300 | 600 = 300, selectionOnly: boolean = false) => {
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

    // Calculate multiplier based on DPI (300 is base)
    const multiplier = dpi / 300;
    const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 1, multiplier });

    // Restore visibility
    hidden.forEach((o) => (o.visible = true));
    hiddenForSelection.forEach((o) => (o.visible = true));
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = selectionOnly ? `selection-${dpi}dpi.jpg` : `diagram-${dpi}dpi.jpg`;
    link.href = dataURL;
    link.click();
    toast.success(`Exported as JPG at ${dpi} DPI`, { duration: 1500, className: 'animate-fade-in' });
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
        canvas.renderAll();
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

    canvas.renderAll();
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
      canvas.renderAll();
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
    canvas.renderAll();
    saveState();
  }, [canvas, saveState]);

  // Project save/load operations
  const saveProject = useCallback(async () => {
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
        // Update existing project
        const { error } = await supabase
          .from('canvas_projects')
          .update(projectData)
          .eq('id', currentProjectId);

        if (error) throw error;
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
      setSaveStatus('unsaved');
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
      
      // Force font re-application after loading
      canvas.getObjects().forEach(obj => {
        if (obj.type === 'textbox' || obj.type === 'text') {
          const fontFamily = (obj as any).fontFamily;
          if (fontFamily) {
            // Re-set the font to trigger proper rendering
            obj.set({ fontFamily });
          }
        }
      });
      
      canvas.renderAll();

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

  // Auto-save every 30 seconds - using a ref to avoid dependency issues
  useEffect(() => {
    if (!canvas || !user || !currentProjectId) return;

    const autoSaveInterval = setInterval(() => {
      // Call saveProject directly without depending on it
      if (canvas && user) {
        saveProject();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [canvas, user, currentProjectId]); // Removed saveProject from deps to prevent interval resets

  // Auto-recovery system
  useEffect(() => {
    if (!canvas) return;

    const autoRecover = setInterval(() => {
      if (saveStatus === 'unsaved') {
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

    return () => clearInterval(autoRecover);
  }, [canvas, saveStatus, projectName, currentProjectId]);

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
    
    canvas.loadFromJSON(recoveryData.state, () => {
      canvas.renderAll();
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
      
      canvas.getObjects().forEach(obj => {
        if (obj.type === 'textbox' || obj.type === 'text') {
          const fontFamily = (obj as any).fontFamily;
          if (fontFamily) {
            obj.set({ fontFamily });
          }
        }
      });
      
      canvas.renderAll();
      
      setProjectName(`Untitled from ${template.name}`);
      setCurrentProjectId(null);
      setPaperSize(template.paperSize);
      setCanvasDimensions(template.dimensions);
      canvas.setDimensions(template.dimensions);
      
      setHistory([]);
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
        canvas.renderAll();
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
      canvas.renderAll();
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
    canvas.renderAll();
  }, [canvas]);

  const toggleLockSelected = useCallback(() => {
    if (!canvas || !selectedObject) return;

    const currentLocked = (selectedObject as any).pinned || false;
    selectedObject.set({
      pinned: !currentLocked,
      selectable: currentLocked,
      evented: currentLocked,
    } as any);
    canvas.renderAll();
    toast.success(currentLocked ? 'Unlocked object' : 'Locked object');
    saveState();
  }, [canvas, selectedObject, saveState]);

  const hideSelected = useCallback(() => {
    if (!canvas || !selectedObject) return;

    selectedObject.set({ visible: false });
    canvas.discardActiveObject();
    canvas.renderAll();
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
    canvas.renderAll();
    if (count > 0) {
      toast.success(`Showed ${count} hidden object${count > 1 ? 's' : ''}`);
      saveState();
    }
  }, [canvas, saveState]);

  const rotateSelected = useCallback((degrees: number) => {
    if (!canvas || !selectedObject) return;

    const currentAngle = selectedObject.angle || 0;
    selectedObject.rotate(currentAngle + degrees);
    canvas.renderAll();
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
    canvas.renderAll();
    toast.success('Duplicated below');
    saveState();
  }, [canvas, selectedObject, saveState]);

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
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};
