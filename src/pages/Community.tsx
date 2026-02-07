import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, Eye, Heart, Library, Star, ArrowUpRight, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectPreviewModal } from '@/components/community/ProjectPreviewModal';
import { FeatureUnlockBanner } from '@/components/community/FeatureUnlockBanner';
import { SEOHead } from '@/components/SEO/SEOHead';
import { MobileWarningDialog } from '@/components/canvas/MobileWarningDialog';
import { CommunityTestIds } from '@/lib/test-ids';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

import noPreviewImage from '@/assets/no_preview.png';

interface CommunityProject {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  keywords: string[] | null;
  updated_at: string;
  thumbnail_url: string | null;
  view_count: number;
  cloned_count: number;
  like_count?: number;
  canvas_width: number;
  canvas_height: number;
  paper_size: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

type SortOption = 'recent' | 'popular' | 'cloned' | 'liked';

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [selectedProject, setSelectedProject] = useState<CommunityProject | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalProjects: 0, totalViews: 0, totalLikes: 0 });
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    if (user) {
      loadProjects();
      loadStats();
    }
  }, [user, sortBy, currentPage]);

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('canvas_projects')
      .select('view_count, like_count')
      .eq('is_public', true)
      .eq('approval_status', 'approved');

    if (!error && data) {
      setStats({
        totalProjects: data.length,
        totalViews: data.reduce((sum, p) => sum + (p.view_count || 0), 0),
        totalLikes: data.reduce((sum, p) => sum + (p.like_count || 0), 0),
      });
    }
  };

  const loadProjects = async () => {
    setLoading(true);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;

    let projectsQuery = supabase
      .from('canvas_projects')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .eq('approval_status', 'approved');

    switch (sortBy) {
      case 'popular':
        projectsQuery = projectsQuery.order('view_count', { ascending: false });
        break;
      case 'cloned':
        projectsQuery = projectsQuery.order('cloned_count', { ascending: false });
        break;
      case 'liked':
        projectsQuery = projectsQuery.order('like_count', { ascending: false });
        break;
      case 'recent':
      default:
        projectsQuery = projectsQuery.order('updated_at', { ascending: false });
    }

    projectsQuery = projectsQuery.range(startIndex, endIndex);

    const { data: projectsData, error: projectsError, count } = await projectsQuery;

    if (projectsError) {
      toast.error('Failed to load community projects');
      console.error(projectsError);
      setLoading(false);
      return;
    }

    setTotalCount(count || 0);

    const userIds = [...new Set(projectsData?.map(p => p.user_id) || [])];
    const { data: profilesData } = await (supabase as any)
      .from('public_profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    const profilesMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>(
      (profilesData as any[])?.map((p: any) => [p.id, p]) || []
    );
    const projectsWithProfiles = projectsData?.map(project => ({
      ...project,
      profiles: profilesMap.get(project.user_id) || null,
    })) as CommunityProject[] || [];

    setProjects(projectsWithProfiles);
    setLoading(false);
  };

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      project.title?.toLowerCase().includes(search) ||
      project.description?.toLowerCase().includes(search) ||
      project.keywords?.some(keyword => keyword.toLowerCase().includes(search))
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const totalPages = searchQuery
    ? Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)
    : Math.ceil(totalCount / ITEMS_PER_PAGE);

  const displayProjects = searchQuery ? filteredProjects : projects;

  const sortOptions: { value: SortOption; label: string; icon: React.ElementType }[] = [
    { value: 'popular', label: 'Most Viewed', icon: TrendingUp },
    { value: 'liked', label: 'Most Liked', icon: Heart },
    { value: 'cloned', label: 'Most Used', icon: Sparkles },
    { value: 'recent', label: 'Recent', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 relative overflow-hidden" data-testid={CommunityTestIds.PAGE_CONTAINER}>
      {/* Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="blob-1 top-[-100px] right-[-100px] opacity-40" />
        <div className="blob-2 bottom-[30%] left-[-50px] opacity-30" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
      </div>

      <MobileWarningDialog />
      <SEOHead
        title="Community Gallery - BioSketch"
        description="Discover and share scientific diagrams with the BioSketch community."
      />
      <FeatureUnlockBanner />

      <main className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
        {/* Header Section */}
        <section className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 text-sm font-medium mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Explore & Discover
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
                Community Gallery
              </h1>
              <p className="text-lg text-slate-600 max-w-xl">
                Browse scientific illustrations shared by researchers worldwide
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { label: 'Projects', value: stats.totalProjects, icon: Library, gradient: 'from-cyan-500 to-teal-500' },
              { label: 'Views', value: stats.totalViews, icon: Eye, gradient: 'from-emerald-500 to-teal-500' },
              { label: 'Likes', value: stats.totalLikes, icon: Heart, gradient: 'from-pink-500 to-rose-500' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card inline-flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:shadow-soft"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white",
                  stat.gradient
                )}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="font-semibold tabular-nums text-slate-900">{stat.value.toLocaleString()}</span>
                <span className="text-sm text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by title, description, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-white/80 backdrop-blur-sm border-slate-200/80 rounded-xl shadow-soft-sm focus:shadow-soft focus:border-blue-300 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                    sortBy === option.value
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/25'
                      : 'glass-card text-slate-600 hover:text-slate-900 hover:shadow-soft'
                  )}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden">
                <Skeleton className="w-full aspect-[4/3]" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayProjects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="inline-block p-10 glass-card rounded-3xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
                <Users className="w-10 h-10 text-cyan-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {searchQuery ? 'No projects found' : 'No community projects yet'}
              </h2>
              <p className="text-slate-600">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Be the first to share your work'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Project Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {displayProjects.map((project, index) => {
                const isFeatured = index < 2;

                return (
                  <div
                    key={project.id}
                    className={cn(
                      "group cursor-pointer transition-all duration-300",
                      "glass-card rounded-2xl overflow-hidden",
                      "hover:shadow-soft hover:-translate-y-1",
                      isFeatured && "sm:col-span-2 lg:col-span-2"
                    )}
                    onClick={() => setSelectedProject(project)}
                  >
                    {/* Image */}
                    <div className={cn(
                      "relative overflow-hidden bg-slate-100",
                      isFeatured ? "aspect-[16/9]" : "aspect-[4/3]"
                    )}>
                      <img
                        src={project.thumbnail_url || noPreviewImage}
                        alt={project.title || project.name}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Featured badge */}
                      {isFeatured && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-xs shadow-lg border-0">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        </div>
                      )}

                      {/* Hover arrow */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <div className="w-10 h-10 bg-white/90 backdrop-blur-sm text-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className={cn(
                        "font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors",
                        isFeatured ? "text-xl" : "text-base"
                      )}>
                        {project.title || project.name}
                      </h3>

                      {project.profiles?.full_name && (
                        <p className="text-sm text-slate-500 mb-3">
                          by {project.profiles.full_name}
                        </p>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Eye className="w-4 h-4" />
                          {(project.view_count || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Heart className="w-4 h-4" />
                          {(project.like_count || 0).toLocaleString()}
                        </span>
                        <span className="text-slate-400 text-xs ml-auto">
                          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Keywords */}
                      {project.keywords && project.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {project.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg"
                            >
                              {keyword}
                            </span>
                          ))}
                          {project.keywords.length > 3 && (
                            <span className="px-2.5 py-1 text-xs text-slate-400">
                              +{project.keywords.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/25'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

      {/* Preview Modal */}
      {selectedProject && (
        <ProjectPreviewModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
