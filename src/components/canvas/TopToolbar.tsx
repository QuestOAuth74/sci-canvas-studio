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
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[hsl(var(--cream))]/95 backdrop-blur-xl border-b-2 border-[hsl(var(--pencil-gray))] paper-shadow-static transition-all duration-200 dark:bg-[hsl(var(--cream))]/98 dark:border-[hsl(var(--pencil-gray))]" data-onboarding="toolbar">
      {/* Edit Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-bold text-[hsl(var(--ink-blue))] uppercase tracking-widest px-2 bg-[hsl(var(--highlighter-yellow))]/20 rounded px-2 py-0.5 border border-[hsl(var(--pencil-gray))] font-source-serif dark:text-[hsl(var(--ink-blue))]">Edit</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))] dark:text-[hsl(var(--ink-blue))]" onClick={undo}>
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={redo}>
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={cut}>
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cut</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={copy}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={paste}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paste</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-[hsl(var(--pencil-gray))]/40" />

      {/* Align Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-bold text-[hsl(var(--ink-blue))] uppercase tracking-widest px-2 bg-[hsl(var(--highlighter-yellow))]/20 rounded px-2 py-0.5 border border-[hsl(var(--pencil-gray))] font-source-serif">Align</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={alignLeft}>
              <AlignLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Left</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={alignCenter}>
              <AlignCenter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Center</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={alignRight}>
              <AlignRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Right</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-[hsl(var(--pencil-gray))]/40" />

      {/* Layer Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-bold text-[hsl(var(--ink-blue))] uppercase tracking-widest px-2 bg-[hsl(var(--highlighter-yellow))]/20 rounded px-2 py-0.5 border border-[hsl(var(--pencil-gray))] font-source-serif">Layer</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={bringToFront}>
              <ChevronsUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring to Front (Ctrl+Shift+])</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={bringForward}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring Forward (Ctrl+])</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={sendBackward}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send Backward (Ctrl+[)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={sendToBack}>
              <ChevronsDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send to Back (Ctrl+Shift+[)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-[hsl(var(--pencil-gray))]/40" />

      {/* Group Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-bold text-[hsl(var(--ink-blue))] uppercase tracking-widest px-2 bg-[hsl(var(--highlighter-yellow))]/20 rounded px-2 py-0.5 border border-[hsl(var(--pencil-gray))] font-source-serif">Group</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={groupSelected}>
              <Group className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Group Objects (Ctrl+G)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={ungroupSelected}>
              <Ungroup className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ungroup (Ctrl+Shift+G)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-[hsl(var(--pencil-gray))]/40" />

      {/* View Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-bold text-[hsl(var(--ink-blue))] uppercase tracking-widest px-2 bg-[hsl(var(--highlighter-yellow))]/20 rounded px-2 py-0.5 border border-[hsl(var(--pencil-gray))] font-source-serif">View</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeTool === "text" ? "sticky" : "ghost"} 
              size="icon" 
              className={`h-8 w-8 ${activeTool === "text" ? '' : 'hover:bg-[hsl(var(--highlighter-yellow))]/20'} text-[hsl(var(--ink-blue))]`}
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
          <Separator orientation="vertical" className="h-6 mx-2 bg-[hsl(var(--pencil-gray))]/40" />
          <TextFormattingPanel />
        </>
      )}

      <Separator orientation="vertical" className="h-6 mx-2 bg-[hsl(var(--pencil-gray))]/40" />

      {/* Zoom Section */}
      <div className="flex items-center gap-0.5 px-1">
        <span className="text-[10px] font-bold text-[hsl(var(--ink-blue))] uppercase tracking-widest px-2 bg-[hsl(var(--highlighter-yellow))]/20 rounded px-2 py-0.5 border border-[hsl(var(--pencil-gray))] font-source-serif">Zoom</span>
        <Tooltip>
          <TooltipTrigger asChild>
              <Button 
                variant={gridEnabled ? "sticky" : "ghost"} 
                size="icon" 
                className={`h-8 w-8 ${gridEnabled ? '' : 'hover:bg-[hsl(var(--highlighter-yellow))]/20'} text-[hsl(var(--ink-blue))]`}
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
              variant={rulersEnabled ? "sticky" : "ghost"} 
              size="icon" 
              className={`h-8 w-8 ${rulersEnabled ? '' : 'hover:bg-[hsl(var(--highlighter-yellow))]/20'} text-[hsl(var(--ink-blue))]`}
              onClick={() => setRulersEnabled(!rulersEnabled)}
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Rulers</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2 bg-[hsl(var(--pencil-gray))]/40" />

      <div className="px-2">
        <FeatureAccessBadge />
      </div>

      <div className="flex-1 flex items-center justify-center">
        {saveStatus === 'saved' && (
          <span className="text-xs flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-md border border-green-500/20">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className="text-green-700 dark:text-green-400 font-medium">All changes saved</span>
          </span>
        )}
        {saveStatus === 'saving' && (
          <span className="text-xs flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 rounded-md border border-yellow-500/20">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
            <span className="text-yellow-700 dark:text-yellow-400 font-medium">Saving...</span>
          </span>
        )}
        {saveStatus === 'unsaved' && (
          <span className="text-xs flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md border border-border/40">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
            <span className="text-muted-foreground font-medium">Not saved</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={zoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        
        <span className="text-xs font-semibold px-3 py-1 bg-white rounded-md min-w-[3rem] text-center border border-[hsl(var(--pencil-gray))] font-source-serif">{zoom}%</span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={zoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[hsl(var(--highlighter-yellow))]/20 text-[hsl(var(--ink-blue))]" onClick={zoomToFit}>
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to Screen</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-2 bg-[hsl(var(--pencil-gray))]/40" />

        <DarkModeToggle />
        <QuickSettings />
      </div>
    </div>
  );
};
