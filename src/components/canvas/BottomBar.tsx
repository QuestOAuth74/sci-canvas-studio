import { Badge } from "@/components/ui/badge";
import {
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
  FloppyDisk,
  Check,
  CloudArrowUp,
} from "@phosphor-icons/react";
import { useCanvas } from "@/contexts/CanvasContext";
import { IconProps } from "@phosphor-icons/react";
import { PageTabs } from "./PageTabs";
import { ProjectPage } from "@/hooks/useProjectPages";

interface BottomBarProps {
  activeTool: string;
  hasSelection: boolean;
  // Page management props
  pages?: ProjectPage[];
  currentPageIndex?: number;
  isSavingPage?: boolean;
  onSwitchPage?: (index: number) => void;
  onAddPage?: () => void;
  onDeletePage?: (pageId: string) => void;
  onRenamePage?: (pageId: string, newName: string) => void;
  onDuplicatePage?: (pageId: string) => void;
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

export const BottomBar = ({ 
  activeTool, 
  hasSelection,
  pages = [],
  currentPageIndex = 0,
  isSavingPage = false,
  onSwitchPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
  onDuplicatePage,
}: BottomBarProps) => {
  const { canvas, selectedObject, isSaving } = useCanvas();
  
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
  
  // Check if pages are enabled
  const hasPages = pages.length > 0 && onSwitchPage && onAddPage;

  return (
    <div className="h-11 bg-background/95 backdrop-blur-sm border-t border-border/60 shadow-sm flex items-center px-4 gap-4 justify-between">
      {/* Left: Page controls */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink">
        {hasPages ? (
          <PageTabs
            pages={pages}
            currentPageIndex={currentPageIndex}
            onSwitchPage={onSwitchPage}
            onAddPage={onAddPage}
            onDeletePage={onDeletePage || (() => {})}
            onRenamePage={onRenamePage || (() => {})}
            onDuplicatePage={onDuplicatePage || (() => {})}
          />
        ) : (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted/60">
            Page 1
          </Badge>
        )}
        
        {/* Object count badge */}
        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted/60 shrink-0">
          {objectCount} objects
        </Badge>
      </div>

      {/* Center: Active Tool & Hint */}
      <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
        {/* Active Tool Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20 transition-all duration-200 shrink-0">
          <div className="flex items-center justify-center w-6 h-6 bg-primary/20 rounded-md">
            <ToolIcon size={16} weight="duotone" className="text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">{toolInfo.name}</span>
            {toolInfo.shortcut && (
              <span className="text-[10px] text-muted-foreground leading-tight">Press {toolInfo.shortcut}</span>
            )}
          </div>
        </div>
        
        {/* Hint */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border border-border/40 max-w-md min-w-0">
          <Lightbulb size={16} weight="duotone" className="text-amber-500 flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{toolInfo.hint}</span>
        </div>
      </div>

      {/* Right: Selection info & Status */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Selection indicator */}
        {selectionInfo && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 rounded-md border border-blue-500/20 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-600">{selectionInfo}</span>
          </div>
        )}
        
        {/* Page saving indicator */}
        {isSavingPage && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 rounded-md border border-blue-500/20">
            <CloudArrowUp size={14} weight="duotone" className="text-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-600">Saving...</span>
          </div>
        )}
        
        {/* Project saving indicator */}
        {isSaving && !isSavingPage && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-md border border-amber-500/20">
            <FloppyDisk size={14} weight="duotone" className="text-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-amber-600">Saving...</span>
          </div>
        )}
        
        {/* Saved indicator (show when not saving and pages exist) */}
        {!isSaving && !isSavingPage && hasPages && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-md border border-green-500/20">
            <Check size={14} weight="bold" className="text-green-600" />
            <span className="text-xs font-medium text-green-600">Saved</span>
          </div>
        )}
        
        {/* Keyboard shortcut hint */}
        <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground">
          <Command size={14} weight="regular" />
          <span>K for commands</span>
        </div>
      </div>
    </div>
  );
};
