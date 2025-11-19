import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { useTheme } from "@/contexts/ThemeContext";
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
    setGridSize,
    backgroundGradient,
    setBackgroundGradient,
    gridPattern,
    setGridPattern,
  } = useCanvas();
  const { darkMode, setDarkMode } = useTheme();
  const [defaultStrokeWidth, setDefaultStrokeWidth] = useState(2);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 bg-[#f0f9ff] dark:bg-slate-800 dark:border-slate-700" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Canvas Settings</h4>
            <p className="text-xs text-muted-foreground">Quick access to common settings</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-sm">Dark Mode</Label>
              <Switch 
                id="dark-mode"
                checked={darkMode} 
                onCheckedChange={setDarkMode} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="background-gradient" className="text-sm">Gradient Background</Label>
              <Switch 
                id="background-gradient"
                checked={backgroundGradient} 
                onCheckedChange={setBackgroundGradient} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-grid" className="text-sm">Show Grid</Label>
              <Switch 
                id="show-grid"
                checked={gridEnabled} 
                onCheckedChange={setGridEnabled} 
              />
            </div>
            
            {gridEnabled && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label htmlFor="grid-pattern" className="text-sm">Grid Pattern</Label>
                <Select value={gridPattern} onValueChange={(value: 'lines' | 'dots' | 'isometric') => setGridPattern(value)}>
                  <SelectTrigger id="grid-pattern" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lines">Lines</SelectItem>
                    <SelectItem value="dots">Dots</SelectItem>
                    <SelectItem value="isometric">Isometric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
