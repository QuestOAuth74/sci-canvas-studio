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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, Eye, Calendar, User, Share2, BookmarkPlus } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--cream))] to-background">
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
      <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--cream))] to-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-[hsl(var(--cream))] rounded-full flex items-center justify-center border-2 border-[hsl(var(--pencil-gray))]/30">
            <BookmarkPlus className="w-12 h-12 text-[hsl(var(--ink-blue))]/30" />
          </div>
          <h1 className="text-3xl font-bold text-[hsl(var(--ink-blue))]">Post not found</h1>
          <p className="text-[hsl(var(--pencil-gray))]">The article you're looking for doesn't exist.</p>
          <Button asChild variant="ink">
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

      <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--cream))]/50 to-background">
        {/* Navigation Bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[hsl(var(--pencil-gray))]/20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-[hsl(var(--ink-blue))] hover:bg-[hsl(var(--cream))]"
            >
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="font-source-serif">All Articles</span>
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
        <header className="container mx-auto px-4 pt-12 pb-8 max-w-4xl">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.categories?.map((cat: any) => (
              <Link 
                key={cat.category.id}
                to={`/blog?category=${cat.category.slug}`}
                className="group"
              >
                <Badge 
                  className="bg-[hsl(var(--ink-blue))]/10 text-[hsl(var(--ink-blue))] border-[hsl(var(--ink-blue))]/20 hover:bg-[hsl(var(--ink-blue))] hover:text-white transition-colors font-source-serif"
                >
                  {cat.category.name}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[hsl(var(--ink-blue))] leading-tight mb-6 font-source-serif">
            {post.title}
          </h1>
          
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-[hsl(var(--pencil-gray))] leading-relaxed mb-8 font-source-serif">
              {post.excerpt}
            </p>
          )}

          {/* Meta Bar */}
          <div className="flex flex-wrap items-center gap-6 py-6 border-y border-[hsl(var(--pencil-gray))]/20">
            {/* Author */}
            {post.author && (
              <div className="flex items-center gap-3">
                {post.author.avatar_url ? (
                  <img 
                    src={post.author.avatar_url} 
                    alt={post.author.full_name || 'Author'} 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[hsl(var(--ink-blue))]/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[hsl(var(--ink-blue))]/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-[hsl(var(--ink-blue))]" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[hsl(var(--ink-blue))]">{post.author.full_name || 'BioSketch Team'}</p>
                  {post.published_at && (
                    <time dateTime={post.published_at} className="text-sm text-[hsl(var(--pencil-gray))]">
                      {format(new Date(post.published_at), 'MMMM d, yyyy')}
                    </time>
                  )}
                </div>
              </div>
            )}
            
            <div className="h-8 w-px bg-[hsl(var(--pencil-gray))]/20 hidden md:block" />
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-[hsl(var(--pencil-gray))]">
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
          <div className="container mx-auto px-4 mb-12 max-w-5xl">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[hsl(var(--ink-blue))]/10">
              <img
                src={post.featured_image_url}
                alt={post.featured_image_alt || post.title}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
            {/* Article Content */}
            <article className="lg:col-span-8">
              {/* Content */}
              <div className="bg-white rounded-2xl shadow-lg shadow-[hsl(var(--ink-blue))]/5 border border-[hsl(var(--pencil-gray))]/10 p-8 md:p-12 mb-12">
                <div className="prose prose-lg max-w-none
                  prose-headings:font-source-serif prose-headings:text-[hsl(var(--ink-blue))] prose-headings:font-bold
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-[hsl(var(--pencil-gray))]/20
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-6 prose-p:font-source-serif
                  prose-a:text-[hsl(var(--ink-blue))] prose-a:font-medium prose-a:no-underline prose-a:border-b prose-a:border-[hsl(var(--ink-blue))]/30 hover:prose-a:border-[hsl(var(--ink-blue))]
                  prose-strong:text-[hsl(var(--ink-blue))] prose-strong:font-semibold
                  prose-code:text-[hsl(var(--ink-blue))] prose-code:bg-[hsl(var(--cream))] prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-[hsl(var(--ink-blue))] prose-pre:text-white prose-pre:rounded-xl
                  prose-img:rounded-xl prose-img:shadow-lg
                  prose-blockquote:border-l-4 prose-blockquote:border-[hsl(var(--ink-blue))] prose-blockquote:bg-[hsl(var(--cream))]/50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-ul:my-6 prose-ol:my-6
                  prose-li:my-2 prose-li:marker:text-[hsl(var(--ink-blue))]">
                  <BlogContentRenderer content={post.content} />
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-12">
                  <span className="text-sm font-medium text-[hsl(var(--pencil-gray))] mr-2">Tags:</span>
                  {post.tags.map((tag: any) => (
                    <Link 
                      key={tag.tag.id}
                      to={`/blog?tag=${tag.tag.slug}`}
                    >
                      <Badge 
                        variant="outline"
                        className="border-[hsl(var(--pencil-gray))]/30 text-[hsl(var(--pencil-gray))] hover:bg-[hsl(var(--cream))] hover:text-[hsl(var(--ink-blue))] transition-colors"
                      >
                        #{tag.tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Share Section */}
              <Card className="p-6 mb-12 bg-[hsl(var(--cream))]/50 border-[hsl(var(--pencil-gray))]/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--ink-blue))] font-source-serif">Enjoyed this article?</h3>
                    <p className="text-sm text-[hsl(var(--pencil-gray))]">Share it with your colleagues and friends</p>
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
                <div className="pt-12 border-t border-[hsl(var(--pencil-gray))]/20">
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
