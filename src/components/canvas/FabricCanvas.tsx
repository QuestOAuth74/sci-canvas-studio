import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Rect, Circle, Line, Textbox, Polygon } from "fabric";
import { toast } from "sonner";

interface FabricCanvasProps {
  activeTool: string;
}

export const FabricCanvas = ({ activeTool }: FabricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth - 128,
      height: window.innerHeight - 145,
      backgroundColor: "#ffffff",
    });

    canvas.isDrawingMode = false;
    setFabricCanvas(canvas);

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 128,
        height: window.innerHeight - 145,
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

  // Handle tool changes
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCanvasClick = (e: any) => {
      if (activeTool === "select") return;

      const pointer = fabricCanvas.getPointer(e.e);
      
      switch (activeTool) {
        case "rectangle":
          const rect = new Rect({
            left: pointer.x - 50,
            top: pointer.y - 50,
            width: 100,
            height: 100,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          fabricCanvas.add(rect);
          break;
          
        case "circle":
          const circle = new Circle({
            left: pointer.x - 50,
            top: pointer.y - 50,
            radius: 50,
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          fabricCanvas.add(circle);
          break;
          
        case "star":
          const starPoints = [];
          const outerRadius = 50;
          const innerRadius = 25;
          for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            starPoints.push({
              x: pointer.x + radius * Math.cos(angle),
              y: pointer.y + radius * Math.sin(angle),
            });
          }
          const star = new Polygon(starPoints, {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 2,
          });
          fabricCanvas.add(star);
          break;
          
        case "text":
          const text = new Textbox("Text", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 24,
            fill: "#000000",
          });
          fabricCanvas.add(text);
          break;
          
        case "line":
          const line = new Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
            stroke: "#000000",
            strokeWidth: 2,
          });
          fabricCanvas.add(line);
          break;
      }
      
      fabricCanvas.renderAll();
    };

    if (activeTool !== "select") {
      fabricCanvas.on("mouse:down", handleCanvasClick);
    }

    return () => {
      fabricCanvas.off("mouse:down", handleCanvasClick);
    };
  }, [fabricCanvas, activeTool]);

  return (
    <div className="flex-1 overflow-hidden bg-muted/20">
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="border-2 border-border shadow-2xl bg-white">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};
