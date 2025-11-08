import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";

const EXPORT_PRESETS = [
  {
    name: "Web (Standard)",
    format: 'png' as const,
    dpi: 150 as const,
    description: "Perfect for websites and presentations"
  },
  {
    name: "Print (High Quality)",
    format: 'png' as const,
    dpi: 300 as const,
    description: "Suitable for professional printing"
  },
  {
    name: "Print (Publication)",
    format: 'png' as const,
    dpi: 600 as const,
    description: "Magazine and publication quality"
  },
  {
    name: "Transparent PNG",
    format: 'png-transparent' as const,
    dpi: 300 as const,
    description: "High quality with no background"
  },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'png' | 'png-transparent' | 'jpg', dpi: 150 | 300 | 600, selectionOnly?: boolean) => void;
  canvasWidth: number;
  canvasHeight: number;
  hasSelection: boolean;
}

export const ExportDialog = ({ open, onOpenChange, onExport, canvasWidth, canvasHeight, hasSelection }: ExportDialogProps) => {
  const [format, setFormat] = useState<'png' | 'png-transparent' | 'jpg'>('png');
  const [dpi, setDpi] = useState<150 | 300 | 600>(300);
  const [selectionOnly, setSelectionOnly] = useState(false);

  // Load preferences from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem('export_preferences');
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          if (prefs.format) setFormat(prefs.format);
          if (prefs.dpi) setDpi(prefs.dpi);
        } catch (e) {
          console.error('Failed to load export preferences:', e);
        }
      }
    }
  }, [open]);

  // Calculate export dimensions based on DPI
  const calculateDimensions = (targetDpi: number) => {
    const multiplier = targetDpi / 300;
    return {
      width: Math.round(canvasWidth * multiplier),
      height: Math.round(canvasHeight * multiplier)
    };
  };

  // Estimate file size based on dimensions and format
  const estimateFileSize = (width: number, height: number, format: string) => {
    const pixels = width * height;
    const bytesPerPixel = format === 'jpg' ? 0.5 : 3;
    const estimatedBytes = pixels * bytesPerPixel;
    
    if (estimatedBytes < 1024 * 1024) {
      return `~${Math.round(estimatedBytes / 1024)} KB`;
    }
    return `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const dimensions = calculateDimensions(dpi);
  const fileSize = estimateFileSize(dimensions.width, dimensions.height, format);

  const applyPreset = (preset: typeof EXPORT_PRESETS[0]) => {
    setFormat(preset.format);
    setDpi(preset.dpi);
  };

  const handleExport = () => {
    // Save preferences to localStorage
    localStorage.setItem('export_preferences', JSON.stringify({ format, dpi }));
    onExport(format, dpi, selectionOnly);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
          <DialogDescription>
            Choose your export format and quality settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* Export Presets */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_PRESETS.map(preset => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-start text-left hover:bg-accent"
                  onClick={() => applyPreset(preset)}
                >
                  <span className="font-medium text-sm">{preset.name}</span>
                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Selection Only Option */}
          {hasSelection && (
            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-accent/50">
              <Checkbox 
                id="selection-only" 
                checked={selectionOnly}
                onCheckedChange={(checked) => setSelectionOnly(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="selection-only" className="font-medium cursor-pointer">Export selected objects only</Label>
                <p className="text-sm text-muted-foreground">Only export currently selected items</p>
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as typeof format)}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="png" id="png" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="png" className="font-medium cursor-pointer">PNG</Label>
                  <p className="text-sm text-muted-foreground">Lossless quality with background</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="png-transparent" id="png-transparent" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="png-transparent" className="font-medium cursor-pointer">PNG (Transparent)</Label>
                  <p className="text-sm text-muted-foreground">Lossless quality, no background</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="jpg" id="jpg" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="jpg" className="font-medium cursor-pointer">JPG</Label>
                  <p className="text-sm text-muted-foreground">Smaller file size, no transparency</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* DPI Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Quality (DPI)</Label>
            <RadioGroup value={dpi.toString()} onValueChange={(v) => setDpi(parseInt(v) as typeof dpi)}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="150" id="dpi-150" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="dpi-150" className="font-medium cursor-pointer">150 DPI - Screen & Web</Label>
                  <p className="text-sm text-muted-foreground">Perfect for digital viewing, smaller files</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="300" id="dpi-300" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="dpi-300" className="font-medium cursor-pointer">300 DPI - Print Quality</Label>
                  <p className="text-sm text-muted-foreground">Recommended for publications and printing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="600" id="dpi-600" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="dpi-600" className="font-medium cursor-pointer">600 DPI - Professional</Label>
                  <p className="text-sm text-muted-foreground">Large format printing, largest files</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold">Export Preview</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Dimensions:</span>
                <p className="font-medium">{dimensions.width} × {dimensions.height} px</p>
              </div>
              <div>
                <span className="text-muted-foreground">Est. file size:</span>
                <p className="font-medium">{fileSize}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
