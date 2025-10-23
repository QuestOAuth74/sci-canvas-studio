import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { SEOHead } from "@/components/SEO/SEOHead";

const ReleaseNotes = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Community Gallery",
      description: "Browse and share scientific illustrations created by users worldwide. Discover inspiration and contribute your own work to the growing collection.",
      icon: "👥"
    },
    {
      title: "Icon Suggestion System",
      description: "Request new scientific icons directly through the app. Submit your icon needs and help shape the library with community-driven additions.",
      icon: "💡"
    },
    {
      title: "Advanced Connector Tool",
      description: "Create professional diagrams with smart connectors that automatically route between objects and stay attached when elements are moved.",
      icon: "🔗"
    },
    {
      title: "User Asset Upload",
      description: "Upload and manage your own custom assets. Build a personal library of frequently used images and icons for faster workflow.",
      icon: "📤"
    },
    {
      title: "Project Management",
      description: "Save, organize, and access all your illustrations from one central dashboard. Never lose your work with cloud-based project storage.",
      icon: "📁"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="What's New - BioSketch Release Notes"
        description="Latest features and improvements in BioSketch. Discover new tools for creating scientific illustrations including community gallery, icon suggestions, and advanced connectors."
        canonical="https://biosketch.art/release-notes"
      />
      {/* Header */}
      <header className="border-b border-border/60 bg-card/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Version Header */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold text-lg shadow-sm">
              <Sparkles className="h-5 w-5" />
              <span>Version 1.1.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold">
              What's New
            </h1>
            
            <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto text-foreground/80">
              The latest features and improvements in BioSketch
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card border border-border/60 rounded-2xl shadow-lg p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                      <h3 className="text-2xl font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-base md:text-lg font-medium leading-relaxed pl-9 text-foreground/70">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-primary to-primary/80 border border-primary/20 rounded-2xl shadow-xl p-10 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">
              Ready to Create?
            </h2>
            <p className="text-lg font-medium max-w-xl mx-auto text-white/90">
              Start using these powerful features to create stunning scientific illustrations today.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/projects")}
              variant="secondary"
              className="h-14 px-10 text-lg"
            >
              Start Creating
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseNotes;
