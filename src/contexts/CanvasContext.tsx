import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";

interface CanvasContextType {
  canvas: FabricCanvas | null;
  setCanvas: (canvas: FabricCanvas | null) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (obj: FabricObject | null) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  gridEnabled: boolean;
  setGridEnabled: (enabled: boolean) => void;
  
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
  exportAsSVG: () => void;
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
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [zoom, setZoom] = useState(100);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [clipboard, setClipboard] = useState<FabricObject | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(0);

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
    const objects = canvas.getObjects().filter(obj => obj.selectable !== false);
    if (objects.length === 0) return;

    const group = new (canvas.constructor as any).Group(objects);
    const groupWidth = group.width || 0;
    const groupHeight = group.height || 0;
    
    const canvasWidth = canvas.width || 800;
    const canvasHeight = canvas.height || 600;
    
    const scaleX = canvasWidth / groupWidth;
    const scaleY = canvasHeight / groupHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    
    const newZoom = Math.round(scale * 100);
    setZoom(newZoom);
    canvas.setZoom(scale);
    canvas.renderAll();
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
    }
  }, [canvas, saveState]);

  const sendToBack = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectToBack(activeObject);
      canvas.renderAll();
      saveState();
    }
  }, [canvas, saveState]);

  const bringForward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringObjectForward(activeObject);
      canvas.renderAll();
      saveState();
    }
  }, [canvas, saveState]);

  const sendBackward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectBackwards(activeObject);
      canvas.renderAll();
      saveState();
    }
  }, [canvas, saveState]);

  // Export operations
  const exportAsPNG = useCallback(() => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const link = document.createElement('a');
    link.download = 'diagram.png';
    link.href = dataURL;
    link.click();
  }, [canvas]);

  const exportAsSVG = useCallback(() => {
    if (!canvas) return;
    const svg = canvas.toSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'diagram.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [canvas]);

  const value: CanvasContextType = {
    canvas,
    setCanvas,
    selectedObject,
    setSelectedObject,
    zoom,
    setZoom,
    gridEnabled,
    setGridEnabled,
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
    exportAsSVG,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};
