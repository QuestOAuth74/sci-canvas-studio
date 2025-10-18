import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [icons, setIcons] = useState<Icon[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadIcons();
  }, [selectedCategory]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('icon_categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const loadIcons = async () => {
    let query = supabase.from('icons').select('*');

    if (selectedCategory !== "all") {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query.order('name');

    if (!error && data) {
      setIcons(data);
    }
  };

  const handleIconClick = (icon: Icon) => {
    const event = new CustomEvent("addIconToCanvas", {
      detail: { svgData: icon.svg_content },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="p-4 space-y-4 h-full bg-gradient-to-b from-background to-muted/20">
      <div>
        <h2 className="text-lg font-semibold mb-3 text-foreground">Categories</h2>
        <div className="space-y-1">
          <Button
            variant={selectedCategory === "all" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onCategoryChange("all")}
          >
            All Icons
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Icons</h2>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="grid grid-cols-3 gap-2">
            {icons.map((icon) => (
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
          {icons.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No icons in this category yet. Add icons from the admin panel.
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
