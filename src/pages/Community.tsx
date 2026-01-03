import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { UserMenu } from '@/components/auth/UserMenu';
import { Loader2, Search, ArrowLeft, Users, Eye, Heart, TrendingUp, Sparkles, Library, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectCard } from '@/components/community/ProjectCard';
import { ProjectPreviewModal } from '@/components/community/ProjectPreviewModal';
import { CommunityFilters } from '@/components/community/CommunityFilters';
import { FeatureUnlockBanner } from '@/components/community/FeatureUnlockBanner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { SEOHead } from '@/components/SEO/SEOHead';
import { MobileWarningDialog } from '@/components/canvas/MobileWarningDialog';
import { CommunityTestIds } from '@/lib/test-ids';

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
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'cloned' | 'liked'>('popular');
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
    const { data: profilesData, error: profilesError } = await (supabase as any)
      .from('public_profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Failed to load profiles:', profilesError);
    }

    // Map profiles to projects
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
    <div className="min-h-screen bg-background relative" data-testid={CommunityTestIds.PAGE_CONTAINER}>
      <MobileWarningDialog />
      <SEOHead 
        title="Community Gallery - BioSketch" 
        description="Discover and share scientific diagrams with the BioSketch community. Browse thousands of high-quality medical and biological illustrations."
      />
      <FeatureUnlockBanner />
      
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <main className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
        {/* Modern Academic Header */}
        <div className="mb-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Shared Resources
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-semibold text-foreground tracking-tight mb-3">
              Community Gallery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover and share scientific diagrams created by researchers and educators worldwide
            </p>
          </div>

          {/* Stats Dashboard - Clean Academic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="group bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Shared Projects</p>
                    <p className="text-3xl font-serif font-semibold text-foreground">{stats.totalProjects.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Library className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Total Views</p>
                    <p className="text-3xl font-serif font-semibold text-foreground">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Total Likes</p>
                    <p className="text-3xl font-serif font-semibold text-foreground">{stats.totalLikes.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/15 transition-colors">
                    <Heart className="w-5 h-5 text-rose-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clean Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, description, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base bg-card border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>
            <CommunityFilters sortBy={sortBy} onSortChange={setSortBy} />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/50">
                <Skeleton className="w-full aspect-[16/9]" />
                <CardContent className="p-5 space-y-3">
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
          /* Clean Empty State */
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
                {searchQuery ? 'No projects found' : 'No community projects yet'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Be the first to share your scientific illustration with the community'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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

            {/* Clean Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <Pagination>
                  <PaginationContent className="bg-card border border-border/50 rounded-lg p-1.5 shadow-sm">
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted'} transition-colors`}
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
                              className={`cursor-pointer ${
                                currentPage === page 
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                  : 'hover:bg-muted'
                              } transition-colors`}
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
                        className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted'} transition-colors`}
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
