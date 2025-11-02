import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { useState } from "react";

export const QuickSettings = () => {
  const { 
    gridEnabled, 
    setGridEnabled, 
    rulersEnabled, 
    setRulersEnabled,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize
  } = useCanvas();
  const [defaultStrokeWidth, setDefaultStrokeWidth] = useState(2);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 bg-background" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Canvas Settings</h4>
            <p className="text-xs text-muted-foreground">Quick access to common settings</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="snap-grid" className="text-sm">Show Grid</Label>
              <Switch 
                id="snap-grid"
                checked={gridEnabled} 
                onCheckedChange={setGridEnabled} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="smart-guides" className="text-sm">Show Rulers</Label>
              <Switch 
                id="smart-guides"
                checked={rulersEnabled} 
                onCheckedChange={setRulersEnabled} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="snap-grid" className="text-sm">Snap to Grid</Label>
              <Switch 
                id="snap-grid"
                checked={snapToGrid} 
                onCheckedChange={setSnapToGrid} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="grid-size" className="text-sm">Grid Size</Label>
                <span className="text-xs text-muted-foreground">{gridSize}px</span>
              </div>
              <Slider 
                id="grid-size"
                value={[gridSize]} 
                onValueChange={([v]) => setGridSize(v)} 
                min={10} 
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="stroke-width" className="text-sm">Default Stroke Width</Label>
                <span className="text-xs text-muted-foreground">{defaultStrokeWidth}px</span>
              </div>
              <Slider 
                id="stroke-width"
                value={[defaultStrokeWidth]} 
                onValueChange={([v]) => setDefaultStrokeWidth(v)} 
                min={1} 
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
