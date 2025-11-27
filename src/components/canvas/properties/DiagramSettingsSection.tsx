import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PAPER_SIZES, getPaperSize } from "@/types/paperSizes";
import { Grid3x3, Ruler, Palette, FileText } from "lucide-react";

interface DiagramSettingsSectionProps {
  gridEnabled: boolean;
  setGridEnabled: (enabled: boolean) => void;
  rulersEnabled: boolean;
  setRulersEnabled: (enabled: boolean) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  paperSize: string;
  setPaperSize: (size: string) => void;
  canvasDimensions: { width: number; height: number };
  showBgColor: boolean;
  setShowBgColor: (show: boolean) => void;
}

export const DiagramSettingsSection = ({
  gridEnabled,
  setGridEnabled,
  rulersEnabled,
  setRulersEnabled,
  backgroundColor,
  setBackgroundColor,
  paperSize,
  setPaperSize,
  canvasDimensions,
  showBgColor,
  setShowBgColor,
}: DiagramSettingsSectionProps) => {
  return (
    <Accordion type="multiple" defaultValue={["view", "background"]} className="w-full">
      {/* View Settings */}
      <AccordionItem value="view" className="border-none">
        <AccordionTrigger className="py-3 px-3 hover:bg-accent/50 rounded-lg hover:no-underline">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">View</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3 pt-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded hover:bg-accent/30 transition-colors">
              <Label htmlFor="grid" className="text-xs cursor-pointer flex items-center gap-2">
                <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
                Grid
              </Label>
              <Checkbox 
                id="grid" 
                checked={gridEnabled}
                onCheckedChange={(checked) => setGridEnabled(checked as boolean)}
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded hover:bg-accent/30 transition-colors">
              <Label htmlFor="rulers" className="text-xs cursor-pointer flex items-center gap-2">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                Rulers
              </Label>
              <Checkbox 
                id="rulers" 
                checked={rulersEnabled}
                onCheckedChange={(checked) => setRulersEnabled(checked as boolean)}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Background Settings */}
      <AccordionItem value="background" className="border-none">
        <AccordionTrigger className="py-3 px-3 hover:bg-accent/50 rounded-lg hover:no-underline">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">Background</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3 pt-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded hover:bg-accent/30 transition-colors">
              <Label htmlFor="bg-color-toggle" className="text-xs cursor-pointer">Custom Color</Label>
              <Checkbox 
                id="bg-color-toggle"
                checked={showBgColor}
                onCheckedChange={(checked) => setShowBgColor(checked as boolean)}
              />
            </div>
            {showBgColor && (
              <div className="flex items-center gap-2 p-2 bg-accent/20 rounded">
                <Input 
                  type="color" 
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-9 w-14 p-1 cursor-pointer" 
                />
                <Input 
                  type="text" 
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-9 text-xs flex-1 font-mono" 
                  placeholder="#ffffff"
                />
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Paper Size Settings */}
      <AccordionItem value="paper" className="border-none">
        <AccordionTrigger className="py-3 px-3 hover:bg-accent/50 rounded-lg hover:no-underline">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">Paper Size</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3 pt-1">
          <div className="space-y-3">
            <Select value={paperSize} onValueChange={setPaperSize}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {/* Custom Section */}
                {PAPER_SIZES.filter(s => s.category === 'custom').map((size) => (
                  <SelectItem key={size.id} value={size.id} className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{size.name}</span>
                      <span className="text-xs text-muted-foreground">{size.description}</span>
                    </div>
                  </SelectItem>
                ))}
                
                {/* Journal Figures Section */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-2">
                  📊 Journal Figures
                </div>
                {PAPER_SIZES.filter(s => s.category === 'journal').map((size) => (
                  <SelectItem key={size.id} value={size.id} className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{size.name}</span>
                      <span className="text-xs text-muted-foreground">{size.description}</span>
                    </div>
                  </SelectItem>
                ))}
                
                {/* Standard Paper Section */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-2">
                  📄 Standard Paper
                </div>
                {PAPER_SIZES.filter(s => s.category === 'paper').map((size) => (
                  <SelectItem key={size.id} value={size.id} className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{size.name}</span>
                      <span className="text-xs text-muted-foreground">{size.description}</span>
                    </div>
                  </SelectItem>
                ))}
                
                {/* Presentations Section */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-2">
                  🎬 Presentations
                </div>
                {PAPER_SIZES.filter(s => s.category === 'presentation').map((size) => (
                  <SelectItem key={size.id} value={size.id} className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{size.name}</span>
                      <span className="text-xs text-muted-foreground">{size.description}</span>
                    </div>
                  </SelectItem>
                ))}
                
                {/* Posters Section */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-2">
                  📐 Posters
                </div>
                {PAPER_SIZES.filter(s => s.category === 'poster').map((size) => (
                  <SelectItem key={size.id} value={size.id} className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{size.name}</span>
                      <span className="text-xs text-muted-foreground">{size.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground bg-accent/20 p-2 rounded">
              Canvas: {canvasDimensions.width} × {canvasDimensions.height}px
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
