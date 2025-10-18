import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage } from "fabric";
import { CanvasToolbar } from "./CanvasToolbar";
import { toast } from "sonner";

export const FabricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth - 320 - 32,
      height: window.innerHeight - 73 - 32,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 320 - 32,
        height: window.innerHeight - 73 - 32,
      });
    };

    window.addEventListener("resize", handleResize);

    // Listen for custom event to add icons to canvas
    const handleAddIcon = (event: CustomEvent) => {
      const { svgData } = event.detail;
      
      FabricImage.fromURL(svgData).then((img) => {
        img.scale(0.5);
        img.set({
          left: canvas.width! / 2 - (img.width! * 0.5) / 2,
          top: canvas.height! / 2 - (img.height! * 0.5) / 2,
        });
        canvas.add(img);
        canvas.renderAll();
      });
    };

    window.addEventListener("addIconToCanvas", handleAddIcon as EventListener);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("addIconToCanvas", handleAddIcon as EventListener);
      canvas.dispose();
    };
  }, []);

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast("Canvas cleared!");
  };

  const handleExport = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    const link = document.createElement("a");
    link.download = "science-illustration.png";
    link.href = dataURL;
    link.click();
    toast("Image exported successfully!");
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <CanvasToolbar onClear={handleClear} onExport={handleExport} />
      <div className="border border-border rounded-lg shadow-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
