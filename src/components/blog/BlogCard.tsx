import { Link } from "react-router-dom";
import { BlogPost } from "@/types/blog";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard = ({ post }: BlogCardProps) => {
  // Random slight rotation for organic look
  const rotation = Math.random() * 2 - 1; // -1 to 1 degrees
  
  return (
    <Link to={`/blog/${post.slug}`} className="block group">
      <Card 
        className="h-full overflow-hidden paper-shadow bg-[#f9f6f0] border-[hsl(var(--pencil-gray))] hover:shadow-lg transition-all duration-300 relative"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Washi tape decoration at top */}
        <div className="washi-tape top-4 left-1/2 -translate-x-1/2" />
        
        {post.featured_image_url && (
          <div className="relative overflow-hidden h-48 border-b-2 border-[hsl(var(--pencil-gray))]">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader className="space-y-3">
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.categories.map((category) => (
                <Badge
                  key={category.id}
                  className="sticky-note bg-[hsl(var(--highlighter-yellow))] text-[hsl(var(--ink-blue))] border-[hsl(var(--pencil-gray))] text-xs"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
          <h2 className="text-xl group-hover:text-[hsl(var(--ink-blue))] transition-colors line-clamp-2 leading-tight font-semibold font-['Caveat'] text-[hsl(var(--ink-blue))]">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-['Source_Serif_4']">
              {post.excerpt}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {post.published_at && (
              <time dateTime={post.published_at} className="flex items-center gap-1">
                {format(new Date(post.published_at), 'MMM d, yyyy')}
              </time>
            )}
            {post.reading_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.reading_time} min read
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.view_count} views
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
