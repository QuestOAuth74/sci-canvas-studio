import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Search, Atom, Grid3X3, ArrowRight } from "lucide-react";

interface IconCategory {
  id: string;
  name: string;
}

interface Icon {
  id: string;
  name: string;
  category: string;
  thumbnail: string | null;
}

const ICONS_PER_PAGE = 32;

export default function IconGlossary() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [icons, setIcons] = useState<Icon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const activeCategory = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setIcons([]);
    setHasMore(true);
    loadIcons(0);
  }, [activeCategory, searchQuery]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("icon_categories")
      .select("id, name")
      .order("name");
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const loadIcons = async (offset: number) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let query = supabase
        .from("icons")
        .select("id, name, category, thumbnail", { count: "exact" });

      if (activeCategory !== "all") {
        query = query.or(`category.eq.${activeCategory},category.ilike.%${activeCategory}%`);
      }

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order("name")
        .range(offset, offset + ICONS_PER_PAGE - 1);

      if (!error && data) {
        if (offset === 0) {
          setIcons(data);
        } else {
          setIcons(prev => [...prev, ...data]);
        }
        setTotalCount(count || 0);
        setHasMore(data.length === ICONS_PER_PAGE);
      }
    } catch (error) {
      console.error("Error loading icons:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId === "all") {
      params.delete("category");
    } else {
      params.set("category", categoryId);
    }
    setSearchParams(params);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    setSearchParams(params);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadIcons(icons.length);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Scientific Icon Library - BioSketch"
        description="Browse our comprehensive library of 6,000+ scientific icons. Find the perfect icons for your biomedical illustrations, research papers, and presentations."
        canonical="https://biosketch.art/icons"
        keywords="scientific icons, biomedical icons, research graphics, biology icons, chemistry icons, medical icons"
      />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Grid3X3 className="h-4 w-4" />
              Icon Library
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              Scientific Icon
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Library
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Browse over 6,000 professionally designed scientific icons. 
              Click any icon to view details and download.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl border-border/50 bg-card"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All Icons
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Icons Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${totalCount.toLocaleString()} icons found`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {[...Array(40)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : icons.length === 0 ? (
            <div className="text-center py-20">
              <Atom className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No icons found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {icons.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => navigate(`/icons/${icon.id}`)}
                    className="group aspect-square rounded-xl bg-card border border-border/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all flex items-center justify-center p-3 cursor-pointer"
                  >
                    {icon.thumbnail ? (
                      <div
                        className="w-full h-full flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all"
                        dangerouslySetInnerHTML={{
                          __html: icon.thumbnail.startsWith("<svg")
                            ? icon.thumbnail
                            : `<img src="${icon.thumbnail}" alt="${icon.name}" class="max-w-full max-h-full object-contain" />`,
                        }}
                      />
                    ) : (
                      <Atom className="h-8 w-8 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    )}
                  </button>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-12">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8"
                  >
                    {loadingMore ? "Loading..." : "Load More Icons"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
