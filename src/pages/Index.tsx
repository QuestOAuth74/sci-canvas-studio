import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Share2, MessageCircleHeart, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { IconSubmissionDialog } from "@/components/community/IconSubmissionDialog";
import { ProjectPreviewModal } from "@/components/community/ProjectPreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEO/SEOHead";
import { getWebApplicationSchema, getOrganizationSchema } from "@/components/SEO/StructuredData";
import { useRecentSignups } from "@/hooks/useRecentSignups";
import { SignupToast } from "@/components/SignupToast";
import { InstitutionCarousel } from "@/components/InstitutionCarousel";
import { BlogPostsCarousel } from "@/components/blog/BlogPostsCarousel";
import { CommunityCarousel } from "@/components/community/CommunityCarousel";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { Card, CardContent } from "@/components/ui/card";
import { HeroImageAccordion } from "@/components/ui/interactive-image-accordion";

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
      <div
        className="absolute inset-0 -z-10 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <SEOHead
        title="BioSketch - Free Scientific Illustration Tool for Researchers"
        description="Create stunning scientific illustrations with BioSketch - a free drag-and-drop tool for scientists and researchers. Build publication-ready figures with our extensive biomedical icon library."
        canonical="https://biosketch.art/"
        keywords="scientific illustration, biomedical graphics, research illustration software, free science graphics, publication figures, scientific diagrams, biology illustration, medical graphics creator"
        structuredData={structuredData}
      />

      <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-24">
          {/* Hero Section with Image Accordion */}
          <div className="animate-fade-in">
            <HeroImageAccordion />
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


      <IconSubmissionDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog} categories={categories} />
      <ProjectPreviewModal project={selectedProject} isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} />
      {signupData && <SignupToast count={signupData.count} topCountries={signupData.topCountries} totalWithLocation={signupData.totalWithLocation} />}
    </div>
  );
};

export default Index;