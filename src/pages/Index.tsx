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
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-white to-white">
      <MaintenanceBanner />

      <SEOHead
        title="BioSketch - Scientific Figure Design Tool"
        description="Create publication-ready scientific illustrations in minutes. Free drag-and-drop tool with 6,000+ icons for researchers."
        canonical="https://biosketch.art/"
        keywords="scientific illustration, publication figures, research graphics, scientific diagrams"
        structuredData={structuredData}
      />

      {/* Subtle Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-cyan-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-xl flex items-center justify-center">
              <Microscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">BioSketch</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/community")}
              className="text-slate-600 hover:text-cyan-700"
            >
              Gallery
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pricing")}
              className="text-slate-600 hover:text-cyan-700"
            >
              Pricing
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(user ? "/canvas" : "/auth")}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-lg px-5"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-sm font-medium">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              Free scientific illustration tool
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              Create publication-ready
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">
                scientific figures
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Design professional diagrams for your research papers, presentations, and posters. No design skills required.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate(user ? "/canvas" : "/auth")}
                className="h-13 px-8 text-base bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
              >
                Start Creating Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/community")}
                className="h-13 px-8 text-base border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 rounded-xl transition-all"
              >
                View Gallery
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 pt-6 text-sm text-slate-500">
              {["No signup required", "Free forever", "Export in any format"].map((text, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-cyan-600" />
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
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200/50 bg-white">
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
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-cyan-100 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
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
            className="bg-gradient-to-br from-cyan-600 to-teal-600 rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden"
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
              <p className="text-lg text-cyan-100 max-w-xl mx-auto">
                Join thousands of researchers using BioSketch for their publications.
              </p>
              <Button
                size="lg"
                onClick={() => navigate(user ? "/canvas" : "/auth")}
                className="h-13 px-10 text-base bg-white text-cyan-700 hover:bg-cyan-50 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-lg flex items-center justify-center">
              <Microscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-700">BioSketch</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <button onClick={() => navigate("/community")} className="hover:text-cyan-600 transition-colors">Community</button>
            <button onClick={() => navigate("/pricing")} className="hover:text-cyan-600 transition-colors">Pricing</button>
            <button onClick={() => navigate("/blog")} className="hover:text-cyan-600 transition-colors">Blog</button>
            <button onClick={() => navigate("/terms")} className="hover:text-cyan-600 transition-colors">Terms</button>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} BioSketch
          </p>
        </div>
      </footer>

      <IconSubmissionDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog} categories={categories} />
      <ProjectPreviewModal project={selectedProject} isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} />
    </div>
  );
};

export default Index;
