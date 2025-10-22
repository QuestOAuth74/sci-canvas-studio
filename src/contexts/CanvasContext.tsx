import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { loadAllFonts } from "@/lib/fontLoader";

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
  
  // Layer operations
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  
  // Export operations
  exportAsPNG: () => void;
  exportAsPNGTransparent: () => void;
  exportAsJPG: () => void;
  exportAsSVG: () => void;
  
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
  
  // Pin/Lock operations
  pinObject: () => void;
  unpinObject: () => void;
  togglePin: () => void;
  isPinned: boolean;
  
  // Layer panel operations
  getCanvasObjects: () => FabricObject[];
  selectObjectById: (id: string) => void;
  toggleObjectVisibility: (id: string) => void;
  
  // Smart snapping
  smartSnapEnabled: boolean;
  setSmartSnapEnabled: (enabled: boolean) => void;
  snapThreshold: number;
  setSnapThreshold: (threshold: number) => void;
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
  const [zoom, setZoom] = useState(100);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [rulersEnabled, setRulersEnabled] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 800 });
  const [paperSize, setPaperSize] = useState("custom");
  const [clipboard, setClipboard] = useState<FabricObject | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Diagram");
  const [isSaving, setIsSaving] = useState(false);
  
  // Text formatting state
  const [textFont, setTextFont] = useState("Inter");
  const [textAlign, setTextAlign] = useState("left");
  const [textUnderline, setTextUnderline] = useState(false);
  const [textOverline, setTextOverline] = useState(false);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  
  // Pin state
  const [isPinned, setIsPinned] = useState(false);
  
  // Smart snapping state
  const [smartSnapEnabled, setSmartSnapEnabled] = useState(() => {
    const saved = localStorage.getItem('smartSnapEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [snapThreshold, setSnapThreshold] = useState(() => {
    const saved = localStorage.getItem('snapThreshold');
    return saved !== null ? JSON.parse(saved) : 5;
  });
  
  // Persist smart snap preferences
  useEffect(() => {
    localStorage.setItem('smartSnapEnabled', JSON.stringify(smartSnapEnabled));
  }, [smartSnapEnabled]);
  
  useEffect(() => {
    localStorage.setItem('snapThreshold', JSON.stringify(snapThreshold));
  }, [snapThreshold]);

  // History management
  const saveState = useCallback(() => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => [...prev.slice(0, historyStep + 1), json]);
    setHistoryStep(prev => prev + 1);
  }, [canvas, historyStep]);

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
    if (activeObject) {
      setClipboard(activeObject);
      canvas.remove(activeObject);
      canvas.renderAll();
      saveState();
    }
  }, [canvas, saveState]);

  const copy = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone().then((cloned: FabricObject) => {
        setClipboard(cloned);
      });
    }
  }, [canvas]);

  const paste = useCallback(() => {
    if (!canvas || !clipboard) return;
    clipboard.clone().then((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      saveState();
    });
  }, [canvas, clipboard, saveState]);

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

  // Export operations
  const exportAsPNG = useCallback(() => {
    if (!canvas) return;

    // Temporarily hide guides and eraser paths
    const hidden: FabricObject[] = [];
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).isGridLine || (obj as any).isRuler || (obj as any).isEraserPath || obj.globalCompositeOperation === 'destination-out') {
        if (obj.visible) {
          hidden.push(obj);
          obj.visible = false;
        }
      }
    });
    canvas.renderAll();

    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });

    // Restore visibility
    hidden.forEach((o) => (o.visible = true));
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = 'diagram.png';
    link.href = dataURL;
    link.click();
    toast.success("Exported as PNG");
  }, [canvas]);

  const exportAsPNGTransparent = useCallback(() => {
    if (!canvas) return;

    // Temporarily hide guides and eraser paths
    const hidden: FabricObject[] = [];
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).isGridLine || (obj as any).isRuler || (obj as any).isEraserPath) {
        if (obj.visible) {
          hidden.push(obj);
          obj.visible = false;
        }
      }
    });

    const originalBg = canvas.backgroundColor;
    canvas.backgroundColor = '';
    canvas.renderAll();

    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });

    // Restore background and guides
    canvas.backgroundColor = originalBg;
    hidden.forEach((o) => (o.visible = true));
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = 'diagram-transparent.png';
    link.href = dataURL;
    link.click();
    toast.success("Exported as PNG with transparent background");
  }, [canvas]);

  const exportAsJPG = useCallback(() => {
    if (!canvas) return;

    // Temporarily hide guides and eraser paths
    const hidden: FabricObject[] = [];
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).isGridLine || (obj as any).isRuler || (obj as any).isEraserPath) {
        if (obj.visible) {
          hidden.push(obj);
          obj.visible = false;
        }
      }
    });
    canvas.renderAll();

    const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 1, multiplier: 2 });

    // Restore visibility
    hidden.forEach((o) => (o.visible = true));
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = 'diagram.jpg';
    link.href = dataURL;
    link.click();
    toast.success("Exported as JPG");
  }, [canvas]);

  const exportAsSVG = useCallback(() => {
    if (!canvas) return;

    // Temporarily hide guides and eraser paths
    const hidden: FabricObject[] = [];
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).isGridLine || (obj as any).isRuler || (obj as any).isEraserPath) {
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
    canvas.renderAll();

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'diagram.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [canvas]);

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

  // Project save/load operations
  const saveProject = useCallback(async () => {
    if (!canvas || !user) {
      toast.error("Please sign in to save projects");
      return;
    }

    setIsSaving(true);
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

      if (currentProjectId) {
        // Update existing project
        const { error } = await supabase
          .from('canvas_projects')
          .update(projectData)
          .eq('id', currentProjectId);

        if (error) throw error;
        toast.success("Project saved");
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
          toast.success("Project created and saved");
        }
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || "Failed to save project");
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
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    exportAsPNG,
    exportAsPNGTransparent,
    exportAsJPG,
    exportAsSVG,
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
    pinObject,
    unpinObject,
    togglePin,
    isPinned,
    getCanvasObjects,
    selectObjectById,
    toggleObjectVisibility,
    smartSnapEnabled,
    setSmartSnapEnabled,
    snapThreshold,
    setSnapThreshold,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};
