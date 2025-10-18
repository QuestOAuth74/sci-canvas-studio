import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MousePointer2,
  Square,
  Circle,
  Triangle,
  Minus,
  Type,
  PenTool,
  Eraser,
  Image,
  Star,
  Hexagon,
  Spline,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export const Toolbar = ({ activeTool, onToolChange }: ToolbarProps) => {
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select and Transform (S)" },
    { id: "pen", icon: PenTool, label: "Draw Bezier Curves (B)" },
    { id: "freeform-line", icon: Spline, label: "Freeform Curved Line (F)" },
    { id: "rectangle", icon: Square, label: "Create Rectangles (R)" },
    { id: "circle", icon: Circle, label: "Create Circles (C)" },
    { id: "star", icon: Star, label: "Create Stars (A)" },
    { id: "polygon", icon: Hexagon, label: "Create Polygons (P)" },
    { id: "line", icon: Minus, label: "Draw Lines (L)" },
    { id: "text", icon: Type, label: "Create Text (T)" },
    { id: "image", icon: Image, label: "Insert Image (I)" },
    { id: "eraser", icon: Eraser, label: "Eraser (E)" },
  ];

  return (
    <div className="flex flex-col gap-1 p-2 border-r bg-card">
      {tools.map((tool, index) => (
        <div key={tool.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="icon"
                onClick={() => onToolChange(tool.id)}
                className="w-10 h-10"
              >
                <tool.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
          {(index === 2 || index === 7 || index === 9) && (
            <Separator className="my-1" />
          )}
        </div>
      ))}
    </div>
  );
};
