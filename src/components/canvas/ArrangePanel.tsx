import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  FlipHorizontal,
  FlipVertical,
  RotateCw
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const ArrangePanel = () => {
  return (
    <div className="space-y-4">
      {/* Position */}
      <div className="space-y-2">
        <Label className="font-semibold">Position</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">X</Label>
            <Input type="number" defaultValue="0" className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Y</Label>
            <Input type="number" defaultValue="0" className="h-8" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Size */}
      <div className="space-y-2">
        <Label className="font-semibold">Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Width</Label>
            <Input type="number" defaultValue="100" className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height</Label>
            <Input type="number" defaultValue="100" className="h-8" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Alignment */}
      <div className="space-y-2">
        <Label className="font-semibold">Align</Label>
        <div className="grid grid-cols-3 gap-1">
          <Button variant="outline" size="icon" className="h-8 w-full">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-full">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-full">
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-full">
            <AlignVerticalJustifyStart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-full">
            <AlignVerticalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-full">
            <AlignVerticalJustifyEnd className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Flip & Rotate */}
      <div className="space-y-2">
        <Label className="font-semibold">Transform</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <FlipHorizontal className="h-4 w-4 mr-1" />
            Flip H
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <FlipVertical className="h-4 w-4 mr-1" />
            Flip V
          </Button>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rotation</Label>
          <div className="flex gap-2">
            <Input type="number" defaultValue="0" className="h-8 flex-1" />
            <Button variant="outline" size="icon" className="h-8 w-8">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Layer Order */}
      <div className="space-y-2">
        <Label className="font-semibold">Order</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-8">
            Bring Forward
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            Send Back
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            To Front
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            To Back
          </Button>
        </div>
      </div>
    </div>
  );
};
