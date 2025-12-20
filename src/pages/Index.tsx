import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Share2, MessageCircleHeart, ArrowRight } from "lucide-react";
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
    { icon: Zap, title: "Intuitive Canvas Editor", desc: "Drag-and-drop interface optimized for scientific workflows. Create complex diagrams efficiently." },
    { icon: Microscope, title: "6,000+ Scientific Icons", desc: "Comprehensive biomedical icon library covering molecular biology, medicine, and laboratory equipment." },
    { icon: Shield, title: "Publication-Quality Export", desc: "High-resolution PNG, JPG, and vector SVG formats suitable for journals and presentations." },
    { icon: Share2, title: "Collaboration & Sharing", desc: "Share figures with colleagues and explore community-created scientific illustrations." },
    { icon: Sparkles, title: "AI-Assisted Generation", desc: "Generate custom scientific figures and icons using AI to accelerate your research workflow." },
    { icon: MessageCircleHeart, title: "Free for Researchers", desc: "No subscription required. Built by scientists to support the global research community." },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MaintenanceBanner />
      
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <SEOHead
        title="BioSketch - Free Scientific Illustration Tool for Researchers"
        description="Create stunning scientific illustrations with BioSketch - a free drag-and-drop tool for scientists and researchers. Build publication-ready figures with our extensive biomedical icon library."
        canonical="https://biosketch.art/"
        keywords="scientific illustration, biomedical graphics, research illustration software, free science graphics, publication figures, scientific diagrams, biology illustration, medical graphics creator"
        structuredData={structuredData}
      />

      <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-24">
          {/* Hero Section */}
          <div className="space-y-10 text-center animate-fade-in">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
              <Microscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Trusted by Researchers Worldwide</span>
            </div>

            {/* Logo and Branding */}
            <div className="space-y-8">
              <div className="flex items-center justify-center gap-5 flex-wrap">
                <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-lg">
                  <img
                    src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                    alt="BioSketch Logo"
                    className="h-14 w-14 md:h-16 md:w-16 object-contain"
                  />
                </div>
                <h1 className="text-5xl md:text-7xl font-serif font-semibold tracking-tight text-foreground">
                  BioSketch
                </h1>
              </div>

              <div className="max-w-4xl mx-auto space-y-5">
                <h2 className="text-xl md:text-3xl font-serif font-medium leading-tight text-foreground">
                  Professional Scientific Illustration Software
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Design publication-quality figures for research papers, presentations, and grants.
                  Trusted by scientists at leading institutions worldwide.
                </p>
              </div>
            </div>

            {/* Welcome Message for Logged-in Users */}
            {user && (
              <div className="flex items-center justify-center gap-3 animate-fade-in">
                <p className="text-xl font-serif text-foreground">
                  Welcome back, <span className="font-semibold text-primary">{user.user_metadata?.full_name?.split(" ")[0] || "there"}</span>
                </p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate(user ? "/projects" : "/auth")} 
                className="min-w-[180px] h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Palette className="h-5 w-5 mr-2" />
                {user ? "Start Creating" : "Start Free"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {user && (
                <>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/projects")} 
                    className="min-w-[160px] h-12 text-base"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    My Projects
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/community")} 
                    className="min-w-[160px] h-12 text-base"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Community
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Institution Logos */}
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1 max-w-[100px] bg-border/50" />
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Trusted by researchers at
              </p>
              <div className="h-px flex-1 max-w-[100px] bg-border/50" />
            </div>
            <InstitutionCarousel />
          </div>

          {/* Showcase Carousel */}
          <div className="animate-fade-in [animation-delay:200ms]">
            <div className="max-w-5xl mx-auto">
              <Carousel opts={{ loop: true }}>
                <CarouselContent>
                  <CarouselItem>
                    <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
                      <img src={carousel1} alt="BioSketch Interface Showcase" className="w-full h-auto" />
                      <div className="p-4 bg-muted/30 border-t border-border/30">
                        <p className="text-center text-sm text-muted-foreground">Canvas workspace in action</p>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
                      <img src={carousel2} alt="BioSketch Features Showcase" className="w-full h-auto" />
                      <div className="p-4 bg-muted/30 border-t border-border/30">
                        <p className="text-center text-sm text-muted-foreground">Full feature showcase</p>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="-left-6 md:-left-12 shadow-lg border-border/50" />
                <CarouselNext className="-right-6 md:-right-12 shadow-lg border-border/50" />
              </Carousel>
            </div>
          </div>

          {/* Demo Video Section */}
          <div className="space-y-8 animate-fade-in [animation-delay:300ms]">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Quick Demo
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">See BioSketch in Action</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Watch how easy it is to create professional figures
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <video
                  src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/public/blog-media/biosketch%20video.mp4"
                  className="w-full h-auto"
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label="BioSketch Canvas Demo Video"
                />
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="space-y-10">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Features
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
                Professional-Grade Features
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Comprehensive toolset for creating publication-ready scientific figures
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="group bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-serif font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Community Carousel */}
          {user ? (
            <div className="space-y-8 animate-fade-in [animation-delay:400ms]">
              <CommunityCarousel />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in [animation-delay:400ms]">
              <Card className="border border-border/50 bg-card/50">
                <CardContent className="text-center p-12 space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-semibold text-foreground">Discover Community Creations</h3>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      Explore thousands of scientific illustrations created by researchers worldwide. Get inspired and learn from the community.
                    </p>
                  </div>
                  <Button size="lg" onClick={() => navigate("/auth")} className="mt-4">
                    <Palette className="h-5 w-5 mr-2" />
                    Sign Up to Explore
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Blog Posts */}
          {user ? (
            <div className="space-y-8 animate-fade-in [animation-delay:500ms]">
              <BlogPostsCarousel />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in [animation-delay:500ms]">
              <Card className="border border-border/50 bg-card/50">
                <CardContent className="text-center p-12 space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-semibold text-foreground">Learn from Expert Articles</h3>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      Access tutorials, tips, and scientific illustration best practices. Stay updated with the latest features and techniques.
                    </p>
                  </div>
                  <Button size="lg" onClick={() => navigate("/auth")} className="mt-4">
                    <Palette className="h-5 w-5 mr-2" />
                    Sign Up to Learn
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Final CTA */}
          {!user && (
            <div className="text-center py-16 space-y-6 animate-fade-in">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Start Creating Today</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Join researchers worldwide who trust BioSketch for their scientific illustrations
                </p>
              </div>
              <Button size="lg" onClick={() => navigate("/auth")} className="min-w-[220px] h-14 text-lg shadow-lg hover:shadow-xl transition-all">
                <Palette className="h-5 w-5 mr-2" />
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Microscope className="h-6 w-6 text-primary" />
                <span className="text-lg font-serif font-semibold text-foreground">BioSketch</span>
              </div>
              <p className="text-sm text-muted-foreground">Professional scientific illustration software for researchers worldwide.</p>
            </div>

            {/* Product Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/canvas" className="text-muted-foreground hover:text-primary transition-colors">
                    Canvas Editor
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="text-muted-foreground hover:text-primary transition-colors">
                    Community
                  </Link>
                </li>
                <li>
                  <Link to="/projects" className="text-muted-foreground hover:text-primary transition-colors">
                    My Projects
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/testimonials" className="text-muted-foreground hover:text-primary transition-colors">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link to="/release-notes" className="text-muted-foreground hover:text-primary transition-colors">
                    Release Notes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} BioSketch. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <IconSubmissionDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog} categories={categories} />
      <ProjectPreviewModal project={selectedProject} isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} />
      {signupData && <SignupToast count={signupData.count} topCountries={signupData.topCountries} totalWithLocation={signupData.totalWithLocation} />}
    </div>
  );
};

export default Index;