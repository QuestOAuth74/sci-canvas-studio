import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Grid3X3, ArrowRight, Sparkles } from "lucide-react";

interface CategoryWithIcons {
  id: string;
  name: string;
  icons: {
    id: string;
    name: string;
    thumbnail: string | null;
  }[];
}

const ICONS_PER_CATEGORY = 6;

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
      // First, get all categories
      const { data: categoriesData, error: catError } = await supabase
        .from("icon_categories")
        .select("id, name")
        .order("name");

      if (catError) throw catError;

      // Then fetch sample icons for each category
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
      <section className="py-20">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <Skeleton className="h-6 w-40 mx-auto" />
            <Skeleton className="h-10 w-80 mx-auto" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary uppercase tracking-widest">
            <Grid3X3 className="h-4 w-4" />
            <span>Icon Library</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            6,000+ Scientific Icons
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Browse our extensive collection of biomedical and scientific icons organized by category
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
              }`}
            >
              {category.name}
              <span className="ml-1.5 opacity-60">({category.icons.length})</span>
            </button>
          ))}
        </div>

        {/* Icons Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {activeIcons.map((icon) => (
            <Card
              key={icon.id}
              className="group border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <CardContent className="p-4 flex flex-col items-center justify-center aspect-square">
                {icon.thumbnail ? (
                  <div
                    className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    dangerouslySetInnerHTML={{
                      __html: icon.thumbnail.startsWith("<svg")
                        ? icon.thumbnail
                        : `<img src="${icon.thumbnail}" alt="${icon.name}" class="max-w-full max-h-full object-contain" />`,
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/auth")}
            className="group"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Explore Full Library
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
