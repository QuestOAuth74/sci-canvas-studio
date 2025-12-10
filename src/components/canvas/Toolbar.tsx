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
  Waves,
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
import { MembraneBrushIconSelector } from "./MembraneBrushIconSelector";

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

// Section label component for visual grouping
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-1 py-1">
    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </span>
  </div>
);

export const Toolbar = ({ activeTool, onToolChange }: ToolbarProps) => {
  const { canvas, selectedObject, setCropMode, setSelectedObject } = useCanvas();
  const { recentTools, addRecentTool } = useRecentlyUsedTools();
  const [powerpointOpen, setPowerpointOpen] = useState(false);
  const { addImagePlaceholder } = useImagePlaceholder();
  const [membraneBrushOpen, setMembraneBrushOpen] = useState(false);
  
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

  const toolButtonBase = "w-9 h-9 rounded-md transition-all duration-150 hover:scale-105";
  const toolButtonActive = `${toolButtonBase} bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30`;
  const toolButtonInactive = `${toolButtonBase} text-muted-foreground hover:text-foreground hover:bg-blue-200/60 hover:shadow-sm`;

  return (
    <div className="h-full flex flex-col bg-blue-100/60 border-r border-blue-200/80 overflow-y-auto min-h-0 w-14">
      <div className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1.5 overflow-y-auto">
        
        {/* Draw Section */}
        <SectionLabel>Draw</SectionLabel>
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToolChange(tool.id)}
                className={activeTool === tool.id ? toolButtonActive : toolButtonInactive}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-medium">
              <div className="flex flex-col">
                <span>{tool.label.split(' (')[0]}</span>
                <span className="text-muted-foreground text-[10px]">
                  {tool.label.includes('(') ? `(${tool.label.split('(')[1]}` : ''}
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="w-8 h-px bg-blue-300/50 my-1.5" />

        {/* Shapes Section */}
        <SectionLabel>Shapes</SectionLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <div data-onboarding="shapes-dropdown">
              <ShapesDropdown onShapeSelect={onToolChange} activeTool={activeTool} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">Basic Shapes</TooltipContent>
        </Tooltip>
        
        <ShapesWithTextDropdown onShapeSelect={onToolChange} activeTool={activeTool} />

        <div className="w-8 h-px bg-blue-300/50 my-1.5" />

        {/* Lines Section */}
        <SectionLabel>Lines</SectionLabel>
        <div data-onboarding="lines-section">
          <StraightLineTool onLineSelect={onToolChange} activeTool={activeTool} />
        </div>
        <OrthogonalLineTool onLineSelect={handleToolChange} activeTool={activeTool} />
        <CurvedLineTool onLineSelect={handleToolChange} activeTool={activeTool} />
        <ConnectorTool onConnectorSelect={handleToolChange} activeTool={activeTool} />
        <ZoomCalloutTool onCalloutSelect={handleToolChange} activeTool={activeTool} />

        <div className="w-8 h-px bg-blue-300/50 my-1.5" />

        {/* Content Section */}
        <SectionLabel>Content</SectionLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToolChange("text")}
              className={activeTool === "text" ? toolButtonActive : toolButtonInactive}
              data-tool="text"
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            <div className="flex flex-col">
              <span>Text</span>
              <span className="text-muted-foreground text-[10px]">(T)</span>
            </div>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMembraneBrushOpen(true)}
              className={activeTool.startsWith("membrane-brush") ? toolButtonActive : toolButtonInactive}
            >
              <Waves className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">Membrane Brush</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToolChange("image")}
              className={activeTool === "image" ? toolButtonActive : toolButtonInactive}
            >
              <Image className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">Image</TooltipContent>
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
              className={toolButtonInactive}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">Image Placeholder</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const isImageOrIcon = selectedObject && 
                  (selectedObject.type === 'image' || selectedObject.type === 'group');
                
                if (!isImageOrIcon) {
                  const activeObject = canvas?.getActiveObject();
                  if (activeObject && (activeObject.type === 'image' || activeObject.type === 'group')) {
                    setSelectedObject(activeObject);
                    setCropMode(true);
                  } else {
                    toast.error("Select an image first");
                  }
                } else {
                  setCropMode(true);
                }
              }}
              className={toolButtonInactive}
              disabled={!(selectedObject && (selectedObject.type === 'image' || selectedObject.type === 'group'))}
            >
              <Crop className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">Crop</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToolChange("eraser")}
              className={activeTool === "eraser" ? toolButtonActive : toolButtonInactive}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">Eraser</TooltipContent>
        </Tooltip>

        <div className="w-8 h-px bg-blue-300/50 my-1.5" />

        {/* Export Section */}
        <SectionLabel>Export</SectionLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPowerpointOpen(true)}
              className={toolButtonInactive}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">PowerPoint</TooltipContent>
        </Tooltip>

        <PowerPointGenerator 
          open={powerpointOpen} 
          onOpenChange={setPowerpointOpen} 
        />
        
        <MembraneBrushIconSelector
          open={membraneBrushOpen}
          onOpenChange={setMembraneBrushOpen}
          onStart={(iconSVG, options) => {
            onToolChange(`membrane-brush:${JSON.stringify({ iconSVG, ...options })}`);
          }}
        />
      </div>
    </div>
  );
};
