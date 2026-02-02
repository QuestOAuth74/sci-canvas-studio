import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Microscope, Palette, FolderOpen, Zap, Users, Clock,
  ArrowRight, Download, Layers, PenTool,
  FileImage, CheckCircle, Globe, Atom, Play
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
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { cn } from "@/lib/utils";

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
    {
      icon: Clock,
      title: "Hours → Minutes",
      desc: "What used to take hours now takes minutes. Drag, drop, done.",
    },
    {
      icon: Microscope,
      title: "6,000+ Scientific Icons",
      desc: "Comprehensive library for biology, chemistry, medicine, and more.",
    },
    {
      icon: FileImage,
      title: "Publication Ready",
      desc: "Export at 300+ DPI in PNG, SVG, or PDF. Meet any journal's requirements.",
    },
    {
      icon: PenTool,
      title: "Precision Tools",
      desc: "Scale bars, annotations, and connectors for scientific accuracy.",
    },
    {
      icon: Layers,
      title: "Smart Layers",
      desc: "Organize complex diagrams with intuitive layer management.",
    },
    {
      icon: Download,
      title: "Instant Export",
      desc: "One-click export in multiple formats and resolutions.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Researchers", icon: Users },
    { value: "6K+", label: "Icons", icon: Atom },
    { value: "150+", label: "Countries", icon: Globe },
    { value: "500K+", label: "Downloads", icon: Download },
  ];

  return (
    <div className="min-h-screen bg-white">
      <MaintenanceBanner />

      <SEOHead
        title="BioSketch - Create Scientific Figures in Minutes"
        description="Create publication-ready scientific illustrations in minutes, not hours. Free drag-and-drop tool with 6,000+ icons for researchers."
        canonical="https://biosketch.art/"
        keywords="scientific illustration, publication figures, research graphics, scientific diagrams, biology illustration, medical graphics"
        structuredData={structuredData}
      />

      {/* Hero Section - Neo-Brutalism */}
      <section className="relative min-h-[85vh] flex items-center bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Time Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary border-3 border-black brutal-shadow-sm"
              >
                <Clock className="h-4 w-4 text-black" />
                <span className="text-sm font-bold text-black">From hours to minutes</span>
              </motion.div>

              {/* Title */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-black leading-[1.1]"
                >
                  Scientific figures,
                  <span className="block text-black">made simple.</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-lg text-muted-foreground max-w-lg leading-relaxed"
                >
                  Create publication-ready illustrations in minutes.
                  6,000+ icons. Drag and drop. Export at 300+ DPI.
                </motion.p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                <Button
                  size="lg"
                  onClick={() => navigate(user ? "/canvas" : "/auth")}
                  className="h-12 px-6 text-base"
                >
                  <Palette className="h-5 w-5 mr-2" />
                  {user ? "Open Canvas" : "Start Free"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(user ? "/projects" : "/community")}
                  className="h-12 px-6"
                >
                  {user ? (
                    <>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      My Projects
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      See Examples
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <CheckCircle className="h-4 w-4 text-black" />
                  <span>Free forever</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <CheckCircle className="h-4 w-4 text-black" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <CheckCircle className="h-4 w-4 text-black" />
                  <span>Publication ready</span>
                </div>
              </div>
            </div>

            {/* Right - Product Preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative overflow-hidden border-4 border-black brutal-shadow-lg bg-white">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary border-b-3 border-black">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 border-2 border-black bg-white" />
                    <div className="w-3 h-3 border-2 border-black bg-white" />
                    <div className="w-3 h-3 border-2 border-black bg-white" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 border-2 border-black bg-white text-xs font-bold text-black">
                      biosketch.art/canvas
                    </div>
                  </div>
                </div>
                {/* Screenshot */}
                <img
                  src={currentSlide === 0 ? carousel1 : carousel2}
                  alt="BioSketch Canvas"
                  className="w-full h-auto transition-opacity duration-500"
                />
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 p-4 bg-white border-3 border-black brutal-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary border-2 border-black flex items-center justify-center">
                    <Zap className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-black">5 min</p>
                    <p className="text-xs font-medium text-muted-foreground">Avg. figure time</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-16 border-y-3 border-black bg-secondary">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-bold text-black uppercase tracking-widest mb-8">
            Trusted by researchers at leading institutions
          </p>
          <InstitutionCarousel />
        </div>
      </section>

      {/* Stats - Neo-Brutalism */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center p-6 bg-white border-3 border-black brutal-shadow"
              >
                <p className="text-4xl font-bold text-black">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Neo-Brutalism Grid */}
      <section className="py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional tools for publication-ready scientific figures.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 bg-white border-3 border-black brutal-shadow transition-all duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] group"
              >
                <div className="w-12 h-12 bg-secondary border-2 border-black group-hover:bg-accent flex items-center justify-center mb-4 transition-colors">
                  <feature.icon className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo - Neo-Brutalism */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold">Quick Demo</p>
              <h2 className="text-2xl font-bold text-black">See how it works</h2>
            </div>

            <div className="overflow-hidden border-4 border-black brutal-shadow-lg">
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

      {/* Final CTA - Neo-Brutalism Black Section */}
      <section className="py-24 bg-black border-y-4 border-black">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Stop spending hours on figures.
              <span className="block text-secondary mt-2">Start creating in minutes.</span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate(user ? "/canvas" : "/auth")}
                className="h-12 px-8 text-base bg-white text-black border-3 border-white hover:bg-secondary hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#ffffff]"
              >
                <Palette className="h-5 w-5 mr-2" />
                {user ? "Open Canvas" : "Get Started Free"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-secondary font-medium">
              Free forever · No credit card required · Publication ready
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black border-t-3 border-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODgyOTg3LCJleHAiOjIwNzYyNDI5ODd9.Z1uz-_XoJro6NP3bm6Ehexf5wAqUMfg03lRo73WPr1g"
                alt="BioSketch"
                className="h-6 object-contain brightness-0 invert"
              />
            </div>
            <p className="text-sm text-secondary font-medium">
              © {new Date().getFullYear()} BioSketch. Free scientific illustration tool.
            </p>
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
