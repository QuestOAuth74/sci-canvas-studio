import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { format } from "date-fns";

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image_url?: string;
  published_at?: string;
  reading_time?: number;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export const RelatedPosts = ({ posts }: RelatedPostsProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`}>
            <Card className="h-full hover:shadow-lg transition-shadow group">
              {post.featured_image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
