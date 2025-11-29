import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useCanvas } from "@/contexts/CanvasContext";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

export const VertexEditingPanel = () => {
  const {
    vertexEditingEnabled,
    setVertexEditingEnabled,
    vertexCount,
  } = useCanvas();

  const [density, setDensity] = useState(50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="vertex-editing" className="text-sm font-medium">
          Edit Vertices
        </Label>
        <Switch
          id="vertex-editing"
          checked={vertexEditingEnabled}
          onCheckedChange={setVertexEditingEnabled}
        />
      </div>

      {vertexEditingEnabled && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Vertex Count</span>
              <span className="font-medium">{vertexCount}</span>
            </div>

            <div className="text-xs text-muted-foreground">
              <strong>Activation:</strong> Double-click on a shape or line to activate vertex editing.
              <br />
              <strong>Usage:</strong> Drag vertex handles to reshape. Double-click on edges to add new vertices.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vertex-density" className="text-sm">
              Vertex Density
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDensity(Math.max(0, density - 10))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Slider
                id="vertex-density"
                min={0}
                max={100}
                step={10}
                value={[density]}
                onValueChange={(values) => setDensity(values[0])}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDensity(Math.min(100, density + 10))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Adjust number of editable points for freeform lines
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // TODO: Implement reset to original
                console.log('Reset to original vertices');
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Original
            </Button>

            <div className="text-xs text-muted-foreground">
              <strong>Keyboard Shortcuts:</strong>
              <br />
              • Double-click shape/line - Activate vertex editing
              <br />
              • Double-click edge - Add vertex at that position
              <br />
              • V - Toggle vertex editing mode
              <br />
              • ESC - Exit vertex editing
            </div>
          </div>
        </>
      )}
    </div>
  );
};
