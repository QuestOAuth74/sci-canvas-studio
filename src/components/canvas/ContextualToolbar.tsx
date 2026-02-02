import { useCanvas } from "@/contexts/CanvasContext";
import { TextFormattingPanel } from "./TextFormattingPanel";
import { LinePropertiesPanel } from "./LinePropertiesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Copy, Trash2, GripVertical, FlipHorizontal, FlipVertical,
  RotateCw, Lock, Unlock, Palette
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { throttle } from "@/lib/performanceUtils";

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
];

export const ContextualToolbar = () => {
  const { selectedObject, canvas } = useCanvas();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 72 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(100);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [aspectLocked, setAspectLocked] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);

  // Sync state with selected object
  useEffect(() => {
    if (selectedObject) {
      setOpacity((selectedObject.opacity || 1) * 100);
      const w = (selectedObject.width || 0) * (selectedObject.scaleX || 1);
      const h = (selectedObject.height || 0) * (selectedObject.scaleY || 1);
      setDimensions({ width: Math.round(w), height: Math.round(h) });
      if (h > 0) setAspectRatio(w / h);
    }
  }, [selectedObject]);

  // Load saved position from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('contextualToolbarPosition');
    if (saved) {
      const savedPos = JSON.parse(saved);
      setPosition(savedPos);
    } else {
      const centerX = Math.max(0, window.innerWidth / 2 - 400);
      setPosition({ x: centerX, y: 72 });
    }
  }, []);

  // Handle dragging with performance optimization
  useEffect(() => {
    if (!isDragging) return;

    const toolbarWidth = toolbarRef.current?.offsetWidth || 800;
    const toolbarHeight = toolbarRef.current?.offsetHeight || 60;

    const handleMouseMove = throttle((e: MouseEvent) => {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      newX = Math.max(0, Math.min(newX, window.innerWidth - toolbarWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - toolbarHeight));

      setPosition({ x: newX, y: newY });
    }, 16);

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('contextualToolbarPosition', JSON.stringify(position));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = toolbarRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  // Compute derived values before hooks
  const objectType = selectedObject?.type;
  const isTextObject = objectType === "textbox" || objectType === "text";
  const isConnector = (selectedObject as any)?.data?.isConnector === true;
  const isShape = ["rect", "circle", "ellipse", "triangle", "polygon"].includes(objectType || "");
  const isImage = objectType === "image";
  const isGroup = objectType === "group" || objectType === "activeSelection";
  const isIcon = isGroup || isImage;

  // Memoize child components
  const textControls = useMemo(() => {
    if (!isTextObject) return null;
    return (
      <>
        <TextFormattingPanel />
        <Separator orientation="vertical" className="h-8 bg-black" />
      </>
    );
  }, [isTextObject, selectedObject]);

  const lineControls = useMemo(() => {
    if (!isConnector) return null;
    return (
      <>
        <LinePropertiesPanel />
        <Separator orientation="vertical" className="h-8 bg-black" />
      </>
    );
  }, [isConnector, selectedObject]);

  // Early returns after hooks
  if (!selectedObject) {
    return null;
  }

  if ((selectedObject as any).isControlHandle || (selectedObject as any).isHandleLine) {
    return null;
  }

  const handleDelete = () => {
    if (canvas && selectedObject) {
      canvas.remove(selectedObject);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  const handleDuplicate = () => {
    if (!canvas || !selectedObject) return;

    (selectedObject as any).clone().then((cloned: any) => {
      cloned.set({
        left: (selectedObject.left || 0) + 20,
        top: (selectedObject.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  };

  const handleOpacityChange = (value: number[]) => {
    if (!selectedObject || !canvas) return;
    const newOpacity = value[0];
    setOpacity(newOpacity);
    selectedObject.set({ opacity: newOpacity / 100 });
    canvas.requestRenderAll();
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedObject || !canvas) return;
    const newWidth = parseInt(e.target.value) || 0;
    const currentWidth = (selectedObject.width || 1) * (selectedObject.scaleX || 1);
    const newScaleX = newWidth / (selectedObject.width || 1);

    if (aspectLocked) {
      const newHeight = newWidth / aspectRatio;
      const newScaleY = newHeight / (selectedObject.height || 1);
      selectedObject.set({ scaleX: newScaleX, scaleY: newScaleY });
      setDimensions({ width: newWidth, height: Math.round(newHeight) });
    } else {
      selectedObject.set({ scaleX: newScaleX });
      setDimensions(prev => ({ ...prev, width: newWidth }));
    }
    canvas.requestRenderAll();
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedObject || !canvas) return;
    const newHeight = parseInt(e.target.value) || 0;
    const newScaleY = newHeight / (selectedObject.height || 1);

    if (aspectLocked) {
      const newWidth = newHeight * aspectRatio;
      const newScaleX = newWidth / (selectedObject.width || 1);
      selectedObject.set({ scaleX: newScaleX, scaleY: newScaleY });
      setDimensions({ width: Math.round(newWidth), height: newHeight });
    } else {
      selectedObject.set({ scaleY: newScaleY });
      setDimensions(prev => ({ ...prev, height: newHeight }));
    }
    canvas.requestRenderAll();
  };

  const handleFlipHorizontal = () => {
    if (!selectedObject || !canvas) return;
    selectedObject.set({ flipX: !selectedObject.flipX });
    canvas.requestRenderAll();
  };

  const handleFlipVertical = () => {
    if (!selectedObject || !canvas) return;
    selectedObject.set({ flipY: !selectedObject.flipY });
    canvas.requestRenderAll();
  };

  const handleRotate90 = () => {
    if (!selectedObject || !canvas) return;
    const currentAngle = selectedObject.angle || 0;
    selectedObject.rotate(currentAngle + 90);
    canvas.requestRenderAll();
  };

  const applyColorToGroup = (color: string) => {
    if (!selectedObject || !canvas) return;

    if (isGroup && (selectedObject as any)._objects) {
      (selectedObject as any)._objects.forEach((obj: any) => {
        if (obj.fill && obj.fill !== 'none' && obj.fill !== 'transparent') {
          obj.set({ fill: color });
        }
      });
    } else if (selectedObject.fill && selectedObject.fill !== 'none') {
      selectedObject.set({ fill: color });
    }
    canvas.requestRenderAll();
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed z-40 bg-white border-3 border-black brutal-shadow p-3 flex items-center gap-3"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'opacity 0.3s',
        cursor: isDragging ? 'grabbing' : 'default',
        willChange: 'transform',
      }}
    >
      {/* Drag Handle */}
      <div
        className="drag-handle cursor-grab active:cursor-grabbing hover:bg-secondary px-1 py-2 -ml-1 flex items-center transition-colors"
        onMouseDown={handleMouseDown}
        title="Drag to reposition"
      >
        <GripVertical className="h-4 w-4 text-black" />
      </div>

      <Separator orientation="vertical" className="h-8 bg-black w-[2px]" />

      {/* Text Controls */}
      {textControls}

      {/* Line/Connector Controls */}
      {lineControls}

      {/* Shape Controls */}
      {isShape && (
        <>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-bold">Fill</Label>
            <Input
              type="color"
              value={(selectedObject.fill as string) || "#000000"}
              onChange={(e) => {
                if (!canvas) return;
                selectedObject.set({ fill: e.target.value });
                canvas.requestRenderAll();
              }}
              className="w-10 h-8 p-0 border-2 border-black cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-bold">Stroke</Label>
            <Input
              type="color"
              value={(selectedObject.stroke as string) || "#000000"}
              onChange={(e) => {
                if (!canvas) return;
                selectedObject.set({ stroke: e.target.value });
                canvas.requestRenderAll();
              }}
              className="w-10 h-8 p-0 border-2 border-black cursor-pointer"
            />
          </div>
          <Separator orientation="vertical" className="h-8 bg-black w-[2px]" />
        </>
      )}

      {/* Icon/Group Quick Edit Controls */}
      {isIcon && (
        <>
          {/* Size Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Label className="text-xs font-bold w-6">W</Label>
              <Input
                type="number"
                value={dimensions.width}
                onChange={handleWidthChange}
                className="w-16 h-8 text-xs px-2 border-2 border-black"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAspectLocked(!aspectLocked)}
              className="h-8 w-8 p-0 hover:bg-secondary"
              title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {aspectLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </Button>
            <div className="flex items-center gap-1">
              <Label className="text-xs font-bold w-6">H</Label>
              <Input
                type="number"
                value={dimensions.height}
                onChange={handleHeightChange}
                className="w-16 h-8 text-xs px-2 border-2 border-black"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 bg-black w-[2px]" />

          {/* Color Presets */}
          <div className="flex items-center gap-1">
            <Palette className="h-4 w-4 text-black mr-1" />
            <div className="flex gap-0.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => applyColorToGroup(color)}
                  className="w-5 h-5 border-2 border-black hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 bg-black w-[2px]" />

          {/* Transform Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlipHorizontal}
              className="h-8 w-8 p-0 hover:bg-secondary"
              title="Flip horizontal"
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlipVertical}
              className="h-8 w-8 p-0 hover:bg-secondary"
              title="Flip vertical"
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate90}
              className="h-8 w-8 p-0 hover:bg-secondary"
              title="Rotate 90°"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 bg-black w-[2px]" />
        </>
      )}

      {/* Opacity Control - All Objects */}
      <div className="flex items-center gap-2">
        <Label className="text-xs font-bold whitespace-nowrap">Opacity</Label>
        <Slider
          value={[opacity]}
          onValueChange={handleOpacityChange}
          max={100}
          min={0}
          step={1}
          className="w-20"
        />
        <span className="text-xs font-bold w-8 text-right">
          {Math.round(opacity)}%
        </span>
      </div>

      <Separator orientation="vertical" className="h-8 bg-black w-[2px]" />

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          className="h-8 w-8 p-0 hover:bg-secondary"
          title="Duplicate"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-8 w-8 p-0 hover:bg-black hover:text-white"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
