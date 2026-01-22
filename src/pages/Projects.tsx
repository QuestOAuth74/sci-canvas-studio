import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis,
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Plus, Trash2, FolderOpen, Search, Share2, Globe, Lock, CheckCircle, XCircle, Clock, FileText, Star, MoveRight, Calendar, Ruler, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ShareProjectDialog } from '@/components/projects/ShareProjectDialog';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-background relative">
      <main className="container mx-auto px-4 py-10 max-w-7xl relative">
        {/* Modern Header Section */}
        <section className="relative py-8 mb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-foreground tracking-tight mb-2">
            My Projects
          </h1>
          
          {/* Background Label */}
          <div className="pointer-events-none absolute top-0 left-0 text-[8rem] md:text-[12rem] font-bold text-muted/5 select-none leading-none -z-10">
            PROJECTS
          </div>
          
          <p className="text-muted-foreground text-lg max-w-2xl mb-8">
            Create, manage, and share publication-ready scientific illustrations
          </p>

          {/* Quick Stats Row */}
          <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="font-semibold text-foreground">{stats.total}</span> total
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-foreground">{stats.public}</span> public
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-foreground">{stats.private}</span> private
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-foreground">{stats.recent}</span> this week
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 text-base border-border/50 bg-card rounded-xl focus:border-primary/50"
              />
            </div>
            <div className="flex gap-1.5 p-1.5 bg-muted/30 rounded-xl border border-border/50">
              {(['all', 'public', 'private'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                    filterStatus === status 
                      ? 'bg-card text-foreground shadow-sm border border-border/50' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                  )}
                >
                  {status === 'public' && <Globe className="w-3.5 h-3.5" />}
                  {status === 'private' && <Lock className="w-3.5 h-3.5" />}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <Button 
              onClick={createNewProject} 
              size="lg"
              className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <Skeleton className="w-full aspect-[4/3]" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24">
            <div className="max-w-lg mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
                {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'Begin Your Research'}
              </h2>
              <p className="text-muted-foreground mb-8">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create publication-ready scientific illustrations for your research'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button onClick={createNewProject} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Project
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Modern Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {paginatedProjects.map((project, index) => {
                const isPrimary = index === 0;
                
                return (
                  <div
                    key={project.id}
                    className={cn(
                      "group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500",
                      "bg-card border border-border/50 hover:border-primary/30",
                      "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                      isPrimary && "md:col-span-2 md:row-span-2"
                    )}
                    onClick={() => openProject(project.id)}
                  >
                    {/* Image Container */}
                    <div className={cn(
                      "relative overflow-hidden bg-muted/30",
                      isPrimary ? "aspect-[16/9]" : "aspect-[4/3]"
                    )}>
                      <img
                        src={project.thumbnail_url || noPreviewImage}
                        alt={project.name}
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "backdrop-blur-sm border-0",
                            project.is_public 
                              ? 'bg-emerald-500/90 text-white' 
                              : 'bg-amber-500/90 text-white'
                          )}
                        >
                          {project.is_public ? (
                            <><Globe className="w-3 h-3 mr-1" /> Public</>
                          ) : (
                            <><Lock className="w-3 h-3 mr-1" /> Private</>
                          )}
                        </Badge>
                      </div>

                      {/* Approval Status Badge */}
                      {project.approval_status && project.approval_status !== 'pending' && (
                        <div className="absolute top-4 right-4">
                          <Badge 
                            variant={project.approval_status === 'approved' ? 'default' : 'destructive'}
                            className="backdrop-blur-sm"
                          >
                            {project.approval_status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {project.approval_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                            {project.approval_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5">
                      <div className="space-y-3">
                        {/* Title */}
                        <h3 className={cn(
                          "font-semibold text-white leading-tight line-clamp-2",
                          isPrimary ? "text-2xl md:text-3xl" : "text-lg"
                        )}>
                          {project.name}
                        </h3>
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5" />
                            {project.canvas_width} × {project.canvas_height}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            size="sm"
                            className="bg-white/90 hover:bg-white text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProject(project.id);
                            }}
                          >
                            <FolderOpen className="w-4 h-4 mr-1.5" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-white/20 hover:bg-white/30 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareDialogProject(project);
                            }}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-white/20 hover:bg-destructive/90 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(project.id, project.name);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Hover Arrow */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        {!project.approval_status || project.approval_status === 'pending' ? (
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <MoveRight className="w-5 h-5 text-white" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center pt-4">
                <div className="bg-card rounded-xl border border-border/50 p-2">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={cn(
                            "rounded-lg",
                            currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:bg-muted'
                          )}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className={cn(
                              "cursor-pointer rounded-lg font-medium",
                              currentPage === page 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-muted'
                            )}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {totalPages > 5 && <PaginationEllipsis />}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={cn(
                            "rounded-lg",
                            currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer hover:bg-muted'
                          )}
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
