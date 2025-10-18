import { useState, useEffect } from "react";
import { iconStorage } from "@/lib/iconStorage";
import { IconItem, IconCategory } from "@/types/icon";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IconLibraryProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const IconLibrary = ({ selectedCategory, onCategoryChange }: IconLibraryProps) => {
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [icons, setIcons] = useState<IconItem[]>([]);

  useEffect(() => {
    setCategories(iconStorage.getCategories());
    loadIcons();
  }, [selectedCategory]);

  const loadIcons = () => {
    if (selectedCategory === "all") {
      setIcons(iconStorage.getIcons());
    } else {
      setIcons(iconStorage.getIconsByCategory(selectedCategory));
    }
  };

  const handleIconClick = (icon: IconItem) => {
    const event = new CustomEvent("addIconToCanvas", {
      detail: { svgData: icon.svgData },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-3">Categories</h2>
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
                <img
                  src={icon.thumbnail}
                  alt={icon.name}
                  className="w-full h-full object-contain"
                />
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
