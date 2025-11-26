import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, Copy, Loader2, Paperclip } from 'lucide-react';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto stable-dialog bg-[hsl(var(--cream))] border-2 border-[hsl(var(--pencil-gray))] paper-shadow sketch-border">
        {/* Decorative tape at top */}
        <div className="absolute -top-3 left-1/4 w-20 h-6 bg-[hsl(var(--highlighter-yellow))]/40 rotate-[-2deg] border border-[hsl(var(--pencil-gray))]/30" />
        
        {/* Paperclip decoration */}
        <div className="absolute top-4 right-4">
          <Paperclip className="h-5 w-5 text-[hsl(var(--pencil-gray))] rotate-45 opacity-60" />
        </div>

        <DialogHeader className="space-y-3">
          <DialogTitle className="text-4xl handwritten ink-text">{project.title || 'Untitled Project'}</DialogTitle>
          <DialogDescription className="font-source-serif text-base text-[hsl(var(--pencil-gray))]">
            {project.description || 'No description provided'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pt-4">
          {/* Preview Image - Polaroid Style */}
          <div className="relative mx-auto max-w-2xl">
            <div className="bg-white p-4 pb-12 paper-shadow border-2 border-[hsl(var(--pencil-gray))] rotate-[0.5deg]">
              <div className="w-full aspect-video bg-[hsl(var(--cream))]/30 overflow-hidden">
                {project.thumbnail_url ? (
                  <img 
                    src={project.thumbnail_url} 
                    alt={project.title || 'Project preview'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-source-serif text-[hsl(var(--pencil-gray))]">
                    No preview available
                  </div>
                )}
              </div>
              <p className="text-center mt-3 handwritten text-lg ink-text">{project.title || 'Project Preview'}</p>
            </div>
            {/* Tape holding polaroid */}
            <div className="absolute -top-2 right-8 w-16 h-5 bg-[hsl(var(--highlighter-yellow))]/40 rotate-[8deg] border border-[hsl(var(--pencil-gray))]/30" />
          </div>

          {/* Creator Info - Index Card Style */}
          <div className="relative w-fit mx-auto">
            <div className="bg-white p-4 paper-shadow border-2 border-[hsl(var(--pencil-gray))] rotate-[-1deg] flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-[hsl(var(--ink-blue))]">
                <AvatarImage src={project.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-[hsl(var(--highlighter-yellow))]/60 handwritten ink-text">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium handwritten text-xl ink-text">{creatorName}</p>
                <p className="text-sm font-source-serif text-[hsl(var(--pencil-gray))]">
                  Posted {format(new Date(project.updated_at), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Stats - Sticky Notes */}
          <div className="flex items-center justify-center gap-6">
            <div className="relative">
              <div className="bg-[hsl(var(--highlighter-yellow))]/60 p-4 paper-shadow border border-[hsl(var(--pencil-gray))]/40 rotate-[-2deg] min-w-[120px] text-center">
                <Eye className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--ink-blue))]" />
                <span className="block text-3xl font-bold handwritten ink-text">{project.view_count}</span>
                <span className="block text-sm font-source-serif text-[hsl(var(--pencil-gray))]">views</span>
              </div>
              {/* Tape on sticky note */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/50 border border-[hsl(var(--pencil-gray))]/20" />
            </div>
            
            <div className="relative">
              <div className="bg-[hsl(var(--highlighter-yellow))]/60 p-4 paper-shadow border border-[hsl(var(--pencil-gray))]/40 rotate-[1.5deg] min-w-[120px] text-center">
                <Copy className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--ink-blue))]" />
                <span className="block text-3xl font-bold handwritten ink-text">{project.cloned_count}</span>
                <span className="block text-sm font-source-serif text-[hsl(var(--pencil-gray))]">uses</span>
              </div>
              {/* Tape on sticky note */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/50 border border-[hsl(var(--pencil-gray))]/20" />
            </div>
          </div>

          {/* Keywords - Paper Tags */}
          {project.keywords && project.keywords.length > 0 && (
            <div className="bg-white/60 p-4 rounded border border-[hsl(var(--pencil-gray))] paper-shadow">
              <h3 className="handwritten text-xl ink-text mb-3 relative inline-block">
                Keywords
                <span className="absolute bottom-0 left-0 right-0 h-2 bg-[hsl(var(--highlighter-yellow))]/60 -z-10" />
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.keywords.map((keyword, i) => (
                  <Badge 
                    key={i} 
                    className="bg-white border border-[hsl(var(--pencil-gray))] text-[hsl(var(--ink-blue))] font-source-serif hover:bg-[hsl(var(--highlighter-yellow))]/20 paper-shadow"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project Details - Ruled Paper Section */}
          <div className="bg-white/80 p-5 rounded border-2 border-[hsl(var(--pencil-gray))] paper-shadow graph-paper">
            <h3 className="handwritten text-xl ink-text mb-4 relative inline-block">
              Project Details
              <span className="absolute bottom-0 left-0 right-0 h-2 bg-[hsl(var(--highlighter-yellow))]/60 -z-10" />
            </h3>
            <div className="grid grid-cols-2 gap-6 font-source-serif">
              <div>
                <span className="text-sm text-[hsl(var(--pencil-gray))]">Canvas Size:</span>
                <p className="handwritten text-xl ink-text">{project.canvas_width} × {project.canvas_height}px</p>
              </div>
              <div>
                <span className="text-sm text-[hsl(var(--pencil-gray))]">Paper Size:</span>
                <p className="handwritten text-xl ink-text">{project.paper_size}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-6">
          <Button variant="pencil" onClick={onClose} className="font-source-serif">
            Close
          </Button>
          <Button variant="sticky" onClick={handleCloneProject} disabled={cloning} className="font-source-serif">
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
