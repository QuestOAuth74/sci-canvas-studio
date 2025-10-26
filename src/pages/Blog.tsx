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
      
      <div className="min-h-screen bg-background grid-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-b-[4px] border-foreground">
          <div className="container mx-auto px-4 py-16 relative z-10">
            <Button
              variant="ghost"
              asChild
              className="mb-8 glossy-button bg-background/80 backdrop-blur-sm"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>

            <Breadcrumbs items={breadcrumbItems} />

            <div className="mt-12 mb-8 relative">
              {/* Decorative shapes */}
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent/20 rounded-full border-[3px] border-foreground neo-shadow-sm rotate-12" />
              <div className="absolute top-0 right-12 w-16 h-16 bg-primary/20 border-[3px] border-foreground neo-shadow-sm -rotate-6" />
              <div className="absolute -bottom-8 right-32 w-20 h-20 bg-secondary/20 rounded-full border-[3px] border-foreground neo-shadow-sm rotate-45" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-accent/30 border-[3px] border-foreground neo-shadow-sm rounded-full mb-6">
                  <Sparkles className="w-5 h-5 text-foreground" />
                  <span className="font-bold text-foreground">Knowledge Hub</span>
                </div>
                
                <h1 className="text-6xl md:text-7xl font-black mb-6 text-foreground leading-tight">
                  BioSketch
                  <span className="block mt-2">
                    <span className="text-primary">Blog</span>
                    <span className="inline-block ml-4 w-16 h-16 bg-gradient-to-br from-primary to-secondary border-[3px] border-foreground neo-shadow rounded-xl rotate-12" />
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl font-medium mb-8">
                  Master the art of scientific visualization with expert tips, tutorials, 
                  and insights for creating stunning figures that captivate and communicate.
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 border-[3px] border-foreground rounded-2xl neo-shadow-sm">
                    <BookOpen className="w-6 h-6 text-primary" />
                    <div>
                      <div className="font-bold text-foreground">Expert Guides</div>
                      <div className="text-sm text-muted-foreground">Step-by-step tutorials</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-6 py-3 bg-secondary/10 border-[3px] border-foreground rounded-2xl neo-shadow-sm">
                    <Zap className="w-6 h-6 text-secondary" />
                    <div>
                      <div className="font-bold text-foreground">Quick Tips</div>
                      <div className="text-sm text-muted-foreground">Boost productivity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative bottom wave */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-background border-t-[4px] border-foreground" 
               style={{ clipPath: 'polygon(0 50%, 5% 0%, 10% 50%, 15% 0%, 20% 50%, 25% 0%, 30% 50%, 35% 0%, 40% 50%, 45% 0%, 50% 50%, 55% 0%, 60% 50%, 65% 0%, 70% 50%, 75% 0%, 80% 50%, 85% 0%, 90% 50%, 95% 0%, 100% 50%, 100% 100%, 0% 100%)' }} 
          />
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              <div className="glossy-card p-6">
                <BlogFilters />
              </div>
              
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
                  
                  {posts.length === limit && (
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="glossy-button border-[3px]"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                        className="glossy-button border-[3px]"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="glossy-card p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-muted/30 border-[3px] border-foreground rounded-2xl neo-shadow flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold text-muted-foreground">No blog posts found.</p>
                  <p className="text-muted-foreground mt-2">Try adjusting your filters or check back later!</p>
                </div>
              )}
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
