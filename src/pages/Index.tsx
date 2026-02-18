import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Microscope, Shapes, Download, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { IconSubmissionDialog } from "@/components/community/IconSubmissionDialog";
import { ProjectPreviewModal } from "@/components/community/ProjectPreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEO/SEOHead";
import { getWebApplicationSchema, getOrganizationSchema } from "@/components/SEO/StructuredData";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
    { icon: Shapes, title: "6,000+ Scientific Icons", desc: "Cells, molecules, organs & more" },
    { icon: Download, title: "Export Anywhere", desc: "PNG, SVG, PDF for publications" },
    { icon: Users, title: "Free Forever", desc: "No credit card required" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEOHead
        title="BioSketch — Create Publication-Ready Scientific Figures"
        description="Design professional diagrams for your research papers, presentations, and posters. Free scientific illustration tool with no design skills required."
        structuredData={[
          JSON.stringify(structuredData),
          JSON.stringify(getOrganizationSchema()),
        ]}
      />
      <MaintenanceBanner />

      {/* Animated glass blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-blob" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Microscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-foreground text-lg">BioSketch</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/community")}
              className="text-muted-foreground hover:text-foreground"
            >
              Gallery
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pricing")}
              className="text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(user ? "/canvas" : "/auth")}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-lg px-5 shadow-lg shadow-indigo-500/25"
            >
              {user ? "Open Canvas" : "Get Started"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-xl border border-white/40 text-indigo-600 text-sm font-medium shadow-sm">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              Free scientific illustration tool
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Create publication-ready
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-600">
                scientific figures
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Design professional diagrams for your research papers, presentations, and posters. No design skills required.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate(user ? "/canvas" : "/auth")}
                className="h-13 px-8 text-base bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
              >
                Start Creating Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/community")}
                className="h-13 px-8 text-base bg-white/40 backdrop-blur-xl border-white/40 hover:bg-white/60 rounded-xl transition-all"
              >
                View Gallery
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 pt-6 text-sm text-muted-foreground">
              {["No signup required", "Free forever", "Export in any format"].map((text, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Product Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/40 shadow-2xl shadow-indigo-200/30 bg-white/50 backdrop-blur-xl">
              <video
                src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/public/blog-media/biosketch%20video.mp4"
                className="w-full"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-violet-400/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-500/25"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 border border-white rounded-full" />
              <div className="absolute bottom-0 right-0 w-60 h-60 border border-white rounded-full" />
            </div>

            <div className="relative space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to create your first figure?
              </h2>
              <p className="text-lg text-indigo-100 max-w-xl mx-auto">
                Join thousands of researchers using BioSketch for their publications.
              </p>
              <Button
                size="lg"
                onClick={() => navigate(user ? "/canvas" : "/auth")}
                className="h-13 px-10 text-base bg-white/90 backdrop-blur-sm text-indigo-700 hover:bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Microscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">BioSketch</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => navigate("/community")} className="hover:text-primary transition-colors">Community</button>
            <button onClick={() => navigate("/pricing")} className="hover:text-primary transition-colors">Pricing</button>
            <button onClick={() => navigate("/blog")} className="hover:text-primary transition-colors">Blog</button>
            <button onClick={() => navigate("/terms")} className="hover:text-primary transition-colors">Terms</button>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BioSketch
          </p>
        </div>
      </footer>

      <IconSubmissionDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog} categories={categories} />
      <ProjectPreviewModal
        project={selectedProject}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
};

export default Index;
