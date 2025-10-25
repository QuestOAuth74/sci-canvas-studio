import { Link } from "react-router-dom";
import { BlogPost } from "@/types/blog";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";
import { format } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard = ({ post }: BlogCardProps) => {
  return (
    <Link to={`/blog/${post.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
        {post.featured_image_url && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            {post.categories?.slice(0, 2).map((cat: any) => (
              <Badge key={cat.category.id} variant="secondary">
                {cat.category.name}
              </Badge>
            ))}
          </div>
          <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
            {post.title}
          </h2>
        </CardHeader>
        <CardContent>
          {post.excerpt && (
            <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {post.published_at && (
              <time dateTime={post.published_at}>
                {format(new Date(post.published_at), 'MMM d, yyyy')}
              </time>
            )}
            {post.reading_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.reading_time} min
              </span>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {post.view_count}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};
