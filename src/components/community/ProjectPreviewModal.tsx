import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, Copy, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface ProjectPreviewModalProps {
  project: {
    id: string;
    title: string | null;
    description: string | null;
    keywords: string[] | null;
    updated_at: string;
    thumbnail_url: string | null;
    view_count: number;
    cloned_count: number;
    canvas_width: number;
    canvas_height: number;
    paper_size: string;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectPreviewModal({ project, isOpen, onClose }: ProjectPreviewModalProps) {
  const navigate = useNavigate();
  const [cloning, setCloning] = useState(false);
  
  // Don't render if project is null or modal is closed
  if (!project || !isOpen) return null;
  
  const creatorName = project.profiles?.full_name || 'Anonymous';
  const initials = creatorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (isOpen) {
      // Increment view count when modal opens
      supabase.rpc('increment_project_view_count', { 
        project_id_param: project.id 
      }).then(({ error }) => {
        if (error) console.error('Failed to increment view count:', error);
      });
    }
  }, [isOpen, project.id]);

  const handleCloneProject = async () => {
    setCloning(true);
    try {
      const { data, error } = await supabase.rpc('clone_project', {
        source_project_id: project.id,
        new_project_name: `Copy of ${project.title || project.id}`
      });

      if (error) throw error;

      toast.success('Project cloned to your workspace!');
      onClose();
      navigate(`/canvas?project=${data}`);
    } catch (error: any) {
      console.error('Error cloning project:', error);
      toast.error(error.message || 'Failed to clone project');
    } finally {
      setCloning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto stable-dialog bg-card border border-border/50 shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-serif font-bold text-foreground">{project.title || 'Untitled Project'}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {project.description || 'No description provided'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pt-4">
          {/* Preview Image - Full Canvas View */}
          <div className="relative mx-auto">
            <div className="bg-muted/30 rounded-xl overflow-hidden shadow-xl ring-1 ring-border/20 flex items-center justify-center max-h-[60vh]">
              {project.thumbnail_url ? (
                <img 
                  src={project.thumbnail_url} 
                  alt={project.title || 'Project preview'}
                  className="max-w-full max-h-[60vh] w-auto h-auto object-contain"
                />
              ) : (
                <div className="w-full py-20 flex items-center justify-center text-muted-foreground">
                  No preview available
                </div>
              )}
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/30">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={project.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{creatorName}</p>
                <p className="text-sm text-muted-foreground">
                  Posted {format(new Date(project.updated_at), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="font-medium text-foreground">{project.view_count.toLocaleString()}</span>
                <span>views</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Copy className="h-4 w-4" />
                <span className="font-medium text-foreground">{project.cloned_count.toLocaleString()}</span>
                <span>uses</span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {project.keywords && project.keywords.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {project.keywords.map((keyword, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary"
                    className="bg-muted/50 hover:bg-muted text-muted-foreground"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border border-border/30">
            <div>
              <span className="text-sm text-muted-foreground">Canvas Size</span>
              <p className="font-medium text-foreground">{project.canvas_width} × {project.canvas_height}px</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Paper Size</span>
              <p className="font-medium text-foreground">{project.paper_size}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCloneProject} disabled={cloning}>
            {cloning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cloning...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Use This Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
