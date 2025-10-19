import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { IconCategory, IconItem, IconDbRow } from "@/types/icon";
import { toast } from "sonner";

interface ShapesLibraryProps {
  onShapeSelect: (shape: string) => void;
}

export const ShapesLibrary = ({ onShapeSelect }: ShapesLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, IconItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('icon_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load icon categories');
    } finally {
      setLoading(false);
    }
  };

  const loadIconsForCategory = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('icons')
        .select('*')
        .eq('category', categoryId)
        .order('name');

      if (error) throw error;

      // Convert IconDbRow to IconItem format
      const icons: IconItem[] = (data || []).map((icon: IconDbRow) => ({
        id: icon.id,
        name: icon.name,
        category: icon.category,
        svgData: icon.svg_content,
        thumbnail: icon.thumbnail || undefined,
        createdAt: new Date(icon.created_at).getTime(),
      }));

      setIconsByCategory(current => ({ ...current, [categoryId]: icons }));
    } catch (error) {
      console.error('Error loading icons:', error);
      toast.error('Failed to load icons');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const isExpanding = !prev.includes(section);
      
      // Lazy load icons only when expanding
      if (isExpanding && !iconsByCategory[section]) {
        loadIconsForCategory(section);
      }
      
      return isExpanding
        ? [...prev, section]
        : prev.filter(s => s !== section);
    });
  };

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery) return true;
    const icons = iconsByCategory[c.id];
    if (!icons) return true; // Show category until icons are loaded
    return icons.some(icon => icon.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs glass-effect"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {/* Dynamic Categories from Database */}
          {filteredCategories.map((c) => {
              const sectionId = c.id;
              return (
                <div key={c.id} className="border border-border/40 rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm">
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-accent/50 text-sm font-semibold transition-colors"
                  >
                    <span>{c.name}</span>
                    {expandedSections.includes(sectionId) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedSections.includes(sectionId) && (
                    <div className="grid grid-cols-4 gap-1.5 p-2 border-t border-border/40">
                      {(iconsByCategory[c.id] || [])
                        .filter(icon => !searchQuery || icon.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((icon) => (
                          <button
                            key={icon.id}
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent("addIconToCanvas", { detail: { svgData: icon.svgData } })
                              )
                            }
                            className="aspect-square border border-border/40 hover:border-primary hover:bg-accent/30 rounded p-1 transition-all hover:scale-105"
                            title={icon.name}
                          >
                            <img 
                              src={icon.thumbnail} 
                              alt={icon.name} 
                              className="w-full h-full object-contain" 
                              loading="lazy"
                            />
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
