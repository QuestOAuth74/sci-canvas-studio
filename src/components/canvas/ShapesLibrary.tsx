import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { iconStorage } from "@/lib/iconStorage";
import { IconCategory, IconItem } from "@/types/icon";

interface ShapesLibraryProps {
  onShapeSelect: (shape: string) => void;
}

export const ShapesLibrary = ({ onShapeSelect }: ShapesLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["arrows"]);
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, IconItem[]>>({});

  useEffect(() => {
    const cats = iconStorage.getCategories();
    setCategories(cats);
    const map: Record<string, IconItem[]> = {};
    cats.forEach((c) => {
      map[c.id] = iconStorage.getIconsByCategory(c.id);
    });
    setIconsByCategory(map);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="w-56 border-r-[3px] border-foreground bg-card flex flex-col">
      {/* Search Bar */}
      <div className="p-2 border-b-[2px] border-foreground">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Type / to search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {/* Dynamic Categories from Database */}
          {categories
            .filter((c) => (iconsByCategory[c.id]?.length || 0) > 0)
            .map((c) => {
              const sectionId = c.id;
              return (
                <div key={c.id} className="border-[2px] border-foreground overflow-hidden bg-card">
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent text-sm font-bold uppercase border-b-[2px] border-foreground"
                  >
                    <span>{c.name}</span>
                    {expandedSections.includes(sectionId) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedSections.includes(sectionId) && (
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {(iconsByCategory[c.id] || []).map((icon) => (
                        <button
                          key={icon.id}
                          onClick={() =>
                            window.dispatchEvent(
                              new CustomEvent("addIconToCanvas", { detail: { svgData: icon.svgData } })
                            )
                          }
                          className="aspect-square border-[2px] border-border hover:border-primary hover:bg-accent p-1 transition-colors"
                          title={icon.name}
                        >
                          <img src={icon.thumbnail} alt={icon.name} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
};
