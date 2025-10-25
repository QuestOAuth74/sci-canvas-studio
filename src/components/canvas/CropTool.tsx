import { useState, useEffect, useCallback, useRef } from "react";
import { Canvas as FabricCanvas, FabricImage, Group, Rect } from "fabric";
import { Button } from "@/components/ui/button";
import { Check, X, Square, Circle } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface CropToolProps {
  canvas: FabricCanvas;
  selectedObject: FabricImage | Group;
  onApply: (
    cropRect: { left: number; top: number; width: number; height: number }, 
    isCircular: boolean
  ) => void;
  onCancel: () => void;
}

export const CropTool = ({ canvas, selectedObject, onApply, onCancel }: CropToolProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cropRect, setCropRect] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageBounds, setImageBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [isCircular, setIsCircular] = useState(false);

  // Initialize crop rectangle to match image bounds
  useEffect(() => {
    if (!selectedObject || !canvas) return;

    const bounds = selectedObject.getBoundingRect();
    const canvasEl = canvas.getElement();
    const rect = canvasEl.getBoundingClientRect();
    
    // Get the canvas zoom and viewport transform
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

    // Calculate image bounds in viewport coordinates
    const imgBounds = {
      left: (bounds.left * zoom + vpt[4]) + rect.left,
      top: (bounds.top * zoom + vpt[5]) + rect.top,
      width: bounds.width * zoom,
      height: bounds.height * zoom
    };

    setImageBounds(imgBounds);
    setCropRect(imgBounds);
  }, [selectedObject, canvas]);

  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setResizeHandle(handle || null);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCropRect(prev => {
      let newRect = { ...prev };

      if (resizeHandle) {
        // Resizing
        switch (resizeHandle) {
          case 'tl':
            newRect = {
              left: Math.max(imageBounds.left, Math.min(prev.left + deltaX, prev.left + prev.width - 10)),
              top: Math.max(imageBounds.top, Math.min(prev.top + deltaY, prev.top + prev.height - 10)),
              width: Math.max(10, prev.width - deltaX),
              height: Math.max(10, prev.height - deltaY)
            };
            break;
          case 'tr':
            newRect = {
              ...prev,
              top: Math.max(imageBounds.top, Math.min(prev.top + deltaY, prev.top + prev.height - 10)),
              width: Math.max(10, Math.min(prev.width + deltaX, imageBounds.left + imageBounds.width - prev.left)),
              height: Math.max(10, prev.height - deltaY)
            };
            break;
          case 'bl':
            newRect = {
              left: Math.max(imageBounds.left, Math.min(prev.left + deltaX, prev.left + prev.width - 10)),
              top: prev.top,
              width: Math.max(10, prev.width - deltaX),
              height: Math.max(10, Math.min(prev.height + deltaY, imageBounds.top + imageBounds.height - prev.top))
            };
            break;
          case 'br':
            newRect = {
              ...prev,
              width: Math.max(10, Math.min(prev.width + deltaX, imageBounds.left + imageBounds.width - prev.left)),
              height: Math.max(10, Math.min(prev.height + deltaY, imageBounds.top + imageBounds.height - prev.top))
            };
            break;
          case 't':
            newRect = {
              ...prev,
              top: Math.max(imageBounds.top, Math.min(prev.top + deltaY, prev.top + prev.height - 10)),
              height: Math.max(10, prev.height - deltaY)
            };
            break;
          case 'r':
            newRect = {
              ...prev,
              width: Math.max(10, Math.min(prev.width + deltaX, imageBounds.left + imageBounds.width - prev.left))
            };
            break;
          case 'b':
            newRect = {
              ...prev,
              height: Math.max(10, Math.min(prev.height + deltaY, imageBounds.top + imageBounds.height - prev.top))
            };
            break;
          case 'l':
            newRect = {
              left: Math.max(imageBounds.left, Math.min(prev.left + deltaX, prev.left + prev.width - 10)),
              top: prev.top,
              width: Math.max(10, prev.width - deltaX),
              height: prev.height
            };
            break;
        }
      } else {
        // Dragging
        newRect = {
          left: Math.max(imageBounds.left, Math.min(prev.left + deltaX, imageBounds.left + imageBounds.width - prev.width)),
          top: Math.max(imageBounds.top, Math.min(prev.top + deltaY, imageBounds.top + imageBounds.height - prev.height)),
          width: prev.width,
          height: prev.height
        };
      }

      return newRect;
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, resizeHandle, dragStart, imageBounds]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);


  const handleApply = () => {
    // Convert viewport coordinates back to canvas coordinates
    const canvasEl = canvas.getElement();
    const rect = canvasEl.getBoundingClientRect();
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

    const canvasCropRect = {
      left: (cropRect.left - rect.left - vpt[4]) / zoom,
      top: (cropRect.top - rect.top - vpt[5]) / zoom,
      width: cropRect.width / zoom,
      height: cropRect.height / zoom
    };

    onApply(canvasCropRect, isCircular);
  };

  const dimensions = `${Math.round(cropRect.width / canvas.getZoom())} × ${Math.round(cropRect.height / canvas.getZoom())} px`;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50"
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

    {/* Action buttons - moved to top left */}
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-50">
      <div className="glass-effect px-4 py-2 rounded-lg text-sm font-medium">
        Crop {selectedObject.type === 'image' ? 'Image' : 'Icon'}: {dimensions}
      </div>
      
      {/* Shape selector */}
      <div className="glass-effect p-1 rounded-lg flex gap-1">
        <Toggle
          pressed={!isCircular}
          onPressedChange={() => setIsCircular(false)}
          size="sm"
          aria-label="Rectangle crop"
        >
          <Square className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={isCircular}
          onPressedChange={() => setIsCircular(true)}
          size="sm"
          aria-label="Circle crop"
        >
          <Circle className="h-4 w-4" />
        </Toggle>
      </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleApply}
            size="sm"
            className="shadow-lg flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            Apply
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="shadow-lg"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>


      {/* Crop rectangle */}
      <div
        className="absolute border-2 border-primary"
      style={{
        left: cropRect.left,
        top: cropRect.top,
        width: cropRect.width,
        height: cropRect.height,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        cursor: 'move',
        borderRadius: isCircular ? '50%' : '0'
      }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {/* Corner handles */}
        {['tl', 'tr', 'bl', 'br'].map(handle => (
          <div
            key={handle}
            className="absolute w-3 h-3 bg-primary border-2 border-background rounded-full"
            style={{
              ...(handle.includes('t') ? { top: -6 } : { bottom: -6 }),
              ...(handle.includes('l') ? { left: -6 } : { right: -6 }),
              cursor: `${handle.includes('t') ? 'n' : 's'}${handle.includes('l') ? 'w' : 'e'}-resize`
            }}
            onMouseDown={(e) => handleMouseDown(e, handle)}
          />
        ))}

        {/* Edge handles */}
        {['t', 'r', 'b', 'l'].map(handle => (
          <div
            key={handle}
            className="absolute bg-primary"
            style={{
              ...(handle === 't' || handle === 'b' 
                ? { 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    width: 20, 
                    height: 8,
                    ...(handle === 't' ? { top: -4 } : { bottom: -4 }),
                    cursor: 'ns-resize'
                  }
                : {
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 8,
                    height: 20,
                    ...(handle === 'l' ? { left: -4 } : { right: -4 }),
                    cursor: 'ew-resize'
                  }
              )
            }}
            onMouseDown={(e) => handleMouseDown(e, handle)}
          />
        ))}
      </div>
    </div>
  );
};
