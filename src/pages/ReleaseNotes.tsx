import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";

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
      {/* Header */}
      <header className="border-b-[4px] border-foreground bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="font-bold uppercase border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
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
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-primary border-[3px] border-foreground neo-brutalist-shadow font-bold text-lg uppercase">
              <Sparkles className="h-5 w-5" />
              <span>Version 1.1.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black uppercase">
              What's New
            </h1>
            
            <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto">
              The latest features and improvements in BioSketch
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-8 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-accent border-[3px] border-foreground flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                      <h3 className="text-2xl font-black uppercase">{feature.title}</h3>
                    </div>
                    <p className="text-base md:text-lg font-medium leading-relaxed pl-9">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-primary border-[4px] border-foreground neo-brutalist-shadow p-10 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-black uppercase">
              Ready to Create?
            </h2>
            <p className="text-lg font-medium max-w-xl mx-auto">
              Start using these powerful features to create stunning scientific illustrations today.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/projects")}
              className="h-16 px-10 text-lg font-bold uppercase bg-secondary hover:bg-secondary border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none"
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
