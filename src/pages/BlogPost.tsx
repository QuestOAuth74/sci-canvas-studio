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
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Navigation Bar */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
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

        {/* Article Header */}
        <header className="container mx-auto px-4 pt-12 pb-8 max-w-4xl relative z-10">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.categories?.map((cat: any) => (
              <Link 
                key={cat.category.id}
                to={`/blog?category=${cat.category.slug}`}
                className="group"
              >
                <Badge 
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {cat.category.name}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-semibold text-foreground leading-tight mb-6">
            {post.title}
          </h1>
          
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              {post.excerpt}
            </p>
          )}

          {/* Meta Bar */}
          <div className="flex flex-wrap items-center gap-6 py-6 border-y border-border/50">
            {/* Author */}
            {post.author && (
              <div className="flex items-center gap-3">
                {post.author.avatar_url ? (
                  <img 
                    src={post.author.avatar_url} 
                    alt={post.author.full_name || 'Author'} 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-background shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{post.author.full_name || 'BioSketch Team'}</p>
                  {post.published_at && (
                    <time dateTime={post.published_at} className="text-sm text-muted-foreground">
                      {format(new Date(post.published_at), 'MMMM d, yyyy')}
                    </time>
                  )}
                </div>
              </div>
            )}
            
            <div className="h-8 w-px bg-border/50 hidden md:block" />
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {post.reading_time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.reading_time} min read
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {post.view_count.toLocaleString()} views
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="container mx-auto px-4 mb-12 max-w-5xl relative z-10">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={post.featured_image_url}
                alt={post.featured_image_alt || post.title}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="container mx-auto px-4 pb-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
            {/* Article Content */}
            <article className="lg:col-span-8">
              {/* Content */}
              <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-8 md:p-12 mb-12">
                <div className="prose prose-lg max-w-none
                  prose-headings:font-serif prose-headings:text-foreground prose-headings:font-semibold
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border/50
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-5
                  prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-foreground prose-pre:text-background prose-pre:rounded-xl
                  prose-img:rounded-xl prose-img:shadow-md
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-ul:my-5 prose-ol:my-5
                  prose-li:my-2 prose-li:marker:text-primary">
                  <BlogContentRenderer content={post.content} />
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-12">
                  <span className="text-sm font-medium text-muted-foreground mr-2">Tags:</span>
                  {post.tags.map((tag: any) => (
                    <Link 
                      key={tag.tag.id}
                      to={`/blog?tag=${tag.tag.slug}`}
                    >
                      <Badge 
                        variant="outline"
                        className="border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        #{tag.tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Share Section */}
              <Card className="p-6 mb-12 bg-muted/30 border-border/30">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-serif font-semibold text-foreground">Enjoyed this article?</h3>
                    <p className="text-sm text-muted-foreground">Share it with your colleagues and friends</p>
                  </div>
                  <ShareButtons
                    url={window.location.href}
                    title={post.title}
                  />
                </div>
              </Card>

              {/* Author Card */}
              {post.author && (
                <div className="mb-12">
                  <AuthorCard author={post.author} />
                </div>
              )}

              {/* Related Posts */}
              {relatedPosts && relatedPosts.length > 0 && (
                <div className="pt-12 border-t border-border/50">
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