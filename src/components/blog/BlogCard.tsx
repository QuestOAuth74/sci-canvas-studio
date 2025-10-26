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
      <Card className="h-full overflow-hidden border-[3px] border-foreground neo-shadow-lg hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 bg-card hover:shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
        {post.featured_image_url && (
          <div className="aspect-video overflow-hidden border-b-[3px] border-foreground relative">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3 w-12 h-12 bg-accent/90 backdrop-blur-sm border-[3px] border-foreground neo-shadow-sm rounded-full flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-300">
              <ArrowRight className="w-5 h-5 text-foreground" />
            </div>
          </div>
        )}
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories?.slice(0, 2).map((cat: any) => (
              <Badge 
                key={cat.category.id} 
                className="bg-primary/10 text-primary border-[2px] border-foreground neo-shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {cat.category.name}
              </Badge>
            ))}
          </div>
          <h2 className="text-2xl font-black group-hover:text-primary transition-colors leading-tight">
            {post.title}
          </h2>
        </CardHeader>
        <CardContent>
          {post.excerpt && (
            <p className="text-muted-foreground line-clamp-3 font-medium">{post.excerpt}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground border-t-[2px] border-foreground/10 pt-4">
          <div className="flex items-center gap-4">
            {post.published_at && (
              <time dateTime={post.published_at} className="font-bold">
                {format(new Date(post.published_at), 'MMM d, yyyy')}
              </time>
            )}
            {post.reading_time && (
              <span className="flex items-center gap-1.5 font-bold">
                <Clock className="h-4 w-4" />
                {post.reading_time} min
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full border-[2px] border-foreground/20 font-bold">
            <Eye className="h-4 w-4" />
            {post.view_count}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};
