import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, Eye, Heart, Library, Star, MoveRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectPreviewModal } from '@/components/community/ProjectPreviewModal';
import { CommunityFilters } from '@/components/community/CommunityFilters';
import { FeatureUnlockBanner } from '@/components/community/FeatureUnlockBanner';
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

  return (
    <div className="min-h-screen bg-background relative" data-testid={CommunityTestIds.PAGE_CONTAINER}>
      <MobileWarningDialog />
      <SEOHead 
        title="Community Gallery - BioSketch" 
        description="Discover and share scientific diagrams with the BioSketch community."
      />
      <FeatureUnlockBanner />

      <main className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
        {/* Modern Header Section */}
        <section className="relative py-8 mb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-foreground tracking-tight mb-2">
            Community Gallery
          </h1>
          
          {/* Background Label */}
          <div className="pointer-events-none absolute top-0 right-0 text-[8rem] md:text-[12rem] font-bold text-muted/5 select-none leading-none -z-10">
            GALLERY
          </div>
          
          <p className="text-muted-foreground text-lg max-w-2xl mb-8">
            Discover and share scientific diagrams created by researchers and educators worldwide
          </p>

          {/* Quick Stats Row */}
          <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Library className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{stats.totalProjects.toLocaleString()}</span> projects
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-foreground">{stats.totalViews.toLocaleString()}</span> views
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="w-4 h-4 text-rose-600" />
              <span className="font-semibold text-foreground">{stats.totalLikes.toLocaleString()}</span> likes
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, description, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 text-base bg-card border-border/50 focus:border-primary/50"
              />
            </div>
            <CommunityFilters sortBy={sortBy} onSortChange={setSortBy} />
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
        ) : displayProjects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24">
            <div className="max-w-lg mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
                {searchQuery ? 'No projects found' : 'No community projects yet'}
              </h2>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Be the first to share your scientific illustration'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Modern Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {displayProjects.map((project, index) => {
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
                    onClick={() => setSelectedProject(project)}
                  >
                    {/* Image Container */}
                    <div className={cn(
                      "relative overflow-hidden bg-muted/30",
                      isPrimary ? "aspect-[16/9]" : "aspect-[4/3]"
                    )}>
                      <img
                        src={project.thumbnail_url || noPreviewImage}
                        alt={project.title || project.name}
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                    </div>
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5">
                      <div className="space-y-3">
                        {/* Title */}
                        <h3 className={cn(
                          "font-semibold text-white leading-tight line-clamp-2",
                          isPrimary ? "text-2xl md:text-3xl" : "text-lg"
                        )}>
                          {project.title || project.name}
                        </h3>
                        
                        {/* Author */}
                        {project.profiles?.full_name && (
                          <p className="text-white/70 text-sm">
                            by {project.profiles.full_name}
                          </p>
                        )}
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
                          {/* Rating Stars */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={cn(
                                  "w-3.5 h-3.5",
                                  idx < Math.min(Math.ceil((project.like_count || 0) / 10), 5) 
                                    ? "fill-amber-400 text-amber-400" 
                                    : "text-white/30"
                                )}
                              />
                            ))}
                          </div>
                          
                          <span className="text-white/60">
                            {(project.view_count || 0).toLocaleString()} views
                          </span>
                          
                          <span className="flex items-center gap-1 text-white/60">
                            <Heart className="w-3 h-3" />
                            {(project.like_count || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Hover Arrow */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <MoveRight className="w-5 h-5 text-white" />
                        </div>
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
