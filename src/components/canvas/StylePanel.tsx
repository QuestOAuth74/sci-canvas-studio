import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCanvas } from "@/contexts/CanvasContext";
import { useEffect, useState } from "react";

export const StylePanel = () => {
  const { selectedObject } = useCanvas();
  
  const [fill, setFill] = useState("#3b82f6");
  const [fillEnabled, setFillEnabled] = useState(true);
  const [stroke, setStroke] = useState("#000000");
  const [strokeEnabled, setStrokeEnabled] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (selectedObject) {
      setFill((selectedObject.fill as string) || "#3b82f6");
      setStroke((selectedObject.stroke as string) || "#000000");
      setStrokeWidth(selectedObject.strokeWidth || 2);
      setOpacity((selectedObject.opacity || 1) * 100);
      setFillEnabled(!!selectedObject.fill);
      setStrokeEnabled(!!selectedObject.stroke);
    }
  }, [selectedObject]);

  const handleFillChange = (color: string) => {
    if (!selectedObject) return;
    setFill(color);
    selectedObject.set({ fill: fillEnabled ? color : '' });
    selectedObject.canvas?.renderAll();
  };

  const handleFillToggle = (enabled: boolean) => {
    if (!selectedObject) return;
    setFillEnabled(enabled);
    selectedObject.set({ fill: enabled ? fill : '' });
    selectedObject.canvas?.renderAll();
  };

  const handleStrokeChange = (color: string) => {
    if (!selectedObject) return;
    setStroke(color);
    selectedObject.set({ stroke: strokeEnabled ? color : '' });
    selectedObject.canvas?.renderAll();
  };

  const handleStrokeToggle = (enabled: boolean) => {
    if (!selectedObject) return;
    setStrokeEnabled(enabled);
    selectedObject.set({ stroke: enabled ? stroke : '' });
    selectedObject.canvas?.renderAll();
  };

  const handleStrokeWidthChange = (width: number) => {
    if (!selectedObject) return;
    setStrokeWidth(width);
    selectedObject.set({ strokeWidth: width });
    selectedObject.canvas?.renderAll();
  };

  const handleOpacityChange = (value: number[]) => {
    if (!selectedObject) return;
    const newOpacity = value[0];
    setOpacity(newOpacity);
    selectedObject.set({ opacity: newOpacity / 100 });
    selectedObject.canvas?.renderAll();
  };

  return (
    <div className="space-y-3">
      {/* Fill */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox 
            id="fill" 
            checked={fillEnabled}
            onCheckedChange={handleFillToggle}
            disabled={!selectedObject}
          />
          <Label htmlFor="fill" className="font-semibold text-xs">Fill</Label>
        </div>
        <div className="flex gap-2 pl-6">
          <Input
            type="color"
            className="h-7 w-14"
            value={fill}
            onChange={(e) => handleFillChange(e.target.value)}
            disabled={!selectedObject || !fillEnabled}
          />
          <Input
            type="text"
            className="h-7 flex-1 text-xs"
            value={fill}
            onChange={(e) => handleFillChange(e.target.value)}
            disabled={!selectedObject || !fillEnabled}
          />
        </div>
      </div>

      <Separator />

      {/* Border */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox 
            id="border" 
            checked={strokeEnabled}
            onCheckedChange={handleStrokeToggle}
            disabled={!selectedObject}
          />
          <Label htmlFor="border" className="font-semibold text-xs">Border</Label>
        </div>
        <div className="flex gap-2 pl-6">
          <Input
            type="color"
            className="h-7 w-14"
            value={stroke}
            onChange={(e) => handleStrokeChange(e.target.value)}
            disabled={!selectedObject || !strokeEnabled}
          />
          <Input
            type="text"
            className="h-7 flex-1 text-xs"
            value={stroke}
            onChange={(e) => handleStrokeChange(e.target.value)}
            disabled={!selectedObject || !strokeEnabled}
          />
        </div>
        <div className="pl-6 space-y-1">
          <Label className="text-xs">Width</Label>
          <Input 
            type="number" 
            value={strokeWidth}
            onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
            disabled={!selectedObject || !strokeEnabled}
            className="h-7 text-xs" 
          />
        </div>
      </div>

      <Separator />

      {/* Opacity */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-xs">Opacity</Label>
        <Slider 
          value={[opacity]} 
          max={100} 
          step={1}
          onValueChange={handleOpacityChange}
          disabled={!selectedObject}
        />
        <p className="text-xs text-muted-foreground text-right">{opacity}%</p>
      </div>
    </div>
  );
};
