import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Type, LayoutGrid, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PresentationSettings {
  primaryColor: string;
  accentColor: string;
  fontPairing: string;
  layoutDensity: 'minimal' | 'balanced' | 'detailed';
}

interface PowerPointSettingsPanelProps {
  settings: PresentationSettings;
  onSettingsChange: (settings: PresentationSettings) => void;
}

const COLOR_PRESETS = [
  { name: 'Professional Blue', primary: '#2563EB', accent: '#3B82F6', category: 'professional' },
  { name: 'Corporate Navy', primary: '#1E40AF', accent: '#60A5FA', category: 'professional' },
  { name: 'Academic Purple', primary: '#7C3AED', accent: '#A78BFA', category: 'academic' },
  { name: 'Creative Coral', primary: '#EF4444', accent: '#F87171', category: 'creative' },
  { name: 'Nature Green', primary: '#059669', accent: '#34D399', category: 'creative' },
  { name: 'Modern Slate', primary: '#475569', accent: '#64748B', category: 'professional' },
  { name: 'Energy Orange', primary: '#EA580C', accent: '#FB923C', category: 'creative' },
  { name: 'Tech Cyan', primary: '#0891B2', accent: '#22D3EE', category: 'professional' },
];

const FONT_PAIRINGS = [
  {
    id: 'modern-sans',
    name: 'Modern Sans',
    heading: 'Inter',
    body: 'Inter',
    description: 'Clean and professional',
    category: 'professional',
  },
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    heading: 'Playfair Display',
    body: 'Source Serif Pro',
    description: 'Elegant and traditional',
    category: 'academic',
  },
  {
    id: 'tech-mono',
    name: 'Tech Mono',
    heading: 'Space Grotesk',
    body: 'IBM Plex Mono',
    description: 'Technical and modern',
    category: 'professional',
  },
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    heading: 'Montserrat',
    body: 'Open Sans',
    description: 'Strong and readable',
    category: 'creative',
  },
  {
    id: 'minimal-geometric',
    name: 'Minimal Geometric',
    heading: 'Poppins',
    body: 'Poppins',
    description: 'Simple and friendly',
    category: 'creative',
  },
];

export function PowerPointSettingsPanel({ settings, onSettingsChange }: PowerPointSettingsPanelProps) {
  const [selectedColorPreset, setSelectedColorPreset] = useState<number | null>(null);

  const handleColorPresetSelect = (index: number) => {
    const preset = COLOR_PRESETS[index];
    setSelectedColorPreset(index);
    onSettingsChange({
      ...settings,
      primaryColor: preset.primary,
      accentColor: preset.accent,
    });
  };

  const handleFontPairingChange = (fontId: string) => {
    onSettingsChange({
      ...settings,
      fontPairing: fontId,
    });
  };

  const handleLayoutDensityChange = (density: 'minimal' | 'balanced' | 'detailed') => {
    onSettingsChange({
      ...settings,
      layoutDensity: density,
    });
  };

  return (
    <div className="space-y-6">
      {/* Color Palette Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Color Palette</CardTitle>
              <CardDescription>Choose a color scheme for your presentation</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLOR_PRESETS.map((preset, index) => (
              <button
                key={index}
                onClick={() => handleColorPresetSelect(index)}
                className={cn(
                  "relative group p-3 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-md",
                  selectedColorPreset === index
                    ? "border-primary shadow-lg"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg shadow-sm"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded-lg shadow-sm"
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
                <p className="text-xs font-medium truncate">{preset.name}</p>
                <Badge
                  variant="secondary"
                  className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5"
                >
                  {preset.category}
                </Badge>
                {selectedColorPreset === index && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl">
                    <div className="p-1 bg-primary rounded-full">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, primaryColor: e.target.value })
                  }
                  className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, primaryColor: e.target.value })
                  }
                  className="flex-1 h-10 px-3 rounded-lg border-2 border-border font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Accent Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, accentColor: e.target.value })
                  }
                  className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.accentColor}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, accentColor: e.target.value })
                  }
                  className="flex-1 h-10 px-3 rounded-lg border-2 border-border font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Font Pairing Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Type className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Font Pairing</CardTitle>
              <CardDescription>Select typography for headings and body text</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup value={settings.fontPairing} onValueChange={handleFontPairingChange}>
            <div className="space-y-2">
              {FONT_PAIRINGS.map((pairing) => (
                <label
                  key={pairing.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/5",
                    settings.fontPairing === pairing.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border"
                  )}
                >
                  <RadioGroupItem value={pairing.id} id={pairing.id} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{pairing.name}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {pairing.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{pairing.description}</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs text-muted-foreground">
                        H: <span className="font-medium text-foreground">{pairing.heading}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        B: <span className="font-medium text-foreground">{pairing.body}</span>
                      </span>
                    </div>
                  </div>
                  {settings.fontPairing === pairing.id && (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Layout Density Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutGrid className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Layout Density</CardTitle>
              <CardDescription>Control content spacing and slide density</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                value: 'minimal' as const,
                label: 'Minimal',
                description: 'Generous spacing, fewer bullets',
                icon: '▢',
              },
              {
                value: 'balanced' as const,
                label: 'Balanced',
                description: 'Optimal spacing and content',
                icon: '▦',
              },
              {
                value: 'detailed' as const,
                label: 'Detailed',
                description: 'Maximum content per slide',
                icon: '▩',
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleLayoutDensityChange(option.value)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all hover:scale-105",
                  settings.layoutDensity === option.value
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-3xl mb-2">{option.icon}</div>
                <p className="font-semibold text-sm mb-1">{option.label}</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {option.description}
                </p>
                {settings.layoutDensity === option.value && (
                  <div className="mt-2 flex justify-center">
                    <div className="p-0.5 bg-primary rounded-full">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
