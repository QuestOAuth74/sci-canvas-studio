import { Link } from "react-router-dom";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Folder } from "lucide-react";

export const BlogSidebar = () => {
  const { data: categories } = useBlogCategories();
  const { data: result } = useBlogPosts({
    status: 'published',
    limit: 5,
  });
  
  const popularPosts = result?.posts || [];

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Folder className="w-4 h-4 text-muted-foreground" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`/blog?category=${category.slug}`}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors group"
            >
              <span className="text-sm font-medium group-hover:text-primary transition-colors">{category.name}</span>
              <span className="text-lg">{category.icon}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Popular Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Trending Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {popularPosts.sort((a, b) => b.view_count - a.view_count).slice(0, 5).map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="block p-2 rounded-md hover:bg-muted transition-colors group"
            >
              <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 mb-1">
                {post.title}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>{post.view_count} views</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
