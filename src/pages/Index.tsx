import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Microscope, Palette, Settings, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Free for Scientists</span>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                <Microscope className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                BioSketch
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Create stunning scientific illustrations with an intuitive drag-and-drop interface. 
              Perfect for publications, presentations, and educational materials.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/canvas")} 
              className="min-w-[220px] h-14 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Palette className="h-5 w-5 mr-2" />
              Start Creating
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/admin")}
              className="min-w-[220px] h-14 text-lg glass-effect hover:bg-primary/5 transition-all"
            >
              <Settings className="h-5 w-5 mr-2" />
              Admin Panel
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="pt-20 grid md:grid-cols-3 gap-6">
            <div className="group p-8 rounded-2xl glass-effect hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Drag & Drop</h3>
              <p className="text-muted-foreground leading-relaxed">
                Intuitive interface lets you arrange vector icons effortlessly on your canvas
              </p>
            </div>
            
            <div className="group p-8 rounded-2xl glass-effect hover:shadow-xl transition-all duration-300 hover:-translate-y-2" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <Microscope className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Organized Library</h3>
              <p className="text-muted-foreground leading-relaxed">
                Scientific icons categorized for quick access and seamless workflow
              </p>
            </div>
            
            <div className="group p-8 rounded-2xl glass-effect hover:shadow-xl transition-all duration-300 hover:-translate-y-2" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Export Ready</h3>
              <p className="text-muted-foreground leading-relaxed">
                High-quality exports optimized for publications and presentations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
