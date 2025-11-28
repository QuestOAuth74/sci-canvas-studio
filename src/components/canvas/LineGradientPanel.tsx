import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCanvas } from "@/contexts/CanvasContext";
import { LineGradientConfig } from "@/types/effects";
import { ShapeWithPorts } from "@/types/connector";

const GRADIENT_PRESETS: { [key: string]: Partial<LineGradientConfig> } = {
  'fade-out': {
    type: 'fade-out',
    solidStartPercent: 40,
    solidEndPercent: 0,
    endOpacity: 0,
  },
  'fade-in': {
    type: 'fade-in',
    solidStartPercent: 0,
    solidEndPercent: 40,
    endOpacity: 0,
  },
  'color-transition': {
    type: 'color-transition',
    solidStartPercent: 0,
    solidEndPercent: 0,
    endOpacity: 1,
  },
  'signal-diminish': {
    type: 'signal-diminish',
    solidStartPercent: 50,
    solidEndPercent: 0,
    endOpacity: 0,
  },
  'black-grey': {
    type: 'black-grey',
    solidStartPercent: 0,
    solidEndPercent: 0,
    endOpacity: 1,
    startColor: '#000000',
    endColor: '#d1d5db',
  },
};

export const LineGradientPanel = () => {
  const { selectedObject, canvas, applyLineGradient, clearLineGradient } = useCanvas();
  const [preset, setPreset] = useState<string>('fade-out');
  const [direction, setDirection] = useState<'along-path' | 'reverse'>('along-path');
  const [startColor, setStartColor] = useState('#3b82f6');
  const [endColor, setEndColor] = useState('#3b82f6');
  const [endOpacity, setEndOpacity] = useState(0.3);
  const [solidStartPercent, setSolidStartPercent] = useState(40);
  const [solidEndPercent, setSolidEndPercent] = useState(0);

  // Load existing gradient config or initialize from stroke color
  useEffect(() => {
    if (!selectedObject) return;

    // Determine target object (connector path, line, or curved line)
    let targetObj: any = selectedObject;
    if (selectedObject.type === 'group' && (selectedObject as any)._objects?.length) {
      const group = selectedObject as any;
      targetObj =
        group._objects.find((obj: any) => obj.type === 'path' || obj.type === 'line') ??
        group._objects[0];
    }

    const gradientConfig = targetObj?.gradientConfig;
    const strokeColor = typeof targetObj?.stroke === 'string' ? targetObj.stroke : undefined;

    if (gradientConfig) {
      setPreset(gradientConfig.type || 'fade-out');
      setDirection(gradientConfig.direction || 'along-path');
      setStartColor(gradientConfig.startColor || strokeColor || '#3b82f6');
      setEndColor(gradientConfig.endColor || strokeColor || '#3b82f6');
      setEndOpacity(
        typeof gradientConfig.endOpacity === 'number' ? gradientConfig.endOpacity : 0.3
      );
      setSolidStartPercent(
        typeof gradientConfig.solidStartPercent === 'number'
          ? gradientConfig.solidStartPercent
          : 40
      );
      setSolidEndPercent(
        typeof gradientConfig.solidEndPercent === 'number'
          ? gradientConfig.solidEndPercent
          : 0
      );
    } else if (strokeColor) {
      // Initialize from current line color if no gradient applied yet
      setStartColor(strokeColor);
      setEndColor(strokeColor);
    }
  }, [selectedObject]);
 
  const connectorGroup =
    selectedObject?.type === 'group' && (selectedObject as any).connectorData;

  const isLineType =
    connectorGroup ||
    (selectedObject as ShapeWithPorts)?.isConnector ||
    selectedObject?.type === 'path' ||
    selectedObject?.type === 'line' ||
    (selectedObject as any)?.isCurvedLine;
  
  if (!selectedObject || !isLineType) {
    return null;
  }

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const presetConfig = GRADIENT_PRESETS[value];
    if (presetConfig) {
      if (presetConfig.solidStartPercent !== undefined) setSolidStartPercent(presetConfig.solidStartPercent);
      if (presetConfig.solidEndPercent !== undefined) setSolidEndPercent(presetConfig.solidEndPercent);
      if (presetConfig.endOpacity !== undefined) setEndOpacity(presetConfig.endOpacity);
      // Also set colors for presets that define them
      if (presetConfig.startColor) setStartColor(presetConfig.startColor);
      if (presetConfig.endColor) setEndColor(presetConfig.endColor);
    }
  };

  const handleApplyGradient = () => {
    if (!canvas || !selectedObject) return;

    const config: LineGradientConfig = {
      type: preset as any,
      direction,
      solidStartPercent,
      solidEndPercent,
      startColor,
      endColor,
      endOpacity,
      stops: [
        { color: startColor, offset: 0, opacity: 1 },
        { color: startColor, offset: solidStartPercent / 100, opacity: 1 },
        { color: endColor, offset: 1 - solidEndPercent / 100, opacity: endOpacity },
        { color: endColor, offset: 1, opacity: endOpacity },
      ],
    };

    applyLineGradient(config);
  };

  const handleClearGradient = () => {
    if (!canvas || !selectedObject) return;
    clearLineGradient();
  };

  return (
    <div className="space-y-4 pt-4">
      <div>
        <h3 className="text-sm font-semibold mb-3">Line Gradient</h3>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Preset</Label>
            <Select value={preset} onValueChange={handlePresetChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade-out">Fade Out (Signal Weakening)</SelectItem>
                <SelectItem value="fade-in">Fade In (Signal Amplification)</SelectItem>
                <SelectItem value="color-transition">Color Transition</SelectItem>
                <SelectItem value="signal-diminish">Signal Diminish</SelectItem>
                <SelectItem value="black-grey">Black to Light Grey</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as any)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="along-path">Along Path</SelectItem>
                <SelectItem value="reverse">Reverse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <Label className="text-xs mb-2 block">Start Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={startColor}
                onChange={(e) => setStartColor(e.target.value)}
                className="w-12 h-8 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={startColor}
                onChange={(e) => setStartColor(e.target.value)}
                className="flex-1 h-8 px-2 text-xs border rounded"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">End Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={endColor}
                onChange={(e) => setEndColor(e.target.value)}
                className="w-12 h-8 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={endColor}
                onChange={(e) => setEndColor(e.target.value)}
                className="flex-1 h-8 px-2 text-xs border rounded"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">End Opacity: {Math.round(endOpacity * 100)}%</Label>
            <Slider
              value={[endOpacity * 100]}
              onValueChange={(v) => setEndOpacity(v[0] / 100)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <Separator />

          <div>
            <Label className="text-xs mb-2 block">Solid Start: {solidStartPercent}%</Label>
            <Slider
              value={[solidStartPercent]}
              onValueChange={(v) => setSolidStartPercent(v[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              How much of the line remains solid before gradient starts
            </p>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Solid End: {solidEndPercent}%</Label>
            <Slider
              value={[solidEndPercent]}
              onValueChange={(v) => setSolidEndPercent(v[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              How much of the line remains solid after gradient ends
            </p>
          </div>

          <Separator />

          {/* Preview */}
          <div>
            <Label className="text-xs mb-2 block">Preview</Label>
            <div 
              className="h-8 rounded border"
              style={{
                background: `linear-gradient(90deg, 
                  ${startColor} 0%, 
                  ${startColor} ${solidStartPercent}%, 
                  ${endColor}${Math.round(endOpacity * 255).toString(16).padStart(2, '0')} ${100 - solidEndPercent}%, 
                  ${endColor}${Math.round(endOpacity * 255).toString(16).padStart(2, '0')} 100%
                )`
              }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleApplyGradient} size="sm" className="flex-1">
              Apply Gradient
            </Button>
            <Button onClick={handleClearGradient} variant="outline" size="sm" className="flex-1">
              Clear Gradient
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
