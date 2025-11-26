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
import { ArrowLeft, Clock, Eye, Calendar, User } from "lucide-react";
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
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

      <div className="min-h-screen notebook-page">
        {/* Hero Section - Notebook Theme */}
        <div className="border-b border-border/30 bg-[#f9f6f0]/80">
          <div className="container mx-auto px-4 py-6">
            <Button
              asChild
              variant="ghost"
              className="pencil-button"
            >
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 animate-fade-in">
              <article>
                {/* Modern Header Section */}
                <header className="mb-8">
                  {/* Categories and Tags - Sticky Notes */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {post.categories?.map((cat: any) => (
                      <Badge 
                        key={cat.category.id}
                        className="sticky-note bg-[hsl(var(--highlighter-yellow))] text-[hsl(var(--ink-blue))] border-[hsl(var(--pencil-gray))]"
                      >
                        {cat.category.name}
                      </Badge>
                    ))}
                    {post.tags?.map((tag: any) => (
                      <Badge 
                        key={tag.tag.id}
                        className="sticky-note bg-[#b4e4ff] text-[hsl(var(--ink-blue))] border-[hsl(var(--pencil-gray))]"
                      >
                        #{tag.tag.name}
                      </Badge>
                    ))}
                  </div>

                  <h1 className="text-heading-1 mb-6 leading-tight">
                    {post.title}
                  </h1>
                  
                  {post.excerpt && (
                    <p className="text-body-lg text-muted-foreground mb-8 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Meta Info - Sticky Note Style */}
                  <div className="flex flex-wrap items-center gap-3 mb-8">
                    {post.published_at && (
                      <div className="flex items-center gap-2 px-4 py-2 sticky-note bg-[#fff4b4] text-sm">
                        <Calendar className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
                        <time dateTime={post.published_at}>
                          {format(new Date(post.published_at), 'MMM d, yyyy')}
                        </time>
                      </div>
                    )}
                    {post.reading_time && (
                      <div className="flex items-center gap-2 px-4 py-2 sticky-note bg-[#ffcce1] text-sm">
                        <Clock className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
                        {post.reading_time} min read
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-4 py-2 sticky-note bg-[#b4e4ff] text-sm">
                      <Eye className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
                      {post.view_count.toLocaleString()} views
                    </div>
                  </div>

                  {/* Author Info Inline */}
                  {post.author && (
                    <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border rounded-lg">
                      {post.author.avatar_url ? (
                        <img 
                          src={post.author.avatar_url} 
                          alt={post.author.full_name || 'Author'} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">Written by</p>
                        <p className="text-foreground">{post.author.full_name || 'BioSketch Team'}</p>
                      </div>
                    </div>
                  )}
                </header>

                {/* Featured Image - Modern Frame */}
                {post.featured_image_url && (
                  <div className="mb-10 rounded-lg overflow-hidden border border-border shadow-lg hover-lift smooth-transition">
                    <img
                      src={post.featured_image_url}
                      alt={post.featured_image_alt || post.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Content with Notebook Paper Styling */}
                <Card className="p-8 md:p-12 mb-10 bg-white border-l-4 border-l-[#ff6b6b] ruled-lines relative pl-16 paper-shadow">
                  {/* Margin line decoration */}
                  <div className="margin-line" />
                  <div className="prose prose-lg max-w-none dark:prose-invert 
                    prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:font-['Caveat'] prose-headings:text-[hsl(var(--ink-blue))]
                    prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                    prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                    prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-6 prose-p:font-['Source_Serif_4']
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded
                    prose-pre:bg-muted prose-pre:border prose-pre:border-border
                    prose-img:rounded-lg prose-img:shadow-md
                    prose-ul:my-6 prose-ol:my-6
                    prose-li:my-2">
                    <BlogContentRenderer content={post.content} />
                  </div>
                </Card>

                <Separator className="my-12" />

                {/* Share Section - Sticky Note */}
                <Card className="p-8 mb-10 sticky-note bg-[hsl(var(--highlighter-yellow))]">
                  <h3 className="text-heading-3 mb-4 font-['Caveat'] text-[hsl(var(--ink-blue))]">Share This Post</h3>
                  <ShareButtons
                    url={window.location.href}
                    title={post.title}
                  />
                </Card>

                {/* Author Card */}
                {post.author && (
                  <div className="mb-10">
                    <AuthorCard author={post.author} />
                  </div>
                )}

                {/* Related Posts */}
                {relatedPosts && relatedPosts.length > 0 && (
                  <div className="pt-12 border-t border-border">
                    <RelatedPosts posts={relatedPosts} />
                  </div>
                )}
              </article>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <BlogPostSidebar content={post.content} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
