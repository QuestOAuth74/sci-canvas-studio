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
import { ShapesDropdown } from "./ShapesDropdown";
import { ConnectorTool } from "./ConnectorTool";

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export const Toolbar = ({ activeTool, onToolChange }: ToolbarProps) => {
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select and Transform (S)" },
    { id: "pen", icon: PenTool, label: "Draw Bezier Curves (B)" },
    { id: "freeform-line", icon: Spline, label: "Freeform Curved Line (F)" },
  ];

  return (
    <div className="flex flex-col gap-1 p-2 border-r bg-card">
      {tools.map((tool) => (
        <Tooltip key={tool.id}>
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
      ))}
      
      <Separator className="my-1" />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <ShapesDropdown onShapeSelect={onToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Shapes</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <ConnectorTool onConnectorSelect={onToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Smart Connectors</p>
        </TooltipContent>
      </Tooltip>
      
      <Separator className="my-1" />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "text" ? "default" : "ghost"}
            size="icon"
            onClick={() => onToolChange("text")}
            className="w-10 h-10"
          >
            <Type className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Create Text (T)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "image" ? "default" : "ghost"}
            size="icon"
            onClick={() => onToolChange("image")}
            className="w-10 h-10"
          >
            <Image className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Insert Image (I)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "eraser" ? "default" : "ghost"}
            size="icon"
            onClick={() => onToolChange("eraser")}
            className="w-10 h-10"
          >
            <Eraser className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Eraser (E)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
