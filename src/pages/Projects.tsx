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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="blob-1 top-[-100px] right-[-100px] opacity-40" />
        <div className="blob-2 bottom-[20%] left-[-50px] opacity-30" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
      </div>

      <main className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
        {/* Header Section */}
        <section className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-600 text-sm font-medium mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Your Workspace
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
                My Projects
              </h1>
              <p className="text-lg text-slate-600 max-w-xl">
                Create, manage, and share publication-ready scientific illustrations
              </p>
            </div>

            <Button
              onClick={createNewProject}
              size="lg"
              className="gap-2 self-start lg:self-auto bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl border-0"
            >
              <Plus className="w-5 h-5" />
              New Project
            </Button>
          </div>

          {/* Stats Cards - Glass Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, icon: FileText, gradient: 'from-slate-500 to-slate-600' },
              { label: 'Public', value: stats.public, icon: Globe, gradient: 'from-emerald-500 to-teal-500' },
              { label: 'Private', value: stats.private, icon: Lock, gradient: 'from-violet-500 to-purple-500' },
              { label: 'This Week', value: stats.recent, icon: Clock, gradient: 'from-blue-500 to-indigo-500' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-2xl p-5 hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br text-white",
                  stat.gradient
                )}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-white/80 backdrop-blur-sm border-slate-200/80 rounded-xl shadow-soft-sm focus:shadow-soft focus:border-blue-300 transition-all"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'public', 'private'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-5 py-3 text-sm font-medium rounded-xl transition-all duration-200 capitalize",
                    filterStatus === status
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'glass-card text-muted-foreground hover:text-foreground hover:shadow-soft'
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
              <div key={i} className="flex gap-6 p-6 glass-card rounded-2xl">
                <Skeleton className="w-48 h-32 rounded-xl" />
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
            <div className="inline-block p-10 glass-card rounded-3xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'Start Creating'}
              </h2>
              <p className="text-slate-600 mb-6 max-w-sm">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first scientific illustration'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button onClick={createNewProject} size="lg" className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl border-0">
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
                    "group flex flex-col md:flex-row gap-6 p-5 cursor-pointer transition-all duration-300",
                    "glass-card rounded-2xl",
                    "hover:shadow-soft hover:-translate-y-1"
                  )}
                  onClick={() => openProject(project.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full md:w-56 h-40 md:h-36 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={project.thumbnail_url || noPreviewImage}
                      alt={project.name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Index Badge */}
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 text-xs font-medium rounded-lg">
                      #{String(index + 1 + (currentPage - 1) * ITEMS_PER_PAGE).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-xl font-semibold text-slate-900 truncate group-hover:text-cyan-600 transition-colors">
                          {project.name}
                        </h3>
                        <Badge
                          className={cn(
                            "flex-shrink-0 font-medium text-xs rounded-full px-3",
                            project.is_public
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          )}
                        >
                          {project.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-3">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Ruler className="w-4 h-4" />
                          {project.canvas_width} × {project.canvas_height}
                        </span>
                        {project.approval_status && project.approval_status !== 'pending' && (
                          <Badge className={cn(
                            "rounded-full px-3",
                            project.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          )}>
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
                        className="gap-1.5 rounded-lg border-slate-200 hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-200"
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
                        className="rounded-lg border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
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
                        className="rounded-lg border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="hidden md:flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-violet-500 group-hover:text-white transition-all duration-300">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 p-2 glass-card rounded-2xl">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="font-medium rounded-xl"
                  >
                    Previous
                  </Button>

                  <div className="flex gap-1 px-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-10 h-10 text-sm font-medium rounded-xl transition-all duration-200",
                          currentPage === page
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {totalPages > 5 && (
                    <span className="px-2 text-slate-400">...</span>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="font-medium rounded-xl"
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
