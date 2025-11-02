import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Type, Square, Minus } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { toast } from "sonner";
import { Textbox, FabricObject } from "fabric";

interface StylePreset {
  name: string;
  icon?: React.ReactNode;
  properties: any;
}

const TEXT_PRESETS: StylePreset[] = [
  { 
    name: "Heading 1", 
    icon: <Type className="h-4 w-4" />,
    properties: { fontFamily: "Inter", fontSize: 48, fontWeight: "bold", fill: "#000000" }
  },
  { 
    name: "Heading 2", 
    icon: <Type className="h-4 w-4" />,
    properties: { fontFamily: "Inter", fontSize: 36, fontWeight: "bold", fill: "#000000" }
  },
  { 
    name: "Heading 3", 
    icon: <Type className="h-4 w-4" />,
    properties: { fontFamily: "Inter", fontSize: 24, fontWeight: "600", fill: "#374151" }
  },
  { 
    name: "Body", 
    icon: <Type className="h-4 w-4" />,
    properties: { fontFamily: "Inter", fontSize: 16, fontWeight: "normal", fill: "#000000" }
  },
  { 
    name: "Caption", 
    icon: <Type className="h-4 w-4" />,
    properties: { fontFamily: "Inter", fontSize: 12, fontWeight: "normal", fill: "#6b7280" }
  },
];

const SHAPE_PRESETS: StylePreset[] = [
  { 
    name: "Primary", 
    icon: <Square className="h-4 w-4" />,
    properties: { fill: "#3b82f6", stroke: undefined, strokeWidth: 0 }
  },
  { 
    name: "Secondary", 
    icon: <Square className="h-4 w-4" />,
    properties: { fill: "#ffffff", stroke: "#d1d5db", strokeWidth: 2 }
  },
  { 
    name: "Accent", 
    icon: <Square className="h-4 w-4" />,
    properties: { fill: "#0D9488", stroke: undefined, strokeWidth: 0 }
  },
  { 
    name: "Outline", 
    icon: <Square className="h-4 w-4" />,
    properties: { fill: "transparent", stroke: "#000000", strokeWidth: 2 }
  },
  { 
    name: "Dashed", 
    icon: <Square className="h-4 w-4" />,
    properties: { fill: "transparent", stroke: "#000000", strokeWidth: 2, strokeDashArray: [5, 5] }
  },
];

const LINE_PRESETS: StylePreset[] = [
  { 
    name: "Solid", 
    icon: <Minus className="h-4 w-4" />,
    properties: { stroke: "#000000", strokeWidth: 2, strokeDashArray: undefined }
  },
  { 
    name: "Dashed", 
    icon: <Minus className="h-4 w-4" />,
    properties: { stroke: "#000000", strokeWidth: 2, strokeDashArray: [10, 5] }
  },
  { 
    name: "Dotted", 
    icon: <Minus className="h-4 w-4" />,
    properties: { stroke: "#000000", strokeWidth: 2, strokeDashArray: [2, 4] }
  },
  { 
    name: "Thick", 
    icon: <Minus className="h-4 w-4" />,
    properties: { stroke: "#000000", strokeWidth: 4, strokeDashArray: undefined }
  },
  { 
    name: "Thin", 
    icon: <Minus className="h-4 w-4" />,
    properties: { stroke: "#6b7280", strokeWidth: 1, strokeDashArray: undefined }
  },
];

export const StylePresets = () => {
  const { canvas, selectedObject } = useCanvas();

  const applyPreset = (preset: StylePreset) => {
    if (!canvas || !selectedObject) {
      toast.error("Please select an object first");
      return;
    }

    try {
      // Helper to check if it's a shape-text group
      const isShapeWithTextGroup = (obj: any): boolean => {
        if (obj.type !== 'group') return false;
        const objects = obj.getObjects();
        return objects.length === 2 && 
               (objects[0].type === 'circle' || objects[0].type === 'rect') &&
               objects[1].type === 'textbox';
      };

      // Apply preset based on object type
      if (selectedObject.type === 'textbox' || selectedObject instanceof Textbox) {
        selectedObject.set(preset.properties);
        canvas.renderAll();
        toast.success(`Applied ${preset.name} style`);
      } else if (isShapeWithTextGroup(selectedObject)) {
        const shape = (selectedObject as any).getObjects()[0];
        shape.set(preset.properties);
        canvas.renderAll();
        toast.success(`Applied ${preset.name} style`);
      } else if (selectedObject.type === 'path' || (selectedObject as any).isFreeformLine) {
        selectedObject.set(preset.properties);
        canvas.renderAll();
        toast.success(`Applied ${preset.name} style`);
      } else {
        selectedObject.set(preset.properties);
        canvas.renderAll();
        toast.success(`Applied ${preset.name} style`);
      }
    } catch (error) {
      console.error("Error applying preset:", error);
      toast.error("Failed to apply style");
    }
  };

  const getPresetType = () => {
    if (!selectedObject) return null;
    
    if (selectedObject.type === 'textbox') return 'text';
    if (selectedObject.type === 'path' || (selectedObject as any).isFreeformLine) return 'line';
    if (selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'polygon') return 'shape';
    if (selectedObject.type === 'group') {
      const objects = (selectedObject as any).getObjects?.();
      if (objects?.length === 2 && objects[1].type === 'textbox') return 'shape';
    }
    
    return null;
  };

  const presetType = getPresetType();
  const presets = presetType === 'text' ? TEXT_PRESETS : 
                  presetType === 'line' ? LINE_PRESETS : 
                  presetType === 'shape' ? SHAPE_PRESETS : null;

  if (!selectedObject || !presets) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <p>Select an object to see style presets</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium mb-2 block">Quick Styles</Label>
        <ScrollArea className="h-[200px]">
          <div className="grid grid-cols-2 gap-2 pr-4">
            {presets.map(preset => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-2 justify-start h-auto py-3"
              >
                {preset.icon}
                <span className="text-xs">{preset.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
