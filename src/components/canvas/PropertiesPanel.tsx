import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { StylePanel } from "./StylePanel";
import { ArrangePanel } from "./ArrangePanel";

export const PropertiesPanel = () => {
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
                    <Checkbox id="grid" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="page-view" className="text-xs">Page View</Label>
                    <Checkbox id="page-view" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Background</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bg-color" className="text-xs">Background Color</Label>
                    <Checkbox id="bg-color" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shadow" className="text-xs">Shadow</Label>
                    <Checkbox id="shadow" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Options</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="arrows" className="text-xs">Connection Arrows</Label>
                    <Checkbox id="arrows" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="points" className="text-xs">Connection Points</Label>
                    <Checkbox id="points" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="guides" className="text-xs">Guides</Label>
                    <Checkbox id="guides" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Paper Size</h3>
                <Input defaultValue='US Letter (8.5" x 11")' className="h-8 text-xs" />
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
