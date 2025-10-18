import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StylePanel } from "./StylePanel";
import { ArrangePanel } from "./ArrangePanel";

export const PropertiesPanel = () => {
  return (
    <div className="w-72 border-l bg-card h-full">
      <ScrollArea className="h-full">
        <div className="p-4">
          <Tabs defaultValue="style" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="arrange">Arrange</TabsTrigger>
            </TabsList>
            
            <TabsContent value="style" className="space-y-3 mt-4">
              <StylePanel />
            </TabsContent>
            
            <TabsContent value="text" className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Input defaultValue="Arial" className="h-8" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Size</Label>
                  <Input type="number" defaultValue="14" className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <Input type="color" defaultValue="#000000" className="h-8" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="arrange" className="space-y-3 mt-4">
              <ArrangePanel />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};
