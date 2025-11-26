import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserMenu } from '@/components/auth/UserMenu';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Loader2, Plus, Trash2, FolderOpen, Search, ArrowLeft, Share2, Calendar, Ruler, Globe, Lock, CheckCircle, XCircle, Clock, Eye, BarChart3, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ShareProjectDialog } from '@/components/projects/ShareProjectDialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import noPreviewImage from '@/assets/no_preview.png';

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
  thumbnail_url?: string | null;
}

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareDialogProject, setShareDialogProject] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'public' | 'private'>('all');
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('canvas_projects')
      .select('id, name, updated_at, paper_size, canvas_width, canvas_height, is_public, title, description, keywords, citations, approval_status, thumbnail_url')
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

    const { error } = await supabase
      .from('canvas_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to delete project');
    } else {
      toast.success('Project deleted');
      loadProjects();
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'public' ? p.is_public === true :
      filterStatus === 'private' ? p.is_public === false :
      true;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: projects.length,
    public: projects.filter(p => p.is_public).length,
    private: projects.filter(p => !p.is_public).length,
    recent: projects.filter(p => {
      const daysDiff = Math.floor((Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length,
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Paginate filtered projects
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen relative">
      {/* Paper aging effects */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-[hsl(var(--pencil-gray)_/_0.03)] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[hsl(var(--pencil-gray)_/_0.02)] to-transparent pointer-events-none" />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Enhanced Header with Stats */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 font-source-serif ink-text">
                <span className="highlighter-bg">My Projects</span>
              </h1>
              <p className="text-muted-foreground handwritten text-lg">
                ~ Manage and organize your scientific illustrations ~
              </p>
            </div>
            <Button 
              onClick={createNewProject} 
              size="lg"
              variant="sticky"
              className="gap-2 shadow-lg hover:shadow-xl transition-shadow text-base"
            >
              <Plus className="w-5 h-5" />
              New Project
            </Button>
          </div>

          {/* Stats Dashboard - Notebook Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:scale-[1.02] transition-all rotate-[-0.5deg]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Projects</p>
                    <p className="text-3xl font-bold mt-1 ink-text">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:scale-[1.02] transition-all rotate-[0.5deg]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Public</p>
                    <p className="text-3xl font-bold mt-1 ink-text">{stats.public}</p>
                  </div>
                  <div className="w-12 h-12 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:scale-[1.02] transition-all rotate-[-0.3deg]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Private</p>
                    <p className="text-3xl font-bold mt-1 ink-text">{stats.private}</p>
                  </div>
                  <div className="w-12 h-12 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:scale-[1.02] transition-all rotate-[0.3deg]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Recent (7d)</p>
                    <p className="text-3xl font-bold mt-1 ink-text">{stats.recent}</p>
                  </div>
                  <div className="w-12 h-12 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base border-2 border-[hsl(var(--pencil-gray))]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'ink' : 'pencil'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'public' ? 'ink' : 'pencil'}
                onClick={() => setFilterStatus('public')}
                size="sm"
                className="gap-1"
              >
                <Globe className="w-3 h-3" />
                Public
              </Button>
              <Button
                variant={filterStatus === 'private' ? 'ink' : 'pencil'}
                onClick={() => setFilterStatus('private')}
                size="sm"
                className="gap-1"
              >
                <Lock className="w-3 h-3" />
                Private
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full aspect-[16/9]" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Enhanced Empty State */
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <FolderOpen className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'No projects yet'}
              </h2>
              <p className="text-muted-foreground mb-8">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first scientific illustration to get started'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <>
                  <Button 
                    onClick={createNewProject} 
                    size="lg"
                    className="gap-2 shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Project
                  </Button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left">
                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">Choose Template</h3>
                        <p className="text-sm text-muted-foreground">Start with a blank canvas or pre-designed template</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">Design & Create</h3>
                        <p className="text-sm text-muted-foreground">Add icons, shapes, and text to build your diagram</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <Share2 className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">Export & Share</h3>
                        <p className="text-sm text-muted-foreground">Download high-quality images or share publicly</p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Modern Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedProjects.map((project, index) => (
                <Card 
                  key={project.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Thumbnail with Gradient Overlay */}
                  <div className="relative overflow-hidden bg-muted">
                    <AspectRatio ratio={16 / 9}>
                      <img
                        src={project.thumbnail_url || noPreviewImage}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Status Corner Ribbon */}
                      {project.approval_status && project.approval_status !== 'pending' && (
                        <div className="absolute top-3 right-3">
                          <Badge 
                            variant={
                              project.approval_status === 'approved' ? 'default' : 
                              project.approval_status === 'rejected' ? 'destructive' : 
                              'secondary'
                            }
                            className="shadow-lg"
                          >
                            {project.approval_status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {project.approval_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                            {project.approval_status}
                          </Badge>
                        </div>
                      )}

                      {/* Quick Action Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          onClick={() => openProject(project.id)}
                          size="lg"
                          className="shadow-xl"
                        >
                          <FolderOpen className="w-5 h-5 mr-2" />
                          Open Project
                        </Button>
                      </div>
                    </AspectRatio>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      {/* Project Title */}
                      <div>
                        <h3 className="font-bold text-lg line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Metadata Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                          <Ruler className="w-3 h-3" />
                          {project.canvas_width} × {project.canvas_height}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`gap-1 ${project.is_public ? 'border-green-500/50 text-green-600 dark:text-green-400' : 'border-orange-500/50 text-orange-600 dark:text-orange-400'}`}
                        >
                          {project.is_public ? (
                            <>
                              <Globe className="w-3 h-3" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              Private
                            </>
                          )}
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => openProject(project.id)}
                          className="flex-1 gap-1"
                          size="sm"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Open
                        </Button>
                        <Button
                          onClick={() => setShareDialogProject(project)}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </Button>
                        <Button
                          onClick={() => deleteProject(project.id, project.name)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </main>

      {/* Share Dialog */}
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
