import { Link } from "react-router-dom";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Folder } from "lucide-react";

export const BlogSidebar = () => {
  const { data: categories } = useBlogCategories();
  const { data: popularPosts } = useBlogPosts({
    status: 'published',
    limit: 5,
  });

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="border-[3px] border-foreground neo-shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/10 border-b-[3px] border-foreground">
          <CardTitle className="flex items-center gap-2 text-xl font-black">
            <div className="w-8 h-8 bg-primary border-[2px] border-foreground rounded-lg flex items-center justify-center">
              <Folder className="w-4 h-4 text-primary-foreground" />
            </div>
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-6">
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`/blog?category=${category.slug}`}
              className="flex items-center justify-between p-3 rounded-xl border-[2px] border-foreground/20 hover:border-foreground hover:bg-primary/5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] transition-all duration-150 group"
            >
              <span className="font-bold group-hover:text-primary transition-colors">{category.name}</span>
              <Badge className="bg-accent/20 text-foreground border-[2px] border-foreground neo-shadow-sm">{category.icon}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Popular Posts */}
      <Card className="border-[3px] border-foreground neo-shadow-lg overflow-hidden">
        <CardHeader className="bg-secondary/10 border-b-[3px] border-foreground">
          <CardTitle className="flex items-center gap-2 text-xl font-black">
            <div className="w-8 h-8 bg-secondary border-[2px] border-foreground rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-secondary-foreground" />
            </div>
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {popularPosts?.sort((a, b) => b.view_count - a.view_count).slice(0, 5).map((post, idx) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="block p-3 rounded-xl border-[2px] border-foreground/20 hover:border-foreground hover:bg-accent/5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] transition-all duration-150 group relative"
            >
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-primary-foreground rounded-full border-[2px] border-foreground flex items-center justify-center text-xs font-black neo-shadow-sm">
                {idx + 1}
              </div>
              <h3 className="font-bold group-hover:text-primary transition-colors line-clamp-2 mb-2 pl-4">
                {post.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground pl-4">
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full border-[2px] border-foreground/20">
                  <Eye className="h-3 w-3" />
                  <span className="font-bold">{post.view_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
