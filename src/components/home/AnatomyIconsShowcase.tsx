import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import noPreview from "@/assets/no_preview.png";

interface Icon {
  id: string;
  name: string;
  thumbnail: string | null;
}

export const AnatomyIconsShowcase = () => {
  const navigate = useNavigate();
  const [icons, setIcons] = useState<Icon[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchAnatomyIcons = async () => {
      try {
        // Get total count
        const { count } = await supabase
          .from("icons")
          .select("*", { count: "exact", head: true })
          .eq("category", "anatomy");

        if (count) setTotalCount(count);

        // Fetch 8 random icons
        const { data, error } = await supabase
          .from("icons")
          .select("id, name, thumbnail")
          .eq("category", "anatomy")
          .limit(8);

        if (error) throw error;

        // Randomize on client side (Supabase doesn't support ORDER BY RANDOM in JS client)
        const shuffled = data?.sort(() => Math.random() - 0.5).slice(0, 8) || [];
        setIcons(shuffled);
      } catch (error) {
        console.error("Error fetching anatomy icons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnatomyIcons();
  }, []);

  return (
    <Card className="glass-card p-8 animate-fade-in relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Explore Our Anatomy Icon Library
            </h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Discover professional medical and anatomical illustrations
          </p>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing 8 of {totalCount}+ anatomy icons
            </p>
          )}
        </div>

        {/* Icons Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : icons.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            {icons.map((icon, index) => (
              <div
                key={icon.id}
                className="group relative aspect-square glass-card p-3 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate("/canvas")}
              >
                <img
                  src={icon.thumbnail || noPreview}
                  alt={icon.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end justify-center p-2">
                  <p className="text-xs font-medium text-center text-foreground truncate w-full">
                    {icon.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No anatomy icons available at the moment.
          </div>
        )}

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/canvas")}
            className="group"
          >
            Explore Full Library
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
