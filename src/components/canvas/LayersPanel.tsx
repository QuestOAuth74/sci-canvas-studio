import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { FabricObject } from "fabric";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  fabricObject: FabricObject;
}

export const LayersPanel = () => {
  const { canvas, selectedObject, getCanvasObjects, selectObjectById, toggleObjectVisibility } = useCanvas();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [, setRefresh] = useState(0);

  const getObjectName = (obj: FabricObject, index: number): string => {
    if ((obj as any).name) return (obj as any).name;
    
    if (obj.type === 'textbox' || obj.type === 'text') {
      const text = (obj as any).text || '';
      return text.length > 20 ? text.substring(0, 20) + '...' : text || 'Text';
    }
    
    if (obj.type === 'group') return 'Icon';
    if (obj.type === 'rect') return 'Rectangle';
    if (obj.type === 'circle') return 'Circle';
    if (obj.type === 'path') return 'Line';
    
    return `${obj.type || 'Object'} ${index + 1}`;
  };

  const updateLayers = () => {
    const objects = getCanvasObjects();
    const newLayers = objects.map((obj, index) => ({
      id: (obj as any).uuid || index.toString(),
      name: getObjectName(obj, index),
      visible: obj.visible !== false,
      locked: (obj as any).isPinned || false,
      fabricObject: obj,
    })).reverse(); // Reverse to show top layer first
    setLayers(newLayers);
  };

  useEffect(() => {
    if (!canvas) return;

    updateLayers();

    const handleObjectModified = () => updateLayers();
    const handleObjectAdded = () => updateLayers();
    const handleObjectRemoved = () => updateLayers();
    const handleSelectionUpdated = () => setRefresh(prev => prev + 1);

    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('selection:created', handleSelectionUpdated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionUpdated);

    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('selection:created', handleSelectionUpdated);
      canvas.off('selection:updated', handleSelectionUpdated);
      canvas.off('selection:cleared', handleSelectionUpdated);
    };
  }, [canvas, getCanvasObjects]);

  const handleLayerClick = (layer: Layer) => {
    selectObjectById(layer.id);
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleObjectVisibility(id);
  };

  const isSelected = (layer: Layer) => {
    return selectedObject === layer.fabricObject;
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No objects on canvas
            </div>
          ) : (
            layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => handleLayerClick(layer)}
                className={`flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer group transition-colors ${
                  isSelected(layer) ? 'bg-accent' : ''
                }`}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-6 w-6 shrink-0 transition-all ${!layer.visible && 'opacity-50 hover:opacity-100'}`}
                  onClick={(e) => toggleVisibility(layer.id, e)}
                >
                  {layer.visible ? (
                    <Eye className="h-4 w-4 text-primary" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                
                {layer.locked && (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                
                <span className={`flex-1 text-sm truncate transition-opacity ${!layer.visible && 'opacity-50'}`}>
                  {layer.name}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
