import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Atom } from "lucide-react";

interface CategoryWithIcons {
  id: string;
  name: string;
  icons: {
    id: string;
    name: string;
    thumbnail: string | null;
  }[];
}

const ICONS_PER_CATEGORY = 8;

export const IconShowcase = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryWithIcons[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    loadCategoriesWithIcons();
  }, []);

  const loadCategoriesWithIcons = async () => {
    try {
      const { data: categoriesData, error: catError } = await supabase
        .from("icon_categories")
        .select("id, name")
        .order("name");

      if (catError) throw catError;

      const categoriesWithIcons: CategoryWithIcons[] = [];

      for (const category of categoriesData || []) {
        const { data: icons, error: iconsError } = await supabase
          .from("icons")
          .select("id, name, thumbnail")
          .or(`category.eq.${category.id},category.eq.${category.name},category.ilike.%${category.id}%`)
          .limit(ICONS_PER_CATEGORY);

        if (!iconsError && icons && icons.length > 0) {
          categoriesWithIcons.push({
            id: category.id,
            name: category.name,
            icons: icons,
          });
        }
      }

      setCategories(categoriesWithIcons);
      if (categoriesWithIcons.length > 0) {
        setActiveCategory(categoriesWithIcons[0].id);
      }
    } catch (error) {
      console.error("Error loading icon showcase:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeIcons = categories.find((c) => c.id === activeCategory)?.icons || [];

  if (loading) {
    return (
      <section className="py-24">
        <div className="max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-8 w-48 mx-auto" />
          <div className="flex justify-center gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Minimal Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Browse 6,000+ icons
          </h2>
        </div>

        {/* Category Tabs - Minimal Style */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.slice(0, 8).map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                activeCategory === category.id
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Icons Grid - Clean Minimal Cards */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {activeIcons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => navigate(`/icons/${icon.id}`)}
              className="group aspect-square rounded-xl bg-muted/30 border border-border/30 hover:border-primary/50 hover:bg-muted/50 hover:shadow-lg hover:shadow-primary/10 transition-all flex items-center justify-center p-3 cursor-pointer"
            >
              {icon.thumbnail ? (
                <div
                  className="w-full h-full flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all"
                  dangerouslySetInnerHTML={{
                    __html: icon.thumbnail.startsWith("<svg")
                      ? icon.thumbnail
                      : `<img src="${icon.thumbnail}" alt="${icon.name}" class="max-w-full max-h-full object-contain" />`,
                  }}
                />
              ) : (
                <Atom className="h-8 w-8 text-muted-foreground/50" />
              )}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/icons")}
            className="text-muted-foreground hover:text-foreground group"
          >
            View all icons
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
