import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";

export const BlogPostsCarousel = () => {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useBlogPosts({ 
    status: 'published',
    limit: 6 
  });

  if (isLoading || !posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="py-12 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="neo-badge inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Latest From Our Blog</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            <span className="marker-highlight">Learn & Discover</span>
          </h2>
          <p className="text-lg font-semibold text-foreground/70 max-w-2xl mx-auto">
            Explore tutorials, tips, and insights to enhance your scientific illustrations
          </p>
        </div>

        {/* Carousel */}
        <Carousel 
          className="relative" 
          opts={{ loop: true, align: "start" }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
            }),
          ]}
        >
          <CarouselContent className="-ml-4">
            {posts.map((post) => (
              <CarouselItem key={post.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Card 
                  className="h-full cursor-pointer group hover:shadow-xl transition-all duration-300 overflow-hidden border-[3px] border-foreground neo-shadow hover:neo-shadow-xl"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  {post.featured_image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.featured_image_url}
                        alt={post.featured_image_alt || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  )}
                  
                  <CardContent className="p-6 space-y-4">
                    {/* Categories */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.categories.slice(0, 2).map((category) => (
                          <Badge
                            key={category.id}
                            variant="secondary"
                            className="font-semibold"
                            style={{
                              backgroundColor: category.color ? `${category.color}20` : undefined,
                              borderColor: category.color || undefined,
                            }}
                          >
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 font-medium">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-semibold pt-2 border-t border-border/50">
                      {post.published_at && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}</span>
                        </div>
                      )}
                      {post.reading_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{post.reading_time} min read</span>
                        </div>
                      )}
                      {post.view_count > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{post.view_count}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="bg-primary/90 border border-primary/20 shadow-lg hover:shadow-xl hover:scale-105 transition-all -left-4 md:-left-16" />
          <CarouselNext className="bg-primary/90 border border-primary/20 shadow-lg hover:shadow-xl hover:scale-105 transition-all -right-4 md:-right-16" />
        </Carousel>
      </div>
    </div>
  );
};
