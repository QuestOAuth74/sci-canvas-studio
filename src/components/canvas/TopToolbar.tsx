import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Copy,
  Scissors,
  Clipboard,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Grid3x3,
  Ruler,
  Type,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  ChevronsDown,
  Group,
  Ungroup,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanvas } from "@/contexts/CanvasContext";
import { TextFormattingPanel } from "./TextFormattingPanel";
import { ShapesDropdown } from "./ShapesDropdown";
import { QuickSettings } from "./QuickSettings";
import { FeatureAccessBadge } from "./FeatureAccessBadge";
import { DarkModeToggle } from "./DarkModeToggle";
import { TextOnPathTool } from "./TextOnPathTool";
import { TextBoxTool } from "./TextBoxTool";
import { useState } from "react";

interface TopToolbarProps {
  onExport: () => void;
  activeTool?: string;
  onToolChange?: (tool: string) => void;
}

export const TopToolbar = ({ onExport, activeTool = "select", onToolChange }: TopToolbarProps) => {
  const {
    undo,
    redo,
    cut,
    copy,
    paste,
    alignLeft,
    alignCenter,
    alignRight,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupSelected,
    ungroupSelected,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoom,
    gridEnabled,
    setGridEnabled,
    rulersEnabled,
    setRulersEnabled,
    saveStatus,
  } = useCanvas();

  const handleTextToolClick = () => {
    const newTool = activeTool === "text" ? "select" : "text";
    onToolChange?.(newTool);
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 glass-effect-premium toolbar-floating border-b shadow-md transition-all duration-200" data-onboarding="toolbar">
      {/* Edit Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">Edit</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 btn-interactive" onClick={undo}>
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 btn-interactive" onClick={redo}>
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 btn-interactive" onClick={cut}>
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cut</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 btn-interactive" onClick={copy}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 btn-interactive" onClick={paste}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paste</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-border/60" />

      {/* Align Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">Align</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={alignLeft}>
              <AlignLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Left</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={alignCenter}>
              <AlignCenter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Center</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={alignRight}>
              <AlignRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Right</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-border/60" />

      {/* Layer Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">Layer</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={bringToFront}>
              <ChevronsUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring to Front (Ctrl+Shift+])</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={bringForward}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring Forward (Ctrl+])</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={sendBackward}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send Backward (Ctrl+[)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={sendToBack}>
              <ChevronsDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send to Back (Ctrl+Shift+[)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-border/60" />

      {/* Group Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">Group</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={groupSelected}>
              <Group className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Group Objects (Ctrl+G)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={ungroupSelected}>
              <Ungroup className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ungroup (Ctrl+Shift+G)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-border/60" />

      {/* View Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">View</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeTool === "text" ? "default" : "ghost"} 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleTextToolClick}
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Text Tool</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ShapesDropdown 
                onShapeSelect={onToolChange || (() => {})} 
                activeTool={activeTool}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>Shapes & Arrows</TooltipContent>
        </Tooltip>

        <TextOnPathTool />
        <TextBoxTool />
      </div>
      
      {activeTool === "text" && (
        <>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <TextFormattingPanel />
        </>
      )}

      <Separator orientation="vertical" className="h-6 mx-2 bg-border/60" />

      {/* Zoom Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">Zoom</span>
        <Tooltip>
          <TooltipTrigger asChild>
              <Button 
                variant={gridEnabled ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setGridEnabled(!gridEnabled)}
                data-grid-toggle
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Grid</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={rulersEnabled ? "default" : "ghost"} 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setRulersEnabled(!rulersEnabled)}
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Rulers</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-border/60" />

      <div className="px-2">
        <FeatureAccessBadge />
      </div>

      <div className="flex-1 flex items-center justify-center">
        {saveStatus === 'saved' && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
            All changes saved
          </span>
        )}
        {saveStatus === 'saving' && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
            Saving...
          </span>
        )}
        {saveStatus === 'unsaved' && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            Not saved
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        
        <span className="text-xs font-medium px-2 min-w-[3rem] text-center">{zoom}%</span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomToFit}>
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to Screen</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <DarkModeToggle />
        <QuickSettings />
      </div>
    </div>
  );
};
