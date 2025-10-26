import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBlogPost, useIncrementViewCount, useRelatedPosts } from "@/hooks/useBlogPosts";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Breadcrumbs } from "@/components/SEO/Breadcrumbs";
import { BlogContentRenderer } from "@/components/blog/BlogContentRenderer";
import { BlogPostSidebar } from "@/components/blog/BlogPostSidebar";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Eye, Calendar } from "lucide-react";
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

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ];

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

      <div className="min-h-screen bg-background grid-background">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b-[4px] border-foreground">
          <div className="container mx-auto px-4 py-6">
            <Button
              asChild
              className="border-[3px] border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[6px_6px_0px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 font-bold"
            >
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <article>
                {/* Header with Neo-Brutalism Style */}
                <header className="mb-10 bg-card border-[4px] border-foreground p-8 shadow-[8px_8px_0px_0px_hsl(var(--foreground))] rounded-none relative overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 -ml-12 -mb-12 rotate-45" />
                  
                  <div className="relative z-10">
                    {/* Categories and Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {post.categories?.map((cat: any) => (
                        <Badge 
                          key={cat.category.id}
                          className="bg-primary text-primary-foreground border-[2px] border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] font-bold text-sm px-3 py-1"
                        >
                          {cat.category.name}
                        </Badge>
                      ))}
                      {post.tags?.map((tag: any) => (
                        <Badge 
                          key={tag.tag.id}
                          className="bg-accent text-accent-foreground border-[2px] border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] font-bold text-sm px-3 py-1"
                        >
                          #{tag.tag.name}
                        </Badge>
                      ))}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-6 text-foreground leading-tight">
                      {post.title}
                    </h1>
                    
                    {post.excerpt && (
                      <p className="text-xl md:text-2xl text-foreground/80 mb-6 font-semibold leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4">
                      {post.published_at && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-background border-[3px] border-foreground rounded-lg shadow-[3px_3px_0px_0px_hsl(var(--foreground))] font-bold text-sm">
                          <Calendar className="h-4 w-4 text-primary" />
                          <time dateTime={post.published_at}>
                            {format(new Date(post.published_at), 'MMMM d, yyyy')}
                          </time>
                        </div>
                      )}
                      {post.reading_time && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-background border-[3px] border-foreground rounded-lg shadow-[3px_3px_0px_0px_hsl(var(--foreground))] font-bold text-sm">
                          <Clock className="h-4 w-4 text-secondary" />
                          {post.reading_time} min read
                        </div>
                      )}
                      <div className="flex items-center gap-2 px-4 py-2 bg-background border-[3px] border-foreground rounded-lg shadow-[3px_3px_0px_0px_hsl(var(--foreground))] font-bold text-sm">
                        <Eye className="h-4 w-4 text-accent" />
                        {post.view_count} views
                      </div>
                    </div>
                  </div>
                </header>

                {/* Featured Image with Neo-Brutalism Frame */}
                {post.featured_image_url && (
                  <div className="mb-10 border-[6px] border-foreground shadow-[12px_12px_0px_0px_hsl(var(--foreground))] overflow-hidden bg-card">
                    <img
                      src={post.featured_image_url}
                      alt={post.featured_image_alt || post.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Content with Enhanced Styling */}
                <div className="bg-card border-[4px] border-foreground p-8 md:p-12 shadow-[8px_8px_0px_0px_hsl(var(--foreground))] mb-10">
                  <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-black prose-headings:text-foreground prose-p:text-foreground/90 prose-p:font-medium prose-a:text-primary prose-a:font-bold prose-strong:text-foreground prose-strong:font-black">
                    <BlogContentRenderer content={post.content} />
                  </div>
                </div>

                {/* Share Section */}
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border-[4px] border-foreground p-8 shadow-[8px_8px_0px_0px_hsl(var(--foreground))] mb-10">
                  <h3 className="text-2xl font-black mb-4 text-foreground">Share This Post</h3>
                  <ShareButtons
                    url={window.location.href}
                    title={post.title}
                  />
                </div>

                {/* Author Card */}
                {post.author && (
                  <div className="mb-10">
                    <AuthorCard author={post.author} />
                  </div>
                )}

                {/* Related Posts */}
                {relatedPosts && relatedPosts.length > 0 && (
                  <div className="border-t-[4px] border-foreground pt-10">
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
