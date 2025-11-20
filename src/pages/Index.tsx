import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Share2, MessageCircleHeart, Upload, Hand } from "lucide-react";
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
  const {
    user,
    isAdmin
  } = useAuth();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [categories, setCategories] = useState<{
    id: string;
    name: string;
  }[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const {
    data: signupData
  } = useRecentSignups();
  useEffect(() => {
    supabase.from('icon_categories').select('id, name').order('name').then(({
      data
    }) => setCategories(data || []));
  }, []);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [getWebApplicationSchema(), getOrganizationSchema()]
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>
      
      <SEOHead title="BioSketch - Free Scientific Illustration Tool for Researchers" description="Create stunning scientific illustrations with BioSketch - a free drag-and-drop tool for scientists and researchers. Build publication-ready figures with our extensive biomedical icon library." canonical="https://biosketch.art/" keywords="scientific illustration, biomedical graphics, research illustration software, free science graphics, publication figures, scientific diagrams, biology illustration, medical graphics creator" structuredData={structuredData} />

      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="max-w-6xl mx-auto space-y-20">
          
          {/* Hero Section */}
          <div className="space-y-10 text-center animate-fade-in">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-card border border-border shadow-sm">
              <Microscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Trusted by Researchers Worldwide</span>
            </div>
            
            {/* Logo and Branding */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-5 flex-wrap">
                <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
                  <img src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0" alt="BioSketch Logo" className="h-14 w-14 md:h-16 md:w-16 object-contain" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
                  BioSketch
                </h1>
              </div>
              
              <div className="max-w-4xl mx-auto space-y-5">
                <h2 className="text-xl md:text-3xl font-semibold leading-tight text-foreground">
                  Professional Scientific Illustration Software
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Design publication-quality figures for research papers, presentations, and grants. Trusted by scientists at leading institutions worldwide.
                </p>
              </div>
            </div>

            {/* Welcome Message for Logged-in Users */}
            {user && <div className="flex items-center justify-center gap-3 animate-fade-in">
                <Hand className="h-7 w-7 text-primary" />
                <p className="text-xl font-semibold">
                  Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}!
                </p>
              </div>}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 justify-center items-center pt-2">
              <Button size="lg" onClick={() => navigate(user ? "/projects" : "/auth")} className="min-w-[180px] h-11 text-base font-medium">
                <Palette className="h-4 w-4 mr-2" />
                {user ? 'Start Creating' : 'Start Free'}
              </Button>
              
              {user && <>
                  <Button size="lg" variant="outline" onClick={() => navigate("/projects")} className="min-w-[180px] h-11 text-base font-medium">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    My Projects
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/community")} className="min-w-[180px] h-11 text-base font-medium">
                    <Users className="h-4 w-4 mr-2" />
                    Community
                  </Button>
                </>}
            </div>
          </div>

          {/* Institution Logos */}
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Trusted by Researchers at Leading Institutions
            </p>
            <InstitutionCarousel />
          </div>

          {/* Showcase Carousel */}
          <div className="animate-fade-in [animation-delay:200ms]">
            <div className="max-w-5xl mx-auto">
              <Carousel opts={{
              loop: true
            }}>
                <CarouselContent>
                  <CarouselItem>
                    <div className="rounded-2xl overflow-hidden border-2 shadow-xl hover:shadow-2xl transition-shadow">
                      <img src={carousel1} alt="BioSketch Interface Showcase" className="w-full h-auto" />
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="rounded-2xl overflow-hidden border-2 shadow-xl hover:shadow-2xl transition-shadow">
                      <img src={carousel2} alt="BioSketch Features Showcase" className="w-full h-auto" />
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="-left-6 md:-left-12 shadow-lg" />
                <CarouselNext className="-right-6 md:-right-12 shadow-lg" />
              </Carousel>
            </div>
          </div>

          {/* Demo Video Section */}
          <div className="space-y-8 animate-fade-in [animation-delay:300ms]">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-semibold">
                See BioSketch in Action
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Watch how easy it is to create professional scientific illustrations
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="rounded-2xl overflow-hidden border-2 shadow-2xl bg-card">
                <video src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/public/blog-media/biosketch%20video.mp4" className="w-full h-auto" autoPlay muted loop playsInline aria-label="BioSketch Canvas Demo Video" />
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-semibold">
                Professional-Grade Features
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Comprehensive toolset for creating publication-ready scientific figures
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-5">
              <div className="group p-6 rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-md bg-card">
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Intuitive Canvas Editor</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drag-and-drop interface optimized for scientific workflows. Create complex diagrams efficiently.
                </p>
              </div>

              <div className="group p-6 rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-md bg-card">
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Microscope className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">6,000+ Scientific Icons</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Comprehensive biomedical icon library covering molecular biology, medicine, and laboratory equipment.
                </p>
              </div>

              <div className="group p-6 rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-md bg-card">
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Publication-Quality Export</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  High-resolution PNG, JPG, and vector SVG formats suitable for journals and presentations.
                </p>
              </div>

              <div className="group p-6 rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-md bg-card">
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Collaboration & Sharing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Share figures with colleagues and explore community-created scientific illustrations.
                </p>
              </div>

              <div className="group p-6 rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-md bg-card">
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI-Assisted Generation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Generate custom scientific figures and icons using AI to accelerate your research workflow.
                </p>
              </div>

              <div className="group p-6 rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-md bg-card">
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <MessageCircleHeart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Free for Researchers</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No subscription required. Built by scientists to support the global research community.
                </p>
              </div>
            </div>
          </div>

          {/* Community Carousel */}
          <div className="space-y-8 animate-fade-in [animation-delay:400ms]">
            <div className="text-center space-y-3">
              
              
            </div>
            <CommunityCarousel />
          </div>

          {/* Blog Posts */}
          <div className="space-y-8 animate-fade-in [animation-delay:500ms]">
            
            <BlogPostsCarousel />
          </div>

          {/* Final CTA */}
          {!user && <div className="text-center py-16 space-y-5 animate-fade-in">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-semibold">
                  Start Creating Today
                </h2>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                  Join researchers worldwide who trust BioSketch for their scientific illustrations
                </p>
              </div>
              <Button size="lg" onClick={() => navigate("/auth")} className="min-w-[200px] h-12 text-base font-medium">
                <Palette className="h-4 w-4 mr-2" />
                Create Free Account
              </Button>
            </div>}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Microscope className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">BioSketch</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional scientific illustration software for researchers worldwide.
              </p>
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
                  <button onClick={() => navigate("/projects")} className="text-muted-foreground hover:text-primary transition-colors">
                    My Projects
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/community")} className="text-muted-foreground hover:text-primary transition-colors">
                    Community Gallery
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/blog")} className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Resources</h3>
              <ul className="space-y-2 text-sm">
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
                <li>
                  <button onClick={() => navigate("/contact")} className="text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => navigate("/terms")} className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/terms")} className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} BioSketch. All rights reserved.</p>
              <p>Built by scientists, for scientists.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Signup Toast */}
      {signupData?.count && signupData.count > 0 && <SignupToast count={signupData.count} topCountries={signupData.topCountries} totalWithLocation={signupData.totalWithLocation} />}

      {/* Dialogs */}
      {showSubmitDialog && <IconSubmissionDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog} categories={categories} />}

      {showPreviewModal && selectedProject && <ProjectPreviewModal project={selectedProject} isOpen={showPreviewModal} onClose={() => {
      setShowPreviewModal(false);
      setSelectedProject(null);
    }} />}
    </div>;
};
export default Index;