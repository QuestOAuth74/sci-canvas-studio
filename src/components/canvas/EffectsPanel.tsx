import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useCanvas } from "@/contexts/CanvasContext";
import { useState, useEffect } from "react";
import { ShadowConfig, SHADOW_PRESETS } from "@/types/effects";
import { Separator } from "@/components/ui/separator";

export const EffectsPanel = () => {
  const { selectedObject, applyShadow, clearEffects, addToRecentColors } = useCanvas();
  
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [blur, setBlur] = useState(10);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(4);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [opacity, setOpacity] = useState(0.3);

  useEffect(() => {
    if (selectedObject) {
      const shadow = (selectedObject as any).shadow;
      if (shadow) {
        setShadowEnabled(true);
        setBlur(shadow.blur || 10);
        setOffsetX(shadow.offsetX || 0);
        setOffsetY(shadow.offsetY || 4);
        setShadowColor(shadow.color || '#000000');
        setOpacity(shadow.opacity !== undefined ? shadow.opacity : 0.3);
      } else {
        setShadowEnabled(false);
      }
    }
  }, [selectedObject]);

  const handleApply = () => {
    const config: ShadowConfig = {
      enabled: shadowEnabled,
      blur,
      offsetX,
      offsetY,
      color: shadowColor,
      opacity
    };
    applyShadow(config);
    if (shadowEnabled) {
      addToRecentColors(shadowColor);
    }
  };

  const handlePresetApply = (preset: typeof SHADOW_PRESETS[0]) => {
    setShadowEnabled(true);
    setBlur(preset.blur);
    setOffsetX(preset.offsetX);
    setOffsetY(preset.offsetY);
    setShadowColor(preset.color);
    setOpacity(preset.opacity);
    
    // Auto-apply preset
    setTimeout(() => {
      applyShadow({
        enabled: true,
        blur: preset.blur,
        offsetX: preset.offsetX,
        offsetY: preset.offsetY,
        color: preset.color,
        opacity: preset.opacity
      });
    }, 0);
  };

  const handleClearAll = () => {
    setShadowEnabled(false);
    clearEffects();
  };

  return (
    <div className="space-y-3">
      {/* Drop Shadow */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox 
            id="shadow" 
            checked={shadowEnabled}
            onCheckedChange={(checked) => setShadowEnabled(checked as boolean)}
            disabled={!selectedObject}
          />
          <Label htmlFor="shadow" className="font-semibold text-xs">Drop Shadow</Label>
        </div>

        {shadowEnabled && (
          <>
            <div className="pl-6 space-y-3">
              {/* Color */}
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-7 w-14 cursor-pointer"
                    value={shadowColor}
                    onChange={(e) => setShadowColor(e.target.value)}
                    disabled={!selectedObject}
                  />
                  <Input
                    type="text"
                    className="h-7 flex-1 text-xs font-mono"
                    value={shadowColor}
                    onChange={(e) => setShadowColor(e.target.value)}
                    disabled={!selectedObject}
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Blur */}
              <div className="space-y-1.5">
                <Label className="text-xs">Blur</Label>
                <div className="flex gap-2 items-center">
                  <Slider 
                    value={[blur]} 
                    min={0} 
                    max={50} 
                    step={1}
                    onValueChange={([v]) => setBlur(v)}
                    disabled={!selectedObject}
                    className="flex-1"
                  />
                  <Input 
                    type="number" 
                    value={blur}
                    onChange={(e) => setBlur(Number(e.target.value))}
                    className="h-7 w-16 text-xs"
                    disabled={!selectedObject}
                    min={0}
                    max={50}
                  />
                </div>
              </div>

              {/* Offset X */}
              <div className="space-y-1.5">
                <Label className="text-xs">Offset X</Label>
                <div className="flex gap-2 items-center">
                  <Slider 
                    value={[offsetX]} 
                    min={-50} 
                    max={50} 
                    step={1}
                    onValueChange={([v]) => setOffsetX(v)}
                    disabled={!selectedObject}
                    className="flex-1"
                  />
                  <Input 
                    type="number" 
                    value={offsetX}
                    onChange={(e) => setOffsetX(Number(e.target.value))}
                    className="h-7 w-16 text-xs"
                    disabled={!selectedObject}
                    min={-50}
                    max={50}
                  />
                </div>
              </div>

              {/* Offset Y */}
              <div className="space-y-1.5">
                <Label className="text-xs">Offset Y</Label>
                <div className="flex gap-2 items-center">
                  <Slider 
                    value={[offsetY]} 
                    min={-50} 
                    max={50} 
                    step={1}
                    onValueChange={([v]) => setOffsetY(v)}
                    disabled={!selectedObject}
                    className="flex-1"
                  />
                  <Input 
                    type="number" 
                    value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
                    className="h-7 w-16 text-xs"
                    disabled={!selectedObject}
                    min={-50}
                    max={50}
                  />
                </div>
              </div>

              {/* Opacity */}
              <div className="space-y-1.5">
                <Label className="text-xs">Opacity</Label>
                <Slider 
                  value={[opacity * 100]} 
                  min={0} 
                  max={100} 
                  step={1}
                  onValueChange={([v]) => setOpacity(v / 100)}
                  disabled={!selectedObject}
                />
                <p className="text-xs text-muted-foreground text-right">{(opacity * 100).toFixed(0)}%</p>
              </div>
            </div>

            {/* Apply Button */}
            <Button
              onClick={handleApply}
              className="w-full h-8 text-xs"
              disabled={!selectedObject}
            >
              Apply Shadow
            </Button>

            <Separator />

            {/* Presets */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Shadow Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {SHADOW_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetApply(preset)}
                    disabled={!selectedObject}
                    className="h-auto flex-col items-center p-3 hover:border-primary"
                  >
                    <div 
                      className="w-12 h-12 bg-primary rounded mb-2"
                      style={{
                        boxShadow: `${preset.offsetX}px ${preset.offsetY}px ${preset.blur}px ${preset.color}${Math.round(preset.opacity * 255).toString(16).padStart(2, '0')}`
                      }}
                    />
                    <span className="text-xs font-medium">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Clear All Effects */}
      <Button
        onClick={handleClearAll}
        variant="outline"
        className="w-full h-8 text-xs"
        disabled={!selectedObject}
      >
        Clear All Effects
      </Button>
    </div>
  );
};
