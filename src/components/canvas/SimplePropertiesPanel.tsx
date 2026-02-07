import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useCanvas } from "@/contexts/CanvasContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconAlignBoxTopCenter,
  IconAlignBoxCenterMiddle,
  IconAlignBoxBottomCenter,
  IconFlipHorizontal,
  IconFlipVertical,
  IconTrash,
  IconCopy,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";

export const SimplePropertiesPanel = () => {
  const {
    canvas,
    selectedObject,
    flipHorizontal,
    flipVertical,
    duplicateSelected,
    deleteSelected,
    toggleLockSelected,
    bringToFront,
    sendToBack,
  } = useCanvas();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [fillColor, setFillColor] = useState("#000000");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(1);

  useEffect(() => {
    if (selectedObject) {
      setPosition({
        x: Math.round(selectedObject.left || 0),
        y: Math.round(selectedObject.top || 0),
      });
      setSize({
        width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
        height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
      });
      setRotation(Math.round(selectedObject.angle || 0));
      setOpacity(Math.round((selectedObject.opacity || 1) * 100));

      const fill = selectedObject.fill;
      if (typeof fill === 'string') {
        setFillColor(fill);
      }

      const stroke = selectedObject.stroke;
      if (typeof stroke === 'string') {
        setStrokeColor(stroke);
      }

      setStrokeWidth(selectedObject.strokeWidth || 0);
    }
  }, [selectedObject]);

  const updateObject = (property: string, value: any) => {
    if (!canvas || !selectedObject) return;
    selectedObject.set(property as any, value);
    canvas.renderAll();
    canvas.fire('object:modified', { target: selectedObject });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0;
    setPosition(prev => ({ ...prev, [axis]: numValue }));
    updateObject(axis === 'x' ? 'left' : 'top', numValue);
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 0;
    const currentValue = dimension === 'width'
      ? (selectedObject?.width || 1) * (selectedObject?.scaleX || 1)
      : (selectedObject?.height || 1) * (selectedObject?.scaleY || 1);

    if (currentValue > 0 && selectedObject) {
      const scale = numValue / (dimension === 'width' ? (selectedObject.width || 1) : (selectedObject.height || 1));
      updateObject(dimension === 'width' ? 'scaleX' : 'scaleY', scale);
      setSize(prev => ({ ...prev, [dimension]: numValue }));
    }
  };

  const handleRotationChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setRotation(numValue);
    updateObject('angle', numValue);
  };

  const handleOpacityChange = (value: number[]) => {
    setOpacity(value[0]);
    updateObject('opacity', value[0] / 100);
  };

  if (!selectedObject) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        <div className="py-8">
          <p className="font-medium">No element selected</p>
          <p className="text-xs mt-1 text-slate-400">
            Click an element on the canvas to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const isLocked = selectedObject.lockMovementX && selectedObject.lockMovementY;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={duplicateSelected}
            className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100"
            title="Duplicate"
          >
            <IconCopy size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={deleteSelected}
            className="h-8 w-8 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <IconTrash size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLockSelected}
            className={`h-8 w-8 rounded-lg ${isLocked ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-100'}`}
            title={isLocked ? "Unlock" : "Lock"}
          >
            {isLocked ? <IconLock size={16} /> : <IconLockOpen size={16} />}
          </Button>
          <div className="w-px h-8 bg-slate-200 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={flipHorizontal}
            className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100"
            title="Flip Horizontal"
          >
            <IconFlipHorizontal size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={flipVertical}
            className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100"
            title="Flip Vertical"
          >
            <IconFlipVertical size={16} />
          </Button>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-slate-400 mb-1">X</div>
              <Input
                type="number"
                value={position.x}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="h-8 text-sm bg-slate-50 border-slate-200"
              />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Y</div>
              <Input
                type="number"
                value={position.y}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="h-8 text-sm bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-slate-400 mb-1">Width</div>
              <Input
                type="number"
                value={size.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                className="h-8 text-sm bg-slate-50 border-slate-200"
              />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Height</div>
              <Input
                type="number"
                value={size.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                className="h-8 text-sm bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rotation</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={rotation}
              onChange={(e) => handleRotationChange(e.target.value)}
              className="h-8 text-sm bg-slate-50 border-slate-200 w-20"
            />
            <span className="text-xs text-slate-400">degrees</span>
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Opacity</Label>
            <span className="text-xs text-slate-500">{opacity}%</span>
          </div>
          <Slider
            value={[opacity]}
            onValueChange={handleOpacityChange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Colors - only show for shapes, not images */}
        {selectedObject.type !== 'image' && (
          <>
            {/* Fill Color */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Fill Color</Label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => {
                      setFillColor(e.target.value);
                      updateObject('fill', e.target.value);
                    }}
                    className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
                  />
                </div>
                <Input
                  type="text"
                  value={fillColor}
                  onChange={(e) => {
                    setFillColor(e.target.value);
                    updateObject('fill', e.target.value);
                  }}
                  className="h-8 text-sm font-mono bg-slate-50 border-slate-200 flex-1"
                />
              </div>
            </div>

            {/* Stroke */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Stroke</Label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => {
                      setStrokeColor(e.target.value);
                      updateObject('stroke', e.target.value);
                    }}
                    className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
                  />
                </div>
                <Input
                  type="number"
                  value={strokeWidth}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setStrokeWidth(value);
                    updateObject('strokeWidth', value);
                  }}
                  className="h-8 text-sm bg-slate-50 border-slate-200 w-16"
                  min={0}
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
          </>
        )}

        {/* Layer Order */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Layer Order</Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={bringToFront}
              className="flex-1 h-8 text-xs"
            >
              Bring to Front
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sendToBack}
              className="flex-1 h-8 text-xs"
            >
              Send to Back
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
