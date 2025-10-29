import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Share2, MessageCircleHeart, Upload, Beaker, FlaskConical, Dna, TestTube, Pill, Syringe, Brain, Heart, Atom } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
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

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { data: signupData } = useRecentSignups();

  useEffect(() => {
    supabase
      .from('icon_categories')
      .select('id, name')
      .order('name')
      .then(({ data }) => setCategories(data || []));
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      getWebApplicationSchema(),
      getOrganizationSchema()
    ]
  };

  // Floating lab icons configuration
  const floatingIcons = [
    { Icon: Microscope, top: '10%', left: '5%', size: 48, speed: 'slow', delay: '0s' },
    { Icon: Beaker, top: '15%', right: '8%', size: 56, speed: 'medium', delay: '2s' },
    { Icon: FlaskConical, top: '45%', left: '3%', size: 44, speed: 'fast', delay: '1s' },
    { Icon: Dna, top: '65%', right: '5%', size: 52, speed: 'slow', delay: '3s' },
    { Icon: TestTube, top: '30%', right: '15%', size: 40, speed: 'medium', delay: '1.5s' },
    { Icon: Pill, top: '75%', left: '10%', size: 36, speed: 'fast', delay: '2.5s' },
    { Icon: Syringe, top: '20%', left: '20%', size: 42, speed: 'slow', delay: '4s' },
    { Icon: Brain, top: '55%', right: '20%', size: 50, speed: 'medium', delay: '0.5s' },
    { Icon: Heart, top: '85%', right: '12%', size: 46, speed: 'fast', delay: '3.5s' },
    { Icon: Atom, top: '40%', left: '15%', size: 38, speed: 'slow', delay: '1s' },
    { Icon: Microscope, top: '70%', left: '25%', size: 44, speed: 'medium', delay: '2s' },
    { Icon: Beaker, top: '25%', right: '25%', size: 40, speed: 'fast', delay: '0s' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden grid-background">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl float-animation" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl float-animation [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-accent/10 rounded-full blur-3xl float-animation [animation-delay:4s]" />
        
        {/* Floating Lab Icons */}
        {floatingIcons.map((config, index) => {
          const IconComponent = config.Icon;
          const style: React.CSSProperties = {
            top: config.top,
            left: config.left,
            right: config.right,
            animationDelay: config.delay,
          };
          
          return (
            <IconComponent
              key={index}
              size={config.size}
              className={`floating-icon ${config.speed}`}
              style={style}
              aria-hidden="true"
            />
          );
        })}
      </div>
      
      <SEOHead
        title="BioSketch - Free Scientific Illustration Tool for Researchers"
        description="Create stunning scientific illustrations with BioSketch - a free drag-and-drop tool for scientists and researchers. Build publication-ready figures with our extensive biomedical icon library."
        canonical="https://biosketch.art/"
        keywords="scientific illustration, biomedical graphics, research illustration software, free science graphics, publication figures, scientific diagrams, biology illustration, medical graphics creator"
        structuredData={structuredData}
      />
      {/* Header with User Menu */}
      <header className="absolute top-0 right-0 p-4 z-20">
        <UserMenu />
      </header>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section */}
          <div className="space-y-8 text-center animate-fade-in">
            {/* Badge */}
            <div className="frosted-glass inline-flex items-center gap-2 px-4 py-2 rounded-full animate-scale-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Free for Scientists</span>
            </div>
            
            {/* Logo and Title */}
            <div className="space-y-8">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="glass-shine p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 border border-white/20 shadow-lg">
                  <Microscope className="h-16 w-16 md:h-20 md:w-20 text-white" />
                </div>
                <div className="relative">
                  <h1 className="text-7xl md:text-9xl font-black tracking-tighter relative">
                    <span className="marker-highlight text-foreground">
                      BioSketch
                    </span>
                  </h1>
                  {/* Glassmorphic accent */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-3 bg-gradient-to-r from-primary/60 via-accent/60 to-primary/60 rounded-full backdrop-blur-sm border border-white/20 shadow-lg" />
                </div>
              </div>
              
              <div className="max-w-4xl mx-auto space-y-6">
                <p className="text-2xl md:text-3xl font-bold leading-tight text-foreground">
                  Create stunning scientific illustrations with an intuitive drag-and-drop interface
                </p>
                <div className="glass-card p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                  <p className="text-lg md:text-xl font-semibold text-foreground/90 relative">
                    Perfect for publications, presentations, and educational materials 🔬
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate(user ? "/projects" : "/auth")} 
                className="min-w-[240px] h-14 text-base font-semibold group"
              >
                <Palette className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Start Creating
              </Button>
              {user ? (
                <>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => navigate("/projects")}
                    className="min-w-[240px] h-14 text-base font-semibold group"
                  >
                    <FolderOpen className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    My Projects
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/community")}
                    className="min-w-[240px] h-14 text-base font-semibold group"
                  >
                    <Users className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Community Gallery
                  </Button>
                </>
              ) : null}
              {user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowSubmitDialog(true)}
                  className="min-w-[240px] h-14 text-base font-semibold group"
                >
                  <Upload className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Suggest an Icon
                </Button>
              )}
            </div>
          </div>

          {/* Institution Logos Carousel */}
          <InstitutionCarousel />

          {/* Carousel Section */}
          <div className="py-12 animate-fade-in [animation-delay:300ms]">
            <div className="max-w-5xl mx-auto">
              <Carousel className="relative" opts={{ loop: true }}>
                <CarouselContent>
                  <CarouselItem>
                    <div className="p-2">
                      <div className="bg-card border border-border/60 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
                        <img 
                          src={carousel1} 
                          alt="BioSketch Showcase 1" 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-2">
                      <div className="bg-card border border-border/60 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
                        <img 
                          src={carousel2} 
                          alt="BioSketch Showcase 2" 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="bg-primary/90 border border-primary/20 shadow-lg hover:shadow-xl hover:scale-105 transition-all -left-4 md:-left-16" />
                <CarouselNext className="bg-primary/90 border border-primary/20 shadow-lg hover:shadow-xl hover:scale-105 transition-all -right-4 md:-right-16" />
              </Carousel>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="glass-card p-8 animate-fade-in group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
              <div className="relative">
                <div className="inline-flex p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl border border-white/20 shadow-lg mb-6 group-hover:scale-110 transition-transform">
                  <Palette className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Drag & Drop</h3>
                <p className="text-base font-medium leading-relaxed text-foreground/70">
                  Intuitive interface lets you arrange vector icons effortlessly on your canvas
                </p>
              </div>
            </div>
            
            <div className="glass-card p-8 animate-fade-in [animation-delay:100ms] group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-3xl" />
              <div className="relative">
                <div className="inline-flex p-4 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl border border-white/20 shadow-lg mb-6 group-hover:scale-110 transition-transform">
                  <Microscope className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Organized Library</h3>
                <p className="text-base font-medium leading-relaxed text-foreground/70">
                  Scientific icons categorized for quick access and seamless workflow
                </p>
              </div>
            </div>
            
            <div className="glass-card p-8 animate-fade-in [animation-delay:200ms] group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/30 to-transparent rounded-full blur-3xl" />
              <div className="relative">
                <div className="inline-flex p-4 bg-gradient-to-br from-accent to-accent/80 rounded-2xl border border-white/20 shadow-lg mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Export Ready</h3>
                <p className="text-base font-medium leading-relaxed text-foreground/70">
                  High-quality exports optimized for publications and presentations
                </p>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-2 gap-6 animate-fade-in [animation-delay:300ms]">
            <div className="glass-card p-10 group overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-5">
                  <div className="inline-flex p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Open Source & Free</h3>
                </div>
                <p className="text-base font-medium leading-relaxed text-foreground/70">
                  Built for the scientific community. No paywalls, no subscriptions. 
                  Just powerful tools for creating beautiful illustrations.
                </p>
              </div>
            </div>

            <div className="glass-card p-10 group overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-5">
                  <div className="inline-flex p-3 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Professional Quality</h3>
                </div>
                <p className="text-base font-medium leading-relaxed text-foreground/70">
                  Export publication-ready graphics in multiple formats. 
                  Perfect for journals, posters, and presentations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Blog Posts Carousel - Only for authenticated users */}
        {user && (
          <div className="container mx-auto px-4 relative z-10">
            <BlogPostsCarousel />
          </div>
        )}

      {/* Footer Section */}
      <footer className="relative z-10 border-t border-border/60 bg-gradient-to-b from-muted/30 to-background mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Share Section */}
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl shadow-lg p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl shadow-md">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                Share BioSketch
              </h3>
              <p className="text-base md:text-lg font-medium leading-relaxed mb-6 text-foreground/70">
                The best way to support BioSketch is by sharing it with colleagues, students, 
                and others who might benefit from free scientific illustration tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/share')}
                  className="h-12 px-8 text-base font-semibold group"
                >
                  <Share2 className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Share BioSketch
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/testimonials")}
                  className="h-12 px-8 text-base font-semibold group"
                >
                  <MessageCircleHeart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Leave a Kind Word
                </Button>
              </div>
            </div>

            {/* Footer Image */}
            <div className="flex flex-col items-center py-8 gap-4">
              <img 
                src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                alt="BioSketch Art"
                width="150"
                height="150"
                className="border-2 border-border/60 rounded-2xl shadow-lg"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/release-notes")}
                  className="px-4 py-2 bg-accent/10 text-accent border border-accent/20 rounded-lg shadow-sm font-semibold text-sm hover:shadow-md hover:scale-105 transition-all hover:bg-accent/20"
                >
                  v1.1.0
                </button>
                <button
                  onClick={() => navigate("/contact")}
                  className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg shadow-sm font-semibold text-sm hover:shadow-md hover:scale-105 transition-all hover:bg-primary/20"
                >
                  Contact Us
                </button>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="text-center pt-8 border-t border-border/40 space-y-3">
              <p className="text-sm md:text-base font-medium text-foreground/70">
                All content on BioSketch.Art is shared under creative commons license (CC-BY) unless stated otherwise.{" "}
                <button
                  onClick={() => navigate("/terms")}
                  className="underline hover:text-primary transition-colors font-semibold"
                >
                  Terms and Conditions
                </button>
              </p>
              <p className="text-sm md:text-base font-semibold text-foreground/60">
                Made with <Share2 className="inline h-4 w-4 text-primary animate-pulse" /> by the Scientific Community
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Icon Submission Dialog */}
      <IconSubmissionDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        categories={categories}
      />

      {/* Project Preview Modal */}
      {selectedProject && (
        <ProjectPreviewModal
          project={selectedProject}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Recent Signups Toast */}
      {signupData && signupData.count > 0 && (
        <SignupToast 
          count={signupData.count} 
          topCountries={signupData.topCountries}
          totalWithLocation={signupData.totalWithLocation}
        />
      )}
    </div>
  );
};

export default Index;
