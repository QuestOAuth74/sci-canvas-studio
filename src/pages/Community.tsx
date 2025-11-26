import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { UserMenu } from '@/components/auth/UserMenu';
import { Loader2, Search, ArrowLeft, Users, Eye, Heart, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectCard } from '@/components/community/ProjectCard';
import { ProjectPreviewModal } from '@/components/community/ProjectPreviewModal';
import { CommunityFilters } from '@/components/community/CommunityFilters';
import { FeatureUnlockBanner } from '@/components/community/FeatureUnlockBanner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { SEOHead } from '@/components/SEO/SEOHead';
import { MobileWarningDialog } from '@/components/canvas/MobileWarningDialog';

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

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'cloned' | 'liked'>('recent');
  const [selectedProject, setSelectedProject] = useState<CommunityProject | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalProjects: 0, totalViews: 0, totalLikes: 0 });
  const ITEMS_PER_PAGE = 9;

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
    
    // Calculate pagination range
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    
    // Build query with server-side pagination and sorting
    let projectsQuery = supabase
      .from('canvas_projects')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .eq('approval_status', 'approved');

    // Apply database-level sorting
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

    // Apply pagination range
    projectsQuery = projectsQuery.range(startIndex, endIndex);

    const { data: projectsData, error: projectsError, count } = await projectsQuery;

    if (projectsError) {
      toast.error('Failed to load community projects');
      console.error(projectsError);
      setLoading(false);
      return;
    }

    // Set total count for pagination
    setTotalCount(count || 0);

    // Fetch profiles only for users of current page projects
    const userIds = [...new Set(projectsData?.map(p => p.user_id) || [])];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Failed to load profiles:', profilesError);
    }

    // Map profiles to projects
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
    const projectsWithProfiles = projectsData?.map(project => ({
      ...project,
      profiles: profilesMap.get(project.user_id) || null,
    })) || [];

    setProjects(projectsWithProfiles);
    setLoading(false);
  };

  // Filter projects based on search query (client-side for responsiveness)
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      project.title?.toLowerCase().includes(search) ||
      project.description?.toLowerCase().includes(search) ||
      project.keywords?.some(keyword => keyword.toLowerCase().includes(search))
    );
  });

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // Calculate total pages based on filtered results or total count
  const totalPages = searchQuery 
    ? Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)
    : Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // Use filtered projects if searching, otherwise use fetched projects
  const displayProjects = searchQuery ? filteredProjects : projects;


  return (
    <div className="min-h-screen relative notebook-page graph-paper">
      <MobileWarningDialog />
      <SEOHead 
        title="Community Gallery - BioSketch" 
        description="Discover and share scientific diagrams with the BioSketch community. Browse thousands of high-quality medical and biological illustrations."
      />
      <FeatureUnlockBanner />
      
      {/* Paper aging effects */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-[hsl(var(--pencil-gray)_/_0.03)] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[hsl(var(--pencil-gray)_/_0.02)] to-transparent pointer-events-none" />

      <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Enhanced Header with Stats */}
        <div className="mb-12">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 font-source-serif ink-text">
              <span className="highlighter-bg">Community Gallery</span>
            </h1>
            <p className="text-muted-foreground handwritten text-lg">
              ~ Discover and share scientific diagrams created by the community ~
            </p>
          </div>

          {/* Stats Dashboard - Notebook Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--highlighter-yellow))]/20 paper-shadow hover:scale-[1.02] transition-all rotate-[-0.5deg]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[hsl(var(--pencil-gray))] uppercase tracking-wide font-source-serif">Total Projects</p>
                    <p className="text-3xl font-bold mt-1 handwritten ink-text">{stats.totalProjects}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[hsl(var(--ink-blue))]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--cream))] paper-shadow hover:scale-[1.02] transition-all rotate-[0.3deg]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[hsl(var(--pencil-gray))] uppercase tracking-wide font-source-serif">Total Views</p>
                    <p className="text-3xl font-bold mt-1 handwritten ink-text">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[hsl(var(--ink-blue))]/10 border-2 border-[hsl(var(--ink-blue))]/20 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-[hsl(var(--ink-blue))]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--highlighter-yellow))]/20 paper-shadow hover:scale-[1.02] transition-all rotate-[-0.3deg]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[hsl(var(--pencil-gray))] uppercase tracking-wide font-source-serif">Total Likes</p>
                    <p className="text-3xl font-bold mt-1 handwritten ink-text">{stats.totalLikes.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--pencil-gray))]" />
              <Input
                type="text"
                placeholder="Search by title, description, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/20 font-source-serif sketch-border transition-colors"
              />
            </div>
            <CommunityFilters sortBy={sortBy} onSortChange={setSortBy} />
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
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayProjects.length === 0 ? (
          /* Enhanced Empty State */
          <div className="text-center py-20">
            <div className="max-w-md mx-auto border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--cream))] paper-shadow p-8 rotate-[-0.5deg]">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--highlighter-yellow))]/30 flex items-center justify-center">
                <Users className="w-12 h-12 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="text-2xl font-bold mb-2 handwritten ink-text">
                {searchQuery ? 'No projects found' : 'No community projects yet'}
              </h2>
              <p className="text-[hsl(var(--pencil-gray))] mb-8 font-source-serif">
                {searchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Be the first to share your scientific illustration with the community'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Modern Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {displayProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPreview={() => setSelectedProject(project)}
                  onLikeChange={loadProjects}
                  index={index}
                />
              ))}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Pagination>
                  <PaginationContent className="border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--cream))] paper-shadow rounded-lg p-2">
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-[hsl(var(--highlighter-yellow))]/30'} font-source-serif`}
                      />
                    </PaginationItem>
                    
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className={`cursor-pointer font-source-serif ${
                              currentPage === pageNum 
                                ? 'bg-[hsl(var(--ink-blue))] text-white border-2 border-[hsl(var(--ink-blue))]' 
                                : 'hover:bg-[hsl(var(--highlighter-yellow))]/30'
                            }`}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-[hsl(var(--highlighter-yellow))]/30'} font-source-serif`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
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
