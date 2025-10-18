import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

export const IconLibrary = ({ selectedCategory, onCategoryChange }: IconLibraryProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, Icon[]>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('icon_categories')
      .select('*')
      .order('name');

    if (!categoriesError && categoriesData) {
      setCategories(categoriesData);
    }

    // Load all icons
    const { data: iconsData, error: iconsError } = await supabase
      .from('icons')
      .select('*')
      .order('name');

    if (!iconsError && iconsData) {
      // Group icons by category
      const grouped = iconsData.reduce((acc, icon) => {
        if (!acc[icon.category]) {
          acc[icon.category] = [];
        }
        acc[icon.category].push(icon);
        return acc;
      }, {} as Record<string, Icon[]>);
      
      setIconsByCategory(grouped);
    }
  };

  const handleIconClick = (icon: Icon) => {
    const event = new CustomEvent("addIconToCanvas", {
      detail: { svgData: icon.svg_content },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="p-4 h-full bg-gradient-to-b from-background to-muted/20">
      <h2 className="text-lg font-semibold mb-3 text-foreground">Icon Library</h2>
      <ScrollArea className="h-[calc(100vh-120px)]">
        <Accordion type="multiple" className="w-full">
          {categories.map((category) => {
            const categoryIcons = iconsByCategory[category.id] || [];
            
            return (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="text-sm font-medium">
                  {category.name} ({categoryIcons.length})
                </AccordionTrigger>
                <AccordionContent>
                  {categoryIcons.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {categoryIcons.map((icon) => (
                        <button
                          key={icon.id}
                          onClick={() => handleIconClick(icon)}
                          className="aspect-square border border-border rounded-lg p-2 hover:bg-accent hover:border-primary transition-colors"
                          title={icon.name}
                        >
                          <div dangerouslySetInnerHTML={{ __html: icon.svg_content }} className="w-full h-full" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm py-4">
                      No icons in this category yet.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        {categories.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No categories yet. Add categories from the admin panel.
          </p>
        )}
      </ScrollArea>
    </div>
  );
};
