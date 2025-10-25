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
  Crop,
} from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShapesDropdown } from "./ShapesDropdown";
import { ShapesWithTextDropdown } from "./ShapesWithTextDropdown";
import { ConnectorTool } from "./ConnectorTool";
import { StraightLineTool } from "./StraightLineTool";
import { OrthogonalLineTool } from "./OrthogonalLineTool";
import { CurvedLineTool } from "./CurvedLineTool";
import { ZoomCalloutTool } from "./ZoomCalloutTool";

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export const Toolbar = ({ activeTool, onToolChange }: ToolbarProps) => {
  const { canvas, selectedObject, setCropMode, setSelectedObject } = useCanvas();
  
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select and Transform (S)" },
    { id: "pen", icon: PenTool, label: "Draw Bezier Curves (B)" },
    { id: "freeform-line", icon: Spline, label: "Freeform Curved Line (F)" },
  ];
  
  const isImageSelected = selectedObject && selectedObject.type === 'image';

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
            <ShapesWithTextDropdown onShapeSelect={onToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Labeled Shapes</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <StraightLineTool onLineSelect={onToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Straight Lines (L)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <OrthogonalLineTool onLineSelect={onToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Orthogonal Lines (90° Bends)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <CurvedLineTool onLineSelect={onToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Curved Lines (Adjustable)</p>
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
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <ZoomCalloutTool onCalloutSelect={onToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Zoom Callouts (Highlight Tool)</p>
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
            variant="ghost"
            size="icon"
            onClick={() => {
              // Check if selected object is an image or group (SVG icon)
              const isImageOrIcon = selectedObject && 
                (selectedObject.type === 'image' || selectedObject.type === 'group');
              
              if (!isImageOrIcon) {
                // Fallback: check canvas directly
                const activeObject = canvas?.getActiveObject();
                if (activeObject && (activeObject.type === 'image' || activeObject.type === 'group')) {
                  setSelectedObject(activeObject);
                  setCropMode(true);
                } else {
                  toast.error("Please select an image or icon first");
                }
              } else {
                setCropMode(true);
              }
            }}
            className="w-10 h-10"
            disabled={!(selectedObject && (selectedObject.type === 'image' || selectedObject.type === 'group'))}
          >
            <Crop className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Crop Image/Icon (C)</p>
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
