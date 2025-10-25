import { Link } from "react-router-dom";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export const BlogSidebar = () => {
  const { data: categories } = useBlogCategories();
  const { data: popularPosts } = useBlogPosts({
    status: 'published',
    limit: 5,
  });

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`/blog?category=${category.slug}`}
              className="flex items-center justify-between hover:text-primary transition-colors"
            >
              <span>{category.name}</span>
              <Badge variant="secondary">{category.icon}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Popular Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {popularPosts?.sort((a, b) => b.view_count - a.view_count).slice(0, 5).map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="block group"
            >
              <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-1">
                {post.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
