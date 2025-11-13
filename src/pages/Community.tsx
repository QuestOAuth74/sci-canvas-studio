import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenu } from '@/components/auth/UserMenu';
import { Loader2, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectCard } from '@/components/community/ProjectCard';
import { ProjectPreviewModal } from '@/components/community/ProjectPreviewModal';
import { CommunityFilters } from '@/components/community/CommunityFilters';
import { FeatureUnlockBanner } from '@/components/community/FeatureUnlockBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { SEOHead } from '@/components/SEO/SEOHead';
import { Breadcrumbs } from '@/components/SEO/Breadcrumbs';

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
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, sortBy, currentPage]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <FeatureUnlockBanner />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community Gallery</h1>
          <p className="text-muted-foreground">
            Discover and share scientific diagrams with the community
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <CommunityFilters sortBy={sortBy} onSortChange={setSortBy} />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card overflow-hidden p-4">
                  <Skeleton className="h-48 w-full rounded-lg mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="glass-card text-center py-16">
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No projects found matching your search'
                  : 'No public projects yet. Be the first to share!'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProjects.map((project, index) => (
                  <div key={project.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <ProjectCard
                      project={project}
                      onPreview={() => setSelectedProject(project)}
                      onLikeChange={loadProjects}
                    />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
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
              )}
            </>
          )}
        </div>
      </main>

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
