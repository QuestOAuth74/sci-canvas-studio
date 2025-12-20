import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBlogPost, useIncrementViewCount, useRelatedPosts } from "@/hooks/useBlogPosts";
import { SEOHead } from "@/components/SEO/SEOHead";
import { BlogContentRenderer } from "@/components/blog/BlogContentRenderer";
import { BlogPostSidebar } from "@/components/blog/BlogPostSidebar";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Clock, Eye, User, BookmarkPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug!);
  const incrementView = useIncrementViewCount();
  const { data: relatedPosts } = useRelatedPosts(post?.id || '', 4);

  useEffect(() => {
    if (post?.id && post.status === 'published') {
      incrementView.mutate(post.id);
    }
  }, [post?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-4 mb-8">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl mb-12" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center">
            <BookmarkPlus className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Post not found</h1>
          <p className="text-muted-foreground">The article you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.featured_image_url || "",
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.author?.full_name || "BioSketch Team",
    },
    publisher: {
      "@type": "Organization",
      name: "BioSketch",
      logo: {
        "@type": "ImageObject",
        url: window.location.origin + "/logo.png"
      }
    },
    description: post.excerpt || post.seo_description || "",
  };

  return (
    <>
      <SEOHead
        title={post.seo_title || `${post.title} | BioSketch Blog`}
        description={post.seo_description || post.excerpt || ""}
        keywords={(post.seo_keywords || []).join(', ')}
        ogImage={post.og_image || post.featured_image_url}
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      <div className="min-h-screen bg-background relative">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-transparent pointer-events-none" />

        {/* Navigation Bar */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground -ml-2"
            >
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Articles
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <ShareButtons
                url={window.location.href}
                title={post.title}
                compact
              />
            </div>
          </div>
        </div>

        {/* Article Header - Academic Style */}
        <header className="container mx-auto px-4 pt-16 pb-10 max-w-4xl relative z-10">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.categories?.map((cat: any) => (
              <Link 
                key={cat.category.id}
                to={`/blog?category=${cat.category.slug}`}
              >
                <Badge 
                  variant="outline"
                  className="border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-medium tracking-wide uppercase"
                >
                  {cat.category.name}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Title - Academic Typography */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-[1.2] tracking-tight mb-6">
            {post.title}
          </h1>
          
          {/* Excerpt - Subtitle Style */}
          {post.excerpt && (
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light max-w-3xl">
              {post.excerpt}
            </p>
          )}

          {/* Meta Bar - Clean Academic */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10 pt-6 border-t border-border/50">
            {/* Author */}
            {post.author && (
              <div className="flex items-center gap-3">
                {post.author.avatar_url ? (
                  <img 
                    src={post.author.avatar_url} 
                    alt={post.author.full_name || 'Author'} 
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-background shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.author.full_name || 'BioSketch Team'}</p>
                  {post.published_at && (
                    <time dateTime={post.published_at} className="text-xs text-muted-foreground">
                      {format(new Date(post.published_at), 'MMMM d, yyyy')}
                    </time>
                  )}
                </div>
              </div>
            )}
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {post.reading_time && (
                <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  {post.reading_time} min read
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                <Eye className="h-3.5 w-3.5" />
                {post.view_count.toLocaleString()} views
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image - Full Width */}
        {post.featured_image_url && (
          <div className="container mx-auto px-4 mb-16 max-w-5xl relative z-10">
            <div className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/10">
              <img
                src={post.featured_image_url}
                alt={post.featured_image_alt || post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="container mx-auto px-4 pb-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
            {/* Article Content - Clean Academic */}
            <article className="lg:col-span-8">
              {/* Content Card */}
              <div className="prose prose-lg max-w-none
                prose-headings:font-serif prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:scroll-mt-20
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-foreground/80 prose-p:leading-[1.8] prose-p:mb-6 prose-p:font-normal
                prose-a:text-primary prose-a:font-medium prose-a:no-underline prose-a:border-b prose-a:border-primary/30 hover:prose-a:border-primary
                prose-strong:text-foreground prose-strong:font-semibold
                prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal
                prose-pre:bg-foreground prose-pre:text-background prose-pre:rounded-lg prose-pre:shadow-lg
                prose-img:rounded-lg prose-img:shadow-lg prose-img:ring-1 prose-img:ring-border/10
                prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:bg-muted/30 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-foreground/70
                prose-ul:my-6 prose-ol:my-6
                prose-li:my-1.5 prose-li:marker:text-primary/60">
                <BlogContentRenderer content={post.content} />
              </div>

              {/* Tags - Minimal Style */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-12 pt-8 border-t border-border/30">
                  <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mr-1">Tags:</span>
                  {post.tags.map((tag: any) => (
                    <Link 
                      key={tag.tag.id}
                      to={`/blog?tag=${tag.tag.slug}`}
                    >
                      <Badge 
                        variant="outline"
                        className="border-border/40 text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors text-xs"
                      >
                        {tag.tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Share Section - Modern Card */}
              <Card className="p-6 mt-12 bg-gradient-to-r from-primary/5 to-transparent border-primary/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Enjoyed this article?</h3>
                    <p className="text-sm text-muted-foreground">Share it with your colleagues</p>
                  </div>
                  <ShareButtons
                    url={window.location.href}
                    title={post.title}
                  />
                </div>
              </Card>

              {/* Author Card */}
              {post.author && (
                <div className="mt-12">
                  <AuthorCard author={post.author} />
                </div>
              )}

              {/* Related Posts */}
              {relatedPosts && relatedPosts.length > 0 && (
                <div className="mt-16 pt-12 border-t border-border/30">
                  <RelatedPosts posts={relatedPosts} />
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24">
                <BlogPostSidebar content={post.content} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPost;