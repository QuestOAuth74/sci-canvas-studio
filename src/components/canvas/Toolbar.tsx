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
  Clock,
  FileText,
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

import { PowerPointGenerator } from "./PowerPointGenerator";
import { useRecentlyUsedTools } from "@/hooks/useRecentlyUsedTools";
import { useEffect, useState } from "react";

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export const Toolbar = ({ activeTool, onToolChange }: ToolbarProps) => {
  const { canvas, selectedObject, setCropMode, setSelectedObject } = useCanvas();
  const { recentTools, addRecentTool } = useRecentlyUsedTools();
  const [powerpointOpen, setPowerpointOpen] = useState(false);
  
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select and Transform (1)" },
    { id: "pen", icon: PenTool, label: "Draw Bezier Curves (B)" },
    { id: "freeform-line", icon: Spline, label: "Freeform Curved Line (F)" },
  ];

  // Map tool IDs to their icons and labels for recent tools
  const toolIconMap: Record<string, { icon: any; label: string }> = {
    "pen": { icon: PenTool, label: "Bezier Curves" },
    "freeform-line": { icon: Spline, label: "Freeform Line" },
    "text": { icon: Type, label: "Text" },
    "image": { icon: Image, label: "Image" },
    "eraser": { icon: Eraser, label: "Eraser" },
  };
  
  const isImageSelected = selectedObject && selectedObject.type === 'image';

  // Track tool usage
  useEffect(() => {
    if (activeTool && activeTool !== 'select') {
      addRecentTool(activeTool);
    }
  }, [activeTool, addRecentTool]);

  const handleToolChange = (toolId: string) => {
    onToolChange(toolId);
  };

  return (
    <div className="flex flex-col gap-1 p-2 bg-gradient-to-b from-background via-muted/20 to-background border-r-2 border-primary/10 shadow-2xl">
      {/* Recently Used Section */}
      {recentTools.length > 0 && (
        <>
          <div className="px-2 py-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-wider flex items-center gap-1.5 bg-primary/5 rounded-md mb-1">
            <Clock className="h-3 w-3" />
            Recent
          </div>
          {recentTools.slice(0, 3).map((toolId) => {
            const toolInfo = toolIconMap[toolId];
            if (!toolInfo) return null;
            
            return (
              <Tooltip key={`recent-${toolId}`}>
                <TooltipTrigger asChild>
              <Button
                variant={activeTool === toolId ? "default" : "ghost"}
                size="icon"
                onClick={() => handleToolChange(toolId)}
                className={`w-10 h-10 relative rounded-lg border transition-all duration-300 ease-out ${
                  activeTool === toolId 
                    ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg scale-105 border-primary/40' 
                    : 'border-border/40 hover:border-primary/40 hover:shadow-lg hover:scale-110'
                }`}
              >
                    <toolInfo.icon className="h-5 w-5" />
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-primary to-primary/60" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{toolInfo.label} (Recent)</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          <Separator className="my-1" />
        </>
      )}

      {/* Selection & Drawing Section */}
      <div className="px-2 py-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-wider bg-primary/5 rounded-md mb-1">
        Drawing
      </div>
      {tools.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === tool.id ? "default" : "ghost"}
              size="icon"
              onClick={() => handleToolChange(tool.id)}
              className={`w-10 h-10 rounded-lg border transition-all duration-300 ease-out ${
                activeTool === tool.id 
                  ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg scale-105 border-primary/40' 
                  : 'border-border/40 hover:border-primary/40 hover:shadow-lg hover:scale-110'
              }`}
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
      
      {/* Shapes Section */}
      <div className="px-2 py-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-wider bg-primary/5 rounded-md mb-1" data-onboarding="shapes-dropdown">
        Shapes
      </div>
      
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
      
      <Separator className="my-1" />
      
      {/* Lines Section */}
      <div className="px-2 py-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-wider bg-primary/5 rounded-md mb-1" data-onboarding="lines-section">
        Lines
      </div>
      
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
            <OrthogonalLineTool onLineSelect={handleToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Orthogonal Lines (90° Bends)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <CurvedLineTool onLineSelect={handleToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Curved Lines (Adjustable)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <ConnectorTool onConnectorSelect={handleToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Smart Connectors</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <ZoomCalloutTool onCalloutSelect={handleToolChange} activeTool={activeTool} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Zoom Callouts (Highlight Tool)</p>
        </TooltipContent>
      </Tooltip>
      
      
      <Separator className="my-1" />
      
      {/* Tools Section */}
      <div className="px-2 py-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-wider bg-primary/5 rounded-md mb-1">
        Tools
      </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "text" ? "default" : "ghost"}
            size="icon"
            onClick={() => handleToolChange("text")}
            className="w-10 h-10"
          >
            <Type className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Create Text (2)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "image" ? "default" : "ghost"}
            size="icon"
            onClick={() => handleToolChange("image")}
            className="w-10 h-10"
          >
            <Image className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Insert Image (8)</p>
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
            onClick={() => handleToolChange("eraser")}
            className="w-10 h-10"
          >
            <Eraser className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Eraser (9)</p>
        </TooltipContent>
      </Tooltip>

      <Separator className="my-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPowerpointOpen(true)}
            className="w-10 h-10"
          >
            <FileText className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Generate PowerPoint</p>
        </TooltipContent>
      </Tooltip>

      <PowerPointGenerator 
        open={powerpointOpen} 
        onOpenChange={setPowerpointOpen} 
      />
    </div>
  );
};
