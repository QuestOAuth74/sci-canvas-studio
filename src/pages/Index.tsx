import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Share2, MessageCircleHeart, ArrowRight, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { IconSubmissionDialog } from "@/components/community/IconSubmissionDialog";
import { ProjectPreviewModal } from "@/components/community/ProjectPreviewModal";
import { supabase } from "@/integrations/supabase/client";
import carousel1 from "@/assets/carousel-1.png";
import carousel2 from "@/assets/carousel-2.png";
import { SEOHead } from "@/components/SEO/SEOHead";
import { getWebApplicationSchema, getOrganizationSchema } from "@/components/SEO/StructuredData";
import { useRecentSignups } from "@/hooks/useRecentSignups";
import { SignupToast } from "@/components/SignupToast";
import { InstitutionCarousel } from "@/components/InstitutionCarousel";
import { BlogPostsCarousel } from "@/components/blog/BlogPostsCarousel";
import { CommunityCarousel } from "@/components/community/CommunityCarousel";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { data: signupData } = useRecentSignups();

  useEffect(() => {
    supabase
      .from("icon_categories")
      .select("id, name")
      .order("name")
      .then(({ data }) => setCategories(data || []));
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [getWebApplicationSchema(), getOrganizationSchema()],
  };

  const features = [
    { icon: Zap, title: "Intuitive Canvas", desc: "Drag-and-drop interface optimized for scientific workflows" },
    { icon: Microscope, title: "6,000+ Icons", desc: "Comprehensive biomedical icon library for any research field" },
    { icon: Shield, title: "Publication-Ready", desc: "Export high-resolution PNG, JPG, and vector SVG formats" },
    { icon: Share2, title: "Collaboration", desc: "Share figures with colleagues and explore community work" },
    { icon: Sparkles, title: "AI-Assisted", desc: "Generate custom figures and icons using AI technology" },
    { icon: MessageCircleHeart, title: "Free Forever", desc: "No subscription required for essential features" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MaintenanceBanner />

      <SEOHead
        title="BioSketch - Free Scientific Illustration Tool for Researchers"
        description="Create stunning scientific illustrations with BioSketch - a free drag-and-drop tool for scientists and researchers. Build publication-ready figures with our extensive biomedical icon library."
        canonical="https://biosketch.art/"
        keywords="scientific illustration, biomedical graphics, research illustration software, free science graphics, publication figures, scientific diagrams, biology illustration, medical graphics creator"
        structuredData={structuredData}
      />

      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
              <Microscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Trusted by 10,000+ Researchers</span>
            </div>

            {/* Logo & Title */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                  <img
                    src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                    alt="BioSketch Logo"
                    className="h-12 w-12 md:h-14 md:w-14 object-contain"
                  />
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground">
                  BioSketch
                </h1>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-xl md:text-2xl font-display text-foreground">
                  Professional Scientific Illustration
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Create publication-quality figures for research papers, presentations, and grants.
                  Free and trusted by scientists at leading institutions worldwide.
                </p>
              </div>
            </div>

            {/* Welcome for logged-in users */}
            {user && (
              <p className="text-lg font-display text-foreground animate-fade-in">
                Welcome back, <span className="font-semibold text-primary">{user.user_metadata?.full_name?.split(" ")[0] || "Researcher"}</span>
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate(user ? "/canvas" : "/auth")} 
                className="h-12 px-8 text-base font-medium shadow-md hover:shadow-lg transition-all"
              >
                <Palette className="h-5 w-5 mr-2" />
                {user ? "Open Canvas" : "Start Free"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {user ? (
                <>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/projects")} 
                    className="h-12 px-6"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    My Projects
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/community")} 
                    className="h-12 px-6"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Community
                  </Button>
                </>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/community")} 
                  className="h-12 px-8"
                >
                  Browse Gallery
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Institution Logos */}
        <section className="py-12 border-y border-border/50">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Trusted by researchers at
            </p>
          </div>
          <InstitutionCarousel />
        </section>

        {/* Product Showcase */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto">
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                <CarouselItem>
                  <div className="rounded-xl overflow-hidden border border-border shadow-xl">
                    <img src={carousel1} alt="BioSketch Interface" className="w-full h-auto" />
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="rounded-xl overflow-hidden border border-border shadow-xl">
                    <img src={carousel2} alt="BioSketch Features" className="w-full h-auto" />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="-left-4 md:-left-12" />
              <CarouselNext className="-right-4 md:-right-12" />
            </Carousel>
          </div>
        </section>

        {/* Demo Video */}
        <section className="py-20 bg-muted/30 -mx-4 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <p className="text-sm font-medium text-primary uppercase tracking-widest">Quick Demo</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                See BioSketch in Action
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Watch how easy it is to create professional figures in minutes
              </p>
            </div>
            <div className="rounded-xl overflow-hidden border border-border shadow-xl">
              <video
                src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/public/blog-media/biosketch%20video.mp4"
                className="w-full h-auto"
                autoPlay
                muted
                loop
                playsInline
                aria-label="BioSketch Canvas Demo"
              />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <p className="text-sm font-medium text-primary uppercase tracking-widest">Features</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Professional-Grade Tools
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Everything you need to create publication-ready scientific figures
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="group border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Community Section */}
        {user ? (
          <section className="py-20 bg-muted/30 -mx-4 px-4">
            <div className="max-w-6xl mx-auto">
              <CommunityCarousel />
            </div>
          </section>
        ) : (
          <section className="py-20">
            <Card className="max-w-3xl mx-auto border-0 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="text-center py-16 px-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-bold text-foreground">Join the Community</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Explore thousands of scientific illustrations created by researchers worldwide.
                  </p>
                </div>
                <Button size="lg" onClick={() => navigate("/auth")} className="mt-4">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Blog Section */}
        {user ? (
          <section className="py-20">
            <div className="max-w-6xl mx-auto">
              <BlogPostsCarousel />
            </div>
          </section>
        ) : (
          <section className="py-20 bg-muted/30 -mx-4 px-4">
            <Card className="max-w-3xl mx-auto border-0 bg-card">
              <CardContent className="text-center py-16 px-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-bold text-foreground">Learn & Grow</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Access tutorials, tips, and best practices for scientific illustration.
                  </p>
                </div>
                <Button size="lg" variant="outline" onClick={() => navigate("/blog")}>
                  Browse Articles
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Final CTA */}
        {!user && (
          <section className="py-24 text-center">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  Start Creating Today
                </h2>
                <p className="text-lg text-muted-foreground">
                  Join thousands of researchers using BioSketch for their scientific illustrations
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="h-14 px-10 text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Palette className="h-5 w-5 mr-2" />
                Create Free Account
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </section>
        )}
      </div>

      <IconSubmissionDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog} categories={categories} />
      <ProjectPreviewModal project={selectedProject} isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} />
      {signupData && <SignupToast count={signupData.count} topCountries={signupData.topCountries} totalWithLocation={signupData.totalWithLocation} />}
    </div>
  );
};

export default Index;