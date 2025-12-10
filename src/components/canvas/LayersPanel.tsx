import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Search, Trash2 } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { FabricObject } from "fabric";
import { toast } from "sonner";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const thumbnailCache = useRef<Map<string, string>>(new Map());

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

  const generateThumbnail = (obj: FabricObject): string => {
    try {
      const tempCanvas = document.createElement('canvas');
      const size = 32;
      tempCanvas.width = size;
      tempCanvas.height = size;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) return '';
      
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, size, size);
      
      const objBounds = obj.getBoundingRect();
      const scale = Math.min(size / objBounds.width, size / objBounds.height) * 0.8;
      
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.scale(scale, scale);
      ctx.translate(-objBounds.width / 2, -objBounds.height / 2);
      
      obj.render(ctx as any);
      ctx.restore();
      
      return tempCanvas.toDataURL();
    } catch (error) {
      return '';
    }
  };

  const handleBulkDelete = () => {
    if (!canvas || selectedLayers.length === 0) return;
    
    selectedLayers.forEach(layerId => {
      const layer = layers.find(l => l.id === layerId);
      if (layer) {
        canvas.remove(layer.fabricObject);
      }
    });
    
    setSelectedLayers([]);
    canvas.renderAll();
    toast.success(`Deleted ${selectedLayers.length} layer(s)`, { duration: 1000, className: 'animate-fade-in' });
  };

  const handleLayerSelect = (layerId: string, ctrlKey: boolean) => {
    if (ctrlKey) {
      setSelectedLayers(prev => 
        prev.includes(layerId) 
          ? prev.filter(id => id !== layerId)
          : [...prev, layerId]
      );
    } else {
      setSelectedLayers([]);
    }
  };

  const isSelected = (layer: Layer) => {
    return selectedObject === layer.fabricObject;
  };

  const isLayerSelected = (layerId: string) => {
    return selectedLayers.includes(layerId);
  };

  const filteredLayers = layers.filter(layer =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Layers</h3>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      
      {/* Bulk Actions */}
      {selectedLayers.length > 0 && (
        <div className="p-2 border-b bg-accent/10 flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex-1">
            {selectedLayers.length} selected
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            className="h-7 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredLayers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-muted-foreground/40 mb-2">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                {searchQuery ? 'No matching layers' : 'No objects yet'}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground/70">
                  Add shapes, text, or icons to get started
                </p>
              )}
            </div>
          ) : (
            filteredLayers.map((layer) => (
              <div
                key={layer.id}
                onClick={(e) => {
                  handleLayerClick(layer);
                  handleLayerSelect(layer.id, e.ctrlKey || e.metaKey);
                }}
                className={`flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer group transition-colors ${
                  isSelected(layer) || isLayerSelected(layer.id) ? 'bg-accent' : ''
                }`}
              >
                {/* Thumbnail */}
                <div className="h-8 w-8 rounded bg-muted shrink-0 overflow-hidden border">
                  <img 
                    src={generateThumbnail(layer.fabricObject)} 
                    alt={layer.name}
                    className="w-full h-full object-contain"
                  />
                </div>
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
