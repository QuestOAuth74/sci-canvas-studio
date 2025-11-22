import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { SEOHead } from "@/components/SEO/SEOHead";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category') || undefined;
  const tagSlug = searchParams.get('tag') || undefined;
  const searchQuery = searchParams.get('search') || undefined;
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  const { data: result, isLoading } = useBlogPosts({
    status: 'published',
    categorySlug,
    tagSlug,
    searchQuery,
    limit: postsPerPage,
    offset: (currentPage - 1) * postsPerPage,
  });

  const posts = result?.posts || [];
  const totalCount = result?.count || 0;

  const { data: categories } = useBlogCategories();

  return (
    <>
      <SEOHead
        title="BioSketch Blog | Scientific Figure Creation Tips & Tutorials"
        description="Learn how to create stunning scientific figures with BioSketch. Get tips, tutorials, and insights on biomedical illustration, research visualization, and figure design."
        keywords="scientific figures, biomedical illustration, research visualization, BioSketch blog, figure creation tips"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section - Clean and Professional */}
        <div className="border-b border-border bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 py-12 md:py-16">
            {/* Top navigation */}
            <div className="flex items-center mb-12">
              <Button
                asChild
                variant="ghost"
                className="hover:bg-muted"
              >
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Main header content */}
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  BioSketch Blog
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Insights, tutorials, and best practices for creating professional scientific figures
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Blog Posts */}
            <div className="lg:col-span-8 space-y-8">
              {/* Search */}
              <BlogFilters />

              {/* Active filters display */}
              {(categorySlug || tagSlug) && (
                <div className="flex flex-wrap gap-2 items-center p-4 bg-muted/50 border border-border rounded-lg">
                  <span className="font-semibold text-sm text-muted-foreground">Filters:</span>
                  {categorySlug && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        searchParams.delete('category');
                        setSearchParams(searchParams);
                        setCurrentPage(1);
                      }}
                      className="h-7 text-xs"
                    >
                      {categorySlug} ✕
                    </Button>
                  )}
                  {tagSlug && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        searchParams.delete('tag');
                        setSearchParams(searchParams);
                        setCurrentPage(1);
                      }}
                      className="h-7 text-xs"
                    >
                      {tagSlug} ✕
                    </Button>
                  )}
                </div>
              )}

              {/* Search Results Info */}
              {searchQuery && !isLoading && (
                <div className="p-4 bg-muted/30 border border-border rounded-lg">
                  <p className="text-sm">
                    {totalCount > 0 ? (
                      <>
                        Found <span className="font-semibold text-primary">{totalCount}</span> post{totalCount !== 1 ? 's' : ''} for{' '}
                        <span className="font-semibold">"{searchQuery}"</span>
                      </>
                    ) : (
                      <>
                        No results for <span className="font-semibold">"{searchQuery}"</span>
                        <span className="block mt-2 text-muted-foreground">
                          Try different keywords or browse by category
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}
              
              {/* Posts Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-96 rounded-lg" />
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((post) => (
                      <div key={post.id}>
                        <BlogCard post={post} />
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalCount > postsPerPage && (
                    <div className="flex justify-center items-center gap-4 mt-12">
                      <Button
                        onClick={() => {
                          setCurrentPage(p => Math.max(1, p - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        variant="outline"
                      >
                        ← Previous
                      </Button>
                      
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {Math.ceil(totalCount / postsPerPage)}
                      </span>
                      
                      <Button
                        onClick={() => {
                          setCurrentPage(p => Math.min(Math.ceil(totalCount / postsPerPage), p + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage >= Math.ceil(totalCount / postsPerPage)}
                        variant="outline"
                      >
                        Next →
                      </Button>
                    </div>
                  )}
                </>
              ) : !searchQuery ? (
                <div className="text-center py-16 border border-dashed border-border rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">No blog posts found</p>
                </div>
              ) : null}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <BlogSidebar />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
