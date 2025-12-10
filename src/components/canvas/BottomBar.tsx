import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Lightbulb } from "lucide-react";

interface BottomBarProps {
  activeTool: string;
  hasSelection: boolean;
}

const TOOL_HINTS: Record<string, string> = {
  select: "Click and drag objects to move them. Hold Shift to select multiple.",
  pen: "Click to place points. Press Enter to finish the path.",
  "freeform-line": "Click and drag to draw a curved line. Release to finish.",
  rectangle: "Click and drag to create a rectangle. Hold Shift for a square.",
  circle: "Click and drag to create a circle. Hold Shift for a perfect circle.",
  triangle: "Click and drag to create a triangle.",
  text: "Click anywhere on the canvas to add text.",
  image: "Click to upload an image from your device.",
  eraser: "Click on any object to remove it from the canvas.",
  "straight-line": "Click start and end points to draw a line. Press Esc to cancel.",
  "orthogonal-line": "Draw lines with 90° bends for clean connections.",
  "curved-line": "Create smooth curves. Drag the green handle to adjust.",
  connector: "Click on objects to connect them with smart routing.",
  crop: "Drag the corners to crop the selected image.",
};

export const BottomBar = ({ activeTool, hasSelection }: BottomBarProps) => {
  const hint = TOOL_HINTS[activeTool] || "Select a tool from the left toolbar to get started.";
  
  return (
    <div className="h-10 bg-white border-t border-slate-200/80 shadow-sm flex items-center px-4 gap-4 justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10 hover:scale-110 transition-all duration-200">
          <Plus className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-muted/50 hover:bg-muted/70 rounded-md transition-all duration-200">
            Page-1
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Context-Aware Tool Hint */}
      <div className="flex items-center gap-2 text-xs flex-1 justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-md border border-primary/10">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground font-medium">{hint}</span>
        </div>
      </div>

      <div className="w-32" /> {/* Spacer for balance */}
    </div>
  );
};
