import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, Search, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { IconCategory, IconItem, IconDbRow } from "@/types/icon";
import { toast } from "sonner";
import { useFavoriteIcons } from "@/hooks/useFavoriteIcons";
import { useAuth } from "@/contexts/AuthContext";

interface ShapesLibraryProps {
  onShapeSelect: (shape: string) => void;
}

export const ShapesLibrary = ({ onShapeSelect }: ShapesLibraryProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, IconItem[]>>({});
  const [loading, setLoading] = useState(true);
  const { favoriteIconIds, toggleFavorite, isFavorite } = useFavoriteIcons();

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
      
      console.log('Loaded categories:', data?.length, 'categories found');
      console.log('Categories:', data?.map(c => c.name).join(', '));
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

      console.log(`Loaded ${data?.length || 0} icons for category: ${categoryId}`);

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
    if (!icons) return true;
    return icons.some(icon => icon.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const FavoritesSection = () => {
    const [favoriteIcons, setFavoriteIcons] = useState<IconItem[]>([]);
    const [favLoading, setFavLoading] = useState(true);

    useEffect(() => {
      loadFavoriteIcons();
    }, [favoriteIconIds]);

    const loadFavoriteIcons = async () => {
      if (favoriteIconIds.size === 0) {
        setFavoriteIcons([]);
        setFavLoading(false);
        return;
      }

      try {
        setFavLoading(true);
        const { data, error } = await supabase
          .from('icons')
          .select('id, name, category, svg_content, thumbnail')
          .in('id', Array.from(favoriteIconIds));

        if (error) throw error;
        
        const icons: IconItem[] = (data || []).map((icon: IconDbRow) => ({
          id: icon.id,
          name: icon.name,
          category: icon.category,
          svgData: icon.svg_content,
          thumbnail: icon.thumbnail || undefined,
          createdAt: new Date(icon.created_at).getTime(),
        }));

        setFavoriteIcons(icons);
      } catch (error) {
        console.error('Error loading favorite icons:', error);
      } finally {
        setFavLoading(false);
      }
    };

    if (favLoading) {
      return (
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-square rounded" />
          ))}
        </div>
      );
    }

    if (favoriteIcons.length === 0) {
      return (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No favorite icons yet. Star icons to add them here!
        </div>
      );
    }

    return (
      <div className="grid grid-cols-4 gap-1.5">
        {favoriteIcons
          .filter(icon => !searchQuery || icon.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((icon) => (
            <div key={icon.id} className="relative group">
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("addIconToCanvas", { detail: { svgData: icon.svgData } })
                  )
                }
                className="aspect-square border border-border/40 hover:border-primary hover:bg-accent/30 rounded p-1 transition-all hover:scale-105 w-full"
                title={icon.name}
              >
                <img 
                  src={icon.thumbnail} 
                  alt={icon.name} 
                  className="w-full h-full object-contain" 
                  loading="lazy"
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(icon.id);
                }}
                className="absolute top-0.5 right-0.5 p-1 bg-background/80 backdrop-blur-sm rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background z-10"
                title="Remove from favorites"
              >
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </button>
            </div>
          ))}
      </div>
    );
  };

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
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Favorites Section */}
              {user && favoriteIconIds.size > 0 && (
                <div className="border border-border/40 rounded-lg overflow-hidden bg-yellow-400/10 mb-2">
                  <button
                    onClick={() => toggleSection('favorites')}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-accent/50 text-sm font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      ⭐ My Favorites
                      <span className="text-xs text-muted-foreground font-normal">
                        ({favoriteIconIds.size} icon{favoriteIconIds.size !== 1 ? 's' : ''})
                      </span>
                    </span>
                    {expandedSections.includes('favorites') ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedSections.includes('favorites') && (
                    <div className="p-2 border-t border-border/40">
                      <FavoritesSection />
                    </div>
                  )}
                </div>
              )}

              {/* Regular Categories */}
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No categories found
                </div>
              ) : (
                filteredCategories.map((c) => {
              const sectionId = c.id;
              const iconCount = iconsByCategory[c.id]?.length;
              return (
                <div key={c.id} className="border border-border/40 rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm">
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-accent/50 text-sm font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {c.name}
                      {iconCount !== undefined && (
                        <span className="text-xs text-muted-foreground font-normal">
                          ({iconCount} icon{iconCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                    {expandedSections.includes(sectionId) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedSections.includes(sectionId) && (
                    <div className="grid grid-cols-4 gap-1.5 p-2 border-t border-border/40">
                      {iconsByCategory[c.id] ? (
                        iconsByCategory[c.id]
                          .filter(icon => !searchQuery || icon.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((icon) => {
                            const isFavorited = isFavorite(icon.id);
                            return (
                              <div key={icon.id} className="relative group">
                                <button
                                  onClick={() =>
                                    window.dispatchEvent(
                                      new CustomEvent("addIconToCanvas", { detail: { svgData: icon.svgData } })
                                    )
                                  }
                                  className="aspect-square border border-border/40 hover:border-primary hover:bg-accent/30 rounded p-1 transition-all hover:scale-105 w-full"
                                  title={icon.name}
                                >
                                  <img 
                                    src={icon.thumbnail} 
                                    alt={icon.name} 
                                    className="w-full h-full object-contain" 
                                    loading="lazy"
                                  />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(icon.id);
                                  }}
                                  className="absolute top-0.5 right-0.5 p-1 bg-background/80 backdrop-blur-sm rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background z-10"
                                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                >
                                  <Star 
                                    className={`h-3 w-3 ${isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                  />
                                </button>
                              </div>
                            );
                          })
                      ) : (
                        <div className="col-span-4 text-center py-4 text-sm text-muted-foreground">
                          Loading icons...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
