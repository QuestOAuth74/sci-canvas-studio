import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserMenu } from '@/components/auth/UserMenu';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Loader2, Plus, Trash2, FolderOpen, Search, ArrowLeft, Share2, Calendar, Ruler, Globe, Lock, CheckCircle, XCircle, Clock, Eye, BarChart3, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ShareProjectDialog } from '@/components/projects/ShareProjectDialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
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
    <div className="min-h-screen relative notebook-page">
      {/* Notebook paper background */}
      <div className="absolute inset-0 graph-paper pointer-events-none opacity-30" />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Enhanced Header with Stats */}
        <Card className="mb-12 notebook-sidebar ruled-lines bg-[#f9f6f0]/95 border-2 border-[hsl(var(--pencil-gray))] overflow-hidden pl-10 relative paper-shadow">
          {/* Spiral binding decoration */}
          <div className="spiral-binding">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="spiral-hole" />
            ))}
          </div>
          
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl font-bold mb-2 handwritten ink-text relative inline-block">
                  My Projects
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-[hsl(var(--highlighter-yellow))]/60 -z-10" />
                </h1>
                <p className="text-[hsl(var(--pencil-gray))] font-source-serif text-lg italic mt-2">
                  Manage and organize your scientific illustrations
                </p>
              </div>
              <Button 
                onClick={createNewProject} 
                size="lg"
                variant="sticky"
                className="gap-2 shadow-lg hover:shadow-xl transition-shadow text-base font-source-serif paper-shadow"
              >
                <Plus className="w-5 h-5" />
                New Project
              </Button>
            </div>

          {/* Stats Dashboard - Sticky Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Card className="bg-[hsl(var(--highlighter-yellow))]/60 border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:scale-[1.02] transition-all rotate-[-0.5deg] sketch-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-source-serif text-[hsl(var(--pencil-gray))] uppercase tracking-wide mb-1">Total Projects</p>
                      <p className="text-4xl font-bold handwritten ink-text">{stats.total}</p>
                    </div>
                    <FileText className="w-8 h-8 text-[hsl(var(--ink-blue))]/60" />
                  </div>
                </CardContent>
              </Card>
              {/* Tape on sticky note */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/50 border border-[hsl(var(--pencil-gray))]/20 rotate-[2deg]" />
            </div>

            <div className="relative">
              <Card className="bg-[hsl(var(--highlighter-yellow))]/60 border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:scale-[1.02] transition-all rotate-[0.5deg] sketch-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-source-serif text-[hsl(var(--pencil-gray))] uppercase tracking-wide mb-1">Public</p>
                      <p className="text-4xl font-bold handwritten ink-text">{stats.public}</p>
                    </div>
                    <Globe className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/50 border border-[hsl(var(--pencil-gray))]/20 rotate-[-3deg]" />
            </div>

            <div className="relative">
              <Card className="bg-[hsl(var(--highlighter-yellow))]/60 border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:scale-[1.02] transition-all rotate-[-0.3deg] sketch-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-source-serif text-[hsl(var(--pencil-gray))] uppercase tracking-wide mb-1">Private</p>
                      <p className="text-4xl font-bold handwritten ink-text">{stats.private}</p>
                    </div>
                    <Lock className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/50 border border-[hsl(var(--pencil-gray))]/20 rotate-[1deg]" />
            </div>

            <div className="relative">
              <Card className="bg-[hsl(var(--highlighter-yellow))]/60 border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:scale-[1.02] transition-all rotate-[0.3deg] sketch-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-source-serif text-[hsl(var(--pencil-gray))] uppercase tracking-wide mb-1">Recent (7d)</p>
                      <p className="text-4xl font-bold handwritten ink-text">{stats.recent}</p>
                    </div>
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/50 border border-[hsl(var(--pencil-gray))]/20 rotate-[-2deg]" />
            </div>
          </div>

            {/* Enhanced Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--pencil-gray))]" />
                <Input
                  type="text"
                  placeholder="Search projects by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base border-2 border-[hsl(var(--pencil-gray))] bg-white/80 focus:bg-[hsl(var(--highlighter-yellow))]/20 font-source-serif paper-shadow sketch-border"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`paper-tab ${filterStatus === 'all' ? 'paper-tab-active' : ''} whitespace-nowrap px-4 py-2 text-sm font-source-serif transition-all`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('public')}
                  className={`paper-tab ${filterStatus === 'public' ? 'paper-tab-active' : ''} whitespace-nowrap px-4 py-2 text-sm font-source-serif transition-all flex items-center gap-1`}
                >
                  <Globe className="w-3 h-3" />
                  Public
                </button>
                <button
                  onClick={() => setFilterStatus('private')}
                  className={`paper-tab ${filterStatus === 'private' ? 'paper-tab-active' : ''} whitespace-nowrap px-4 py-2 text-sm font-source-serif transition-all flex items-center gap-1`}
                >
                  <Lock className="w-3 h-3" />
                  Private
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full aspect-[16/9]" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Enhanced Empty State - Notebook Style */
          <div className="text-center py-16">
            <div className="max-w-3xl mx-auto relative">
              {/* Main notebook paper card */}
              <div className="bg-[#f9f6f0] ruled-lines p-12 border-2 border-[hsl(var(--pencil-gray))] paper-shadow relative overflow-hidden" style={{ transform: 'rotate(-0.5deg)' }}>
                {/* Washi tape decoration */}
                <div className="washi-tape top-6 left-1/2 -translate-x-1/2" />
                
                {/* Spiral binding on left */}
                <div className="spiral-binding" style={{ left: '-16px' }}>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="spiral-hole" />
                  ))}
                </div>

                {/* Empty folder illustration */}
                <div className="relative inline-block mb-8">
                  <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(var(--highlighter-yellow))]/30 to-[hsl(var(--highlighter-yellow))]/50 border-2 border-[hsl(var(--pencil-gray))] paper-shadow flex items-center justify-center rotate-[-2deg]">
                    <FolderOpen className="w-16 h-16 text-[hsl(var(--ink-blue))]/60" />
                  </div>
                  {/* Floating doodle elements */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 border-[hsl(var(--ink-blue))]/30" style={{ transform: 'rotate(15deg)' }} />
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-2 border-[hsl(var(--ink-blue))]/30" style={{ transform: 'rotate(-10deg)' }} />
                </div>

                <h2 className="text-4xl font-['Caveat'] text-[hsl(var(--ink-blue))] mb-3 leading-tight">
                  {searchQuery || filterStatus !== 'all' ? 'No projects found...' : 'Your canvas awaits!'}
                </h2>
                <p className="font-['Source_Serif_4'] text-lg text-[hsl(var(--pencil-gray))] mb-10 max-w-xl mx-auto leading-relaxed">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters to find what you\'re looking for'
                    : 'Start creating beautiful scientific illustrations in just a few clicks'}
                </p>

                {!searchQuery && filterStatus === 'all' && (
                  <>
                    {/* Quick start buttons */}
                    <div className="flex flex-wrap gap-4 justify-center mb-12">
                      <Button 
                        onClick={createNewProject} 
                        size="lg"
                        className="gap-2 shadow-lg font-['Source_Serif_4'] bg-[hsl(var(--ink-blue))] hover:bg-[hsl(var(--ink-blue))]/90 text-white border-2 border-[hsl(var(--pencil-gray))]"
                      >
                        <Plus className="w-5 h-5" />
                        Start Blank Canvas
                      </Button>
                      <Button 
                        onClick={createNewProject}
                        size="lg"
                        className="gap-2 shadow-lg font-['Source_Serif_4'] bg-[hsl(var(--highlighter-yellow))] hover:bg-[hsl(var(--highlighter-yellow))]/90 text-[hsl(var(--ink-blue))] border-2 border-[hsl(var(--pencil-gray))]"
                      >
                        <FileText className="w-5 h-5" />
                        Browse Templates
                      </Button>
                    </div>

                    {/* Feature cards styled as sticky notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                      <div className="sticky-note bg-[hsl(var(--highlighter-yellow))]/80 p-6 border-2 border-[hsl(var(--pencil-gray))] paper-shadow relative" style={{ transform: 'rotate(-2deg)' }}>
                        {/* Tape on sticky note */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/60 border border-[hsl(var(--pencil-gray))]/30 rotate-[3deg]" />
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 border-2 border-[hsl(var(--pencil-gray))]">
                          <FileText className="w-6 h-6 text-[hsl(var(--ink-blue))]" />
                        </div>
                        <h3 className="font-['Caveat'] text-2xl text-[hsl(var(--ink-blue))] mb-2">Choose Template</h3>
                        <p className="text-sm font-['Source_Serif_4'] text-[hsl(var(--pencil-gray))] leading-relaxed">Start with a blank canvas or browse community templates</p>
                      </div>
                      
                      <div className="sticky-note bg-[hsl(var(--highlighter-yellow))]/80 p-6 border-2 border-[hsl(var(--pencil-gray))] paper-shadow relative" style={{ transform: 'rotate(1deg)' }}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/60 border border-[hsl(var(--pencil-gray))]/30 rotate-[-2deg]" />
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 border-2 border-[hsl(var(--pencil-gray))]">
                          <Sparkles className="w-6 h-6 text-[hsl(var(--ink-blue))]" />
                        </div>
                        <h3 className="font-['Caveat'] text-2xl text-[hsl(var(--ink-blue))] mb-2">Design & Create</h3>
                        <p className="text-sm font-['Source_Serif_4'] text-[hsl(var(--pencil-gray))] leading-relaxed">Add icons, shapes, connectors, and text to build your diagram</p>
                      </div>
                      
                      <div className="sticky-note bg-[hsl(var(--highlighter-yellow))]/80 p-6 border-2 border-[hsl(var(--pencil-gray))] paper-shadow relative" style={{ transform: 'rotate(-1deg)' }}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/60 border border-[hsl(var(--pencil-gray))]/30 rotate-[2deg]" />
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 border-2 border-[hsl(var(--pencil-gray))]">
                          <Share2 className="w-6 h-6 text-[hsl(var(--ink-blue))]" />
                        </div>
                        <h3 className="font-['Caveat'] text-2xl text-[hsl(var(--ink-blue))] mb-2">Export & Share</h3>
                        <p className="text-sm font-['Source_Serif_4'] text-[hsl(var(--pencil-gray))] leading-relaxed">Download high-quality images or share with the community</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Notebook Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedProjects.map((project, index) => {
                // Random slight rotation for organic torn paper look
                const rotation = Math.random() * 2 - 1; // -1 to 1 degrees
                
                return (
                  <Card 
                    key={project.id}
                    className="group overflow-hidden bg-[#f9f6f0] border-[hsl(var(--pencil-gray))] paper-shadow hover:shadow-lg transition-all duration-300 animate-fade-in relative"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      transform: `rotate(${rotation}deg)`
                    }}
                  >
                    {/* Washi tape decoration at top */}
                    <div className="washi-tape top-4 left-1/2 -translate-x-1/2" />
                  
                    {/* Thumbnail - Polaroid Style */}
                    <div className="relative overflow-hidden bg-white p-3 m-3 paper-shadow border border-[hsl(var(--pencil-gray))]">
                    <AspectRatio ratio={16 / 9}>
                      <img
                        src={project.thumbnail_url || noPreviewImage}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Status Corner Ribbon */}
                      {project.approval_status && project.approval_status !== 'pending' && (
                        <div className="absolute top-3 right-3">
                          <Badge 
                            variant={
                              project.approval_status === 'approved' ? 'default' : 
                              project.approval_status === 'rejected' ? 'destructive' : 
                              'secondary'
                            }
                            className="shadow-lg"
                          >
                            {project.approval_status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {project.approval_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                            {project.approval_status}
                          </Badge>
                        </div>
                      )}

                      {/* Quick Action Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          onClick={() => openProject(project.id)}
                          size="lg"
                          variant="sticky"
                          className="shadow-xl font-source-serif"
                        >
                          <FolderOpen className="w-5 h-5 mr-2" />
                          Open Project
                        </Button>
                      </div>
                    </AspectRatio>
                    <p className="text-center mt-2 text-sm handwritten ink-text line-clamp-1">
                      {project.name}
                    </p>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-5 space-y-4">
                    {/* Last Updated */}
                    <p className="text-xs font-source-serif text-[hsl(var(--pencil-gray))] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                    </p>

                    {/* Metadata - Paper Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="gap-1 bg-white border border-[hsl(var(--pencil-gray))] text-[hsl(var(--ink-blue))] font-source-serif text-xs">
                        <Ruler className="w-3 h-3" />
                        {project.canvas_width} × {project.canvas_height}
                      </Badge>
                      <Badge 
                        className={`gap-1 bg-white border font-source-serif text-xs ${
                          project.is_public 
                            ? 'border-green-500/50 text-green-600' 
                            : 'border-orange-500/50 text-orange-600'
                        }`}
                      >
                        {project.is_public ? (
                          <>
                            <Globe className="w-3 h-3" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            Private
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => openProject(project.id)}
                        className="flex-1 gap-1 font-source-serif"
                        variant="ink"
                        size="sm"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Open
                      </Button>
                      <Button
                        onClick={() => setShareDialogProject(project)}
                        variant="pencil"
                        size="sm"
                        className="gap-1 font-source-serif"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteProject(project.id, project.name)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>

            {/* Notebook Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <div className="bg-[hsl(var(--cream))] p-3 border-2 border-[hsl(var(--pencil-gray))] paper-shadow rounded-lg">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={`font-source-serif ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-[hsl(var(--highlighter-yellow))]/30'}`}
                        />
                      </PaginationItem>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(i + 1)}
                            isActive={currentPage === i + 1}
                            className={`cursor-pointer font-source-serif ${
                              currentPage === i + 1 
                                ? 'bg-[hsl(var(--highlighter-yellow))]/60 border-2 border-[hsl(var(--pencil-gray))] handwritten text-lg' 
                                : 'hover:bg-[hsl(var(--highlighter-yellow))]/20'
                            }`}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={`font-source-serif ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-[hsl(var(--highlighter-yellow))]/30'}`}
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
