import { Link } from "react-router-dom";
import { BlogPost } from "@/types/blog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";
import { format } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

export const BlogCard = ({ post, index = 0 }: BlogCardProps) => {
  return (
    <Link to={`/blog/${post.slug}`} className="block group">
      <Card 
        className="h-full overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {post.featured_image_url && (
          <div className="relative overflow-hidden h-48">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        <CardHeader className="space-y-3 p-5">
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.categories.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="bg-primary/10 text-primary text-xs font-medium"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
          <h2 className="text-xl font-serif font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0 px-5 pb-5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {post.published_at && (
              <time dateTime={post.published_at}>
                {format(new Date(post.published_at), 'MMM d, yyyy')}
              </time>
            )}
            {post.reading_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.reading_time} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.view_count.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};