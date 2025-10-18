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
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'cloned'>('recent');
  const [selectedProject, setSelectedProject] = useState<CommunityProject | null>(null);

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

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        projectsQuery = projectsQuery.order('view_count', { ascending: false });
        break;
      case 'cloned':
        projectsQuery = projectsQuery.order('cloned_count', { ascending: false });
        break;
      default:
        projectsQuery = projectsQuery.order('updated_at', { ascending: false });
    }

    const { data: projectsData, error: projectsError } = await projectsQuery;

    if (projectsError) {
      toast.error('Failed to load community projects');
      console.error(projectsError);
      setLoading(false);
      return;
    }

    // Fetch profiles for all unique user_ids
    const userIds = [...new Set(projectsData.map(p => p.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Failed to load profiles:', profilesError);
    }

    // Map profiles to projects
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const projectsWithProfiles = projectsData.map(project => ({
      ...project,
      profiles: profilesMap.get(project.user_id) || null
    }));

    setProjects(projectsWithProfiles);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Community Gallery</h1>
          </div>
          <UserMenu />
        </div>
      </header>

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
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No projects found matching your search'
                  : 'No public projects yet. Be the first to share!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPreview={() => setSelectedProject(project)}
                />
              ))}
            </div>
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
