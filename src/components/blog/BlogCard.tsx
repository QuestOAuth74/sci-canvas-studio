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
  return (
    <Link to={`/blog/${post.slug}`} className="block group">
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
        {post.featured_image_url && (
          <div className="relative overflow-hidden h-48">
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
                  variant="secondary"
                  className="text-xs"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
          <h2 className="text-xl group-hover:text-primary transition-colors line-clamp-2 leading-tight font-semibold">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
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
