import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { Eye, Copy, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import noPreviewImage from '@/assets/no_preview.png';
import { VerifiedBadge } from './VerifiedBadge';
import { CommunityTestIds } from '@/lib/test-ids';

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
      className="group overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onPreview}
      data-testid={CommunityTestIds.PROJECT_CARD}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden bg-muted/30 min-h-[160px] max-h-[280px] flex items-center justify-center">
        <img
          src={project.thumbnail_url || noPreviewImage}
          alt={project.title || 'Project thumbnail'}
          loading="lazy"
          className="max-w-full max-h-[280px] w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Like Button Overlay */}
        <div className="absolute top-3 right-3">
          <Button
            variant={isLiked ? "default" : "secondary"}
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={`shadow-lg gap-1.5 transition-all ${isLiked ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-white/90 hover:bg-white text-foreground'}`}
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">{likeCount}</span>
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <CardContent className="p-5 space-y-4">
        {/* Title */}
        <h3 className="font-serif font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {project.title || 'Untitled'}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {project.description || 'No description provided'}
        </p>

        {/* Creator Info */}
        <Link
          to={`/author/${(project as any).user_id}`}
          className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar className="h-8 w-8 ring-2 ring-background">
            <AvatarImage src={project.profiles?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors" data-testid={CommunityTestIds.PROJECT_AUTHOR}>{creatorName}</span>
            {isVerified && <VerifiedBadge size="sm" />}
          </div>
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span>{project.view_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Copy className="h-4 w-4" />
            <span>{project.cloned_count.toLocaleString()}</span>
          </div>
        </div>

        {/* Keywords */}
        {project.keywords && project.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.keywords.slice(0, 3).map((keyword, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal bg-muted/50 hover:bg-muted text-muted-foreground">
                {keyword}
              </Badge>
            ))}
            {project.keywords.length > 3 && (
              <Badge variant="secondary" className="text-xs font-normal bg-muted/50 text-muted-foreground">
                +{project.keywords.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground px-5 py-3 border-t border-border/30 bg-muted/20">
        Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
      </CardFooter>
    </Card>
  );
}
