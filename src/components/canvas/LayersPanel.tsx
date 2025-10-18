import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from "lucide-react";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export const LayersPanel = () => {
  const [layers, setLayers] = useState<Layer[]>([
    { id: "1", name: "Layer 1", visible: true, locked: false },
  ]);

  const toggleVisibility = (id: string) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const toggleLock = (id: string) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, locked: !layer.locked } : layer
    ));
  };

  const addLayer = () => {
    const newLayer = {
      id: Date.now().toString(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
    };
    setLayers([...layers, newLayer]);
  };

  const deleteLayer = (id: string) => {
    if (layers.length > 1) {
      setLayers(layers.filter(layer => layer.id !== id));
    }
  };

  return (
    <div className="w-64 border-l bg-card h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Layers</h3>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={addLayer}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="flex items-center gap-2 p-2 rounded hover:bg-accent group"
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => toggleVisibility(layer.id)}
              >
                {layer.visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => toggleLock(layer.id)}
              >
                {layer.locked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              
              <span className="flex-1 text-sm truncate">{layer.name}</span>
              
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => deleteLayer(layer.id)}
                disabled={layers.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
