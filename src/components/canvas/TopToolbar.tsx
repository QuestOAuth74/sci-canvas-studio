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

  const toolButtonClass = "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors";
  const activeToolButtonClass = "h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90";

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 bg-white border-b border-slate-200/80 shadow-sm" data-onboarding="toolbar">
      {/* Edit Tools */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={undo}>
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (⌘Z)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={redo}>
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />

      {/* Clipboard */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={cut}>
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cut (⌘X)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={copy}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy (⌘C)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={paste}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paste (⌘V)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={alignLeft}>
              <AlignLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Left</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={alignCenter}>
              <AlignCenter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Center</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={alignRight}>
              <AlignRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Right</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />

      {/* Layer Controls */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={bringToFront}>
              <ChevronsUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring to Front</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={bringForward}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring Forward</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={sendBackward}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send Backward</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={sendToBack}>
              <ChevronsDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send to Back</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />

      {/* Grouping */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={groupSelected}>
              <Group className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Group (⌘G)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={ungroupSelected}>
              <Ungroup className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ungroup (⌘⇧G)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />

      {/* View Tools */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost"
              size="icon" 
              className={activeTool === "text" ? activeToolButtonClass : toolButtonClass}
              onClick={handleTextToolClick}
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Text Tool</TooltipContent>
        </Tooltip>

        <ShapesDropdown 
          onShapeSelect={onToolChange || (() => {})} 
          activeTool={activeTool}
        />

        <TextOnPathTool />
        <TextBoxTool />
      </div>
      
      {activeTool === "text" && (
        <>
          <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />
          <TextFormattingPanel />
        </>
      )}

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />

      {/* View Options */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost"
              size="icon" 
              className={gridEnabled ? activeToolButtonClass : toolButtonClass}
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
              variant="ghost"
              size="icon" 
              className={rulersEnabled ? activeToolButtonClass : toolButtonClass}
              onClick={() => setRulersEnabled(!rulersEnabled)}
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Rulers</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />

      <FeatureAccessBadge />

      {/* Save Status - Centered */}
      <div className="flex-1 flex items-center justify-center">
        {saveStatus === 'saved' && (
          <span className="text-xs flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Saved</span>
          </span>
        )}
        {saveStatus === 'saving' && (
          <span className="text-xs flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">Saving...</span>
          </span>
        )}
        {saveStatus === 'unsaved' && (
          <span className="text-xs flex items-center gap-1.5 px-2 py-1 text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
            <span>Unsaved</span>
          </span>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={zoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        
        <span className="text-xs font-medium px-2 py-1 bg-muted/50 rounded min-w-[3rem] text-center text-foreground">{zoom}%</span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={zoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={zoomToFit}>
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to Screen</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />

        <QuickSettings />
      </div>
    </div>
  );
};
