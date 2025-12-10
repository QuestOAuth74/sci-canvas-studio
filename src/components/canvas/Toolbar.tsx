import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Cursor,
  PenNib,
  Scribble,
  TextT,
  Image,
  Eraser,
  Crop,
  Waves,
  FilePpt,
  ImageSquare,
} from "@phosphor-icons/react";
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
    { id: "select", Icon: Cursor, label: "Select and Transform", shortcut: "1" },
    { id: "pen", Icon: PenNib, label: "Draw Bezier Curves", shortcut: "B" },
    { id: "freeform-line", Icon: Scribble, label: "Freeform Curved Line", shortcut: "F" },
  ];
  
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
                <tool.Icon 
                  size={18} 
                  weight={activeTool === tool.id ? "duotone" : "regular"} 
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span className="text-xs font-medium">{tool.label}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border shadow-sm">
                {tool.shortcut}
              </kbd>
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
              <TextT 
                size={18} 
                weight={activeTool === "text" ? "duotone" : "regular"} 
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span className="text-xs font-medium">Text</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border shadow-sm">T</kbd>
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
              <Waves 
                size={18} 
                weight={activeTool.startsWith("membrane-brush") ? "duotone" : "regular"} 
              />
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
              <Image 
                size={18} 
                weight={activeTool === "image" ? "duotone" : "regular"} 
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span className="text-xs font-medium">Image</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border shadow-sm">8</kbd>
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
              className={toolButtonInactive}
            >
              <ImageSquare size={18} weight="regular" />
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
              <Crop size={18} weight="regular" />
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
              <Eraser 
                size={18} 
                weight={activeTool === "eraser" ? "duotone" : "regular"} 
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span className="text-xs font-medium">Eraser</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border shadow-sm">9</kbd>
          </TooltipContent>
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
              <FilePpt size={18} weight="regular" />
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
