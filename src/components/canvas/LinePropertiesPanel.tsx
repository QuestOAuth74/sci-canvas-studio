import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCanvas } from "@/contexts/CanvasContext";
import { ShapeWithPorts, ArrowMarkerType, LineStyle, RoutingStyle } from "@/types/connector";

const THICKNESS_PRESETS = [
  { label: 'Thin', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'Thick', value: 4 },
  { label: 'Extra Thick', value: 6 },
];

// Standard markers
const STANDARD_MARKERS: { value: ArrowMarkerType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'open-arrow', label: 'Open Arrow' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'circle', label: 'Circle' },
  { value: 'block', label: 'Block' },
  { value: 'tee', label: 'T-bar' },
];

// Biological pathway markers
const BIOLOGICAL_MARKERS: { value: ArrowMarkerType; label: string; description: string }[] = [
  { value: 'inhibition', label: 'Inhibition', description: 'Blocks/inhibits target' },
  { value: 'activation', label: 'Activation', description: 'Activates target' },
  { value: 'phosphorylation', label: 'Phosphorylation', description: 'Adds phosphate group' },
  { value: 'binding', label: 'Binding', description: 'Complex formation' },
  { value: 'catalysis', label: 'Catalysis', description: 'Enzyme activity' },
  { value: 'stimulation', label: 'Stimulation', description: 'Positive regulation' },
];

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
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">Standard</SelectLabel>
                  {STANDARD_MARKERS.map(marker => (
                    <SelectItem key={marker.value} value={marker.value}>{marker.label}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">Biological Pathway</SelectLabel>
                  {BIOLOGICAL_MARKERS.map(marker => (
                    <SelectItem key={marker.value} value={marker.value}>
                      <span className="flex items-center gap-2">
                        {marker.label}
                        <span className="text-[10px] text-muted-foreground">({marker.description})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
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
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">Standard</SelectLabel>
                  {STANDARD_MARKERS.map(marker => (
                    <SelectItem key={marker.value} value={marker.value}>{marker.label}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">Biological Pathway</SelectLabel>
                  {BIOLOGICAL_MARKERS.map(marker => (
                    <SelectItem key={marker.value} value={marker.value}>
                      <span className="flex items-center gap-2">
                        {marker.label}
                        <span className="text-[10px] text-muted-foreground">({marker.description})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
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
            
            {/* Quick Preset Buttons */}
            <div className="flex gap-1 mb-3">
              {THICKNESS_PRESETS.map((preset) => (
                <Tooltip key={preset.value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={data.strokeWidth === preset.value ? "default" : "outline"}
                      size="sm"
                      className="flex-1 h-8 px-2"
                      onClick={() => handleStrokeWidthChange([preset.value])}
                    >
                      <div 
                        className="w-full rounded-full bg-current"
                        style={{ height: `${Math.min(preset.value * 1.5, 6)}px` }}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{preset.label} ({preset.value}px)</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            
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
