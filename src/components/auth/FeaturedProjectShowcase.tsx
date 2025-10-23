import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CommunityProject {
  id: string;
  title: string | null;
  description: string | null;
  keywords: string[] | null;
  thumbnail_url: string | null;
  view_count: number;
  cloned_count: number;
  profiles: {
    full_name: string | null;
  } | null;
}

export function FeaturedProjectShowcase() {
  const [project, setProject] = useState<CommunityProject | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFeaturedProject = async () => {
      try {
        const { data: projects, error } = await supabase
          .from('canvas_projects')
          .select('id, title, description, keywords, thumbnail_url, view_count, cloned_count, user_id')
          .eq('is_public', true)
          .eq('approval_status', 'approved')
          .not('thumbnail_url', 'is', null)
          .limit(100);

        if (error) throw error;
        
        if (projects && projects.length > 0) {
          const randomProjectData = projects[Math.floor(Math.random() * projects.length)];
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', randomProjectData.user_id)
            .single();

          setProject({
            ...randomProjectData,
            profiles: profile || null,
          });
        }
      } catch (error) {
        console.error('Error loading featured project:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProject();
  }, []);

  if (loading || !project) return null;

  return (
    <Card className="w-full h-full backdrop-blur-sm bg-card/80 border-border shadow-xl overflow-hidden">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <Badge 
            variant="secondary" 
            className="text-xs font-medium tracking-wide uppercase bg-primary/10 text-primary border-primary/20"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Featured Project
          </Badge>
        </div>

        <h3 className="text-2xl font-bold mb-2 text-foreground line-clamp-2">
          {project.title || 'Untitled Project'}
        </h3>

        {project.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {project.description}
          </p>
        )}

        {/* Thumbnail */}
        <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md border border-border/30 bg-muted/30 mb-4 flex-shrink-0">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.title || 'Project thumbnail'}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
              No preview available
            </div>
          )}
        </div>

        {/* Keywords */}
        {project.keywords && project.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.keywords.slice(0, 4).map((keyword, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs font-normal bg-muted/40 border-border/30"
              >
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto space-y-4">
          {/* Creator & Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-medium text-xs border border-primary/20">
                {project.profiles?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">By</span>
                <span className="font-medium text-foreground text-sm">
                  {project.profiles?.full_name || 'Anonymous'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 opacity-60" />
                <span className="font-medium">{project.view_count}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Copy className="h-4 w-4 opacity-60" />
                <span className="font-medium">{project.cloned_count}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full group hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={() => navigate('/community')}
          >
            Explore Community
            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
