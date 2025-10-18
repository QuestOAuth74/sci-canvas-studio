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
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectPreviewModal({ project, isOpen, onClose }: ProjectPreviewModalProps) {
  const navigate = useNavigate();
  const [cloning, setCloning] = useState(false);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{project.title || 'Untitled Project'}</DialogTitle>
          <DialogDescription>
            {project.description || 'No description provided'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Image */}
          <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
            {project.thumbnail_url ? (
              <img 
                src={project.thumbnail_url} 
                alt={project.title || 'Project preview'}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No preview available
              </div>
            )}
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={project.profiles?.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{creatorName}</p>
              <p className="text-sm text-muted-foreground">
                Posted {format(new Date(project.updated_at), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{project.view_count}</span>
              <span className="text-muted-foreground">views</span>
            </span>
            <span className="flex items-center gap-2">
              <Copy className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{project.cloned_count}</span>
              <span className="text-muted-foreground">uses</span>
            </span>
          </div>

          {/* Keywords */}
          {project.keywords && project.keywords.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {project.keywords.map((keyword, i) => (
                  <Badge key={i} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project Details */}
          <div>
            <h3 className="font-semibold mb-2">Project Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Canvas Size:</span>
                <p className="font-medium">{project.canvas_width} × {project.canvas_height}px</p>
              </div>
              <div>
                <span className="text-muted-foreground">Paper Size:</span>
                <p className="font-medium">{project.paper_size}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
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
