import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  Scissors,
  Copy,
  ClipboardText,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  CaretDoubleUp,
  CaretUp,
  CaretDown,
  CaretDoubleDown,
  SelectionAll,
  SplitVertical,
  GridFour,
  Ruler,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CornersOut,
  TextT,
} from "@phosphor-icons/react";
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

  const toolButtonClass = "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-blue-200/60 transition-colors";
  const activeToolButtonClass = "h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90";

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 bg-blue-100/60 border-b border-blue-200/80 shadow-sm" data-onboarding="toolbar">
      {/* Edit Tools */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={undo}>
              <ArrowCounterClockwise size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (⌘Z)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={redo}>
              <ArrowClockwise size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-blue-200/70" />

      {/* Clipboard */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={cut}>
              <Scissors size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cut (⌘X)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={copy}>
              <Copy size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy (⌘C)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={paste}>
              <ClipboardText size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paste (⌘V)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-blue-200/70" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={alignLeft}>
              <TextAlignLeft size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Left</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={alignCenter}>
              <TextAlignCenter size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Center</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={alignRight}>
              <TextAlignRight size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Right</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-blue-200/70" />

      {/* Layer Controls */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={bringToFront}>
              <CaretDoubleUp size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring to Front</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={bringForward}>
              <CaretUp size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring Forward</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={sendBackward}>
              <CaretDown size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send Backward</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={sendToBack}>
              <CaretDoubleDown size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send to Back</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-blue-200/70" />

      {/* Grouping */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={groupSelected}>
              <SelectionAll size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Group (⌘G)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={ungroupSelected}>
              <SplitVertical size={18} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ungroup (⌘⇧G)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-blue-200/70" />

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
              <TextT size={18} weight={activeTool === "text" ? "duotone" : "regular"} />
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
          <Separator orientation="vertical" className="h-5 mx-1.5 bg-blue-200/70" />
          <TextFormattingPanel />
        </>
      )}

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-blue-200/70" />

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
              <GridFour size={18} weight={gridEnabled ? "duotone" : "regular"} />
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
              <Ruler size={18} weight={rulersEnabled ? "duotone" : "regular"} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Rulers</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1.5 bg-blue-200/70" />

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
              <MagnifyingGlassMinus size={16} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        
        <span className="text-xs font-medium px-2 py-1 bg-muted/50 rounded min-w-[3rem] text-center text-foreground">{zoom}%</span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={zoomIn}>
              <MagnifyingGlassPlus size={16} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={zoomToFit}>
              <CornersOut size={16} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to Screen</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 mx-1.5 bg-blue-200/70" />

        <QuickSettings />
      </div>
    </div>
  );
};
