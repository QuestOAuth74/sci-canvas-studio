import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBlogPost, useIncrementViewCount, useRelatedPosts } from "@/hooks/useBlogPosts";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Breadcrumbs } from "@/components/SEO/Breadcrumbs";
import { BlogContentRenderer } from "@/components/blog/BlogContentRenderer";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Eye } from "lucide-react";
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

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            asChild
            className="mb-6"
          >
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>

          <Breadcrumbs items={breadcrumbItems} />

          <article className="mt-8">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">
                  {post.excerpt}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {post.published_at && (
                  <time dateTime={post.published_at}>
                    {format(new Date(post.published_at), 'MMMM d, yyyy')}
                  </time>
                )}
                {post.reading_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.reading_time} min read
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.view_count} views
                </span>
              </div>

              {/* Categories and Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {post.categories?.map((cat: any) => (
                  <Badge key={cat.category.id} variant="secondary">
                    {cat.category.name}
                  </Badge>
                ))}
                {post.tags?.map((tag: any) => (
                  <Badge key={tag.tag.id} variant="outline">
                    {tag.tag.name}
                  </Badge>
                ))}
              </div>
            </header>

            {/* Featured Image */}
            {post.featured_image_url && (
              <img
                src={post.featured_image_url}
                alt={post.featured_image_alt || post.title}
                className="w-full h-auto rounded-lg mb-8 object-cover max-h-96"
              />
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert mb-12">
              <BlogContentRenderer content={post.content} />
            </div>

            {/* Share Buttons */}
            <div className="border-t border-border pt-8 mb-8">
              <ShareButtons
                url={window.location.href}
                title={post.title}
              />
            </div>

            {/* Author Card */}
            {post.author && (
              <div className="mb-12">
                <AuthorCard author={post.author} />
              </div>
            )}

            {/* Related Posts */}
            {relatedPosts && relatedPosts.length > 0 && (
              <div className="border-t border-border pt-12">
                <RelatedPosts posts={relatedPosts} />
              </div>
            )}
          </article>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
