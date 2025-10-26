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
import { ArrowLeft, Sparkles, BookOpen, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Blog = () => {
  const [searchParams] = useSearchParams();
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
      
      <div className="min-h-screen bg-background grid-background">
        {/* Hero Section - New Design */}
        <div className="relative overflow-hidden bg-background border-b-[6px] border-foreground">
          {/* Dotted background pattern */}
          <div className="absolute inset-0 opacity-30" 
               style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
          />
          
          {/* Geometric shapes background */}
          <div className="absolute top-20 left-[10%] w-32 h-32 bg-primary/20 border-[4px] border-foreground rotate-45 animate-pulse" />
          <div className="absolute top-40 right-[15%] w-24 h-24 rounded-full bg-secondary/20 border-[4px] border-foreground animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-20 left-[20%] w-20 h-20 bg-accent/20 border-[4px] border-foreground -rotate-12" />
          <div className="absolute bottom-32 right-[25%] w-16 h-16 rounded-full bg-primary/30 border-[3px] border-foreground" />
          
          <div className="container mx-auto px-4 py-20 relative z-10">
            {/* Top navigation */}
            <div className="flex justify-between items-center mb-12">
              <Button
                asChild
                className="border-[3px] border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[6px_6px_0px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 font-bold"
              >
                <Link to="/">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Home
                </Link>
              </Button>
              
              <Breadcrumbs items={breadcrumbItems} />
            </div>

            {/* Main header content */}
            <div className="max-w-5xl mx-auto text-center space-y-8">
              {/* Mega title with neo-brutal styling */}
              <div className="space-y-4">
                <div className="inline-block">
                  <div className="bg-primary text-primary-foreground px-8 py-3 border-[4px] border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))] rotate-[-2deg] mb-6">
                    <div className="flex items-center gap-3 font-black text-lg uppercase tracking-wider">
                      <Sparkles className="w-6 h-6" />
                      <span>Fresh Content Daily</span>
                      <Sparkles className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-black leading-none">
                  <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent" 
                        style={{ WebkitTextStroke: '2px hsl(var(--foreground))' }}>
                    BLOG
                  </span>
                </h1>
                
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="bg-secondary text-secondary-foreground px-6 py-2 border-[3px] border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] rotate-[1deg] font-bold text-lg">
                    Tips
                  </div>
                  <div className="bg-accent text-accent-foreground px-6 py-2 border-[3px] border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] rotate-[-1deg] font-bold text-lg">
                    Tutorials
                  </div>
                  <div className="bg-primary text-primary-foreground px-6 py-2 border-[3px] border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] rotate-[2deg] font-bold text-lg">
                    Insights
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xl md:text-2xl font-bold text-foreground/80 max-w-3xl mx-auto leading-relaxed">
                Level up your scientific figure game with cutting-edge techniques, 
                pro tips, and creative workflows
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-[4px] border-foreground p-6 shadow-[6px_6px_0px_0px_hsl(var(--foreground))] hover:shadow-[8px_8px_0px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 group">
                  <div className="w-14 h-14 bg-primary text-primary-foreground rounded-xl border-[3px] border-foreground flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-200">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black mb-2">In-Depth</h3>
                  <p className="text-sm font-semibold text-muted-foreground">Comprehensive guides & tutorials</p>
                </div>

                <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-[4px] border-foreground p-6 shadow-[6px_6px_0px_0px_hsl(var(--foreground))] hover:shadow-[8px_8px_0px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 group">
                  <div className="w-14 h-14 bg-secondary text-secondary-foreground rounded-xl border-[3px] border-foreground flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-200">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Fast-Track</h3>
                  <p className="text-sm font-semibold text-muted-foreground">Quick wins & productivity hacks</p>
                </div>

                <div className="bg-gradient-to-br from-accent/10 to-accent/5 border-[4px] border-foreground p-6 shadow-[6px_6px_0px_0px_hsl(var(--foreground))] hover:shadow-[8px_8px_0px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 group">
                  <div className="w-14 h-14 bg-accent text-accent-foreground rounded-xl border-[3px] border-foreground flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-200">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Trending</h3>
                  <p className="text-sm font-semibold text-muted-foreground">Latest updates & hot topics</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom border accent */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              <div className="glossy-card p-6">
                <BlogFilters />
              </div>

              {/* Search Results Info */}
              {searchQuery && !isLoading && (
                <div className="mb-6 p-4 border-4 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-sm font-bold">
                    {totalCount > 0 ? (
                      <>
                        Found <span className="text-primary">{totalCount}</span> post{totalCount !== 1 ? 's' : ''} for{' '}
                        <span className="text-foreground">"{searchQuery}"</span>
                      </>
                    ) : (
                      <>
                        No results for <span className="text-foreground">"{searchQuery}"</span>
                        <span className="block mt-2 text-muted-foreground font-normal">
                          Try different keywords or browse by category
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-96 rounded-2xl border-[3px] border-foreground neo-shadow" />
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {posts.map((post, idx) => (
                      <div 
                        key={post.id}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <BlogCard post={post} />
                      </div>
                    ))}
                  </div>
                  
                  {totalCount > postsPerPage && (
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="glossy-button border-[3px]"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage * postsPerPage >= totalCount}
                        className="glossy-button border-[3px]"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : !searchQuery ? (
                <div className="glossy-card p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-muted/30 border-[3px] border-foreground rounded-2xl neo-shadow flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold text-muted-foreground">No blog posts found.</p>
                  <p className="text-muted-foreground mt-2">Try adjusting your filters or check back later!</p>
                </div>
              ) : null}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <BlogSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
