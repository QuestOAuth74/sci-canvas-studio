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
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, sortBy]);

  const loadProjects = async () => {
    setLoading(true);
    
    // Fetch projects
    let projectsQuery = supabase
      .from('canvas_projects')
      .select('*')
      .eq('is_public', true)
      .eq('approval_status', 'approved');

    const { data: projectsData, error: projectsError } = await projectsQuery;
    
    console.log('Community query results:', {
      count: projectsData?.length,
      projects: projectsData?.map(p => ({ 
        id: p.id, 
        title: p.title, 
        is_public: p.is_public, 
        approval_status: p.approval_status 
      }))
    });

    if (projectsError) {
      toast.error('Failed to load community projects');
      console.error(projectsError);
      setLoading(false);
      return;
    }

    // Fetch like counts for all projects
    const { data: likesData, error: likesError } = await supabase
      .from('project_likes')
      .select('project_id');

    if (likesError) {
      console.error('Failed to load likes:', likesError);
    }

    // Count likes per project
    const likesMap = new Map<string, number>();
    likesData?.forEach(like => {
      likesMap.set(like.project_id, (likesMap.get(like.project_id) || 0) + 1);
    });

    // Fetch profiles for all unique user_ids
    const userIds = [...new Set(projectsData.map(p => p.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Failed to load profiles:', profilesError);
    }

    // Map profiles and likes to projects
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    let projectsWithData = projectsData.map(project => ({
      ...project,
      profiles: profilesMap.get(project.user_id) || null,
      like_count: likesMap.get(project.id) || 0
    }));

    // Apply sorting
    switch (sortBy) {
      case 'liked':
        projectsWithData.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      case 'popular':
        projectsWithData.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'cloned':
        projectsWithData.sort((a, b) => b.cloned_count - a.cloned_count);
        break;
      default:
        projectsWithData.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }

    setProjects(projectsWithData);
    setLoading(false);
  };

  const filteredProjects = projects.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (p.title?.toLowerCase().includes(searchLower)) ||
      (p.description?.toLowerCase().includes(searchLower)) ||
      (p.keywords?.some(k => k.toLowerCase().includes(searchLower)));
    
    return matchesSearch;
  });

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
...
      <header className="border-b glass-effect sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Community Gallery</h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadProjects}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
          <UserMenu />
        </div>
      </header>

      <FeatureUnlockBanner />

      <main className="container mx-auto px-4 py-8">
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
                {paginatedProjects.map((project, index) => (
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
