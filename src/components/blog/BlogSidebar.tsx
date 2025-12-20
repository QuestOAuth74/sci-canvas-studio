import { Link } from "react-router-dom";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Folder, ChevronRight, BookOpen } from "lucide-react";

export const BlogSidebar = () => {
  const { data: categories } = useBlogCategories();
  const { data: result } = useBlogPosts({
    status: 'published',
    limit: 5,
  });
  
  const popularPosts = result?.posts || [];

  return (
    <div className="space-y-8">
      {/* Categories - Modern Academic Style */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <Folder className="w-4 h-4 text-primary" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <nav className="space-y-1">
            {categories?.map((category) => (
              <Link
                key={category.id}
                to={`/blog?category=${category.slug}`}
                className="group flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                    {category.name}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Trending Posts - Academic Journal Style */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <TrendingUp className="w-4 h-4 text-primary" />
            Trending Articles
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {popularPosts.sort((a, b) => b.view_count - a.view_count).slice(0, 5).map((post, index) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group block"
              >
                <article className="relative pl-8 py-2 border-l-2 border-border hover:border-primary transition-colors">
                  <span className="absolute left-0 top-2 -translate-x-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span>{post.view_count.toLocaleString()} views</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reading Recommendation */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Start Reading</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore our collection of scientific illustration tutorials and research insights.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};