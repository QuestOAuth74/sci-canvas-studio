import { Button } from "@/components/ui/button";
import { Trash, CheckCircle, Circle, Square } from "@phosphor-icons/react";
import { useCanvas } from "@/contexts/CanvasContext";
import { BezierPath } from "@/types/bezier";
import { ScrollArea } from "@/components/ui/scroll-area";

export const EditModePanel = () => {
  const {
    bezierEditModeRef,
    editingBezierPath,
    exitBezierEditMode,
    isBezierEditMode,
    curvedLineEditModeRef,
    editingCurvedLine,
    exitCurvedLineEditMode,
    isCurvedLineEditMode,
  } = useCanvas();

  // Handle bezier edit mode
  if (isBezierEditMode && bezierEditModeRef.current && editingBezierPath) {
    const editMode = bezierEditModeRef.current;
    const selectedPath = editingBezierPath as BezierPath;

    if (!editMode.isActive()) {
      return null;
    }

    const selectedAnchorId = editMode.getSelectedAnchorId();
    const bezierPoints = (selectedPath as any).bezierPoints || [];
    const selectedPoint = bezierPoints.find((p: any) => p.id === selectedAnchorId);

    const handleToggleType = () => {
      if (selectedAnchorId) {
        editMode.togglePointType(selectedAnchorId);
      }
    };

    const handleDeletePoint = () => {
      if (selectedAnchorId) {
        editMode.deleteAnchorPoint(selectedAnchorId);
      }
    };

    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold">Edit Mode Active</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                • Click path to add point
              </p>
              <p className="text-xs text-muted-foreground">
                • Click anchor to select
              </p>
              <p className="text-xs text-muted-foreground">
                • Drag handles to reshape
              </p>
            </div>

            {selectedPoint && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-semibold">Selected Anchor</p>

                <div className="flex gap-2">
                  <Button
                    variant={selectedPoint.type === 'smooth' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={handleToggleType}
                  >
                    <Circle size={14} className="mr-1" />
                    Smooth
                  </Button>
                  <Button
                    variant={selectedPoint.type === 'corner' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={handleToggleType}
                  >
                    <Square size={14} className="mr-1" />
                    Corner
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleDeletePoint}
                  disabled={bezierPoints.length <= 2}
                >
                  <Trash size={14} className="mr-1" />
                  Delete Point
                </Button>
              </div>
            )}

            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={exitBezierEditMode}
            >
              <CheckCircle size={16} className="mr-1" />
              Done Editing
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  }

  // Handle curved line edit mode
  if (isCurvedLineEditMode && curvedLineEditModeRef.current && editingCurvedLine) {
    const editMode = curvedLineEditModeRef.current;

    if (!editMode.isActive()) {
      return null;
    }

    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold">Edit Mode Active</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                • Drag the green control point to adjust the curve
              </p>
              <p className="text-xs text-muted-foreground">
                • Dashed lines show the curve control
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={exitCurvedLineEditMode}
            >
              <CheckCircle size={16} className="mr-1" />
              Done Editing
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  }

  return null;
};
