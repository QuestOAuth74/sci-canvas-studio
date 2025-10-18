import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export const StylePanel = () => {
  return (
    <div className="space-y-4">
      {/* Fill */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox id="fill" defaultChecked />
          <Label htmlFor="fill" className="font-semibold">Fill</Label>
        </div>
        <div className="flex gap-2 pl-6">
          <Input
            type="color"
            className="h-8 w-16"
            defaultValue="#3b82f6"
          />
          <Input
            type="text"
            className="h-8 flex-1"
            defaultValue="#3b82f6"
          />
        </div>
      </div>

      <Separator />

      {/* Border */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox id="border" defaultChecked />
          <Label htmlFor="border" className="font-semibold">Border</Label>
        </div>
        <div className="flex gap-2 pl-6">
          <Input
            type="color"
            className="h-8 w-16"
            defaultValue="#000000"
          />
          <Input
            type="text"
            className="h-8 flex-1"
            defaultValue="#000000"
          />
        </div>
        <div className="pl-6 space-y-1">
          <Label className="text-xs">Width</Label>
          <Input type="number" defaultValue="1" className="h-8" />
        </div>
      </div>

      <Separator />

      {/* Opacity */}
      <div className="space-y-2">
        <Label className="font-semibold">Opacity</Label>
        <Slider defaultValue={[100]} max={100} step={1} />
        <p className="text-xs text-muted-foreground text-right">100%</p>
      </div>

      <Separator />

      {/* Sketch Effect */}
      <div className="flex items-center gap-2">
        <Checkbox id="sketch" />
        <Label htmlFor="sketch" className="font-semibold">Sketch</Label>
      </div>

      {/* Shadow */}
      <div className="flex items-center gap-2">
        <Checkbox id="shadow" />
        <Label htmlFor="shadow" className="font-semibold">Shadow</Label>
      </div>

      <Separator />

      {/* Edit Mode */}
      <div className="space-y-2">
        <Label className="text-xs">Edit</Label>
        <Select defaultValue="edit">
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="edit">Edit</SelectItem>
            <SelectItem value="view">View Only</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
