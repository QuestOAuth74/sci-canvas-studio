import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Share2, 
  MessageCircleHeart, ArrowRight, ChevronRight, Download, Layers, PenTool,
  FileImage, Grid3X3, Wand2, BookOpen, GraduationCap, FlaskConical, Dna,
  Brain, Heart, Target, CheckCircle2, Star, Trophy, Globe, Clock
} from "lucide-react";
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
import { IconShowcase } from "@/components/home/IconShowcase";

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
    { icon: Layers, title: "Intuitive Canvas", desc: "Drag-and-drop interface optimized for scientific workflows", color: "text-primary" },
    { icon: Microscope, title: "6,000+ Icons", desc: "Comprehensive biomedical icon library for any research field", color: "text-accent" },
    { icon: FileImage, title: "Publication-Ready", desc: "Export high-resolution PNG, JPG, and vector SVG formats", color: "text-primary" },
    { icon: Share2, title: "Collaboration", desc: "Share figures with colleagues and explore community work", color: "text-accent" },
    { icon: Wand2, title: "AI-Assisted", desc: "Generate custom figures and icons using AI technology", color: "text-primary" },
    { icon: Heart, title: "Free Forever", desc: "No subscription required for essential features", color: "text-accent" },
  ];

  const stats = [
    { icon: Users, value: "10,000+", label: "Researchers" },
    { icon: Microscope, value: "6,000+", label: "Icons" },
    { icon: Globe, value: "150+", label: "Countries" },
    { icon: Download, value: "500K+", label: "Downloads" },
  ];

  const disciplines = [
    { icon: Dna, name: "Molecular Biology" },
    { icon: Brain, name: "Neuroscience" },
    { icon: FlaskConical, name: "Biochemistry" },
    { icon: Heart, name: "Cardiology" },
    { icon: Microscope, name: "Cell Biology" },
    { icon: Target, name: "Immunology" },
  ];

  const benefits = [
    { icon: Clock, title: "Save Hours", desc: "Create figures in minutes, not hours" },
    { icon: CheckCircle2, title: "Journal-Ready", desc: "Meet publication requirements easily" },
    { icon: Star, title: "Professional Quality", desc: "Impress reviewers and readers" },
    { icon: Trophy, title: "Stand Out", desc: "Elevate your research presentation" },
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
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Floating Icons Background */}
            <div className="relative">
              <div className="absolute -top-8 left-1/4 opacity-10">
                <Dna className="h-16 w-16 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-4 right-1/4 opacity-10">
                <Brain className="h-12 w-12 text-accent animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              <div className="absolute top-8 left-1/6 opacity-10">
                <FlaskConical className="h-10 w-10 text-primary animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-sm">
              <div className="flex -space-x-1">
                <GraduationCap className="h-4 w-4 text-primary" />
                <BookOpen className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Trusted by 10,000+ Researchers Worldwide</span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                ))}
              </div>
            </div>

            {/* Logo & Title */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-5">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 shadow-lg">
                  <img
                    src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                    alt="BioSketch Logo"
                    className="h-14 w-14 md:h-16 md:w-16 object-contain"
                  />
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground">
                  BioSketch
                </h1>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-xl md:text-2xl font-display text-foreground flex items-center justify-center gap-3">
                  <PenTool className="h-6 w-6 text-primary" />
                  Professional Scientific Illustration
                  <Sparkles className="h-6 w-6 text-accent" />
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Create publication-quality figures for research papers, presentations, and grants.
                  Free and trusted by scientists at leading institutions worldwide.
                </p>
              </div>
            </div>

            {/* Welcome for logged-in users */}
            {user && (
              <div className="flex items-center justify-center gap-2 text-lg font-display text-foreground animate-fade-in">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Welcome back, <span className="font-semibold text-primary">{user.user_metadata?.full_name?.split(" ")[0] || "Researcher"}</span></span>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate(user ? "/canvas" : "/auth")} 
                className="h-13 px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all group"
              >
                <Palette className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                {user ? "Open Canvas" : "Start Free"}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              {user ? (
                <>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/projects")} 
                    className="h-13 px-6 group"
                  >
                    <FolderOpen className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    My Projects
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/community")} 
                    className="h-13 px-6 group"
                  >
                    <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Community
                  </Button>
                </>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/community")} 
                  className="h-13 px-8 group"
                >
                  <Grid3X3 className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                  Browse Gallery
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                <CardContent className="p-6 text-center space-y-2">
                  <stat.icon className="h-8 w-8 mx-auto text-primary" />
                  <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Institution Logos */}
        <section className="py-12 border-y border-border/50">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Trusted by researchers at
              <GraduationCap className="h-4 w-4" />
            </p>
          </div>
          <InstitutionCarousel />
        </section>

        {/* Product Showcase */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary uppercase tracking-widest">
                <Layers className="h-4 w-4" />
                <span>Powerful Canvas</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Everything You Need in One Place
              </h2>
            </div>
            <Carousel opts={{ loop: true }}>
              <CarouselContent>
                <CarouselItem>
                  <div className="rounded-xl overflow-hidden border border-border shadow-2xl">
                    <img src={carousel1} alt="BioSketch Interface" className="w-full h-auto" />
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="rounded-xl overflow-hidden border border-border shadow-2xl">
                    <img src={carousel2} alt="BioSketch Features" className="w-full h-auto" />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="-left-4 md:-left-12" />
              <CarouselNext className="-right-4 md:-right-12" />
            </Carousel>
          </div>
        </section>

        {/* Icon Showcase - visible to all users */}
        <IconShowcase />

        {/* Disciplines Section */}
        <section className="py-16">
          <div className="text-center mb-10 space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary uppercase tracking-widest">
              <FlaskConical className="h-4 w-4" />
              <span>For Every Field</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Icons for Every Discipline
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {disciplines.map((discipline, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-muted/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-default"
              >
                <discipline.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{discipline.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Demo Video */}
        <section className="py-20 bg-muted/30 -mx-4 px-4 rounded-3xl">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary uppercase tracking-widest">
                <Zap className="h-4 w-4" />
                <span>Quick Demo</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                See BioSketch in Action
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                Create professional figures in minutes
              </p>
            </div>
            <div className="rounded-xl overflow-hidden border border-border shadow-2xl">
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

        {/* Benefits Section */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary uppercase tracking-widest">
                <Trophy className="h-4 w-4" />
                <span>Why BioSketch</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Elevate Your Research
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-border/50 bg-gradient-to-b from-card to-muted/20 hover:shadow-lg transition-all group">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-primary/15 transition-all">
                      <benefit.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30 -mx-4 px-4 rounded-3xl">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary uppercase tracking-widest">
                <Sparkles className="h-4 w-4" />
                <span>Features</span>
              </div>
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
                  className="group border border-border/50 bg-card hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all shrink-0">
                        <feature.icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Community Section */}
        {user ? (
          <section className="py-20">
            <div className="max-w-6xl mx-auto">
              <CommunityCarousel />
            </div>
          </section>
        ) : (
          <section className="py-20">
            <Card className="max-w-3xl mx-auto border-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 overflow-hidden relative">
              <div className="absolute top-4 left-4 opacity-10">
                <Users className="h-24 w-24 text-primary" />
              </div>
              <div className="absolute bottom-4 right-4 opacity-10">
                <Share2 className="h-20 w-20 text-accent" />
              </div>
              <CardContent className="text-center py-16 px-8 space-y-6 relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-bold text-foreground">Join the Community</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Explore thousands of scientific illustrations created by researchers worldwide.
                  </p>
                </div>
                <Button size="lg" onClick={() => navigate("/auth")} className="mt-4 group">
                  <MessageCircleHeart className="h-4 w-4 mr-2" />
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Blog Section */}
        {user ? (
          <section className="py-20 bg-muted/30 -mx-4 px-4 rounded-3xl">
            <div className="max-w-6xl mx-auto">
              <BlogPostsCarousel />
            </div>
          </section>
        ) : (
          <section className="py-20 bg-muted/30 -mx-4 px-4 rounded-3xl">
            <Card className="max-w-3xl mx-auto border-0 bg-card overflow-hidden relative">
              <div className="absolute top-4 right-4 opacity-10">
                <BookOpen className="h-20 w-20 text-primary" />
              </div>
              <CardContent className="text-center py-16 px-8 space-y-6 relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-bold text-foreground">Learn & Grow</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Access tutorials, tips, and best practices for scientific illustration.
                  </p>
                </div>
                <Button size="lg" variant="outline" onClick={() => navigate("/blog")} className="group">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Browse Articles
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Final CTA */}
        {!user && (
          <section className="py-24 text-center relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Microscope className="h-96 w-96 text-primary" />
            </div>
            <div className="max-w-2xl mx-auto space-y-8 relative">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <Zap className="h-6 w-6 text-accent" />
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
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
                className="h-14 px-10 text-lg shadow-xl hover:shadow-2xl transition-all group"
              >
                <Palette className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                Create Free Account
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                No credit card required • Free forever
              </p>
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