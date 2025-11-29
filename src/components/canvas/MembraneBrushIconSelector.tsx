import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import noPreview from "@/assets/no_preview.png";

// Helper functions for thumbnail handling
const isUrl = (str: string): boolean => {
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:');
};

const sanitizeSvg = (raw: string): string => {
  let svg = raw.trim();
  svg = svg
    .replace(/<\?xml[^>]*?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");

  if (!svg.includes('viewBox')) {
    const widthMatch = svg.match(/width\s*=\s*["']([^"']+)["']/i);
    const heightMatch = svg.match(/height\s*=\s*["']([^"']+)["']/i);
    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      if (!isNaN(width) && !isNaN(height)) {
        svg = svg.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
      }
    }
  }
  
  return svg;
};

const svgToDataUrl = (svg: string): string => {
  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, "")
    .replace(/%20/g, " ");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
};

const ICONS_PER_PAGE = 20;

interface Category {
  id: string;
  name: string;
}

interface Icon {
  id: string;
  name: string;
  category: string;
  svg_content: string;
  thumbnail?: string;
}

interface MembraneBrushIconSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (iconSVG: string, options: {
    iconSize: number;
    spacing: number;
    rotateToPath: boolean;
    doubleSided: boolean;
  }) => void;
}

export const MembraneBrushIconSelector = ({ open, onOpenChange, onStart }: MembraneBrushIconSelectorProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, Icon[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});
  
  // Brush options
  const [iconSize, setIconSize] = useState(40);
  const [spacing, setSpacing] = useState(0);
  const [rotateToPath, setRotateToPath] = useState(true);
  const [doubleSided, setDoubleSided] = useState(false);

  // Pagination helpers
  const getCurrentPage = (categoryId: string) => categoryPages[categoryId] || 0;
  const setCurrentPage = (categoryId: string, page: number) => {
    setCategoryPages(prev => ({ ...prev, [categoryId]: page }));
  };
  const getPaginatedIcons = (categoryId: string, icons: Icon[]) => {
    const currentPage = getCurrentPage(categoryId);
    const startIdx = currentPage * ICONS_PER_PAGE;
    return icons.slice(startIdx, startIdx + ICONS_PER_PAGE);
  };
  const getTotalPages = (icons: Icon[]) => Math.ceil(icons.length / ICONS_PER_PAGE);

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("icon_categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load icon categories");
    } finally {
      setLoading(false);
    }
  };

  const loadIconsForCategory = async (categoryId: string) => {
    if (iconsByCategory[categoryId]) return;

    try {
      const { data, error } = await supabase
        .from("icons")
        .select("id, name, category, svg_content, thumbnail")
        .eq("category", categoryId)
        .order("name");

      if (error) throw error;
      
      setIconsByCategory(prev => ({
        ...prev,
        [categoryId]: data || []
      }));
    } catch (error) {
      console.error("Error loading icons:", error);
    }
  };

  const handleAccordionChange = (value: string[]) => {
    setOpenAccordions(value);
    value.forEach(categoryId => {
      if (!iconsByCategory[categoryId]) {
        loadIconsForCategory(categoryId);
      }
    });
  };

  const handleIconClick = (icon: Icon) => {
    setSelectedIcon(icon);
  };

  const handleStartDrawing = () => {
    if (!selectedIcon) {
      toast.error("Please select an icon first");
      return;
    }

    onStart(selectedIcon.svg_content, {
      iconSize,
      spacing,
      rotateToPath,
      doubleSided,
    });
    
    onOpenChange(false);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedIcons = [
    { name: "Phospholipid", search: "phospholipid" },
    { name: "Channel", search: "channel" },
    { name: "Receptor", search: "receptor" },
    { name: "Pump", search: "pump" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Select Membrane Brush Icon
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Suggested Icons */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Suggested for Membranes:</Label>
            <div className="flex gap-2 flex-wrap">
              {suggestedIcons.map((item) => (
                <Button
                  key={item.search}
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery(item.search)}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">All Categories:</Label>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[300px] border rounded-md p-2">
                <Accordion
                  type="multiple"
                  value={openAccordions}
                  onValueChange={handleAccordionChange}
                >
                  {filteredCategories.map((category) => (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="text-sm font-medium">
                        {category.name}
                      </AccordionTrigger>
                      <AccordionContent>
                        {iconsByCategory[category.id] ? (
                          <>
                            <div className="grid grid-cols-8 gap-2">
                              {getPaginatedIcons(category.id, iconsByCategory[category.id]).map((icon) => {
                                // Determine proper thumbnail source
                                let thumbSrc = '';
                                if (icon.thumbnail) {
                                  if (isUrl(icon.thumbnail)) {
                                    thumbSrc = icon.thumbnail;
                                  } else {
                                    // Raw SVG - convert to data URL
                                    thumbSrc = svgToDataUrl(sanitizeSvg(icon.thumbnail));
                                  }
                                }

                                return (
                                  <button
                                    key={icon.id}
                                    onClick={() => handleIconClick(icon)}
                                    className={`p-2 rounded border transition-all hover:scale-110 ${
                                      selectedIcon?.id === icon.id
                                        ? 'border-primary bg-primary/10 ring-2 ring-primary'
                                        : 'border-border hover:border-primary'
                                    }`}
                                    title={icon.name}
                                  >
                                    {thumbSrc ? (
                                      <img
                                        src={thumbSrc}
                                        alt={icon.name}
                                        className="w-full h-auto"
                                      />
                                    ) : icon.svg_content ? (
                                      <div
                                        dangerouslySetInnerHTML={{ __html: icon.svg_content }}
                                        className="w-full h-auto"
                                      />
                                    ) : (
                                      <img
                                        src={noPreview}
                                        alt="No preview"
                                        className="w-full h-auto opacity-50"
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Pagination Controls */}
                            {getTotalPages(iconsByCategory[category.id]) > 1 && (
                              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                                <span className="text-xs text-muted-foreground">
                                  Page {getCurrentPage(category.id) + 1} of {getTotalPages(iconsByCategory[category.id])}
                                  {' '}({iconsByCategory[category.id].length} icons)
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={getCurrentPage(category.id) === 0}
                                    onClick={() => setCurrentPage(category.id, getCurrentPage(category.id) - 1)}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={getCurrentPage(category.id) >= getTotalPages(iconsByCategory[category.id]) - 1}
                                    onClick={() => setCurrentPage(category.id, getCurrentPage(category.id) + 1)}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">Loading icons...</div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            )}
          </div>

          {/* Selected Icon Preview & Options */}
          {selectedIcon && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-medium mb-3 block">Selected Icon & Options:</Label>
              
              <div className="flex gap-6">
                {/* Preview */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 border rounded-lg bg-background flex items-center justify-center p-2">
                    {(() => {
                      let thumbSrc = '';
                      if (selectedIcon.thumbnail) {
                        if (isUrl(selectedIcon.thumbnail)) {
                          thumbSrc = selectedIcon.thumbnail;
                        } else {
                          thumbSrc = svgToDataUrl(sanitizeSvg(selectedIcon.thumbnail));
                        }
                      }

                      return thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={selectedIcon.name}
                          className="max-w-full max-h-full"
                        />
                      ) : selectedIcon.svg_content ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: selectedIcon.svg_content }}
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        <img
                          src={noPreview}
                          alt="No preview"
                          className="max-w-full max-h-full opacity-50"
                        />
                      );
                    })()}
                  </div>
                  <p className="text-xs text-center mt-1 text-muted-foreground">{selectedIcon.name}</p>
                </div>

                {/* Options */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm">Icon Size</Label>
                      <span className="text-sm text-muted-foreground">{iconSize}px</span>
                    </div>
                    <Slider
                      value={[iconSize]}
                      onValueChange={(v) => setIconSize(v[0])}
                      min={20}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm">Spacing</Label>
                      <span className="text-sm text-muted-foreground">
                        {spacing}px {spacing === 0 && "(touching)"}
                      </span>
                    </div>
                    <Slider
                      value={[spacing]}
                      onValueChange={(v) => setSpacing(v[0])}
                      min={0}
                      max={50}
                      step={5}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Rotate to follow path</Label>
                    <Switch
                      checked={rotateToPath}
                      onCheckedChange={setRotateToPath}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Double-sided (bilayer)</Label>
                    <Switch
                      checked={doubleSided}
                      onCheckedChange={setDoubleSided}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartDrawing} disabled={!selectedIcon}>
            Start Drawing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
