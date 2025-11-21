import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCanvas } from "@/contexts/CanvasContext";
import { createTextOnPath, isValidPath, updateTextOnPath, isTextOnPath } from "@/lib/textOnPath";
import { Type, Circle, Spline } from "lucide-react";
import { FabricObject, Path, Circle as FabricCircle, Ellipse } from "fabric";

export const TextOnPathTool = () => {
  const { canvas, selectedObject } = useCanvas();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("Sample Text");
  const [fontSize, setFontSize] = useState(24);
  const [offset, setOffset] = useState(0);
  const [alignmentOffset, setAlignmentOffset] = useState(0);
  const [flipText, setFlipText] = useState(false);
  const [selectedPath, setSelectedPath] = useState<FabricObject | null>(null);

  // Check if current selection is a valid path
  useEffect(() => {
    if (selectedObject && isValidPath(selectedObject)) {
      setSelectedPath(selectedObject);
    } else {
      setSelectedPath(null);
    }
  }, [selectedObject]);

  const handleCreateTextOnPath = () => {
    if (!canvas) {
      toast.error("Canvas not initialized");
      return;
    }

    let pathToUse = selectedPath;

    // If no path selected, create a default circle
    if (!pathToUse) {
      const circle = new FabricCircle({
        radius: 100,
        fill: 'transparent',
        stroke: '#cccccc',
        strokeWidth: 2,
        left: canvas.width! / 2 - 100,
        top: canvas.height! / 2 - 100,
      });
      
      canvas.add(circle);
      pathToUse = circle;
      toast.info("Created a default circle path");
    }

    try {
      // Create text on path
      const textOnPathGroup = createTextOnPath(text, pathToUse, {
        fontSize,
        fontFamily: 'Arial',
        fill: '#000000',
        offset,
        alignmentOffset: alignmentOffset / 100,
        flipText,
      });

      // Add to canvas
      canvas.add(textOnPathGroup);
      canvas.setActiveObject(textOnPathGroup);
      canvas.requestRenderAll();

      toast.success("Text on path created!");
      setOpen(false);

      // Reset form
      setText("Sample Text");
      setFontSize(24);
      setOffset(0);
      setAlignmentOffset(0);
      setFlipText(false);
    } catch (error) {
      console.error("Error creating text on path:", error);
      toast.error("Failed to create text on path");
    }
  };

  const handleUpdateTextOnPath = () => {
    if (!canvas || !selectedObject || !isTextOnPath(selectedObject)) {
      toast.error("Please select a text-on-path object");
      return;
    }

    // Find the associated path (for now, use selected path or create new one)
    let pathToUse = selectedPath;
    if (!pathToUse) {
      // Try to find a path on canvas
      const objects = canvas.getObjects();
      pathToUse = objects.find(obj => isValidPath(obj)) || null;
    }

    if (!pathToUse) {
      toast.error("No path found to update text on");
      return;
    }

    try {
      // Remove old group
      canvas.remove(selectedObject);

      // Create updated text on path
      const updatedGroup = updateTextOnPath(selectedObject as any, pathToUse, {
        text,
        fontSize,
        offset,
        alignmentOffset: alignmentOffset / 100,
        flipText,
      });

      // Add new group
      canvas.add(updatedGroup);
      canvas.setActiveObject(updatedGroup);
      canvas.requestRenderAll();

      toast.success("Text on path updated!");
    } catch (error) {
      console.error("Error updating text on path:", error);
      toast.error("Failed to update text on path");
    }
  };

  const isEditMode = selectedObject && isTextOnPath(selectedObject);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Type className="h-4 w-4" />
        <Spline className="h-3 w-3" />
        Text on Path
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Text on Path" : "Create Text on Path"}
            </DialogTitle>
            <DialogDescription>
              {selectedPath
                ? "Add text that follows the selected path"
                : "Add text that follows a circular path"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="text">Text</Label>
              <Input
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text..."
              />
            </div>

            <div className="space-y-2">
              <Label>Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={10}
                max={72}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Offset from Path: {offset}px</Label>
              <Slider
                value={[offset]}
                onValueChange={(value) => setOffset(value[0])}
                min={-100}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Positive moves text outside, negative moves inside
              </p>
            </div>

            <div className="space-y-2">
              <Label>Position Along Path: {alignmentOffset}%</Label>
              <Slider
                value={[alignmentOffset]}
                onValueChange={(value) => setAlignmentOffset(value[0])}
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="flip">Flip Text Orientation</Label>
              <Switch
                id="flip"
                checked={flipText}
                onCheckedChange={setFlipText}
              />
            </div>

            {!selectedPath && !isEditMode && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">
                  <Circle className="inline h-4 w-4 mr-1" />
                  No path selected. A default circle will be created.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={isEditMode ? handleUpdateTextOnPath : handleCreateTextOnPath}>
              {isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
