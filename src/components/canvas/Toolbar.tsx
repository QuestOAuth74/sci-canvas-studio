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
  ImagePlus,
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
import { useImagePlaceholder } from "./ImagePlaceholderTool";

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export const Toolbar = ({ activeTool, onToolChange }: ToolbarProps) => {
  const { canvas, selectedObject, setCropMode, setSelectedObject } = useCanvas();
  const { recentTools, addRecentTool } = useRecentlyUsedTools();
  const [powerpointOpen, setPowerpointOpen] = useState(false);
  const { addImagePlaceholder } = useImagePlaceholder();
  
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
    <div className="h-full flex flex-col bg-[hsl(var(--cream))]/95 border-r-2 border-[hsl(var(--pencil-gray))] shadow-lg backdrop-blur-sm overflow-y-auto min-h-0 notebook-sidebar ruled-lines">
      {/* Spiral binding decoration */}
      <div className="spiral-binding">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="spiral-hole" />
        ))}
      </div>
      
      <div className="flex-1 flex flex-col gap-1 p-1.5 pl-8 overflow-y-auto">
        {/* Recently Used Section */}
        {recentTools.length > 0 && (
          <>
            <div className="notebook-section-header px-2 mb-2 flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
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
                    ? 'canvas-tool-button-active' 
                    : 'canvas-tool-button'
                }`}
              >
                    <toolInfo.icon className="h-5 w-5" />
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[hsl(var(--canvas-accent-primary))] to-[hsl(var(--canvas-accent-secondary))]" />
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
        <div className="notebook-section-header px-2 mb-2">
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
                  ? 'canvas-tool-button-active' 
                  : 'canvas-tool-button'
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
        <div className="notebook-section-header px-2 mb-2" data-onboarding="shapes-dropdown">
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
        <div className="notebook-section-header px-2 mb-2" data-onboarding="lines-section">
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
        <div className="notebook-section-header px-2 mb-2">
          Tools
        </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool === "text" ? "default" : "ghost"}
            size="icon"
            onClick={() => handleToolChange("text")}
            className="w-10 h-10"
            data-tool="text"
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
              addImagePlaceholder();
              onToolChange("select");
            }}
            className="w-10 h-10"
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Image Placeholder</p>
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
    </div>
  );
};
