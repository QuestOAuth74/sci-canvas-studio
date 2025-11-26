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
      className="group overflow-hidden border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:scale-[1.02] transition-all duration-300 animate-fade-in cursor-pointer"
      style={{ 
        animationDelay: `${index * 50}ms`,
        transform: `rotate(${index % 2 === 0 ? -0.5 : 0.5}deg)`
      }}
      onClick={onPreview}
    >
      {/* Thumbnail - Polaroid Style */}
      <div className="relative overflow-hidden bg-white p-2">
        <AspectRatio ratio={16 / 9}>
          <img
            src={project.thumbnail_url || noPreviewImage}
            alt={project.title || 'Project thumbnail'}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Like Button Overlay */}
          <div className="absolute top-3 right-3">
            <Button
              variant={isLiked ? "sticky" : "secondary"}
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className="shadow-lg gap-1"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
          </div>
        </AspectRatio>
        <p className="text-center mt-2 text-xs handwritten text-muted-foreground">
          {project.title || 'Untitled'}
        </p>
      </div>

      {/* Card Content */}
      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description || 'No description provided'}
            </p>
          </div>

          {/* Creator Info */}
          <Link
            to={`/author/${(project as any).user_id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="h-6 w-6 border border-[hsl(var(--pencil-gray))]">
              <AvatarImage src={project.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground hover:underline">{creatorName}</span>
              {isVerified && <VerifiedBadge size="sm" />}
            </div>
          </Link>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {project.view_count}
            </span>
            <span className="flex items-center gap-1">
              <Copy className="h-4 w-4" />
              {project.cloned_count}
            </span>
          </div>

          {/* Keywords */}
          {project.keywords && project.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.keywords.slice(0, 3).map((keyword, i) => (
                <Badge key={i} variant="secondary" className="text-xs border border-[hsl(var(--pencil-gray))]">
                  {keyword}
                </Badge>
              ))}
              {project.keywords.length > 3 && (
                <Badge variant="outline" className="text-xs border-[hsl(var(--pencil-gray))]">
                  +{project.keywords.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground px-5 py-3 border-t border-[hsl(var(--pencil-gray)_/_0.2)]">
        Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
      </CardFooter>
    </Card>
  );
}
