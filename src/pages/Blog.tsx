import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { SEOHead } from "@/components/SEO/SEOHead";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, PenTool, FileText, Lightbulb, Bookmark, Pencil } from "lucide-react";
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
      
      <div className="min-h-screen notebook-page">
        {/* Hero Section - Enhanced Notebook Theme */}
        <div className="border-b-2 border-[hsl(var(--pencil-gray))]/50 bg-[hsl(var(--cream))] ruled-lines relative overflow-hidden">
          {/* Decorative paper clip */}
          <div className="absolute top-8 right-12 w-8 h-16 border-4 border-[hsl(var(--pencil-gray))] rounded-full opacity-30 transform rotate-12 hidden md:block" />
          
          {/* Decorative pencil */}
          <Pencil className="absolute bottom-8 left-8 w-20 h-20 text-[hsl(var(--highlighter-yellow))] opacity-20 transform -rotate-45 hidden md:block" />
          
          <div className="container mx-auto px-4 py-12 md:py-16 relative">
            {/* Top navigation - styled as tab */}
            <div className="flex items-center mb-12">
              <Button
                asChild
                variant="ghost"
                className="pencil-button bg-[hsl(var(--cream))] border-2 border-[hsl(var(--pencil-gray))] hover:bg-[hsl(var(--highlighter-yellow))]/20"
              >
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="font-source-serif">Back to Home</span>
                </Link>
              </Button>
            </div>

            {/* Main header content */}
            <div className="max-w-4xl mx-auto text-center space-y-6">
              {/* Washi tape decoration */}
              <div className="flex justify-center mb-4">
                <div className="washi-tape w-32 transform -rotate-2" />
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight handwritten text-[hsl(var(--ink-blue))] drop-shadow-sm">
                  BioSketch Blog
                </h1>
                <p className="text-lg md:text-xl text-[hsl(var(--pencil-gray))] max-w-2xl mx-auto font-source-serif italic">
                  Insights, tutorials, and best practices for creating professional scientific figures
                </p>
              </div>
              
              {/* Decorative notebook doodles */}
              <div className="flex justify-center gap-8 pt-4">
                <PenTool className="w-8 h-8 text-[hsl(var(--ink-blue))]/20 doodle-sketch" />
                <BookOpen className="w-10 h-10 text-[hsl(var(--ink-blue))]/30 doodle-sketch" />
                <Lightbulb className="w-8 h-8 text-[hsl(var(--highlighter-yellow))]/50 doodle-sketch" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Notebook Layout */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Blog Posts - Main notebook area */}
            <div className="lg:col-span-8 space-y-8">
              {/* Search - styled as notebook header */}
              <div className="bg-[hsl(var(--cream))] p-4 border-2 border-[hsl(var(--pencil-gray))] paper-shadow rounded-lg relative">
                <div className="absolute -top-3 left-4 bg-[hsl(var(--highlighter-yellow))] px-3 py-1 text-xs font-source-serif text-[hsl(var(--ink-blue))] border border-[hsl(var(--pencil-gray))] rounded transform -rotate-1">
                  <Bookmark className="w-3 h-3 inline mr-1" />
                  Search Articles
                </div>
                <div className="pt-2">
                  <BlogFilters />
                </div>
              </div>

              {/* Active filters display - sticky note style */}
              {(categorySlug || tagSlug) && (
                <div className="flex flex-wrap gap-2 items-center p-4 sticky-note bg-[hsl(var(--highlighter-yellow))] transform rotate-1">
                  <span className="font-semibold text-sm text-[hsl(var(--ink-blue))] font-source-serif">Filters:</span>
                  {categorySlug && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        searchParams.delete('category');
                        setSearchParams(searchParams);
                        setCurrentPage(1);
                      }}
                      className="h-7 text-xs bg-white/80 border border-[hsl(var(--pencil-gray))] hover:bg-white"
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
                      className="h-7 text-xs bg-white/80 border border-[hsl(var(--pencil-gray))] hover:bg-white"
                    >
                      {tagSlug} ✕
                    </Button>
                  )}
                </div>
              )}

              {/* Search Results Info - notebook annotation style */}
              {searchQuery && !isLoading && (
                <div className="p-4 bg-[hsl(var(--cream))] border-l-4 border-[hsl(var(--ink-blue))] rounded-r-lg paper-shadow">
                  <p className="text-sm font-source-serif">
                    {totalCount > 0 ? (
                      <>
                        Found <span className="font-bold text-[hsl(var(--ink-blue))] underline decoration-wavy decoration-[hsl(var(--highlighter-yellow))]">{totalCount}</span> post{totalCount !== 1 ? 's' : ''} for{' '}
                        <span className="font-bold italic">"{searchQuery}"</span>
                      </>
                    ) : (
                      <>
                        No results for <span className="font-bold italic">"{searchQuery}"</span>
                        <span className="block mt-2 text-[hsl(var(--pencil-gray))]">
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
                  <div className="h-px flex-1 bg-[hsl(var(--pencil-gray))]/30" />
                  <span className="text-sm font-source-serif text-[hsl(var(--pencil-gray))] flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {totalCount} article{totalCount !== 1 ? 's' : ''} available
                  </span>
                  <div className="h-px flex-1 bg-[hsl(var(--pencil-gray))]/30" />
                </div>
              )}
              
              {/* Posts Grid - Pinned notes on corkboard */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-[hsl(var(--cream))] border-2 border-[hsl(var(--pencil-gray))] rounded-lg overflow-hidden">
                      <Skeleton className="h-48 bg-[hsl(var(--pencil-gray))]/10" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-20 bg-[hsl(var(--highlighter-yellow))]/30" />
                        <Skeleton className="h-6 w-full bg-[hsl(var(--pencil-gray))]/10" />
                        <Skeleton className="h-4 w-3/4 bg-[hsl(var(--pencil-gray))]/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((post) => (
                      <div key={post.id} className="transform hover:-translate-y-1 transition-transform duration-200">
                        <BlogCard post={post} />
                      </div>
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
                      
                      // Always show first 3
                      pages.push(1, 2, 3);
                      
                      // Add ellipsis if current is far from start
                      if (currentPage > 5) {
                        pages.push('ellipsis');
                      }
                      
                      // Pages around current (if not already included)
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                        if (i > 3 && i < totalPages - 2 && !pages.includes(i)) {
                          pages.push(i);
                        }
                      }
                      
                      // Add ellipsis if current is far from end
                      if (currentPage < totalPages - 4) {
                        pages.push('ellipsis');
                      }
                      
                      // Always show last 3
                      for (let i = totalPages - 2; i <= totalPages; i++) {
                        if (!pages.includes(i)) {
                          pages.push(i);
                        }
                      }
                      
                      return pages;
                    };
                    
                    return (
                      <div className="flex justify-center mt-12">
                        <Pagination>
                          <PaginationContent className="border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--cream))] paper-shadow rounded-lg p-2">
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => {
                                  setCurrentPage(p => Math.max(1, p - 1));
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`font-source-serif ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-[hsl(var(--highlighter-yellow))]/30'}`}
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
                                    className={`cursor-pointer font-source-serif ${
                                      currentPage === page 
                                        ? 'bg-[hsl(var(--ink-blue))] text-white border-2 border-[hsl(var(--ink-blue))]' 
                                        : 'hover:bg-[hsl(var(--highlighter-yellow))]/30'
                                    }`}
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
                                className={`font-source-serif ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-[hsl(var(--highlighter-yellow))]/30'}`}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    );
                  })()}
                </>
              ) : !searchQuery ? (
                <div className="text-center py-16 bg-[hsl(var(--cream))] border-2 border-dashed border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow relative">
                  {/* Decorative tape */}
                  <div className="washi-tape absolute top-4 left-1/2 -translate-x-1/2 w-20 transform rotate-2" />
                  
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto mb-4 bg-[hsl(var(--highlighter-yellow))]/20 rounded-full flex items-center justify-center border-2 border-[hsl(var(--pencil-gray))]/30">
                      <BookOpen className="w-10 h-10 text-[hsl(var(--ink-blue))]/50 doodle-sketch" />
                    </div>
                    <p className="text-xl font-medium text-[hsl(var(--ink-blue))] handwritten">No blog posts yet...</p>
                    <p className="text-sm text-[hsl(var(--pencil-gray))] font-source-serif italic">
                      Check back soon for new articles!
                    </p>
                    <div className="flex justify-center gap-4 pt-4 opacity-30">
                      <PenTool className="w-6 h-6 text-[hsl(var(--pencil-gray))]" />
                      <Lightbulb className="w-6 h-6 text-[hsl(var(--highlighter-yellow))]" />
                      <FileText className="w-6 h-6 text-[hsl(var(--pencil-gray))]" />
                    </div>
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
