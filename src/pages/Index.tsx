import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Share2, MessageCircleHeart, Hand } from "lucide-react";
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

  return (
    <div className="min-h-screen notebook-page relative overflow-hidden">
      {/* Subtle paper aging effect in corners */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-[hsl(var(--pencil-gray)_/_0.03)] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[hsl(var(--pencil-gray)_/_0.02)] to-transparent pointer-events-none" />

      <SEOHead
        title="BioSketch - Free Scientific Illustration Tool for Researchers"
        description="Create stunning scientific illustrations with BioSketch - a free drag-and-drop tool for scientists and researchers. Build publication-ready figures with our extensive biomedical icon library."
        canonical="https://biosketch.art/"
        keywords="scientific illustration, biomedical graphics, research illustration software, free science graphics, publication figures, scientific diagrams, biology illustration, medical graphics creator"
        structuredData={structuredData}
      />

      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="max-w-6xl mx-auto space-y-20">
          {/* Hero Section - Notebook Style */}
          <div className="space-y-10 text-center animate-fade-in">
            {/* Top Badge - Stamped Style */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-card border-2 border-[hsl(var(--pencil-gray))] shadow-sm rotate-[-0.5deg]">
              <Microscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Trusted by Researchers Worldwide</span>
            </div>

            {/* Logo and Branding */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-5 flex-wrap">
                <div className="p-5 rounded-md bg-card border-2 border-[hsl(var(--pencil-gray))] shadow-sm rotate-[1deg]">
                  <img
                    src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                    alt="BioSketch Logo"
                    className="h-14 w-14 md:h-16 md:w-16 object-contain"
                  />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-source-serif text-foreground">
                  BioSketch
                </h1>
              </div>

              <div className="max-w-4xl mx-auto space-y-5">
                <h2 className="text-xl md:text-3xl font-semibold leading-tight font-source-serif text-foreground">
                  Professional Scientific Illustration Software
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-inter">
                  Design publication-quality figures for research papers, presentations, and grants.{" "}
                  <span className="highlighter-bg inline-block px-1">Trusted by scientists</span> at leading institutions worldwide.
                </p>
              </div>
            </div>

            {/* Welcome Message for Logged-in Users */}
            {user && (
              <div className="flex items-center justify-center gap-3 animate-fade-in">
                <Hand className="h-7 w-7 text-primary" />
                <p className="text-xl font-semibold handwritten text-2xl">
                  Welcome back, {user.user_metadata?.full_name?.split(" ")[0] || "there"}!
                </p>
              </div>
            )}

            {/* CTA Buttons - Sticky Note Style */}
            <div className="flex flex-wrap gap-3 justify-center items-center pt-2">
              <Button size="lg" variant="sticky" onClick={() => navigate(user ? "/projects" : "/auth")} className="min-w-[180px] h-12 text-lg">
                <Palette className="h-5 w-5 mr-2" />
                {user ? "Start Creating" : "Start Free"}
              </Button>

              {user && (
                <>
                  <Button size="lg" variant="pencil" onClick={() => navigate("/projects")} className="min-w-[180px] h-12 text-base">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    My Projects
                  </Button>
                  <Button size="lg" variant="pencil" onClick={() => navigate("/community")} className="min-w-[180px] h-12 text-base">
                    <Users className="h-4 w-4 mr-2" />
                    Community
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Institution Logos - Stamped Approval Style */}
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider handwritten text-lg">
              ~ Approved by researchers at ~
            </p>
            <InstitutionCarousel />
          </div>

          {/* Showcase Carousel - Polaroid Style */}
          <div className="animate-fade-in [animation-delay:200ms]">
            <div className="max-w-5xl mx-auto">
              <Carousel opts={{ loop: true }}>
                <CarouselContent>
                  <CarouselItem>
                    <div className="p-4 bg-white border-2 border-[hsl(var(--pencil-gray))] shadow-lg hover:shadow-xl transition-shadow rotate-[-1deg] hover:rotate-0">
                      <img src={carousel1} alt="BioSketch Interface Showcase" className="w-full h-auto" />
                      <p className="text-center mt-3 handwritten text-lg text-muted-foreground">Canvas workspace in action</p>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-4 bg-white border-2 border-[hsl(var(--pencil-gray))] shadow-lg hover:shadow-xl transition-shadow rotate-[1deg] hover:rotate-0">
                      <img src={carousel2} alt="BioSketch Features Showcase" className="w-full h-auto" />
                      <p className="text-center mt-3 handwritten text-lg text-muted-foreground">Full feature showcase</p>
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="-left-6 md:-left-12 shadow-lg" />
                <CarouselNext className="-right-6 md:-right-12 shadow-lg" />
              </Carousel>
            </div>
          </div>

          {/* Demo Video Section - Polaroid Taped Style */}
          <div className="space-y-8 animate-fade-in [animation-delay:300ms]">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-semibold font-source-serif">See BioSketch in Action</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto handwritten text-lg">
                Watch how easy it is to create professional figures →
              </p>
            </div>
            <div className="max-w-4xl mx-auto relative">
              {/* Tape decoration */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-32 h-12 bg-[hsl(var(--highlighter-yellow)_/_0.5)] border border-[hsl(var(--highlighter-yellow))] rotate-[-2deg] z-10" />
              <div className="p-4 bg-white border-2 border-[hsl(var(--pencil-gray))] shadow-2xl rotate-[0.5deg]">
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

          {/* Feature Cards - Torn Notebook Pages */}
          <div className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-semibold font-source-serif">
                <span className="highlighter-bg">Professional-Grade Features</span>
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">Comprehensive toolset for creating publication-ready scientific figures</p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: Zap, title: "Intuitive Canvas Editor", desc: "Drag-and-drop interface optimized for scientific workflows. Create complex diagrams efficiently." },
                { icon: Microscope, title: "6,000+ Scientific Icons", desc: "Comprehensive biomedical icon library covering molecular biology, medicine, and laboratory equipment." },
                { icon: Shield, title: "Publication-Quality Export", desc: "High-resolution PNG, JPG, and vector SVG formats suitable for journals and presentations." },
                { icon: Share2, title: "Collaboration & Sharing", desc: "Share figures with colleagues and explore community-created scientific illustrations." },
                { icon: Sparkles, title: "AI-Assisted Generation", desc: "Generate custom scientific figures and icons using AI to accelerate your research workflow." },
                { icon: MessageCircleHeart, title: "Free for Researchers", desc: "No subscription required. Built by scientists to support the global research community." },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-sm border-2 border-[hsl(var(--pencil-gray))] bg-card paper-shadow hover:scale-[1.02] transition-all"
                  style={{ transform: `rotate(${(index % 2 === 0 ? -0.5 : 0.5)}deg)` }}
                >
                  <div className="w-12 h-12 rounded-md bg-primary/5 flex items-center justify-center mb-4 border border-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 ink-text font-source-serif">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Community Carousel - Pinned Notes Style */}
          {user ? (
            <div className="space-y-8 animate-fade-in [animation-delay:400ms]">
              <CommunityCarousel />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in [animation-delay:400ms]">
              <div className="text-center space-y-4 p-12 rounded-md border-2 border-dashed border-primary bg-card paper-shadow">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold font-source-serif">Discover Community Creations</h3>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Explore thousands of scientific illustrations created by researchers worldwide. Get inspired and learn from the community.
                  </p>
                </div>
                <Button size="lg" variant="sticky" onClick={() => navigate("/auth")} className="mt-4 text-lg">
                  <Palette className="h-5 w-5 mr-2" />
                  Sign Up to Explore
                </Button>
              </div>
            </div>
          )}

          {/* Blog Posts */}
          {user ? (
            <div className="space-y-8 animate-fade-in [animation-delay:500ms]">
              <BlogPostsCarousel />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in [animation-delay:500ms]">
              <div className="text-center space-y-4 p-12 rounded-md border-2 border-dashed border-primary bg-card paper-shadow">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold font-source-serif">Learn from Expert Articles</h3>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Access tutorials, tips, and scientific illustration best practices. Stay updated with the latest features and techniques.
                  </p>
                </div>
                <Button size="lg" variant="sticky" onClick={() => navigate("/auth")} className="mt-4 text-lg">
                  <Palette className="h-5 w-5 mr-2" />
                  Sign Up to Learn
                </Button>
              </div>
            </div>
          )}

          {/* Final CTA - Sticky Note */}
          {!user && (
            <div className="text-center py-16 space-y-5 animate-fade-in">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-semibold handwritten text-4xl">Start Creating Today</h2>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                  Join researchers worldwide who trust BioSketch for their scientific illustrations
                </p>
              </div>
              <Button size="lg" variant="sticky" onClick={() => navigate("/auth")} className="min-w-[200px] h-14 text-xl">
                <Palette className="h-5 w-5 mr-2" />
                Create Free Account
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Clean Notebook Style */}
      <footer className="border-t-2 border-[hsl(var(--pencil-gray))] bg-card/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Microscope className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold font-source-serif">BioSketch</span>
              </div>
              <p className="text-sm text-muted-foreground">Professional scientific illustration software for researchers worldwide.</p>
            </div>

            {/* Product Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => navigate("/canvas")} className="text-muted-foreground hover:text-primary transition-colors">
                    Canvas Editor
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/community")} className="text-muted-foreground hover:text-primary transition-colors">
                    Community
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/projects")} className="text-muted-foreground hover:text-primary transition-colors">
                    My Projects
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => navigate("/blog")} className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/testimonials")} className="text-muted-foreground hover:text-primary transition-colors">
                    Testimonials
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/release-notes")} className="text-muted-foreground hover:text-primary transition-colors">
                    Release Notes
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => navigate("/contact")} className="text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/terms")} className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
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
