import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, Copy, User } from 'lucide-react';
import { format } from 'date-fns';

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
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  onPreview: () => void;
}

export function ProjectCard({ project, onPreview }: ProjectCardProps) {
  const creatorName = project.profiles?.full_name || 'Anonymous';
  const initials = creatorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <div 
        className="h-48 bg-muted cursor-pointer relative group"
        onClick={onPreview}
      >
        {project.thumbnail_url ? (
          <img 
            src={project.thumbnail_url} 
            alt={project.title || 'Project thumbnail'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No preview available
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white font-medium">Click to preview</span>
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="line-clamp-1">{project.title || 'Untitled'}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description || 'No description provided'}
        </p>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={project.profiles?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{creatorName}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {project.view_count}
          </span>
          <span className="flex items-center gap-1">
            <Copy className="h-4 w-4" />
            {project.cloned_count}
          </span>
        </div>

        {project.keywords && project.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.keywords.slice(0, 3).map((keyword, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {project.keywords.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.keywords.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
      </CardFooter>
    </Card>
  );
}
