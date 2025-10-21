import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserMenu } from '@/components/auth/UserMenu';
import { Loader2, Plus, Trash2, FolderOpen, Search, ArrowLeft, Share2, Sparkles, Eye, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ShareProjectDialog } from '@/components/projects/ShareProjectDialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

interface FeaturedProject {
  id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  keywords: string[] | null;
  canvas_width: number;
  canvas_height: number;
  view_count: number;
  cloned_count: number;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareDialogProject, setShareDialogProject] = useState<Project | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [featuredProject, setFeaturedProject] = useState<FeaturedProject | null>(null);
  const [cloningProject, setCloningProject] = useState(false);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && projects.length === 0 && !searchQuery) {
      loadFeaturedProject();
    }
  }, [loading, projects.length, searchQuery]);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('canvas_projects')
      .select('id, name, updated_at, paper_size, canvas_width, canvas_height, is_public, title, description, keywords, citations, approval_status')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const loadFeaturedProject = async () => {
    const { data, error } = await supabase
      .from('canvas_projects')
      .select(`
        id, title, description, thumbnail_url, keywords,
        canvas_width, canvas_height, view_count, cloned_count, user_id
      `)
      .eq('is_public', true)
      .eq('approval_status', 'approved')
      .not('thumbnail_url', 'is', null)
      .order('cloned_count', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data && !error) {
      // Fetch profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', data.user_id)
        .maybeSingle();
      
      setFeaturedProject({
        ...data,
        profiles: profile
      });
    }
  };

  const cloneProjectAsTemplate = async (projectId: string) => {
    setCloningProject(true);
    toast.loading('Creating your project from template...', { id: 'clone-template' });
    
    const { data, error } = await supabase.rpc('clone_project', {
      source_project_id: projectId,
      new_project_name: 'My Project from Template'
    });
    
    if (error) {
      toast.error('Failed to clone template. Starting blank canvas instead.', { id: 'clone-template' });
      console.error(error);
      navigate('/canvas');
    } else {
      toast.success('Template loaded! Start customizing.', { id: 'clone-template' });
      navigate(`/canvas?project=${data}`);
    }
    
    setCloningProject(false);
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
          searchQuery ? (
            <Card className="text-center py-16">
              <CardContent>
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <CardTitle className="mb-2">No projects found</CardTitle>
                <CardDescription className="mb-6">Try a different search term</CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                  No Projects Yet - But Here's Inspiration!
                </h2>
                <p className="text-muted-foreground">Start with a professional template or create from scratch</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Featured Template Card */}
                {featuredProject ? (
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="relative">
                      <div className="absolute top-4 left-4 z-10">
                        <Badge className="bg-primary text-primary-foreground">Featured Template</Badge>
                      </div>
                      {featuredProject.thumbnail_url && (
                        <img
                          src={featuredProject.thumbnail_url}
                          alt={featuredProject.title || 'Featured project'}
                          className="w-full h-64 object-cover"
                        />
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {featuredProject.title || 'Untitled Project'}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {featuredProject.description || 'Professional scientific illustration'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {featuredProject.profiles && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>By {featuredProject.profiles.full_name || 'Anonymous'}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {featuredProject.view_count} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Copy className="h-4 w-4" />
                            {featuredProject.cloned_count} clones
                          </span>
                        </div>
                        {featuredProject.keywords && featuredProject.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {featuredProject.keywords.slice(0, 3).map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => cloneProjectAsTemplate(featuredProject.id)}
                        disabled={cloningProject}
                        className="w-full"
                        size="lg"
                      >
                        {cloningProject ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Use This Template
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="overflow-hidden">
                    <CardContent className="p-8 flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Loading featured template...</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Start from Scratch Card */}
                <Card className="flex flex-col justify-between hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-primary/5">
                  <div>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Plus className="h-6 w-6" />
                        Start from Scratch
                      </CardTitle>
                      <CardDescription>
                        Create a blank canvas and build your diagram from the ground up
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Sparkles className="h-4 w-4" />
                          Join other scientists creating publication-ready figures
                        </p>
                        <p className="flex items-center gap-2 text-muted-foreground">
                          ⚡ Average time to first project: 5 minutes
                        </p>
                      </div>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-primary"
                        onClick={() => navigate('/community')}
                      >
                        Browse Community Gallery →
                      </Button>
                    </CardContent>
                  </div>
                  <CardFooter>
                    <Button 
                      onClick={createNewProject}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Blank Canvas
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )
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
