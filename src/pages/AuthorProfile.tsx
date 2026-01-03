import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/community/VerifiedBadge";
import { ArrowLeft, Eye, Heart, Copy, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SEOHead } from "@/components/SEO/SEOHead";
import { AuthorProfileTestIds } from "@/lib/test-ids";

export default function AuthorProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  // Fetch author profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['author-profile', userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('public_profiles')
        .select('id, full_name, avatar_url, bio, country, field_of_study, created_at, updated_at, quote')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        bio: string | null;
        country: string | null;
        field_of_study: string | null;
        created_at: string | null;
        updated_at: string | null;
        quote: string | null;
      };
    },
    enabled: !!userId,
  });

  // Fetch verification status
  const { data: verificationData } = useQuery({
    queryKey: ['author-verification', userId],
    queryFn: async () => {
      const { data } = await supabase
        .rpc('get_user_premium_progress', { check_user_id: userId! })
        .single();
      return data;
    },
    enabled: !!userId,
  });

  // Fetch public projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['author-projects', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canvas_projects')
        .select('id, title, description, thumbnail_url, view_count, like_count, cloned_count, updated_at, keywords')
        .eq('user_id', userId)
        .eq('is_public', true)
        .eq('approval_status', 'approved')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Calculate aggregate stats
  const stats = projects ? {
    projectCount: projects.length,
    totalViews: projects.reduce((sum, p) => sum + (p.view_count || 0), 0),
    totalLikes: projects.reduce((sum, p) => sum + (p.like_count || 0), 0),
  } : null;

  const isVerified = verificationData?.approved_count >= 3;

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <Skeleton className="w-32 h-32 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-6 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/community')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Community
        </Button>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">Author profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${profile.full_name || 'Anonymous'} - Author Profile`}
        description={profile.bio || `View ${profile.full_name || 'Anonymous'}'s scientific diagrams and projects`}
      />
      
      <div className="min-h-screen notebook-page" data-testid={AuthorProfileTestIds.PAGE_CONTAINER}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Button variant="ghost" onClick={() => navigate('/community')} className="mb-6 pencil-button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Community
          </Button>

          {/* Author Info Card - Notebook Style */}
          <Card className="mb-8 bg-white border-l-4 border-l-[#ff6b6b] ruled-lines relative pl-16 paper-shadow">
            {/* Margin line decoration */}
            <div className="margin-line" />
            
            <CardContent className="pt-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-[hsl(var(--ink-blue))] shadow-lg">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'Author'} />
                    <AvatarFallback className="text-3xl bg-[hsl(var(--highlighter-yellow))] text-[hsl(var(--ink-blue))]">
                      {profile.full_name?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  {isVerified && (
                    <div className="absolute -bottom-2 -right-2">
                      <VerifiedBadge size="md" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-heading-2 font-bold font-['Caveat'] text-[hsl(var(--ink-blue))]" data-testid={AuthorProfileTestIds.PROFILE_NAME}>
                        {profile.full_name || 'Anonymous'}
                      </h1>
                      {isVerified && <VerifiedBadge size="md" />}
                    </div>
                    {profile.bio && (
                      <p className="text-body text-muted-foreground mt-2 whitespace-pre-wrap font-['Source_Serif_4']" data-testid={AuthorProfileTestIds.PROFILE_BIO}>
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-body-sm text-muted-foreground">
                    {profile.country && <span data-testid={AuthorProfileTestIds.PROFILE_COUNTRY}>📍 {profile.country}</span>}
                    {profile.field_of_study && <span data-testid={AuthorProfileTestIds.PROFILE_FIELD}>🔬 {profile.field_of_study}</span>}
                    {profile.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {stats && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="sticky-note bg-[#fff4b4] p-4 text-center hover:shadow-md transition-all" style={{ transform: 'rotate(-1deg)' }} data-testid={AuthorProfileTestIds.STAT_PROJECTS}>
                        <div className="text-2xl font-bold text-[hsl(var(--ink-blue))] mb-1 font-['Caveat']">
                          {stats.projectCount}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {stats.projectCount === 1 ? 'Project' : 'Projects'}
                        </div>
                      </div>
                      <div className="sticky-note bg-[#ffcce1] p-4 text-center hover:shadow-md transition-all" style={{ transform: 'rotate(0.5deg)' }} data-testid={AuthorProfileTestIds.STAT_VIEWS}>
                        <div className="text-2xl font-bold text-[hsl(var(--ink-blue))] mb-1 font-['Caveat']">
                          {stats.totalViews.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Views
                        </div>
                      </div>
                      <div className="sticky-note bg-[#b4e4ff] p-4 text-center hover:shadow-md transition-all" style={{ transform: 'rotate(-0.5deg)' }} data-testid={AuthorProfileTestIds.STAT_LIKES}>
                        <div className="text-2xl font-bold text-[hsl(var(--ink-blue))] mb-1 font-['Caveat']">
                          {stats.totalLikes}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Likes
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Section */}
          <div className="space-y-4" data-testid={AuthorProfileTestIds.PROJECTS_SECTION}>
            <h2 className="notebook-section-header text-heading-3">Public Projects</h2>
            
            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => {
                  const rotation = (index % 2 === 0 ? 1 : -1) * (Math.random() * 1.5 + 0.5);
                  return (
                    <Link key={project.id} to={`/community`}>
                      <Card
                        className="overflow-hidden paper-shadow hover:shadow-lg transition-all bg-[#f9f6f0] border-[hsl(var(--pencil-gray))] relative"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        data-testid={AuthorProfileTestIds.PROJECT_CARD}
                      >
                        {/* Washi tape decoration */}
                        <div className="washi-tape top-4 left-1/2 -translate-x-1/2" />
                        
                        <CardContent className="p-0">
                          <AspectRatio ratio={16 / 9}>
                            <img
                              src={project.thumbnail_url || '/placeholder.svg'}
                              alt={project.title || 'Project'}
                              className="w-full h-full object-cover border-b-2 border-[hsl(var(--pencil-gray))]"
                            />
                          </AspectRatio>
                          <div className="p-4 space-y-3">
                            <h3 className="text-body font-semibold line-clamp-1 font-['Caveat'] text-[hsl(var(--ink-blue))] text-xl">
                              {project.title || 'Untitled Project'}
                            </h3>
                            {project.description && (
                              <p className="text-body-sm text-muted-foreground line-clamp-2 font-['Source_Serif_4']">
                                {project.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-body-sm text-muted-foreground">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {project.view_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {project.like_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Copy className="h-3 w-3" />
                                  {project.cloned_count || 0}
                                </span>
                              </div>
                            </div>
                            {project.keywords && project.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {project.keywords.slice(0, 3).map((keyword, idx) => (
                                  <Badge key={idx} className="sticky-note bg-[hsl(var(--highlighter-yellow))] text-[hsl(var(--ink-blue))] border-[hsl(var(--pencil-gray))] text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-ui-caption text-muted-foreground">
                              Updated {formatDistanceToNow(new Date(project.updated_at))} ago
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card className="sticky-note bg-[#fff4b4]" style={{ transform: 'rotate(-0.5deg)' }}>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground font-['Caveat'] text-xl text-[hsl(var(--ink-blue))]">
                    {isVerified ? 'No public projects yet' : 'This author hasn\'t published any projects yet'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
