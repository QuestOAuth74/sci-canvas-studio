import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CommunityProject {
  id: string;
  title: string | null;
  description: string | null;
  keywords: string[] | null;
  thumbnail_url: string | null;
  view_count: number;
  cloned_count: number;
  canvas_width: number;
  canvas_height: number;
  paper_size: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface FeaturedProjectPopupProps {
  onViewProject: (project: CommunityProject) => void;
}

export function FeaturedProjectPopup({ onViewProject }: FeaturedProjectPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [project, setProject] = useState<CommunityProject | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFeaturedProject = async () => {
      try {
        setLoading(true);
        const { data: projects, error } = await supabase
          .from('canvas_projects')
          .select('*')
          .eq('is_public', true)
          .eq('approval_status', 'approved')
          .not('thumbnail_url', 'is', null)
          .limit(100);

        if (error) throw error;
        
        if (projects && projects.length > 0) {
          // Select random project from results
          const randomProjectData = projects[Math.floor(Math.random() * projects.length)];
          
          // Fetch creator profile separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', randomProjectData.user_id)
            .single();

          setProject({
            ...randomProjectData,
            profiles: profile || null,
          });
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error loading featured project:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check if popup was already shown today
    const lastDismissed = localStorage.getItem('biosketch_featured_popup_dismissed');
    const shouldShow = !lastDismissed || 
      (Date.now() - new Date(lastDismissed).getTime() > 24 * 60 * 60 * 1000);

    if (shouldShow) {
      const timer = setTimeout(() => {
        loadFeaturedProject();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('biosketch_featured_popup_dismissed', new Date().toISOString());
  };

  const handleViewProject = () => {
    if (project) {
      handleClose();
      onViewProject(project);
    }
  };

  if (!project || loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl rounded-none border-[4px] border-foreground bg-card neo-brutalist-shadow-lg animate-in slide-in-from-bottom-4 duration-300">
        {/* Accent strip at top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
        
        <DialogHeader className="space-y-4 pb-2 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-secondary animate-pulse neo-brutalist-shadow" />
            <Badge 
              className="rounded-none border-[3px] border-foreground bg-primary text-foreground hover:bg-primary/90 font-bold tracking-wider uppercase text-xs px-3 py-1 neo-brutalist-shadow transition-transform hover:-translate-y-0.5"
            >
              <Zap className="h-3 w-3 mr-1" />
              Featured Illustration
            </Badge>
          </div>
          <DialogTitle className="text-4xl font-black tracking-tight text-foreground leading-tight uppercase">
            {project.title || 'Untitled Project'}
          </DialogTitle>
          {project.description && (
            <DialogDescription className="text-base leading-relaxed text-foreground/80 font-medium">
              {project.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Thumbnail */}
          <div className="relative aspect-video w-full rounded-none overflow-hidden border-[4px] border-foreground neo-brutalist-shadow bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 transition-all hover:-translate-y-1 hover:neo-brutalist-shadow-lg cursor-pointer group">
            {project.thumbnail_url ? (
              <img
                src={project.thumbnail_url}
                alt={project.title || 'Project thumbnail'}
                className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground/60 font-bold text-xl">
                NO PREVIEW AVAILABLE
              </div>
            )}
          </div>

          {/* Creator & Stats */}
          <div className="flex items-center justify-between pt-2 pb-1 border-t-[3px] border-foreground">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-foreground font-black text-lg border-[3px] border-foreground neo-brutalist-shadow">
                {project.profiles?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-foreground/70 uppercase tracking-wider font-bold">Created by</span>
                <span className="font-bold text-foreground text-base">
                  {project.profiles?.full_name || 'Anonymous'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none border-[2px] border-foreground bg-primary/20 neo-brutalist-shadow">
                <Eye className="h-5 w-5" />
                <span className="font-black">{project.view_count}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none border-[2px] border-foreground bg-secondary/20 neo-brutalist-shadow">
                <Copy className="h-5 w-5" />
                <span className="font-black">{project.cloned_count}</span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {project.keywords && project.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {project.keywords.slice(0, 5).map((keyword, index) => {
                const colors = ['bg-primary/30', 'bg-secondary/30', 'bg-accent/30'];
                const colorClass = colors[index % colors.length];
                return (
                  <Badge 
                    key={index} 
                    className={`rounded-none border-[2px] border-foreground ${colorClass} text-foreground hover:bg-opacity-50 neo-brutalist-shadow text-xs font-bold uppercase tracking-wide px-3 py-1 transition-transform hover:-translate-y-0.5`}
                  >
                    {keyword}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t-[3px] border-foreground">
          <Button
            onClick={handleClose}
            className="rounded-none border-[3px] border-foreground bg-background hover:bg-muted neo-brutalist-shadow text-foreground font-bold uppercase tracking-wide transition-all hover:-translate-y-1 hover:neo-brutalist-shadow-lg"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleViewProject}
            className="rounded-none border-[3px] border-foreground bg-primary text-foreground hover:bg-primary/90 neo-brutalist-shadow font-black uppercase tracking-wide transition-all hover:-translate-y-1 hover:neo-brutalist-shadow-lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            View Full Project
          </Button>
        </DialogFooter>
        
        {/* Accent strip at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-accent via-secondary to-primary" />
      </DialogContent>
    </Dialog>
  );
}
