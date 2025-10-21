import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserMenu } from '@/components/auth/UserMenu';
import { Loader2, Plus, Trash2, FolderOpen, Search, ArrowLeft, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ShareProjectDialog } from '@/components/projects/ShareProjectDialog';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  updated_at: string;
  paper_size: string;
  canvas_width: number;
  canvas_height: number;
  is_public?: boolean;
  title?: string | null;
  description?: string | null;
  keywords?: string[] | null;
  citations?: string | null;
  approval_status?: string | null;
}

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareDialogProject, setShareDialogProject] = useState<Project | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('canvas_projects')
      .select('id, name, updated_at, paper_size, canvas_width, canvas_height, is_public, title, description, keywords, citations, approval_status')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const createNewProject = () => {
    navigate('/canvas');
  };

  const openProject = (projectId: string) => {
    navigate(`/canvas?project=${projectId}`);
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;

    // Find the project to verify ownership
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      toast.error('Project not found');
      return;
    }

    // Start fade-out animation
    setDeletingIds(prev => new Set(prev).add(projectId));
    toast.loading('Deleting project...', { id: `delete-project-${projectId}` });

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Remove from UI
    setProjects(prev => prev.filter(p => p.id !== projectId));

    // Delete from database
    const { error } = await supabase
      .from('canvas_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user?.id);

    if (error) {
      // Reload projects to restore the item
      toast.error(`Failed to delete: ${error.message}`, { id: `delete-project-${projectId}` });
      console.error('Delete error:', error);
      await loadProjects();
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    } else {
      toast.success('Project deleted', { id: `delete-project-${projectId}` });
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">My Projects</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={createNewProject} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </CardTitle>
              <CardDescription className="mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first diagram to get started'}
              </CardDescription>
              {!searchQuery && (
                <Button onClick={createNewProject}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className={cn(
                  "hover:shadow-lg transition-shadow animate-fade-in",
                  deletingIds.has(project.id) && "animate-fade-out opacity-0 scale-95 pointer-events-none"
                )}
              >
                <CardHeader>
                  <CardTitle className="truncate">{project.name}</CardTitle>
                  <CardDescription>
                    {format(new Date(project.updated_at), 'MMM d, yyyy h:mm a')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p>Size: {project.canvas_width} × {project.canvas_height}px</p>
                    <p>Paper: {project.paper_size}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    onClick={() => openProject(project.id)}
                    className="flex-1"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                  <Button
                    onClick={() => setShareDialogProject(project)}
                    variant="outline"
                    size="icon"
                    title={project.is_public ? 'Shared to community' : 'Share to community'}
                  >
                    <Share2 className={`h-4 w-4 ${project.is_public ? 'text-primary' : ''}`} />
                  </Button>
                  <Button
                    onClick={() => deleteProject(project.id, project.name)}
                    variant="destructive"
                    size="icon"
                    disabled={deletingIds.has(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {shareDialogProject && (
        <ShareProjectDialog
          project={shareDialogProject}
          isOpen={!!shareDialogProject}
          onClose={() => setShareDialogProject(null)}
          onUpdate={loadProjects}
        />
      )}
    </div>
  );
}
