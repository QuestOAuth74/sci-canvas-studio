import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Icon {
  id: string;
  name: string;
  category: string;
  svg_content: string;
}

interface Category {
  id: string;
  name: string;
}

interface IconLibraryProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const ICONS_PER_PAGE = 20;

export const IconLibrary = ({ selectedCategory, onCategoryChange }: IconLibraryProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, Icon[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<string>("checking");
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

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

      // Load all icons
      console.log("Loading icons...");
      const { data: iconsData, error: iconsError } = await supabase
        .from('icons')
        .select('*')
        .order('name');

      if (iconsError) {
        console.error("Icons error:", iconsError);
        throw new Error(`Failed to load icons: ${iconsError.message}`);
      }
      
      console.log("Icons loaded:", iconsData?.length || 0);
      if (iconsData) {
        // Group icons by category
        const grouped = iconsData.reduce((acc, icon) => {
          if (!acc[icon.category]) {
            acc[icon.category] = [];
          }
          acc[icon.category].push(icon);
          return acc;
        }, {} as Record<string, Icon[]>);
        
        console.log("Icons grouped by category:", Object.keys(grouped).length, "categories");
        setIconsByCategory(grouped);
      }
    } catch (err) {
      console.error("Error loading icon library:", err);
      setError(err instanceof Error ? err.message : "Failed to load icons");
    } finally {
      setLoading(false);
    }
  };

  const handleIconClick = (icon: Icon) => {
    const event = new CustomEvent("addIconToCanvas", {
      detail: { svgData: icon.svg_content },
    });
    window.dispatchEvent(event);
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/40">
        <h2 className="text-lg font-semibold text-foreground">Icon Library</h2>
        <p className="text-xs text-muted-foreground mt-1">Click any icon to add to canvas</p>
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
      
      {!loading && (
        <ScrollArea className="flex-1 px-3">
        <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="w-full space-y-2 py-3">
          {categories.map((category) => {
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
                    <span>{category.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {categoryIcons.length}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-border/40">
                  {categoryIcons.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-1.5 p-2">
                        {paginatedIcons.map((icon) => (
                          <button
                            key={icon.id}
                            onClick={() => handleIconClick(icon)}
                            className="aspect-square border border-border/40 rounded p-1.5 hover:bg-accent/30 hover:border-primary transition-all hover:scale-105"
                            title={icon.name}
                          >
                            <div 
                              dangerouslySetInnerHTML={{ __html: icon.svg_content }} 
                              className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain" 
                            />
                          </button>
                        ))}
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
      </ScrollArea>
      )}
    </div>
  );
};
