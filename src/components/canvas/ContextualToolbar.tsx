import { useCanvas } from "@/contexts/CanvasContext";
import { TextFormattingPanel } from "./TextFormattingPanel";
import { LinePropertiesPanel } from "./LinePropertiesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Copy, Trash2 } from "lucide-react";

export const ContextualToolbar = () => {
  const { selectedObject, canvas } = useCanvas();

  if (!selectedObject) {
    return null;
  }

  const objectType = selectedObject.type;
  const isTextObject = objectType === "textbox" || objectType === "text";
  const isConnector = (selectedObject as any).data?.isConnector === true;
  const isShape = ["rect", "circle", "ellipse", "triangle", "polygon"].includes(objectType || "");
  const isImage = objectType === "image";
  const isGroup = objectType === "group" || objectType === "activeSelection";

  const handleDelete = () => {
    if (canvas && selectedObject) {
      canvas.remove(selectedObject);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  const handleDuplicate = () => {
    if (!canvas || !selectedObject) return;
    
    (selectedObject as any).clone().then((cloned: any) => {
      cloned.set({
        left: (selectedObject.left || 0) + 20,
        top: (selectedObject.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  };

  const handleOpacityChange = (value: number[]) => {
    if (!selectedObject || !canvas) return;
    selectedObject.set({ opacity: value[0] / 100 });
    canvas.requestRenderAll();
  };

  return (
    <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-40 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 flex items-center gap-4 max-w-5xl">
      {/* Text Controls */}
      {isTextObject && (
        <>
          <TextFormattingPanel />
          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      {/* Line/Connector Controls */}
      {isConnector && (
        <>
          <LinePropertiesPanel />
          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      {/* Shape Controls */}
      {isShape && (
        <>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Fill</Label>
            <Input
              type="color"
              value={(selectedObject.fill as string) || "#000000"}
              onChange={(e) => {
                if (!canvas) return;
                selectedObject.set({ fill: e.target.value });
                canvas.requestRenderAll();
              }}
              className="w-12 h-8 p-0 border-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Stroke</Label>
            <Input
              type="color"
              value={(selectedObject.stroke as string) || "#000000"}
              onChange={(e) => {
                if (!canvas) return;
                selectedObject.set({ stroke: e.target.value });
                canvas.requestRenderAll();
              }}
              className="w-12 h-8 p-0 border-0"
            />
          </div>
          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      {/* Common Controls for all objects */}
      <div className="flex items-center gap-2">
        <Label className="text-xs whitespace-nowrap">Opacity</Label>
        <Slider
          value={[(selectedObject.opacity || 1) * 100]}
          onValueChange={handleOpacityChange}
          max={100}
          min={0}
          step={1}
          className="w-24"
        />
        <span className="text-xs text-muted-foreground w-8">
          {Math.round((selectedObject.opacity || 1) * 100)}%
        </span>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          className="h-8 px-2"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-8 px-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
