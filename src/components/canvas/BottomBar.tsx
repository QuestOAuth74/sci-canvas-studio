import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  CaretDown,
  CaretLeft,
  CaretRight,
  Lightbulb,
  Cursor,
  PenNib,
  Square,
  TextT,
  Image,
  Eraser,
  LineSegment,
  HandGrabbing,
  Scribble,
  Waves,
  Command,
  Copy,
  Trash,
  PencilSimple,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";
import { useCanvas } from "@/contexts/CanvasContext";
import { IconProps } from "@phosphor-icons/react";
import { PageContextMenu } from "./PageContextMenu";

interface BottomBarProps {
  activeTool: string;
  hasSelection: boolean;
}

type PhosphorIcon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

const TOOL_INFO: Record<string, {
  name: string;
  hint: string;
  shortcut?: string;
  icon: PhosphorIcon;
}> = {
  select: {
    name: "Select",
    hint: "Click objects to select. Drag to move. Hold Shift for multi-select.",
    shortcut: "1",
    icon: Cursor
  },
  pen: {
    name: "Pen",
    hint: "Click to place points. Press Enter to finish the path.",
    shortcut: "B",
    icon: PenNib
  },
  "freeform-line": {
    name: "Freeform Line",
    hint: "Click and drag to draw a curved line. Release to finish.",
    shortcut: "F",
    icon: Scribble
  },
  rectangle: {
    name: "Rectangle",
    hint: "Click and drag to create. Hold Shift for a square.",
    shortcut: "3",
    icon: Square
  },
  circle: {
    name: "Circle",
    hint: "Click and drag to create. Hold Shift for a perfect circle.",
    shortcut: "4",
    icon: Square
  },
  triangle: {
    name: "Triangle",
    hint: "Click and drag to create a triangle.",
    icon: Square
  },
  text: {
    name: "Text",
    hint: "Click anywhere on the canvas to add text.",
    shortcut: "T",
    icon: TextT
  },
  image: {
    name: "Image",
    hint: "Click to upload an image from your device.",
    shortcut: "8",
    icon: Image
  },
  eraser: {
    name: "Eraser",
    hint: "Click on any object to remove it from the canvas.",
    shortcut: "9",
    icon: Eraser
  },
  "straight-line": {
    name: "Line",
    hint: "Click start and end points. Press Esc to cancel.",
    shortcut: "5",
    icon: LineSegment
  },
  "orthogonal-line": {
    name: "Orthogonal Line",
    hint: "Draw lines with 90° bends for clean connections.",
    icon: LineSegment
  },
  "curved-line": {
    name: "Curved Line",
    hint: "Create smooth curves. Drag the green handle to adjust.",
    icon: Scribble
  },
  connector: {
    name: "Connector",
    hint: "Click on objects to connect them with smart routing.",
    icon: HandGrabbing
  },
  crop: {
    name: "Crop",
    hint: "Drag the corners to crop the selected image.",
    icon: Image
  },
  "membrane-brush": {
    name: "Membrane Brush",
    hint: "Draw to place icons along a path. Great for membranes!",
    icon: Waves
  },
};

