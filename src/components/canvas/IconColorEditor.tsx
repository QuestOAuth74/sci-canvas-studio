import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Check, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconColorEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  svgContent: string;
  iconId?: string;
  onApply: (modifiedSVG: string) => void;
  onSkip: () => void;
}

interface ColorGroup {
  originalColor: string;
  newColor: string;
  count: number;
  normalizedColor: string;
}

// Normalize color to hex for comparison
const normalizeColor = (color: string): string => {
  if (!color || color === 'none' || color === 'transparent') return color;
  
  // Already hex
  if (color.startsWith('#')) {
    // Convert 3-digit hex to 6-digit
    if (color.length === 4) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
    }
    return color.toLowerCase();
  }
  
  // RGB/RGBA
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toLowerCase();
  }
  
  // Named colors - common ones
  const namedColors: Record<string, string> = {
    white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000',
    blue: '#0000ff', yellow: '#ffff00', orange: '#ffa500', purple: '#800080',
    pink: '#ffc0cb', gray: '#808080', grey: '#808080', cyan: '#00ffff',
    magenta: '#ff00ff', brown: '#a52a2a', navy: '#000080', teal: '#008080',
    olive: '#808000', maroon: '#800000', lime: '#00ff00', aqua: '#00ffff',
    silver: '#c0c0c0', fuchsia: '#ff00ff',
  };
  
  return namedColors[color.toLowerCase()] || color;
};

// Predefined color palette for quick selection
const COLOR_PALETTE = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#000080',
  '#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C', '#E6E6FA',
  '#4A90D9', '#50C878', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#74B9FF', '#A29BFE', '#FD79A8', '#00B894',
];

export const IconColorEditor = ({
  open,
  onOpenChange,
  svgContent,
  iconId,
  onApply,
  onSkip
}: IconColorEditorProps) => {
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);

  // Parse SVG and detect unique fill colors
  useEffect(() => {
    if (!svgContent || !open) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      
      // Also check inline styles for fill colors
      const colorMap = new Map<string, number>();
      
      // Find all elements with fill attribute or style
      const allElements = doc.querySelectorAll('*');
      allElements.forEach((el) => {
        // Check fill attribute
        const fill = el.getAttribute('fill');
        if (fill && fill !== 'none' && fill !== 'transparent' && !fill.startsWith('url(')) {
          const normalized = normalizeColor(fill);
          colorMap.set(normalized, (colorMap.get(normalized) || 0) + 1);
        }
        
        // Check style attribute for fill
        const style = el.getAttribute('style');
        if (style) {
          const fillMatch = style.match(/fill:\s*([^;]+)/);
          if (fillMatch && fillMatch[1] !== 'none' && fillMatch[1] !== 'transparent' && !fillMatch[1].startsWith('url(')) {
            const normalized = normalizeColor(fillMatch[1].trim());
            colorMap.set(normalized, (colorMap.get(normalized) || 0) + 1);
          }
        }
      });
      
      // Convert to array and sort by count (most used first)
      const groups: ColorGroup[] = Array.from(colorMap.entries())
        .filter(([color]) => color && color !== 'none' && color !== 'transparent')
        .map(([color, count]) => ({
          originalColor: color,
          newColor: color,
          count,
          normalizedColor: color,
        }))
        .sort((a, b) => b.count - a.count);
      
      setColorGroups(groups);
      updatePreview(svgContent);
    } catch (error) {
      console.error('Error parsing SVG for colors:', error);
    }
  }, [svgContent, open]);

  const updatePreview = (svg: string) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
  };

  // Generate modified SVG with new colors
  const modifiedSVG = useMemo(() => {
    if (!svgContent || colorGroups.length === 0) return svgContent;

    let modified = svgContent;
    
    colorGroups.forEach(({ originalColor, newColor }) => {
      if (originalColor !== newColor) {
        // Replace in fill attributes (case insensitive)
        const fillRegex = new RegExp(`fill=["']${escapeRegExp(originalColor)}["']`, 'gi');
        modified = modified.replace(fillRegex, `fill="${newColor}"`);
        
        // Replace in style attributes
        const styleRegex = new RegExp(`fill:\\s*${escapeRegExp(originalColor)}`, 'gi');
        modified = modified.replace(styleRegex, `fill: ${newColor}`);
      }
    });
    
    return modified;
  }, [svgContent, colorGroups]);

  // Update preview when colors change
  useEffect(() => {
    if (modifiedSVG) {
      updatePreview(modifiedSVG);
    }
  }, [modifiedSVG]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const handleColorChange = (index: number, newColor: string) => {
    setColorGroups(prev => prev.map((group, i) => 
      i === index ? { ...group, newColor } : group
    ));
  };

  const handleReset = () => {
    setColorGroups(prev => prev.map(group => ({
      ...group,
      newColor: group.originalColor
    })));
  };

  const handleApply = () => {
    onApply(modifiedSVG);
    onOpenChange(false);
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  const hasChanges = colorGroups.some(g => g.originalColor !== g.newColor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Customize Icon Colors
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="border-2 rounded-lg p-6 bg-muted/30 flex items-center justify-center min-h-[200px] md:min-h-[280px]">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Icon preview" 
                  className="max-w-full max-h-[240px] object-contain"
                />
              ) : (
                <div className="text-muted-foreground text-sm">Loading...</div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Click a color below to customize it
            </p>
          </div>

          {/* Color Controls */}
          <div className="space-y-2 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Fill Colors ({colorGroups.length} found)
              </Label>
              {hasChanges && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            
            <ScrollArea className="flex-1 pr-3">
              {colorGroups.length > 0 ? (
                <div className="space-y-3">
                  {colorGroups.map((group, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "p-3 border rounded-lg transition-all",
                        selectedColorIndex === index ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: group.newColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground">
                            {group.count} element{group.count > 1 ? 's' : ''}
                          </div>
                          <input
                            type="color"
                            value={group.newColor}
                            onChange={(e) => handleColorChange(index, e.target.value)}
                            className="w-full h-7 cursor-pointer rounded"
                          />
                        </div>
                      </div>
                      
                      {/* Quick palette */}
                      <div className="flex flex-wrap gap-1">
                        {COLOR_PALETTE.slice(0, 12).map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(index, color)}
                            className={cn(
                              "w-5 h-5 rounded-sm border transition-transform hover:scale-110",
                              group.newColor.toLowerCase() === color.toLowerCase() 
                                ? "border-primary ring-1 ring-primary" 
                                : "border-border/50"
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30 text-center">
                  No fill colors detected in this icon
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-2 flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} className="flex-1 sm:flex-none">
            <X className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button onClick={handleApply} className="flex-1 sm:flex-none">
            <Check className="h-4 w-4 mr-2" />
            {hasChanges ? 'Apply Colors' : 'Add to Canvas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper to escape regex special chars
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
