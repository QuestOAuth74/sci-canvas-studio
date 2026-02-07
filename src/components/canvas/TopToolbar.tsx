import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCut,
  IconCopy,
  IconClipboard,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconStackPush,
  IconArrowUp,
  IconArrowDown,
  IconStackPop,
  IconBoxMultiple,
  IconBoxAlignTop,
  IconGridDots,
  IconRuler2,
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
  IconTypography,
} from "@tabler/icons-react";
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

  // Refined modern theme with micro-interactions
  const toolButtonClass = "h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 border border-slate-100 hover:-translate-y-0.5 transition-all duration-150";
  const activeToolButtonClass = "h-8 w-8 rounded-lg bg-blue-500 text-white shadow-[0_2px_8px_-2px_rgba(59,130,246,0.5)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all duration-150 tool-activate";

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 glass-toolbar border-b border-slate-200/80" data-onboarding="toolbar">
      {/* Edit Tools */}
      <div className="flex items-center gap-0.5 p-1 rounded-lg bg-slate-50/80 border border-slate-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={undo}>
              <IconArrowBackUp size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Undo (⌘Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={redo}>
              <IconArrowForwardUp size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Redo (⌘⇧Z)</TooltipContent>
        </Tooltip>
      </div>

      <div className="toolbar-divider mx-1.5" />

      {/* Clipboard */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-50/80 border border-slate-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={cut}>
              <IconCut size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Cut (⌘X)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={copy}>
              <IconCopy size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Copy (⌘C)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={paste}>
              <IconClipboard size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Paste (⌘V)</TooltipContent>
        </Tooltip>
      </div>

      <div className="toolbar-divider mx-1.5" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-50/80 border border-slate-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={alignLeft}>
              <IconAlignLeft size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Align Left</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={alignCenter}>
              <IconAlignCenter size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Align Center</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={alignRight}>
              <IconAlignRight size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Align Right</TooltipContent>
        </Tooltip>
      </div>

      <div className="toolbar-divider mx-1.5" />

      {/* Layer Controls */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-50/80 border border-slate-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={bringToFront}>
              <IconStackPush size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Bring to Front</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={bringForward}>
              <IconArrowUp size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Bring Forward</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={sendBackward}>
              <IconArrowDown size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Send Backward</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={sendToBack}>
              <IconStackPop size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Send to Back</TooltipContent>
        </Tooltip>
      </div>

      <div className="toolbar-divider mx-1.5" />

      {/* Grouping */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-50/80 border border-slate-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={groupSelected}>
              <IconBoxMultiple size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Group (⌘G)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={toolButtonClass} onClick={ungroupSelected}>
              <IconBoxAlignTop size={18} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Ungroup (⌘⇧G)</TooltipContent>
        </Tooltip>
      </div>

      <div className="toolbar-divider mx-1.5" />

      {/* View Tools */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-50/80 border border-slate-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={activeTool === "text" ? activeToolButtonClass : toolButtonClass}
              onClick={handleTextToolClick}
            >
              <IconTypography size={18} stroke={activeTool === "text" ? 2 : 1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Text Tool</TooltipContent>
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
          <div className="toolbar-divider mx-1.5" />
          <TextFormattingPanel />
        </>
      )}

      <div className="toolbar-divider mx-1.5" />

      {/* View Options */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-50/80 border border-slate-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={gridEnabled ? activeToolButtonClass : toolButtonClass}
              onClick={() => setGridEnabled(!gridEnabled)}
              data-grid-toggle
            >
              <IconGridDots size={18} stroke={gridEnabled ? 2 : 1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Toggle Grid</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={rulersEnabled ? activeToolButtonClass : toolButtonClass}
              onClick={() => setRulersEnabled(!rulersEnabled)}
            >
              <IconRuler2 size={18} stroke={rulersEnabled ? 2 : 1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Toggle Rulers</TooltipContent>
        </Tooltip>
      </div>

      <div className="toolbar-divider mx-1.5" />

      <FeatureAccessBadge />

      {/* Save Status - Centered */}
      <div className="flex-1 flex items-center justify-center">
        {saveStatus === 'saved' && (
          <span className="text-xs flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-700 font-medium">Saved</span>
          </span>
        )}
        {saveStatus === 'saving' && (
          <span className="text-xs flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-amber-700 font-medium">Saving...</span>
          </span>
        )}
        {saveStatus === 'unsaved' && (
          <span className="text-xs flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-slate-600">Unsaved</span>
          </span>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-50/80 border border-slate-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200" onClick={zoomOut}>
              <IconZoomOut size={16} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Zoom Out</TooltipContent>
        </Tooltip>

        <span className="text-xs font-semibold px-3 py-1 bg-white rounded-lg min-w-[3.5rem] text-center text-slate-700 border border-slate-200">{zoom}%</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200" onClick={zoomIn}>
              <IconZoomIn size={16} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200" onClick={zoomToFit}>
              <IconMaximize size={16} stroke={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-0 shadow-lg">Fit to Screen</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        <QuickSettings />
      </div>
    </div>
  );
};