export const BottomBar = ({ activeTool, hasSelection }: BottomBarProps) => {
  const {
    canvas,
    selectedObject,
    isSaving,
    pages,
    currentPageIndex,
    addPage,
    switchToPage,
    deleteCurrentPage,
    renamePage,
    duplicateCurrentPage,
    movePage,
  } = useCanvas();

  const [contextMenuPage, setContextMenuPage] = useState<{ id: string; index: number } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Get tool info, handling membrane-brush prefix
  const toolKey = activeTool.startsWith("membrane-brush") ? "membrane-brush" : activeTool;
  const toolInfo = TOOL_INFO[toolKey] || {
    name: "Select",
    hint: "Select a tool from the left toolbar to get started.",
    icon: Cursor,
    shortcut: undefined
  };

  // Get selection info
  const getSelectionInfo = () => {
    if (!selectedObject) return null;

    if (selectedObject.type === 'activeSelection') {
      const selection = selectedObject as any;
      const count = selection._objects?.length || 0;
      return `${count} objects selected`;
    }

    const typeLabels: Record<string, string> = {
      'rect': 'Rectangle',
      'circle': 'Circle',
      'ellipse': 'Ellipse',
      'triangle': 'Triangle',
      'polygon': 'Polygon',
      'textbox': 'Text',
      'text': 'Text',
      'i-text': 'Text',
      'image': 'Image',
      'group': 'Group',
      'path': 'Path',
      'line': 'Line',
    };

    return typeLabels[selectedObject.type || ''] || 'Object';
  };

  const selectionInfo = getSelectionInfo();
  const objectCount = canvas?.getObjects().filter(obj =>
    !(obj as any).isGridLine && !(obj as any).isRuler
  ).length || 0;

  const ToolIcon = toolInfo.icon;

  // Get current page name
  const currentPage = pages[currentPageIndex];
  const currentPageName = currentPage?.page_name || 'Page 1';
  const totalPages = pages.length || 1;

  // Handle page navigation
  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      switchToPage(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      switchToPage(currentPageIndex + 1);
    }
  };

  // Handle context menu
  const handlePageContextMenu = (e: React.MouseEvent, pageId: string, index: number) => {
    e.preventDefault();
    setContextMenuPage({ id: pageId, index });
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenuPage(null);
    setContextMenuPosition(null);
  };

  return (
    <>
      <div className="h-11 glass-toolbar border-t border-slate-200/80 flex items-center px-4 gap-4 justify-between">
        {/* Left: Page controls */}
        <div className="flex items-center gap-2">
          {/* Add Page Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:scale-105 transition-all duration-200"
                onClick={addPage}
              >
                <Plus size={18} weight="regular" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-slate-900 text-white border-0 shadow-lg">
              Add Page (Ctrl+Shift+N)
            </TooltipContent>
          </Tooltip>

          {/* Page Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-md transition-all duration-200"
              >
                {currentPageName}
                <CaretDown size={14} weight="regular" className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {pages.length > 0 ? (
                pages.map((page, index) => (
                  <DropdownMenuItem
                    key={page.id}
                    className={`cursor-pointer ${index === currentPageIndex ? 'bg-blue-50 text-blue-700' : ''}`}
                    onClick={() => switchToPage(index)}
                    onContextMenu={(e) => handlePageContextMenu(e, page.id, index)}
                  >
                    <span className="flex-1">{page.page_name}</span>
                    {index === currentPageIndex && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-100 text-blue-700">
                        Current
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem
                  className="bg-blue-50 text-blue-700"
                  onClick={() => {}}
                >
                  Page 1
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-100 text-blue-700 ml-2">
                    Current
                  </Badge>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={addPage} className="cursor-pointer">
                <Plus size={14} className="mr-2" />
                Add New Page
              </DropdownMenuItem>
              {pages.length > 0 && (
                <>
                  <DropdownMenuItem onClick={duplicateCurrentPage} className="cursor-pointer">
                    <Copy size={14} className="mr-2" />
                    Duplicate Current Page
                  </DropdownMenuItem>
                  {pages.length > 1 && (
                    <DropdownMenuItem
                      onClick={deleteCurrentPage}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash size={14} className="mr-2" />
                      Delete Current Page
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Page Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                    onClick={handlePrevPage}
                    disabled={currentPageIndex === 0}
                  >
                    <CaretLeft size={14} weight="bold" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white border-0 shadow-lg">
                  Previous Page (Ctrl+PageUp)
                </TooltipContent>
              </Tooltip>

              <span className="text-[11px] text-slate-500 font-medium min-w-[40px] text-center">
                {currentPageIndex + 1} / {totalPages}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                    onClick={handleNextPage}
                    disabled={currentPageIndex === pages.length - 1}
                  >
                    <CaretRight size={14} weight="bold" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white border-0 shadow-lg">
                  Next Page (Ctrl+PageDown)
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Object count badge */}
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
            {objectCount} objects
          </Badge>
        </div>

        {/* Center: Active Tool & Hint */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          {/* Active Tool Indicator */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/60 shadow-soft-xs transition-all duration-200">
            <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-[0_2px_8px_-2px_rgba(59,130,246,0.4)]">
              <ToolIcon size={16} weight="duotone" className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800 leading-tight">{toolInfo.name}</span>
              {toolInfo.shortcut && (
                <span className="text-[10px] text-slate-500 leading-tight font-medium">Press {toolInfo.shortcut}</span>
              )}
            </div>
          </div>

          {/* Hint */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50/80 to-orange-50/60 rounded-lg border border-amber-200/40 max-w-md">
            <Lightbulb size={16} weight="duotone" className="text-amber-500 flex-shrink-0" />
            <span className="text-xs text-slate-600 truncate font-medium">{toolInfo.hint}</span>
          </div>
        </div>

        {/* Right: Selection info & Status */}
        <div className="flex items-center gap-3">
          {/* Selection indicator */}
          {selectionInfo && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-md border border-blue-200">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-blue-700">{selectionInfo}</span>
            </div>
          )}

          {/* Saving indicator */}
          {isSaving && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-md border border-amber-200">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">Saving...</span>
            </div>
          )}

          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-500">
            <Command size={14} weight="regular" />
            <span>K for commands</span>
          </div>
        </div>
      </div>

      {/* Page Context Menu */}
      {contextMenuPage && contextMenuPosition && (
        <PageContextMenu
          pageId={contextMenuPage.id}
          pageIndex={contextMenuPage.index}
          totalPages={pages.length}
          position={contextMenuPosition}
          onClose={handleCloseContextMenu}
          onRename={(id, name) => {
            renamePage(id, name);
            handleCloseContextMenu();
          }}
          onDuplicate={() => {
            duplicateCurrentPage();
            handleCloseContextMenu();
          }}
          onDelete={() => {
            deleteCurrentPage();
            handleCloseContextMenu();
          }}
          onMoveUp={() => {
            if (contextMenuPage.index > 0) {
              movePage(contextMenuPage.index, contextMenuPage.index - 1);
            }
            handleCloseContextMenu();
          }}
          onMoveDown={() => {
            if (contextMenuPage.index < pages.length - 1) {
              movePage(contextMenuPage.index, contextMenuPage.index + 1);
            }
            handleCloseContextMenu();
          }}
        />
      )}
    </>
  );
};
