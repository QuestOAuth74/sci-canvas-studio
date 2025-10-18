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
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanvas } from "@/contexts/CanvasContext";
import { TextFormattingPanel } from "./TextFormattingPanel";
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
    zoomIn,
    zoomOut,
    zoomToFit,
    zoom,
    gridEnabled,
    setGridEnabled,
    rulersEnabled,
    setRulersEnabled,
  } = useCanvas();

  const handleTextToolClick = () => {
    const newTool = activeTool === "text" ? "select" : "text";
    onToolChange?.(newTool);
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 glass-effect border-b border-border/40">
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo}>
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo}>
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cut}>
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cut</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copy}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={paste}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paste</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-0.5">
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

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-0.5">
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
      </div>
      
      {activeTool === "text" && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <TextFormattingPanel />
        </>
      )}

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={gridEnabled ? "default" : "ghost"} 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setGridEnabled(!gridEnabled)}
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

      <div className="flex-1" />

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
      </div>
    </div>
  );
};
