import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Eye, Copy, Star, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import noPreviewImage from '@/assets/no_preview.png';
import { VerifiedBadge } from './VerifiedBadge';

interface ProjectCardProps {
  project: {
    id: string;
    title: string | null;
    description: string | null;
    keywords: string[] | null;
    updated_at: string;
    thumbnail_url: string | null;
    view_count: number;
    cloned_count: number;
    like_count?: number;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  onPreview: () => void;
  onLikeChange?: () => void;
  index?: number;
}

export function ProjectCard({ project, onPreview, onLikeChange, index = 0 }: ProjectCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const creatorName = project.profiles?.full_name || 'Anonymous';
  const initials = creatorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Fetch verification status for author
  const { data: authorVerification } = useQuery({
    queryKey: ['author-verification', project.profiles],
    queryFn: async () => {
      if (!project.profiles) return null;
      const userId = (project as any).user_id;
      if (!userId) return null;
      
      const { data } = await supabase
        .rpc('get_user_premium_progress', { check_user_id: userId })
        .single();
      return data;
    },
    enabled: !!project.profiles,
  });

  const isVerified = authorVerification?.approved_count >= 3;

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, project.id]);

  const checkIfLiked = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('project_likes')
      .select('id')
      .eq('project_id', project.id)
      .eq('user_id', user.id)
      .single();
    
    setIsLiked(!!data);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to like projects');
      return;
    }

    if (isLiking) return;
    
    setIsLiking(true);
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', project.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        toast.success('Removed from favorites');
      } else {
        // Like
        const { error } = await supabase
          .from('project_likes')
          .insert({ project_id: project.id, user_id: user.id });
        
        if (error) throw error;
        
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success('Added to favorites');
      }
      
      if (onLikeChange) {
        onLikeChange();
      }
    } catch (error: any) {
      console.error('Like error:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card 
      className="group overflow-hidden bg-[hsl(var(--cream))] border-2 border-[hsl(var(--pencil-gray))] paper-shadow sketch-border hover:scale-[1.02] transition-all duration-300 animate-fade-in cursor-pointer relative"
      style={{ 
        animationDelay: `${index * 50}ms`,
        transform: `rotate(${index % 2 === 0 ? -0.5 : 0.5}deg)`
      }}
      onClick={onPreview}
    >
      {/* Decorative tape at top corner */}
      <div className="absolute -top-2 right-8 w-16 h-5 bg-[hsl(var(--highlighter-yellow))]/40 rotate-[8deg] border border-[hsl(var(--pencil-gray))]/30 z-10" />
      
      {/* Thumbnail - Polaroid Style */}
      <div className="relative overflow-hidden bg-white p-3 m-3 paper-shadow border border-[hsl(var(--pencil-gray))]">
        <AspectRatio ratio={16 / 9}>
          <img
            src={project.thumbnail_url || noPreviewImage}
            alt={project.title || 'Project thumbnail'}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Like Button Overlay */}
          <div className="absolute top-2 right-2">
            <Button
              variant={isLiked ? "sticky" : "secondary"}
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className="shadow-lg gap-1 font-source-serif"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
          </div>
        </AspectRatio>
        <p className="text-center mt-2 text-sm handwritten ink-text">
          {project.title || 'Untitled'}
        </p>
      </div>

      {/* Card Content */}
      <CardContent className="p-5 space-y-4">
        {/* Description */}
        <p className="text-sm font-source-serif text-[hsl(var(--pencil-gray))] line-clamp-2">
          {project.description || 'No description provided'}
        </p>

        {/* Creator Info - Index Card Style */}
        <Link
          to={`/author/${(project as any).user_id}`}
          className="flex items-center gap-2 p-2 bg-white/60 border border-[hsl(var(--pencil-gray))]/50 rounded paper-shadow hover:bg-[hsl(var(--highlighter-yellow))]/10 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar className="h-7 w-7 ring-1 ring-[hsl(var(--ink-blue))]">
            <AvatarImage src={project.profiles?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-[hsl(var(--highlighter-yellow))]/60 handwritten ink-text">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-source-serif text-[hsl(var(--ink-blue))] hover:underline">{creatorName}</span>
            {isVerified && <VerifiedBadge size="sm" />}
          </div>
        </Link>

        {/* Stats - Sticky Notes Style */}
        <div className="flex items-center gap-3 justify-center">
          <div className="relative">
            <div className="bg-[hsl(var(--highlighter-yellow))]/60 px-3 py-2 paper-shadow border border-[hsl(var(--pencil-gray))]/40 rotate-[-1deg] text-center min-w-[80px]">
              <Eye className="h-3 w-3 mx-auto mb-0.5 text-[hsl(var(--ink-blue))]" />
              <span className="block text-lg font-bold handwritten ink-text">{project.view_count}</span>
              <span className="block text-[10px] font-source-serif text-[hsl(var(--pencil-gray))]">views</span>
            </div>
            {/* Mini tape */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-white/50 border border-[hsl(var(--pencil-gray))]/20" />
          </div>
          
          <div className="relative">
            <div className="bg-[hsl(var(--highlighter-yellow))]/60 px-3 py-2 paper-shadow border border-[hsl(var(--pencil-gray))]/40 rotate-[1deg] text-center min-w-[80px]">
              <Copy className="h-3 w-3 mx-auto mb-0.5 text-[hsl(var(--ink-blue))]" />
              <span className="block text-lg font-bold handwritten ink-text">{project.cloned_count}</span>
              <span className="block text-[10px] font-source-serif text-[hsl(var(--pencil-gray))]">uses</span>
            </div>
            {/* Mini tape */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-white/50 border border-[hsl(var(--pencil-gray))]/20" />
          </div>
        </div>

        {/* Keywords - Paper Tags */}
        {project.keywords && project.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {project.keywords.slice(0, 3).map((keyword, i) => (
              <Badge key={i} className="text-xs bg-white border border-[hsl(var(--pencil-gray))] text-[hsl(var(--ink-blue))] font-source-serif hover:bg-[hsl(var(--highlighter-yellow))]/20 paper-shadow">
                {keyword}
              </Badge>
            ))}
            {project.keywords.length > 3 && (
              <Badge className="text-xs border border-[hsl(var(--pencil-gray))] bg-white text-[hsl(var(--pencil-gray))] font-source-serif">
                +{project.keywords.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="text-xs font-source-serif text-[hsl(var(--pencil-gray))] px-5 py-3 border-t border-[hsl(var(--pencil-gray))]/20 bg-white/40">
        Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
      </CardFooter>
    </Card>
  );
}
