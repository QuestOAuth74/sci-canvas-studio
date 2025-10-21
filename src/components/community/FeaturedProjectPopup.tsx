import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, Sparkles } from "lucide-react";
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
      <DialogContent className="sm:max-w-2xl neo-border border-4 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <Badge variant="secondary" className="neo-brutalist-shadow">
              Featured Community Project
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {project.title || 'Untitled Project'}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {project.description || 'A creative scientific illustration from our community'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Thumbnail */}
          <div className="relative aspect-video w-full rounded-lg overflow-hidden neo-brutalist-shadow border-4 border-border bg-muted">
            {project.thumbnail_url ? (
              <img
                src={project.thumbnail_url}
                alt={project.title || 'Project thumbnail'}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No preview available
              </div>
            )}
          </div>

          {/* Creator & Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold border-2 border-primary">
                {project.profiles?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="font-medium text-foreground">
                by {project.profiles?.full_name || 'Anonymous'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {project.view_count}
              </span>
              <span className="flex items-center gap-1">
                <Copy className="h-4 w-4" />
                {project.cloned_count}
              </span>
            </div>
          </div>

          {/* Keywords */}
          {project.keywords && project.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.keywords.slice(0, 5).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="neo-border border-2"
          >
            Close
          </Button>
          <Button
            onClick={handleViewProject}
            className="neo-brutalist-shadow bg-primary text-primary-foreground hover:translate-x-1 hover:translate-y-1 transition-transform"
          >
            View Full Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
