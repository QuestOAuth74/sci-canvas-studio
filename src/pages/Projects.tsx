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
  PaginationEllipsis,
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
      .eq('user_id', user!.id)
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Professional Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight mb-2">
                My Projects
              </h1>
              <p className="text-muted-foreground text-lg font-source-serif">
                Manage and organize your scientific illustrations
              </p>
            </div>
            <Button 
              onClick={createNewProject} 
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md font-medium"
            >
              <Plus className="w-5 h-5" />
              New Project
            </Button>
          </div>

          {/* Stats Dashboard - Clean Professional Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card border border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Projects</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Public</p>
                    <p className="text-3xl font-bold text-foreground">{stats.public}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Private</p>
                    <p className="text-3xl font-bold text-foreground">{stats.private}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Recent (7d)</p>
                    <p className="text-3xl font-bold text-foreground">{stats.recent}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters - Clean Design */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base border-border bg-card focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filterStatus === 'all' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('public')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  filterStatus === 'public' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Public
              </button>
              <button
                onClick={() => setFilterStatus('private')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  filterStatus === 'private' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Private
              </button>
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
          /* Professional Empty State */
          <div className="text-center py-20">
            <div className="max-w-2xl mx-auto">
              {/* Clean icon container */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-muted-foreground" />
              </div>

              <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
                {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'Start Your First Project'}
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : 'Create beautiful scientific illustrations for your research and publications'}
              </p>

              {!searchQuery && filterStatus === 'all' && (
                <>
                  <div className="flex flex-wrap gap-4 justify-center mb-12">
                    <Button 
                      onClick={createNewProject} 
                      size="lg"
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="w-5 h-5" />
                      Start Blank Canvas
                    </Button>
                    <Button 
                      onClick={createNewProject}
                      size="lg"
                      variant="outline"
                      className="gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Browse Templates
                    </Button>
                  </div>

                  {/* Feature cards - Clean professional style */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                    <Card className="bg-card border border-border p-6">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Choose Template</h3>
                      <p className="text-sm text-muted-foreground">Start with a blank canvas or browse community templates</p>
                    </Card>
                    
                    <Card className="bg-card border border-border p-6">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Design & Create</h3>
                      <p className="text-sm text-muted-foreground">Add icons, shapes, connectors, and text to build your diagram</p>
                    </Card>
                    
                    <Card className="bg-card border border-border p-6">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Share2 className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Export & Share</h3>
                      <p className="text-sm text-muted-foreground">Download high-quality images or share with the community</p>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Professional Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedProjects.map((project, index) => (
                <Card 
                  key={project.id}
                  className="group overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden">
                    <AspectRatio ratio={16 / 9}>
                      <img
                        src={project.thumbnail_url || noPreviewImage}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Status Badge */}
                      {project.approval_status && project.approval_status !== 'pending' && (
                        <div className="absolute top-3 right-3">
                          <Badge 
                            variant={
                              project.approval_status === 'approved' ? 'default' : 
                              project.approval_status === 'rejected' ? 'destructive' : 
                              'secondary'
                            }
                            className="shadow-sm"
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
                          className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <FolderOpen className="w-5 h-5 mr-2" />
                          Open Project
                        </Button>
                      </div>
                    </AspectRatio>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-4 space-y-3">
                    {/* Project Name */}
                    <h3 className="font-semibold text-foreground line-clamp-1">{project.name}</h3>
                    
                    {/* Last Updated */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                    </p>

                    {/* Metadata Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Ruler className="w-3 h-3" />
                        {project.canvas_width} × {project.canvas_height}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={`gap-1 text-xs ${
                          project.is_public 
                            ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400' 
                            : 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                        }`}
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
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Clean Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                      />
                    </PaginationItem>
                    
                    {(() => {
                      const getVisiblePages = (): (number | 'ellipsis')[] => {
                        if (totalPages <= 7) {
                          return Array.from({ length: totalPages }, (_, i) => i + 1);
                        }
                        
                        const pages: (number | 'ellipsis')[] = [];
                        pages.push(1, 2, 3);
                        
                        if (currentPage > 5) {
                          pages.push('ellipsis');
                        }
                        
                        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                          if (i > 3 && i < totalPages - 2 && !pages.includes(i)) {
                            pages.push(i);
                          }
                        }
                        
                        if (currentPage < totalPages - 4) {
                          pages.push('ellipsis');
                        }
                        
                        for (let i = totalPages - 2; i <= totalPages; i++) {
                          if (!pages.includes(i)) {
                            pages.push(i);
                          }
                        }
                        
                        return pages;
                      };
                      
                      return getVisiblePages().map((page, index) => (
                        <PaginationItem key={`${page}-${index}`}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ));
                    })()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
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
