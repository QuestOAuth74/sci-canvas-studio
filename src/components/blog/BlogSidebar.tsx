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
      {/* Categories - Notebook Style */}
      <Card className="notebook-sidebar ruled-lines bg-[#f9f6f0] border-[hsl(var(--pencil-gray))] overflow-hidden pl-8 relative">
        {/* Spiral binding */}
        <div className="spiral-binding">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="spiral-hole" />
          ))}
        </div>
        
        <CardHeader className="bg-[#f9f6f0]/80">
          <CardTitle className="notebook-section-header text-lg">
            <Folder className="w-4 h-4 inline mr-2" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`/blog?category=${category.slug}`}
              className="flex items-center justify-between p-2 rounded-md paper-tab hover:paper-tab-active transition-all group"
            >
              <span className="text-sm font-medium group-hover:text-[hsl(var(--ink-blue))] transition-colors">{category.name}</span>
              <span className="text-lg">{category.icon}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Popular Posts - Sticky Note Stack */}
      <Card className="notebook-sidebar ruled-lines bg-[#f9f6f0] border-[hsl(var(--pencil-gray))] overflow-hidden pl-8 relative">
        {/* Spiral binding */}
        <div className="spiral-binding">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="spiral-hole" />
          ))}
        </div>
        
        <CardHeader className="bg-[#f9f6f0]/80">
          <CardTitle className="notebook-section-header text-lg">
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Trending Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {popularPosts.sort((a, b) => b.view_count - a.view_count).slice(0, 5).map((post, index) => {
            const rotation = (index % 2 === 0 ? 0.5 : -0.5);
            return (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="block"
              >
                <div 
                  className="p-3 sticky-note bg-[#fff4b4] hover:shadow-md transition-all group"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <h3 className="text-sm font-medium group-hover:text-[hsl(var(--ink-blue))] transition-colors line-clamp-2 mb-1 font-['Caveat'] text-[hsl(var(--ink-blue))]">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span>{post.view_count} views</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
