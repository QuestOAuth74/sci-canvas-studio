import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Share2, 
  ArrowRight, ChevronRight, Download, Layers, PenTool,
  FileImage, Grid3X3, Wand2, BookOpen, GraduationCap, Play,
  CheckCircle, Star, Globe, MousePointerClick, Atom, Image
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
import { IconShowcase } from "@/components/home/IconShowcase";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data: signupData } = useRecentSignups();

  useEffect(() => {
    supabase
      .from("icon_categories")
      .select("id, name")
      .order("name")
      .then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [getWebApplicationSchema(), getOrganizationSchema()],
  };

  const features = [
    { icon: Layers, title: "Intuitive Canvas", desc: "Drag-and-drop interface built for scientists" },
    { icon: Microscope, title: "6,000+ Icons", desc: "Comprehensive biomedical icon library" },
    { icon: FileImage, title: "Publication-Ready", desc: "Export PNG, JPG, and SVG formats" },
    { icon: Share2, title: "Easy Sharing", desc: "Collaborate with your research team" },
    { icon: Wand2, title: "AI-Powered", desc: "Generate custom figures with AI" },
    { icon: Shield, title: "Free Forever", desc: "Essential features at no cost" },
  ];

  const stats = [
    { value: "10K+", label: "Researchers", icon: Users },
    { value: "6K+", label: "Icons", icon: Atom },
    { value: "150+", label: "Countries", icon: Globe },
    { value: "500K+", label: "Downloads", icon: Download },
  ];

  const steps = [
    { num: "01", title: "Sign Up Free", desc: "Create your account in seconds", icon: MousePointerClick },
    { num: "02", title: "Choose Icons", desc: "Browse our extensive library", icon: Grid3X3 },
    { num: "03", title: "Design & Export", desc: "Create and download your figure", icon: Image },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <MaintenanceBanner />

      <SEOHead
        title="BioSketch - Free Scientific Illustration Tool for Researchers"
        description="Create stunning scientific illustrations with BioSketch - a free drag-and-drop tool for scientists and researchers. Build publication-ready figures with our extensive biomedical icon library."
        canonical="https://biosketch.art/"
        keywords="scientific illustration, biomedical graphics, research illustration software, free science graphics, publication figures, scientific diagrams, biology illustration, medical graphics creator"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Trusted by 10,000+ researchers</span>
              </div>

              {/* Title */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground leading-[1.1]">
                  Scientific figures
                  <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    made simple
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Create publication-ready illustrations in minutes. 
                  Drag, drop, and export—no design skills needed.
                </p>
              </div>

              {/* User Welcome */}
              {user && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-foreground">
                    Welcome back, <span className="font-semibold text-primary">{user.user_metadata?.full_name?.split(" ")[0] || "Researcher"}</span>
                  </span>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate(user ? "/canvas" : "/auth")} 
                  className="h-12 px-6 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all group"
                >
                  <Palette className="h-5 w-5 mr-2" />
                  {user ? "Open Canvas" : "Start Creating — It's Free"}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                {user ? (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/projects")}
                    className="h-12 px-6"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    My Projects
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/community")}
                    className="h-12 px-6"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    See Examples
                  </Button>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Free forever</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Instant access</span>
                </div>
              </div>
            </div>

            {/* Right - Product Preview */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
                      biosketch.art/canvas
                    </div>
                  </div>
                </div>
                {/* Screenshot */}
                <div className="relative">
                  <img 
                    src={currentSlide === 0 ? carousel1 : carousel2} 
                    alt="BioSketch Canvas" 
                    className="w-full h-auto transition-opacity duration-500"
                  />
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -bottom-6 -left-6 p-4 rounded-xl bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Microscope className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">6,000+</p>
                    <p className="text-xs text-muted-foreground">Scientific Icons</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 p-3 rounded-xl bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-foreground">AI-Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-16 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8 flex items-center justify-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Trusted by researchers at leading institutions
          </p>
          <InstitutionCarousel />
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div 
                key={i}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg"
              >
                <stat.icon className="h-6 w-6 text-primary/60 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-3xl lg:text-4xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Features
            </div>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Everything you need to create
              <span className="block text-primary">stunning figures</span>
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-xl overflow-hidden ${
                  i === 0 ? 'lg:col-span-2 lg:row-span-1' : ''
                }`}
              >
                {/* Gradient Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
              <Zap className="h-4 w-4" />
              How it works
            </div>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Three steps to publication-ready figures
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector Line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                
                <div className="text-center space-y-4">
                  <div className="relative mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center">
                    <step.icon className="h-10 w-10 text-primary" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {step.num.split('')[1]}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Play className="h-4 w-4" />
                Quick Demo
              </div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                See it in action
              </h2>
            </div>
            
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
              <video
                src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/public/blog-media/biosketch%20video.mp4"
                className="w-full h-auto"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          </div>
        </div>
      </section>

      {/* Icon Showcase */}
      <div className="container mx-auto px-4">
        <IconShowcase />
      </div>

      {/* Community / CTA Section */}
      {user ? (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <CommunityCarousel />
          </div>
        </section>
      ) : (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)]" />
              
              <div className="relative z-10 text-center py-16 px-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-display font-bold text-white">
                  Join thousands of researchers
                </h3>
                <p className="text-white/80 max-w-md mx-auto">
                  Create, share, and explore scientific illustrations with our growing community.
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate("/auth")} 
                  className="mt-4 h-12 px-8 text-base font-medium"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Section */}
      {user && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <BlogPostsCarousel />
          </div>
        </section>
      )}

      {/* Final CTA */}
      {!user && (
        <section className="py-24 relative">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-t from-muted/50 to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                  Ready to create beautiful figures?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Join 10,000+ researchers who trust BioSketch for their scientific illustrations.
                </p>
              </div>
              
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="h-14 px-10 text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all group"
              >
                <Palette className="h-5 w-5 mr-2" />
                Start Creating — It's Free
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Free forever
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <IconSubmissionDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog} categories={categories} />
      <ProjectPreviewModal project={selectedProject} isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} />
      {signupData && <SignupToast count={signupData.count} topCountries={signupData.topCountries} totalWithLocation={signupData.totalWithLocation} />}
    </div>
  );
};

export default Index;