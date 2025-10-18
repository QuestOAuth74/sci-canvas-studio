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
import { useCanvas } from "@/contexts/CanvasContext";
import { useEffect, useState } from "react";

export const ArrangePanel = () => {
  const {
    selectedObject,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  } = useCanvas();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (selectedObject) {
      setPosition({ x: selectedObject.left || 0, y: selectedObject.top || 0 });
      setSize({ width: selectedObject.width || 0, height: selectedObject.height || 0 });
      setRotation(selectedObject.angle || 0);
    }
  }, [selectedObject]);

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    if (!selectedObject) return;
    if (axis === 'x') {
      selectedObject.set({ left: value });
      setPosition(prev => ({ ...prev, x: value }));
    } else {
      selectedObject.set({ top: value });
      setPosition(prev => ({ ...prev, y: value }));
    }
    selectedObject.canvas?.renderAll();
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    if (!selectedObject) return;
    selectedObject.set({ [dimension]: value });
    setSize(prev => ({ ...prev, [dimension]: value }));
    selectedObject.canvas?.renderAll();
  };

  const handleRotate = () => {
    if (!selectedObject) return;
    selectedObject.set({ angle: rotation });
    selectedObject.canvas?.renderAll();
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (!selectedObject) return;
    if (direction === 'horizontal') {
      selectedObject.set({ flipX: !selectedObject.flipX });
    } else {
      selectedObject.set({ flipY: !selectedObject.flipY });
    }
    selectedObject.canvas?.renderAll();
  };

  return (
    <div className="space-y-3">
      {/* Position */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-xs">Position</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">X</Label>
            <Input 
              type="number" 
              value={position.x} 
              onChange={(e) => handlePositionChange('x', Number(e.target.value))}
              disabled={!selectedObject}
              className="h-8 text-xs" 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Y</Label>
            <Input 
              type="number" 
              value={position.y} 
              onChange={(e) => handlePositionChange('y', Number(e.target.value))}
              disabled={!selectedObject}
              className="h-8 text-xs" 
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Size */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-xs">Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Width</Label>
            <Input 
              type="number" 
              value={size.width} 
              onChange={(e) => handleSizeChange('width', Number(e.target.value))}
              disabled={!selectedObject}
              className="h-8 text-xs" 
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height</Label>
            <Input 
              type="number" 
              value={size.height} 
              onChange={(e) => handleSizeChange('height', Number(e.target.value))}
              disabled={!selectedObject}
              className="h-8 text-xs" 
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Alignment */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-xs">Align</Label>
        <div className="grid grid-cols-3 gap-1">
          <Button variant="outline" size="icon" className="h-7 w-full" onClick={alignLeft} disabled={!selectedObject}>
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-full" onClick={alignCenter} disabled={!selectedObject}>
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-full" onClick={alignRight} disabled={!selectedObject}>
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-full" onClick={alignTop} disabled={!selectedObject}>
            <AlignVerticalJustifyStart className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-full" onClick={alignMiddle} disabled={!selectedObject}>
            <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-full" onClick={alignBottom} disabled={!selectedObject}>
            <AlignVerticalJustifyEnd className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Flip & Rotate */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-xs">Transform</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleFlip('horizontal')} disabled={!selectedObject}>
            <FlipHorizontal className="h-3.5 w-3.5 mr-1" />
            Flip H
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleFlip('vertical')} disabled={!selectedObject}>
            <FlipVertical className="h-3.5 w-3.5 mr-1" />
            Flip V
          </Button>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rotation</Label>
          <div className="flex gap-2">
            <Input 
              type="number" 
              value={rotation} 
              onChange={(e) => setRotation(Number(e.target.value))}
              disabled={!selectedObject}
              className="h-7 flex-1 text-xs" 
            />
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleRotate} disabled={!selectedObject}>
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Layer Order */}
      <div className="space-y-1.5">
        <Label className="font-semibold text-xs">Order</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={bringForward} disabled={!selectedObject}>
            Bring Forward
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={sendBackward} disabled={!selectedObject}>
            Send Back
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={bringToFront} disabled={!selectedObject}>
            To Front
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={sendToBack} disabled={!selectedObject}>
            To Back
          </Button>
        </div>
      </div>
    </div>
  );
};
