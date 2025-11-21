import { useCanvas } from "@/contexts/CanvasContext";
import { TextFormattingPanel } from "./TextFormattingPanel";
import { LinePropertiesPanel } from "./LinePropertiesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Copy, Trash2, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const ContextualToolbar = () => {
  const { selectedObject, canvas } = useCanvas();
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const [position, setPosition] = useState({ x: 0, y: 72 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load saved position from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('contextualToolbarPosition');
    if (saved) {
      const savedPos = JSON.parse(saved);
      setPosition(savedPos);
    } else {
      // Default centered position
      const centerX = Math.max(0, window.innerWidth / 2 - 400);
      setPosition({ x: centerX, y: 72 });
    }
  }, []);

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const toolbarWidth = toolbarRef.current?.offsetWidth || 800;
      const toolbarHeight = toolbarRef.current?.offsetHeight || 60;

      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - toolbarWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - toolbarHeight));

      setPosition({ x: newX, y: newY });
    };

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

  if (!selectedObject) {
    return null;
  }

  // Don't show toolbar for control handles or guide lines
  if ((selectedObject as any).isControlHandle || (selectedObject as any).isHandleLine) {
    return null;
  }

  const objectType = selectedObject.type;
  const isTextObject = objectType === "textbox" || objectType === "text";
  const isConnector = (selectedObject as any).data?.isConnector === true;
  const isShape = ["rect", "circle", "ellipse", "triangle", "polygon"].includes(objectType || "");
  const isImage = objectType === "image";
  const isGroup = objectType === "group" || objectType === "activeSelection";

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
    selectedObject.set({ opacity: value[0] / 100 });
    canvas.requestRenderAll();
  };

  return (
    <div 
      ref={toolbarRef}
      className="fixed z-40 glass-effect-premium rounded-lg shadow-lg hover:shadow-xl p-3 flex items-center gap-4 max-w-5xl transition-all duration-300"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: isDragging 
          ? '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.3)' 
          : undefined
      }}
    >
      {/* Drag Handle */}
      <div 
        className="drag-handle cursor-grab active:cursor-grabbing hover:bg-primary/10 rounded px-1 py-2 -ml-1 flex items-center transition-all duration-200"
        onMouseDown={handleMouseDown}
        title="Drag to reposition"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
      </div>
      
      <Separator orientation="vertical" className="h-8" />
      {/* Text Controls */}
      {isTextObject && (
        <>
          <TextFormattingPanel />
          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      {/* Line/Connector Controls */}
      {isConnector && (
        <>
          <LinePropertiesPanel />
          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      {/* Shape Controls */}
      {isShape && (
        <>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Fill</Label>
            <Input
              type="color"
              value={(selectedObject.fill as string) || "#000000"}
              onChange={(e) => {
                if (!canvas) return;
                selectedObject.set({ fill: e.target.value });
                canvas.requestRenderAll();
              }}
              className="w-12 h-8 p-0 border-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Stroke</Label>
            <Input
              type="color"
              value={(selectedObject.stroke as string) || "#000000"}
              onChange={(e) => {
                if (!canvas) return;
                selectedObject.set({ stroke: e.target.value });
                canvas.requestRenderAll();
              }}
              className="w-12 h-8 p-0 border-0"
            />
          </div>
          <Separator orientation="vertical" className="h-8" />
        </>
      )}

      {/* Common Controls for all objects */}
      <div className="flex items-center gap-2">
        <Label className="text-xs whitespace-nowrap">Opacity</Label>
        <Slider
          value={[(selectedObject.opacity || 1) * 100]}
          onValueChange={handleOpacityChange}
          max={100}
          min={0}
          step={1}
          className="w-24"
        />
        <span className="text-xs text-muted-foreground w-8">
          {Math.round((selectedObject.opacity || 1) * 100)}%
        </span>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          className="h-8 px-2"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-8 px-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
