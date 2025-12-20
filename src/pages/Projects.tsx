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
    <div className="min-h-screen bg-background">
      {/* Subtle academic pattern background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }} />
      
      <main className="container mx-auto px-4 py-10 max-w-7xl relative">
        {/* Modern Academic Header */}
        <header className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <span className="text-sm font-medium text-primary uppercase tracking-widest">Research Workspace</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground tracking-tight leading-none">
                My Projects
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl">
                Create, manage, and share publication-ready scientific illustrations
              </p>
            </div>
            <Button 
              onClick={createNewProject} 
              size="lg"
              className="gap-2.5 h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-medium text-base"
            >
              <Plus className="w-5 h-5" />
              New Project
            </Button>
          </div>

          {/* Stats Dashboard - Modern Academic Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="group relative bg-card rounded-xl border border-border/50 p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total</p>
                  <p className="text-4xl font-bold text-foreground font-serif">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">projects</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="group relative bg-card rounded-xl border border-border/50 p-6 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Public</p>
                  <p className="text-4xl font-bold text-foreground font-serif">{stats.public}</p>
                  <p className="text-xs text-muted-foreground">shared</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-emerald-500/10 transition-colors">
                  <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="group relative bg-card rounded-xl border border-border/50 p-6 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Private</p>
                  <p className="text-4xl font-bold text-foreground font-serif">{stats.private}</p>
                  <p className="text-xs text-muted-foreground">drafts</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-amber-500/10 transition-colors">
                  <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            <div className="group relative bg-card rounded-xl border border-border/50 p-6 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Recent</p>
                  <p className="text-4xl font-bold text-foreground font-serif">{stats.recent}</p>
                  <p className="text-xs text-muted-foreground">this week</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-500/10 transition-colors">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters - Modern Design */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-border/50 bg-card rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>
            <div className="flex gap-1 bg-muted/30 p-1.5 rounded-xl border border-border/50">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  filterStatus === 'all' 
                    ? 'bg-card text-foreground shadow-sm border border-border/50' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('public')}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  filterStatus === 'public' 
                    ? 'bg-card text-foreground shadow-sm border border-border/50' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                onClick={() => setFilterStatus('private')}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  filterStatus === 'private' 
                    ? 'bg-card text-foreground shadow-sm border border-border/50' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>
          </div>
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <Skeleton className="w-full aspect-[16/9]" />
                <div className="p-5 space-y-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Modern Academic Empty State */
          <div className="text-center py-24">
            <div className="max-w-2xl mx-auto">
              {/* Elegant icon container */}
              <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                <FolderOpen className="w-12 h-12 text-primary/70" />
              </div>

              <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
                {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'Begin Your Research'}
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : 'Create publication-ready scientific illustrations for your research papers and presentations'}
              </p>

              {!searchQuery && filterStatus === 'all' && (
                <>
                  <div className="flex flex-wrap gap-4 justify-center mb-16">
                    <Button 
                      onClick={createNewProject} 
                      size="lg"
                      className="gap-2.5 h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      <Plus className="w-5 h-5" />
                      Start Blank Canvas
                    </Button>
                    <Button 
                      onClick={createNewProject}
                      size="lg"
                      variant="outline"
                      className="gap-2.5 h-12 px-8 border-border/50 hover:bg-muted/50"
                    >
                      <FileText className="w-5 h-5" />
                      Browse Templates
                    </Button>
                  </div>

                  {/* Feature cards - Academic style with numbers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                    <div className="relative bg-card rounded-xl border border-border/50 p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                      <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg">1</div>
                      <div className="pt-4">
                        <h3 className="font-semibold text-foreground mb-2 text-lg">Choose Template</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">Start with a blank canvas or browse community templates for inspiration</p>
                      </div>
                    </div>
                    
                    <div className="relative bg-card rounded-xl border border-border/50 p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                      <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg">2</div>
                      <div className="pt-4">
                        <h3 className="font-semibold text-foreground mb-2 text-lg">Design & Create</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">Add icons, shapes, connectors, and text to build your scientific diagram</p>
                      </div>
                    </div>
                    
                    <div className="relative bg-card rounded-xl border border-border/50 p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                      <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg">3</div>
                      <div className="pt-4">
                        <h3 className="font-semibold text-foreground mb-2 text-lg">Export & Share</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">Download high-quality images or share with the research community</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Modern Academic Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {paginatedProjects.map((project, index) => (
                <div 
                  key={project.id}
                  className="group relative bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden">
                    <AspectRatio ratio={16 / 9}>
                      <img
                        src={project.thumbnail_url || noPreviewImage}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Status Badge */}
                      {project.approval_status && project.approval_status !== 'pending' && (
                        <div className="absolute top-4 right-4">
                          <Badge 
                            variant={
                              project.approval_status === 'approved' ? 'default' : 
                              project.approval_status === 'rejected' ? 'destructive' : 
                              'secondary'
                            }
                            className="shadow-lg backdrop-blur-sm"
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
                          className="shadow-xl bg-white/95 hover:bg-white text-foreground font-medium"
                        >
                          <FolderOpen className="w-5 h-5 mr-2" />
                          Open Project
                        </Button>
                      </div>
                    </AspectRatio>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    {/* Project Name */}
                    <h3 className="font-semibold text-foreground text-lg line-clamp-1 group-hover:text-primary transition-colors">{project.name}</h3>
                    
                    {/* Metadata row */}
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                      </p>
                      <Badge 
                        variant="outline"
                        className={`gap-1.5 font-medium ${
                          project.is_public 
                            ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' 
                            : 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                        }`}
                      >
                        {project.is_public ? (
                          <>
                            <Globe className="w-3.5 h-3.5" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            Private
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Dimensions */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{project.canvas_width} × {project.canvas_height} px</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => openProject(project.id)}
                        className="flex-1 gap-2 h-10"
                        size="sm"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Open
                      </Button>
                      <Button
                        onClick={() => setShareDialogProject(project)}
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 border-border/50"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteProject(project.id, project.name)}
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modern Academic Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center pt-4">
                <div className="bg-card rounded-xl border border-border/50 p-2">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={`rounded-lg ${currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:bg-muted'}`}
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
                                className={`cursor-pointer rounded-lg font-medium ${
                                  currentPage === page 
                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                    : 'hover:bg-muted'
                                }`}
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
                          className={`rounded-lg ${currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:bg-muted'}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
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
