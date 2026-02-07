import { Button } from "@/components/ui/button";
import {
  IconPointer,
  IconPencil,
  IconScribble,
  IconTypography,
  IconPhoto,
  IconEraser,
  IconCrop,
  IconWaveSine,
  IconPresentation,
  IconPhotoSquareRounded,
  IconChartBar,
} from "@tabler/icons-react";
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
import { PathwayBuilderTool } from "./PathwayBuilderTool";

import { PowerPointGenerator } from "./PowerPointGenerator";
import { useRecentlyUsedTools } from "@/hooks/useRecentlyUsedTools";
import { useEffect, useState } from "react";
import { useImagePlaceholder } from "./ImagePlaceholderTool";
import { DataVisualizationDialog } from "./charts";

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  isHorizontal?: boolean;
}

export const Toolbar = ({ activeTool, onToolChange, isHorizontal = false }: ToolbarProps) => {
  const { canvas, selectedObject, setCropMode, setSelectedObject } = useCanvas();
  const { addRecentTool } = useRecentlyUsedTools();
  const [powerpointOpen, setPowerpointOpen] = useState(false);
  const { addImagePlaceholder } = useImagePlaceholder();
  const [chartDialogOpen, setChartDialogOpen] = useState(false);

  // Track tool usage
  useEffect(() => {
    if (activeTool && activeTool !== 'select') {
      addRecentTool(activeTool);
    }
  }, [activeTool, addRecentTool]);

  const handleToolChange = (toolId: string) => {
    onToolChange(toolId);
  };

  // Modern sleek theme with micro-interactions
  const btnBase = "w-9 h-9 rounded-lg transition-all duration-150";
  const btnActive = `${btnBase} bg-cyan-600 text-white shadow-[0_2px_8px_-2px_rgba(8,145,178,0.5)] tool-activate`;
  const btnInactive = `${btnBase} text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 hover:-translate-y-0.5`;

  // Horizontal layout for simple canvas
  if (isHorizontal) {
    return (
      <div className="flex items-center gap-1 px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolChange("select")}
          className={activeTool === "select" ? btnActive : btnInactive}
          title="Select (1)"
        >
          <IconPointer size={18} stroke={activeTool === "select" ? 2 : 1.5} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolChange("pen")}
          className={activeTool === "pen" ? btnActive : btnInactive}
          title="Pen (B)"
        >
          <IconPencil size={18} stroke={activeTool === "pen" ? 2 : 1.5} />
        </Button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <ShapesDropdown onShapeSelect={onToolChange} activeTool={activeTool} />
        <ShapesWithTextDropdown onShapeSelect={onToolChange} activeTool={activeTool} />
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <StraightLineTool onLineSelect={onToolChange} activeTool={activeTool} />
        <ConnectorTool onConnectorSelect={handleToolChange} activeTool={activeTool} />
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolChange("text")}
          className={activeTool === "text" ? btnActive : btnInactive}
          title="Text (T)"
        >
          <IconTypography size={18} stroke={activeTool === "text" ? 2 : 1.5} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolChange("image")}
          className={activeTool === "image" ? btnActive : btnInactive}
          title="Image (8)"
        >
          <IconPhoto size={18} stroke={activeTool === "image" ? 2 : 1.5} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolChange("eraser")}
          className={activeTool === "eraser" ? btnActive : btnInactive}
          title="Eraser (9)"
        >
          <IconEraser size={18} stroke={activeTool === "eraser" ? 2 : 1.5} />
        </Button>
        <PowerPointGenerator open={powerpointOpen} onOpenChange={setPowerpointOpen} />
        <DataVisualizationDialog open={chartDialogOpen} onOpenChange={setChartDialogOpen} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col glass-toolbar w-[52px]">
      <div className="flex flex-col items-center gap-0.5 py-2 px-1.5">

        {/* Selection & Drawing */}
        <div className="grid grid-cols-1 gap-0.5 w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToolChange("select")}
                className={activeTool === "select" ? btnActive : btnInactive}
              >
                <IconPointer size={18} stroke={activeTool === "select" ? 2 : 1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-slate-900 text-white border-0 shadow-lg z-[100]">
              <span className="text-xs font-medium">Select</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 rounded">1</kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToolChange("pen")}
                className={activeTool === "pen" ? btnActive : btnInactive}
              >
                <IconPencil size={18} stroke={activeTool === "pen" ? 2 : 1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-slate-900 text-white border-0 shadow-lg z-[100]">
              <span className="text-xs font-medium">Pen Tool</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 rounded">B</kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToolChange("freeform-line")}
                className={activeTool === "freeform-line" ? btnActive : btnInactive}
              >
                <IconScribble size={18} stroke={activeTool === "freeform-line" ? 2 : 1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-slate-900 text-white border-0 shadow-lg z-[100]">
              <span className="text-xs font-medium">Freeform</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 rounded">F</kbd>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="w-7 h-px bg-slate-200 my-1" />

        {/* Shapes */}
        <div className="grid grid-cols-1 gap-0.5 w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <div data-onboarding="shapes-dropdown">
                <ShapesDropdown onShapeSelect={onToolChange} activeTool={activeTool} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="text-xs font-medium bg-slate-900 text-white border-0 shadow-lg z-[100]">Shapes</TooltipContent>
          </Tooltip>

          <ShapesWithTextDropdown onShapeSelect={onToolChange} activeTool={activeTool} />
        </div>

        <div className="w-7 h-px bg-slate-200 my-1" />

        {/* Lines & Connectors */}
        <div className="grid grid-cols-1 gap-0.5 w-full" data-onboarding="lines-section">
          <StraightLineTool onLineSelect={onToolChange} activeTool={activeTool} />
          <OrthogonalLineTool onLineSelect={handleToolChange} activeTool={activeTool} />
          <CurvedLineTool onLineSelect={handleToolChange} activeTool={activeTool} />
          <ConnectorTool onConnectorSelect={handleToolChange} activeTool={activeTool} />
          <ZoomCalloutTool onCalloutSelect={handleToolChange} activeTool={activeTool} />
          <PathwayBuilderTool onToolChange={handleToolChange} activeTool={activeTool} />
        </div>

        <div className="w-7 h-px bg-slate-200 my-1" />

        {/* Content Tools */}
        <div className="grid grid-cols-1 gap-0.5 w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToolChange("text")}
                className={activeTool === "text" ? btnActive : btnInactive}
                data-tool="text"
              >
                <IconTypography size={18} stroke={activeTool === "text" ? 2 : 1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-slate-900 text-white border-0 shadow-lg z-[100]">
              <span className="text-xs font-medium">Text</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 rounded">T</kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToolChange("membrane-draw")}
                className={activeTool === "membrane-draw" || activeTool.startsWith("membrane-brush") ? btnActive : btnInactive}
              >
                <IconWaveSine size={18} stroke={activeTool === "membrane-draw" || activeTool.startsWith("membrane-brush") ? 2 : 1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="text-xs font-medium bg-slate-900 text-white border-0 shadow-lg z-[100]">Membrane</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToolChange("image")}
                className={activeTool === "image" ? btnActive : btnInactive}
              >
                <IconPhoto size={18} stroke={activeTool === "image" ? 2 : 1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-slate-900 text-white border-0 shadow-lg z-[100]">
              <span className="text-xs font-medium">Image</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 rounded">8</kbd>
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
                className={btnInactive}
              >
                <IconPhotoSquareRounded size={18} stroke={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="text-xs font-medium bg-slate-900 text-white border-0 shadow-lg z-[100]">Placeholder</TooltipContent>
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
                className={btnInactive}
                disabled={!(selectedObject && (selectedObject.type === 'image' || selectedObject.type === 'group'))}
              >
                <IconCrop size={18} stroke={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="text-xs font-medium bg-slate-900 text-white border-0 shadow-lg z-[100]">Crop</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToolChange("eraser")}
                className={activeTool === "eraser" ? btnActive : btnInactive}
              >
                <IconEraser size={18} stroke={activeTool === "eraser" ? 2 : 1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 bg-slate-900 text-white border-0 shadow-lg z-[100]">
              <span className="text-xs font-medium">Eraser</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 rounded">9</kbd>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="w-7 h-px bg-slate-200 my-1" />

        {/* Data & Export */}
        <div className="grid grid-cols-1 gap-0.5 w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChartDialogOpen(true)}
                className={btnInactive}
              >
                <IconChartBar size={18} stroke={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="text-xs font-medium bg-slate-900 text-white border-0 shadow-lg z-[100]">Charts</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPowerpointOpen(true)}
                className={btnInactive}
              >
                <IconPresentation size={18} stroke={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="text-xs font-medium bg-slate-900 text-white border-0 shadow-lg z-[100]">Export PPT</TooltipContent>
          </Tooltip>
        </div>

        <PowerPointGenerator
          open={powerpointOpen}
          onOpenChange={setPowerpointOpen}
        />

        <DataVisualizationDialog
          open={chartDialogOpen}
          onOpenChange={setChartDialogOpen}
        />
      </div>
    </div>
  );
};
