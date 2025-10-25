import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Breadcrumbs } from "@/components/SEO/Breadcrumbs";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Blog = () => {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('category') || undefined;
  const tagSlug = searchParams.get('tag') || undefined;
  const searchQuery = searchParams.get('q') || undefined;
  const [page, setPage] = useState(0);
  const limit = 12;

  const { data: posts, isLoading } = useBlogPosts({
    status: 'published',
    categorySlug,
    tagSlug,
    searchQuery,
    limit,
    offset: page * limit,
  });

  const { data: categories } = useBlogCategories();

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ];

  return (
    <>
      <SEOHead
        title="BioSketch Blog | Scientific Figure Creation Tips & Tutorials"
        description="Learn how to create stunning scientific figures with BioSketch. Get tips, tutorials, and insights on biomedical illustration, research visualization, and figure design."
        keywords="scientific figures, biomedical illustration, research visualization, BioSketch blog, figure creation tips"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            asChild
            className="mb-6"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <Breadcrumbs items={breadcrumbItems} />

          <div className="mt-8">
            <h1 className="text-4xl font-bold mb-4 text-foreground">BioSketch Blog</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Tips, tutorials, and insights for creating beautiful scientific figures
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <BlogFilters />
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-96" />
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {posts.map((post) => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>
                  
                  {posts.length === limit && (
                    <div className="flex justify-center gap-4 mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No blog posts found.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <BlogSidebar />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
