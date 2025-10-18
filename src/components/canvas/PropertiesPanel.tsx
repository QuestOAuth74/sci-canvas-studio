import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StylePanel } from "./StylePanel";
import { ArrangePanel } from "./ArrangePanel";
import { PAPER_SIZES } from "@/types/paperSizes";
import { useState } from "react";
import { useCanvas } from "@/contexts/CanvasContext";

export const PropertiesPanel = () => {
  const [paperSize, setPaperSize] = useState("custom");
  const { gridEnabled, setGridEnabled, rulersEnabled, setRulersEnabled, backgroundColor, setBackgroundColor } = useCanvas();
  const [showBgColor, setShowBgColor] = useState(false);

  return (
    <div className="w-64 border-l-[3px] border-foreground bg-card h-full">
      <ScrollArea className="h-full">
        <Tabs defaultValue="diagram" className="w-full">
          <TabsList className="grid w-full grid-cols-2 m-2">
            <TabsTrigger value="diagram" className="text-xs">Diagram</TabsTrigger>
            <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
          </TabsList>
          
          <div className="px-3 pb-4">
            <TabsContent value="diagram" className="space-y-4 mt-0">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">View</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="grid" className="text-xs">Grid</Label>
                    <Checkbox 
                      id="grid" 
                      checked={gridEnabled}
                      onCheckedChange={(checked) => setGridEnabled(checked as boolean)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rulers" className="text-xs">Rulers</Label>
                    <Checkbox 
                      id="rulers" 
                      checked={rulersEnabled}
                      onCheckedChange={(checked) => setRulersEnabled(checked as boolean)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Background</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bg-color-toggle" className="text-xs">Custom Color</Label>
                    <Checkbox 
                      id="bg-color-toggle"
                      checked={showBgColor}
                      onCheckedChange={(checked) => setShowBgColor(checked as boolean)}
                    />
                  </div>
                  {showBgColor && (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-8 w-12 p-1" 
                      />
                      <Input 
                        type="text" 
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-8 text-xs flex-1" 
                        placeholder="#ffffff"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Paper Size</h3>
                <Select value={paperSize} onValueChange={setPaperSize}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_SIZES.map((size) => (
                      <SelectItem key={size.id} value={size.id} className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium">{size.name}</span>
                          <span className="text-xs text-muted-foreground">{size.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4 mt-0">
              <StylePanel />
              
              <div className="pt-3 border-t">
                <h3 className="font-semibold text-sm mb-3">Text</h3>
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Font Family</Label>
                    <Input defaultValue="Arial" className="h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Size</Label>
                      <Input type="number" defaultValue="14" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Color</Label>
                      <Input type="color" defaultValue="#000000" className="h-8" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <h3 className="font-semibold text-sm mb-3">Arrange</h3>
                <ArrangePanel />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>
    </div>
  );
};
