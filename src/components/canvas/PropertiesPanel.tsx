import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export const PropertiesPanel = () => {
  return (
    <div className="w-64 border-l bg-card h-full">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-sm">Properties</h3>
          
          <Tabs defaultValue="fill" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fill">Fill</TabsTrigger>
              <TabsTrigger value="stroke">Stroke</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fill" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="fill-color">Fill Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="fill-color"
                    type="color"
                    className="h-10 w-full"
                    defaultValue="#3b82f6"
                  />
                  <Input
                    type="text"
                    className="h-10 w-24"
                    defaultValue="#3b82f6"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Opacity</Label>
                <Slider defaultValue={[100]} max={100} step={1} />
                <p className="text-xs text-muted-foreground text-right">100%</p>
              </div>
            </TabsContent>
            
            <TabsContent value="stroke" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="stroke-color">Stroke Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="stroke-color"
                    type="color"
                    className="h-10 w-full"
                    defaultValue="#000000"
                  />
                  <Input
                    type="text"
                    className="h-10 w-24"
                    defaultValue="#000000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Stroke Width</Label>
                <Slider defaultValue={[2]} max={20} step={0.5} />
                <p className="text-xs text-muted-foreground text-right">2px</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-4 space-y-3 border-t">
            <h4 className="font-semibold text-sm">Transform</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="x">X</Label>
                <Input id="x" type="number" defaultValue="0" className="h-8" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="y">Y</Label>
                <Input id="y" type="number" defaultValue="0" className="h-8" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="width">Width</Label>
                <Input id="width" type="number" defaultValue="100" className="h-8" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="height">Height</Label>
                <Input id="height" type="number" defaultValue="100" className="h-8" />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="rotation">Rotation</Label>
              <Input id="rotation" type="number" defaultValue="0" className="h-8" />
            </div>
          </div>

          <div className="pt-4 space-y-2 border-t">
            <Button variant="outline" className="w-full" size="sm">
              Duplicate
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              Group
            </Button>
            <Button variant="destructive" className="w-full" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
