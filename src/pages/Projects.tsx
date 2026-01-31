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
import { Plus, Trash2, FolderOpen, Search, Share2, Globe, Lock, CheckCircle, XCircle, Clock, FileText, Ruler, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
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
  const ITEMS_PER_PAGE = 8;

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

  const stats = {
    total: projects.length,
    public: projects.filter(p => p.is_public).length,
    private: projects.filter(p => !p.is_public).length,
    recent: projects.filter(p => {
      const daysDiff = Math.floor((Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length,
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header Section - Neobrutalist Style */}
        <section className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div>
              <div className="inline-block bg-primary text-primary-foreground px-4 py-1 text-sm font-bold uppercase tracking-wider mb-4 border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                Your Workspace
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-3">
                My Projects
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Create, manage, and share publication-ready scientific illustrations
              </p>
            </div>
            
            <Button 
              onClick={createNewProject} 
              size="lg"
              className="gap-2 self-start lg:self-auto"
            >
              <Plus className="w-5 h-5" />
              New Project
            </Button>
          </div>

          {/* Stats Cards - Brutalist Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, icon: FileText, color: 'bg-secondary' },
              { label: 'Public', value: stats.public, icon: Globe, color: 'bg-success text-success-foreground' },
              { label: 'Private', value: stats.private, icon: Lock, color: 'bg-accent' },
              { label: 'This Week', value: stats.recent, icon: Clock, color: 'bg-primary text-primary-foreground' },
            ].map((stat) => (
              <div 
                key={stat.label}
                className={cn(
                  "p-4 border-2 border-foreground rounded-lg",
                  "shadow-[4px_4px_0px_0px_hsl(var(--foreground))]",
                  stat.color
                )}
              >
                <stat.icon className="w-5 h-5 mb-2 opacity-70" />
                <div className="text-3xl font-bold font-mono">{stat.value}</div>
                <div className="text-sm font-medium uppercase tracking-wide opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-2 border-foreground bg-card shadow-[3px_3px_0px_0px_hsl(var(--foreground))] focus:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] focus:translate-x-[2px] focus:translate-y-[2px] transition-all rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'public', 'private'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-5 py-3 text-sm font-bold uppercase tracking-wide border-2 border-foreground rounded-lg transition-all",
                    filterStatus === status 
                      ? 'bg-foreground text-background shadow-none translate-x-[2px] translate-y-[2px]' 
                      : 'bg-card shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px]'
                  )}
                >
                  {status === 'public' && <Globe className="w-4 h-4 inline mr-2" />}
                  {status === 'private' && <Lock className="w-4 h-4 inline mr-2" />}
                  {status}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-6 p-6 border-2 border-foreground bg-card rounded-lg">
                <Skeleton className="w-48 h-32 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-secondary border-2 border-foreground rounded-lg shadow-[6px_6px_0px_0px_hsl(var(--foreground))]">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'Start Creating'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first scientific illustration'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button onClick={createNewProject} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Project
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Project List - Horizontal Cards */}
            <div className="space-y-4 mb-10">
              {paginatedProjects.map((project, index) => (
                <div
                  key={project.id}
                  className={cn(
                    "group flex flex-col md:flex-row gap-6 p-5 cursor-pointer transition-all duration-150",
                    "bg-card border-2 border-foreground rounded-lg",
                    "shadow-[5px_5px_0px_0px_hsl(var(--foreground))]",
                    "hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:translate-x-[3px] hover:translate-y-[3px]"
                  )}
                  onClick={() => openProject(project.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full md:w-56 h-40 md:h-36 flex-shrink-0 overflow-hidden rounded-lg border-2 border-foreground bg-muted">
                    <img
                      src={project.thumbnail_url || noPreviewImage}
                      alt={project.name}
                      className="w-full h-full object-contain"
                    />
                    {/* Index Badge */}
                    <div className="absolute top-2 left-2 bg-foreground text-background px-2 py-1 text-xs font-mono font-bold rounded">
                      #{String(index + 1 + (currentPage - 1) * ITEMS_PER_PAGE).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-xl font-bold text-foreground truncate">
                          {project.name}
                        </h3>
                        <Badge 
                          className={cn(
                            "flex-shrink-0 border-2 border-foreground font-bold uppercase text-xs",
                            project.is_public 
                              ? 'bg-success text-success-foreground' 
                              : 'bg-secondary text-secondary-foreground'
                          )}
                        >
                          {project.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1.5 font-mono">
                          <Ruler className="w-4 h-4" />
                          {project.canvas_width} × {project.canvas_height}
                        </span>
                        {project.approval_status && project.approval_status !== 'pending' && (
                          <Badge variant={project.approval_status === 'approved' ? 'default' : 'destructive'} className="border-2 border-foreground">
                            {project.approval_status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {project.approval_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                            {project.approval_status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProject(project.id);
                        }}
                        className="gap-1.5"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareDialogProject(project);
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id, project.name);
                        }}
                        className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="hidden md:flex items-center">
                    <div className="w-12 h-12 rounded-lg border-2 border-foreground bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 p-3 bg-card border-2 border-foreground rounded-lg shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="font-bold"
                  >
                    Prev
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-10 h-10 text-sm font-bold border-2 border-foreground rounded-lg transition-all",
                          currentPage === page 
                            ? 'bg-foreground text-background' 
                            : 'bg-card hover:bg-secondary'
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  {totalPages > 5 && (
                    <span className="px-2 font-mono text-muted-foreground">...</span>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="font-bold"
                  >
                    Next
                  </Button>
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
