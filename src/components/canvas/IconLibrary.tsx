import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, X, Star } from "lucide-react";
import { usePinnedCategories } from "@/hooks/usePinnedCategories";
import { toast } from "sonner";

interface Icon {
  id: string;
  name: string;
  category: string;
  svg_content?: string;
  thumbnail?: string;
}

interface Category {
  id: string;
  name: string;
}

interface IconLibraryProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ICONS_PER_PAGE = 20;

// Helper functions to sanitize and encode SVG content
const sanitizeSvg = (raw: string): string => {
  try {
    let svg = raw.trim();
    // Remove XML declarations and DOCTYPE
    svg = svg
      .replace(/<\?xml[^>]*?>/gi, "")
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
    
    // Ensure viewBox if missing and width/height exist
    if (!/viewBox=/i.test(svg)) {
      const w = svg.match(/\bwidth=["']?(\d+(\.\d+)?)\s*(px)?["']?/i);
      const h = svg.match(/\bheight=["']?(\d+(\.\d+)?)\s*(px)?["']?/i);
      if (w && h) {
        const width = parseFloat(w[1]);
        const height = parseFloat(h[1]);
        svg = svg.replace(/<svg([^>]*?)>/i, `<svg$1 viewBox="0 0 ${width} ${height}">`);
        svg = svg.replace(/\b(width|height)=["'][^"']*["']/gi, "");
      }
    }
    return svg;
  } catch {
    return raw;
  }
};

const svgToDataUrl = (svg: string): string => {
  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, "")
    .replace(/%20/g, " ");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
};

export const IconLibrary = ({ selectedCategory, onCategoryChange, isCollapsed, onToggleCollapse }: IconLibraryProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, Icon[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<string>("checking");
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Icon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { pinnedCategoryIds, togglePin, isPinned } = usePinnedCategories();

  // Split categories into pinned and unpinned
  const { pinnedCategories, unpinnedCategories } = useMemo(() => {
    if (searchQuery.trim()) {
      return { pinnedCategories: [], unpinnedCategories: categories };
    }
    
    const pinned = categories.filter(cat => isPinned(cat.id));
    const unpinned = categories.filter(cat => !isPinned(cat.id));
    
    return { pinnedCategories: pinned, unpinnedCategories: unpinned };
  }, [categories, isPinned, searchQuery]);

  useEffect(() => {
    loadData();
    
    // Listen for thumbnail generation completion
    const handleThumbnailsGenerated = () => {
      console.log('Thumbnails generated, reloading icons...');
      loadData();
    };
    
    window.addEventListener('thumbnailsGenerated', handleThumbnailsGenerated);
    return () => window.removeEventListener('thumbnailsGenerated', handleThumbnailsGenerated);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const searchTerms = query.trim().split(/\s+/).join(' & ');
      
      // Load only thumbnails for search results (svg_content fetched on click)
      const { data, error } = await supabase
        .from('icons')
        .select('id, name, category, thumbnail')
        .textSearch('search_vector', searchTerms, {
          type: 'websearch',
          config: 'english'
        })
        .limit(50);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth session:", session ? "Authenticated" : "Not authenticated");
      setAuthState(session ? "authenticated" : "not authenticated");
      
      // Load categories
      console.log("Loading categories...");
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('icon_categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error("Categories error:", categoriesError);
        throw new Error(`Failed to load categories: ${categoriesError.message}`);
      }
      
      console.log("Categories loaded:", categoriesData?.length || 0);
      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Load icons per-category to avoid PostgREST default row cap (typically 1,000)
      console.log("Loading icons per category to avoid server row limits...");
      const grouped: Record<string, Icon[]> = {};

      await Promise.all(
        (categoriesData || []).map(async (cat) => {
          const { data, error } = await supabase
            .from('icons')
            .select('id, name, category, thumbnail')
            .eq('category', cat.id)
            .order('name');

          if (error) {
            console.error(`Icons error for category ${cat.id}:`, error);
            return;
          }
          grouped[cat.id] = data || [];
        })
      );

      console.log("Icons grouped by category:", Object.keys(grouped).length, "categories");
      setIconsByCategory(grouped);
    } catch (err) {
      console.error("Error loading icon library:", err);
      setError(err instanceof Error ? err.message : "Failed to load icons");
    } finally {
      setLoading(false);
    }
  };

  const handleIconClick = async (icon: Icon) => {
    const loadingToastId = toast.loading(`Loading ${icon.name}...`);
    
    try {
      // If we already have svg_content, use it
      if (icon.svg_content) {
        const event = new CustomEvent("addIconToCanvas", {
          detail: { svgData: icon.svg_content },
        });
        window.dispatchEvent(event);
        toast.dismiss(loadingToastId);
        return;
      }

      // Otherwise, fetch full svg_content for high-quality canvas rendering
      const { data, error } = await supabase
        .from('icons')
        .select('svg_content')
        .eq('id', icon.id)
        .single();

      if (error) {
        toast.dismiss(loadingToastId);
        toast.error(`Failed to load icon: ${error.message}`);
        console.error('Error loading icon:', error);
        return;
      }
      
      if (!data?.svg_content) {
        toast.dismiss(loadingToastId);
        toast.error('No SVG content found for this icon');
        return;
      }

      // Check SVG size and warn if large
      const svgSizeKB = new Blob([data.svg_content]).size / 1024;
      console.log(`Loading icon: ${icon.name}, Size: ${svgSizeKB.toFixed(2)} KB`);
      
      if (svgSizeKB > 500) {
        toast.dismiss(loadingToastId);
        toast.loading('Processing large icon, please wait...', { id: loadingToastId });
      }

      const event = new CustomEvent("addIconToCanvas", {
        detail: { svgData: data.svg_content },
      });
      window.dispatchEvent(event);
      toast.dismiss(loadingToastId);
    } catch (error) {
      toast.dismiss(loadingToastId);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load icon: ${errorMessage}`);
      console.error('Error loading icon:', error);
    }
  };

  const onImgLoad = (id: string) => {
    setLoadedMap(prev => ({ ...prev, [id]: true }));
  };

  const onImgError = (id: string) => {
    setLoadedMap(prev => ({ ...prev, [id]: true }));
  };

  const getCurrentPage = (categoryId: string) => categoryPages[categoryId] || 0;
  
  const setCurrentPage = (categoryId: string, page: number) => {
    setCategoryPages(prev => ({ ...prev, [categoryId]: page }));
  };

  const getPaginatedIcons = (categoryId: string, icons: Icon[]) => {
    const currentPage = getCurrentPage(categoryId);
    const startIdx = currentPage * ICONS_PER_PAGE;
    const endIdx = startIdx + ICONS_PER_PAGE;
    return icons.slice(startIdx, endIdx);
  };

  const getTotalPages = (icons: Icon[]) => Math.ceil(icons.length / ICONS_PER_PAGE);

  const renderIconButton = (icon: Icon) => {
    const hasThumbnail = !!icon.thumbnail;
    const safeSvg = hasThumbnail ? sanitizeSvg(icon.thumbnail!) : '';
    const thumbSrc = hasThumbnail ? svgToDataUrl(safeSvg) : '';
    const isLoaded = !!loadedMap[icon.id];
    
    return (
      <button
        key={icon.id}
        onClick={() => handleIconClick(icon)}
        className="aspect-square border border-border/40 rounded overflow-hidden p-1.5 bg-muted/30 hover:bg-accent/40 hover:border-primary transition-transform hover:scale-105 relative"
        title={icon.name}
      >
        {!hasThumbnail ? (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
            No preview
          </div>
        ) : (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-6 h-6 rounded-sm" />
              </div>
            )}
            <img
              src={thumbSrc}
              alt={icon.name}
              loading="lazy"
              onLoad={() => onImgLoad(icon.id)}
              onError={() => onImgError(icon.id)}
              className={`w-full h-full object-contain transition-opacity duration-200 ${isLoaded ? "opacity-100" : "opacity-0 blur-[1px]"}`}
              style={{ imageRendering: "pixelated" }}
            />
          </>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toggle button - always visible */}
      <div className="p-2 border-b border-border/40 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
          title={isCollapsed ? "Expand icon library" : "Collapse icon library"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content - hidden when collapsed */}
      {!isCollapsed && (
        <>
          <div className="p-4 border-b border-border/40 space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Icon Library</h2>
              <p className="text-xs text-muted-foreground mt-1">Click any icon to add to canvas</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-8 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-accent rounded-sm transition-colors"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
          
          {loading && (
            <div className="px-3 py-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border/40 rounded-lg p-3 space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <Skeleton key={idx} className="aspect-square rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {error}
                <div className="mt-2 text-xs">Auth state: {authState}</div>
              </AlertDescription>
            </Alert>
          )}
          
          {!loading && searchQuery && (
            <ScrollArea type="always" className="flex-1 min-h-0 px-3 pr-1">
              <div className="py-3">
                <div className="mb-2 text-sm text-muted-foreground">
                  {isSearching ? "Searching..." : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {searchResults.map((icon) => renderIconButton(icon))}
                </div>
              </div>
            </ScrollArea>
          )}
          
          {!loading && !searchQuery && (
            <ScrollArea type="always" className="flex-1 min-h-0 px-3 pr-1">
              <div className="space-y-2 py-3">
                {/* Pinned Categories Section */}
                {pinnedCategories.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/40 bg-yellow-500/5 rounded-t mb-2">
                      ⭐ Pinned Categories
                    </div>
                    <Accordion type="multiple" className="w-full space-y-2">
                      {pinnedCategories.map((category) => {
                        const categoryIcons = iconsByCategory[category.id] || [];
                        const totalPages = getTotalPages(categoryIcons);
                        const currentPage = getCurrentPage(category.id);
                        const paginatedIcons = getPaginatedIcons(category.id, categoryIcons);
                        
                        return (
                          <AccordionItem 
                            key={category.id} 
                            value={category.id}
                            className="border border-yellow-500/20 rounded-lg overflow-hidden bg-yellow-500/5 backdrop-blur-sm"
                          >
                            <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold hover:bg-accent/50 hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePin(category.id);
                                    }}
                                    className="hover:text-yellow-600 transition-colors"
                                    title="Unpin category"
                                  >
                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                  </button>
                                  <span>{category.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground font-normal">
                                  {categoryIcons.length}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="border-t border-border/40">
                              {categoryIcons.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-4 gap-1.5 p-2">
                                    {paginatedIcons.map((icon) => renderIconButton(icon))}
                                  </div>
                                  
                                  {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-2 pb-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentPage(category.id, Math.max(0, currentPage - 1))}
                                        disabled={currentPage === 0}
                                        className="h-7 px-2"
                                      >
                                        <ChevronLeft className="h-4 w-4" />
                                      </Button>
                                      
                                      <span className="text-xs text-muted-foreground">
                                        {currentPage + 1} / {totalPages}
                                      </span>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentPage(category.id, Math.min(totalPages - 1, currentPage + 1))}
                                        disabled={currentPage === totalPages - 1}
                                        className="h-7 px-2"
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-xs py-3 px-3 text-center">
                                  No icons in this category yet.
                                </p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </>
                )}

                {/* Unpinned Categories Section */}
                <Accordion type="multiple" className="w-full space-y-2">
                  {unpinnedCategories.map((category) => {
                    const categoryIcons = iconsByCategory[category.id] || [];
                    const totalPages = getTotalPages(categoryIcons);
                    const currentPage = getCurrentPage(category.id);
                    const paginatedIcons = getPaginatedIcons(category.id, categoryIcons);
                    
                    return (
                      <AccordionItem 
                        key={category.id} 
                        value={category.id}
                        className="border border-border/40 rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm"
                      >
                        <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold hover:bg-accent/50 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(category.id);
                                }}
                                className="hover:text-yellow-500 transition-colors"
                                title="Pin category"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                              <span>{category.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground font-normal">
                              {categoryIcons.length}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="border-t border-border/40">
                          {categoryIcons.length > 0 ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-4 gap-1.5 p-2">
                                {paginatedIcons.map((icon) => renderIconButton(icon))}
                              </div>
                              
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between px-2 pb-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(category.id, Math.max(0, currentPage - 1))}
                                    disabled={currentPage === 0}
                                    className="h-7 px-2"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  
                                  <span className="text-xs text-muted-foreground">
                                    {currentPage + 1} / {totalPages}
                                  </span>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(category.id, Math.min(totalPages - 1, currentPage + 1))}
                                    disabled={currentPage === totalPages - 1}
                                    className="h-7 px-2"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-xs py-3 px-3 text-center">
                              No icons in this category yet.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
                
                {categories.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <p className="text-muted-foreground text-sm">
                      No categories yet. Add categories from the admin panel.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
};
