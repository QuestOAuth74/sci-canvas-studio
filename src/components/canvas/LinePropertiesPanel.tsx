import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useCanvas } from "@/contexts/CanvasContext";
import { ShapeWithPorts, ArrowMarkerType, LineStyle, RoutingStyle } from "@/types/connector";

export const LinePropertiesPanel = () => {
  const { selectedObject, canvas } = useCanvas();

  if (!selectedObject || !(selectedObject as ShapeWithPorts).isConnector) {
    return null;
  }

  const connector = selectedObject as ShapeWithPorts;
  const data = connector.connectorData;

  if (!data) return null;

  const handleStartMarkerChange = (value: ArrowMarkerType) => {
    if (data) {
      data.startMarker = value;
      canvas?.renderAll();
    }
  };

  const handleEndMarkerChange = (value: ArrowMarkerType) => {
    if (data) {
      data.endMarker = value;
      canvas?.renderAll();
    }
  };

  const handleLineStyleChange = (value: LineStyle) => {
    if (data) {
      data.lineStyle = value;
      canvas?.renderAll();
    }
  };

  const handleRoutingStyleChange = (value: RoutingStyle) => {
    if (data) {
      data.routingStyle = value;
      canvas?.renderAll();
    }
  };

  const handleStrokeWidthChange = (value: number[]) => {
    if (data) {
      data.strokeWidth = value[0];
      connector.set({ strokeWidth: value[0] } as any);
      canvas?.renderAll();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-3">Line Properties</h3>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Start Marker</Label>
            <Select value={data.startMarker} onValueChange={handleStartMarkerChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="arrow">Arrow</SelectItem>
                <SelectItem value="open-arrow">Open Arrow</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="block">Block</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">End Marker</Label>
            <Select value={data.endMarker} onValueChange={handleEndMarkerChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="arrow">Arrow</SelectItem>
                <SelectItem value="open-arrow">Open Arrow</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="block">Block</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <Label className="text-xs">Line Style</Label>
            <Select value={data.lineStyle} onValueChange={handleLineStyleChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="dash-dot">Dash-Dot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Routing Style</Label>
            <Select value={data.routingStyle} onValueChange={handleRoutingStyleChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight">Straight</SelectItem>
                <SelectItem value="curved">Curved</SelectItem>
                <SelectItem value="orthogonal">Orthogonal (90°)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <Label className="text-xs mb-2 block">Stroke Width: {data.strokeWidth}px</Label>
            <Slider
              value={[data.strokeWidth]}
              onValueChange={handleStrokeWidthChange}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
