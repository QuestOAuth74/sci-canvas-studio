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
          <div className="space-y-12 text-center animate-fade-in">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Free for Scientists & Researchers</span>
            </div>
            
            {/* Logo and Branding */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl">
                  <img src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0" alt="BioSketch Logo" className="h-16 w-16 md:h-20 md:w-20 object-contain" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">
                  BioSketch
                </h1>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                  Create Stunning Scientific Illustrations
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  The intuitive drag-and-drop tool for researchers. Build publication-ready figures with our extensive biomedical icon library.
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
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <Button size="lg" onClick={() => navigate(user ? "/projects" : "/auth")} className="min-w-[200px] h-12 text-base font-semibold shadow-lg hover:shadow-xl">
                <Palette className="h-5 w-5 mr-2" />
                {user ? 'Start Creating' : 'Get Started Free'}
              </Button>
              
              {user && <>
                  <Button size="lg" variant="outline" onClick={() => navigate("/projects")} className="min-w-[200px] h-12 text-base font-semibold">
                    <FolderOpen className="h-5 w-5 mr-2" />
                    My Projects
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/community")} className="min-w-[200px] h-12 text-base font-semibold">
                    <Users className="h-5 w-5 mr-2" />
                    Community
                  </Button>
                </>}
            </div>
          </div>

          {/* Institution Logos */}
          <InstitutionCarousel />

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

          {/* Feature Cards */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Everything You Need
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Professional tools designed specifically for scientific illustration
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group p-8 rounded-2xl border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-card">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Intuitive Interface</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Drag-and-drop canvas editor designed for scientists. Create complex diagrams in minutes, not hours.
                </p>
              </div>

              <div className="group p-8 rounded-2xl border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-card">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Microscope className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">6,000+ Scientific Icons</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Extensive library of biomedical icons covering molecular biology, medicine, lab equipment, and more.
                </p>
              </div>

              <div className="group p-8 rounded-2xl border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-card">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Publication Ready</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Export high-resolution PNG, JPG, and SVG files perfect for journals, presentations, and posters.
                </p>
              </div>

              <div className="group p-8 rounded-2xl border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-card">
                <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Share2 className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Share & Collaborate</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Share your work with the community, get inspired by others, and collaborate with colleagues.
                </p>
              </div>

              <div className="group p-8 rounded-2xl border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-card">
                <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI-Powered Tools</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate custom scientific figures and icons using AI to speed up your illustration workflow.
                </p>
              </div>

              <div className="group p-8 rounded-2xl border-2 hover:border-primary/50 transition-all hover:shadow-xl bg-card">
                <div className="w-14 h-14 rounded-full bg-pink-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <MessageCircleHeart className="h-7 w-7 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Free Forever</h3>
                <p className="text-muted-foreground leading-relaxed">
                  No credit card required. Built by scientists, for scientists. Supporting the research community.
                </p>
              </div>
            </div>
          </div>

          {/* Community Carousel */}
          <div className="space-y-6">
            <div className="text-center">
              
              
            </div>
            <CommunityCarousel />
          </div>

          {/* Blog Posts */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Latest Updates
              </h2>
              <p className="text-lg text-muted-foreground">
                Tips, tutorials, and news from the BioSketch team
              </p>
            </div>
            <BlogPostsCarousel />
          </div>

          {/* Final CTA */}
          {!user && <div className="text-center py-12 space-y-6 animate-fade-in">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Ready to Create?
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Join thousands of researchers using BioSketch for their scientific illustrations
                </p>
              </div>
              <Button size="lg" onClick={() => navigate("/auth")} className="min-w-[240px] h-14 text-lg font-semibold shadow-xl hover:shadow-2xl">
                <Sparkles className="h-5 w-5 mr-2" />
                Get Started Free
              </Button>
            </div>}
        </div>
      </div>

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