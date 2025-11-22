import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ColorPickerSectionProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  recentColors?: string[];
  palette?: string[];
  showHex?: boolean;
}

const DEFAULT_PALETTE = [
  "#3b82f6", "#0D9488", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4",
  "#ffffff", "#000000", "#6b7280", "#f3f4f6",
];

export const ColorPickerSection = ({
  label,
  value,
  onChange,
  recentColors = [],
  palette = DEFAULT_PALETTE,
  showHex = true,
}: ColorPickerSectionProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      
      {/* Color Grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {palette.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className="w-full aspect-square rounded border-2 hover:scale-110 transition-all duration-200"
            style={{ 
              backgroundColor: color,
              borderColor: value === color ? 'hsl(var(--primary))' : 'hsl(var(--border))',
            }}
            title={color}
          />
        ))}
      </div>

      {/* Color Input */}
      {showHex && (
        <div className="flex items-center gap-2">
          <Input 
            type="color" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-14 p-1 cursor-pointer" 
          />
          <Input 
            type="text" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 text-xs flex-1 font-mono" 
            placeholder="#000000"
          />
        </div>
      )}

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Recent</Label>
          <div className="flex gap-1 flex-wrap">
            {recentColors.map((color, idx) => (
              <Button
                key={`${color}-${idx}`}
                variant="outline"
                size="icon"
                className="h-7 w-7 p-0 border-2 hover:scale-110 transition-all duration-200"
                style={{ 
                  backgroundColor: color,
                  borderColor: value === color ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                }}
                onClick={() => onChange(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
