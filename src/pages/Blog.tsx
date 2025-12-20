import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { SEOHead } from "@/components/SEO/SEOHead";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FileText, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
      
      <div className="min-h-screen bg-background relative">
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Hero Section */}
        <div className="border-b border-border/50 bg-card/50 relative overflow-hidden">
          <div className="container mx-auto px-4 py-12 md:py-16 relative">
            {/* Top navigation */}
            <div className="flex items-center mb-10">
              <Button
                asChild
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Main header content */}
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Knowledge Base
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold text-foreground tracking-tight">
                BioSketch Blog
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Insights, tutorials, and best practices for creating professional scientific figures
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Blog Posts - Main area */}
            <div className="lg:col-span-8 space-y-8">
              {/* Search */}
              <div className="bg-card p-5 border border-border/50 rounded-xl shadow-sm">
                <BlogFilters />
              </div>

              {/* Active filters display */}
              {(categorySlug || tagSlug) && (
                <div className="flex flex-wrap gap-2 items-center p-4 bg-muted/30 rounded-lg border border-border/30">
                  <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
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
                <div className="p-4 bg-card border-l-4 border-primary rounded-r-lg shadow-sm">
                  <p className="text-sm">
                    {totalCount > 0 ? (
                      <>
                        Found <span className="font-semibold text-foreground">{totalCount}</span> post{totalCount !== 1 ? 's' : ''} for{' '}
                        <span className="font-semibold">"{searchQuery}"</span>
                      </>
                    ) : (
                      <>
                        No results for <span className="font-semibold">"{searchQuery}"</span>
                        <span className="block mt-1 text-muted-foreground">
                          Try different keywords or browse by category
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Posts count indicator */}
              {!isLoading && totalCount > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {totalCount} article{totalCount !== 1 ? 's' : ''} available
                  </span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
              )}
              
              {/* Posts Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-card border border-border/50 rounded-xl overflow-hidden">
                      <Skeleton className="h-48" />
                      <div className="p-5 space-y-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((post, index) => (
                      <BlogCard key={post.id} post={post} index={index} />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalCount > postsPerPage && (() => {
                    const totalPages = Math.ceil(totalCount / postsPerPage);
                    
                    const getVisiblePages = (): (number | 'ellipsis')[] => {
                      if (totalPages <= 7) {
                        return Array.from({ length: totalPages }, (_, i) => i + 1);
                      }
                      
                      const pages: (number | 'ellipsis')[] = [];
                      pages.push(1, 2, 3);
                      
                      if (currentPage > 5) {
                        pages.push('ellipsis');
                      }
                      
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                        if (i > 3 && i < totalPages - 2 && !pages.includes(i)) {
                          pages.push(i);
                        }
                      }
                      
                      if (currentPage < totalPages - 4) {
                        pages.push('ellipsis');
                      }
                      
                      for (let i = totalPages - 2; i <= totalPages; i++) {
                        if (!pages.includes(i)) {
                          pages.push(i);
                        }
                      }
                      
                      return pages;
                    };
                    
                    return (
                      <div className="flex justify-center mt-10">
                        <Pagination>
                          <PaginationContent className="bg-card border border-border/50 rounded-lg p-1.5 shadow-sm">
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => {
                                  setCurrentPage(p => Math.max(1, p - 1));
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted'} transition-colors`}
                              />
                            </PaginationItem>
                            
                            {getVisiblePages().map((page, index) => (
                              <PaginationItem key={`${page}-${index}`}>
                                {page === 'ellipsis' ? (
                                  <PaginationEllipsis />
                                ) : (
                                  <PaginationLink
                                    onClick={() => {
                                      setCurrentPage(page);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    isActive={currentPage === page}
                                    className={`cursor-pointer ${
                                      currentPage === page 
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                        : 'hover:bg-muted'
                                    } transition-colors`}
                                  >
                                    {page}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => {
                                  setCurrentPage(p => Math.min(totalPages, p + 1));
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted'} transition-colors`}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    );
                  })()}
                </>
              ) : !searchQuery ? (
                <div className="text-center py-20">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
                      No blog posts yet
                    </h2>
                    <p className="text-muted-foreground">
                      Check back soon for new articles and tutorials
                    </p>
                  </div>
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