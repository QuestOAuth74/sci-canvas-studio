import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Share2, MessageCircleHeart, Upload, Beaker, FlaskConical, Dna, TestTube, Pill, Syringe, Brain, Heart, Atom, Hand } from "lucide-react";
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
import { CommunityCarousel } from "@/components/community/CommunityCarousel";

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
              <span className="font-medium">Free for Scientists 🔬</span>
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

            {/* Welcome Message */}
            {user && (
              <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
                <Hand className="h-8 w-8 text-primary animate-wave" />
                <h2 className="text-2xl md:text-3xl font-bold">
                  Hello {user.user_metadata?.full_name?.split(' ')[0] || 'there'}!
                </h2>
              </div>
            )}

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

        {/* AI Icon Generator Announcement - Only for authenticated users */}
        {user && (
          <div className="relative animate-fade-in [animation-delay:200ms]">
            <style>{`
              @keyframes gradient-shift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
              }
              .animate-gradient-shift {
                background-size: 200% 200%;
                animation: gradient-shift 5s ease infinite;
              }
              @keyframes wave {
                0%, 100% { transform: rotate(0deg); }
                10%, 30% { transform: rotate(14deg); }
                20% { transform: rotate(-8deg); }
                40% { transform: rotate(-4deg); }
                50% { transform: rotate(10deg); }
              }
              .animate-wave {
                animation: wave 2s ease-in-out infinite;
                transform-origin: 70% 70%;
              }
            `}</style>
            
            <div className="glass-card p-8 md:p-10 border-2 border-primary/50 relative overflow-hidden group hover:border-primary/80 transition-all">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 animate-gradient-shift" />
              
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
              
              <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Icon section */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="p-5 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-xl">
                      <Sparkles className="h-12 w-12 md:h-16 md:w-16 text-white animate-pulse" />
                    </div>
                    {/* NEW badge */}
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-accent to-secondary text-white text-xs font-black px-3 py-1 rounded-full shadow-lg animate-bounce">
                      NEW ✨
                    </div>
                  </div>
                </div>
                
                {/* Content section */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                    🎨 AI Icon Generator Now Available! 🚀
                  </h3>
                  <p className="text-base md:text-lg font-medium text-foreground/80 leading-relaxed">
                    Transform your ideas into professional scientific icons using AI. Upload a reference image or describe what you need, and watch the magic happen! ✨
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start text-sm font-semibold">
                    <span className="px-3 py-1 bg-primary/20 rounded-full">🧬 Medical</span>
                    <span className="px-3 py-1 bg-accent/20 rounded-full">🔬 Biochemical</span>
                    <span className="px-3 py-1 bg-secondary/20 rounded-full">🦠 Cellular</span>
                    <span className="px-3 py-1 bg-primary/20 rounded-full">💡 & More!</span>
                  </div>
                </div>
                
                {/* CTA section */}
                <div className="flex-shrink-0">
                  <Button 
                    size="lg"
                    onClick={() => navigate("/projects")}
                    className="min-w-[200px] h-12 text-base font-bold shadow-xl hover:shadow-2xl transition-all group/btn"
                  >
                    <Sparkles className="h-5 w-5 mr-2 group-hover/btn:rotate-180 transition-transform duration-500" />
                    Try AI Generator
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Drag & Drop ✨</h3>
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
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Organized Library 📚</h3>
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
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Export Ready 🚀</h3>
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
                  <h3 className="text-2xl font-bold">Open Source & Free 💚</h3>
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
                  <h3 className="text-2xl font-bold">Professional Quality ⭐</h3>
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

        {/* Video Section */}
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-4 md:p-6 overflow-hidden">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <video 
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                >
                  <source 
                    src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/public/blog-media/biosketch%20video.mp4" 
                    type="video/mp4" 
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>

      {/* Footer Section */}
      <footer className="relative z-10 mt-20">
        <div className="container mx-auto px-4 py-12">
          {/* Made with Love Banner */}
          <div className="relative mb-12 animate-fade-in">
            <div className="glass-card p-6 md:p-8 border-2 border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10" />
              <div className="relative text-center">
                <p className="text-2xl md:text-3xl font-bold tracking-tight">
                  Made with <Heart className="inline h-7 w-7 text-red-500 animate-pulse mx-1" fill="currentColor" /> by the Scientific Community
                </p>
                <p className="text-sm md:text-base font-medium text-muted-foreground mt-2">
                  Empowering researchers worldwide to create beautiful scientific illustrations
                </p>
              </div>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="glass-card p-10 md:p-12 border-t-2 border-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-10">
              
              {/* About Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Microscope className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-bold tracking-tight">BioSketch</h3>
                </div>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                  A free, open-source scientific illustration tool designed by scientists, for scientists.
                </p>
              </div>

              {/* Resources Column */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Resources
                </h4>
                <div className="space-y-2">
                  <button onClick={() => navigate("/community")} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Community Gallery
                  </button>
                  <button onClick={() => navigate("/blog")} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Blog & Tutorials
                  </button>
                  <button onClick={() => navigate("/release-notes")} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Release Notes
                  </button>
                  <button onClick={() => navigate("/testimonials")} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Testimonials
                  </button>
                  <button onClick={() => navigate("/share")} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Share BioSketch
                  </button>
                </div>
              </div>

              {/* Legal Column */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Legal
                </h4>
                <div className="space-y-2">
                  <button onClick={() => navigate("/terms")} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Terms & Conditions
                  </button>
                  <button onClick={() => navigate("/contact")} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </button>
                  <p className="text-xs font-medium text-muted-foreground/80 pt-2">
                    CC-BY License
                  </p>
                </div>
              </div>

              {/* Community Column */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Community
                </h4>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-4">
                  Join researchers from leading institutions worldwide creating better science communication.
                </p>
                <img 
                  src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                  alt="BioSketch Art"
                  width="120"
                  height="120"
                  className="border-2 border-border/60 rounded-xl shadow-md"
                />
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm font-medium text-muted-foreground">
                © {new Date().getFullYear()} BioSketch. All rights reserved.
              </p>
              <button
                onClick={() => navigate("/release-notes")}
                className="px-3 py-1.5 glass-effect text-primary border border-primary/20 rounded-lg text-xs font-semibold hover:bg-primary/10 transition-all"
              >
                v1.1.0
              </button>
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
