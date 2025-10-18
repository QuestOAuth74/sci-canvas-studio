import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Microscope, Palette, Settings, Sparkles, Zap, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Neo-brutalist grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}></div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section */}
          <div className="space-y-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-accent border-[3px] border-foreground neo-brutalist-shadow-sm font-bold text-sm uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Free for Scientists</span>
            </div>
            
            {/* Logo and Title */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                <div className="p-4 bg-primary border-[4px] border-foreground neo-brutalist-shadow-lg rotate-3">
                  <Microscope className="h-12 w-12 md:h-16 md:w-16 text-foreground" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight">
                  BioSketch
                </h1>
              </div>
              
              <p className="text-xl md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                Create stunning scientific illustrations with a bold, intuitive drag-and-drop interface. 
                Perfect for publications, presentations, and educational materials.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate("/canvas")} 
                className="min-w-[240px] h-16 text-lg font-bold uppercase bg-primary hover:bg-primary border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
              >
                <Palette className="h-6 w-6 mr-2" />
                Start Creating
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/admin")}
                className="min-w-[240px] h-16 text-lg font-bold uppercase bg-card hover:bg-muted border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
              >
                <Settings className="h-6 w-6 mr-2" />
                Admin Panel
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="bg-accent border-[3px] border-foreground neo-brutalist-shadow p-8 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
              <div className="w-14 h-14 bg-background border-[3px] border-foreground flex items-center justify-center mb-6 rotate-3">
                <Palette className="h-7 w-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase">Drag & Drop</h3>
              <p className="text-base font-medium leading-relaxed">
                Intuitive interface lets you arrange vector icons effortlessly on your canvas
              </p>
            </div>
            
            <div className="bg-secondary border-[3px] border-foreground neo-brutalist-shadow p-8 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
              <div className="w-14 h-14 bg-background border-[3px] border-foreground flex items-center justify-center mb-6 -rotate-3">
                <Microscope className="h-7 w-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase">Organized Library</h3>
              <p className="text-base font-medium leading-relaxed">
                Scientific icons categorized for quick access and seamless workflow
              </p>
            </div>
            
            <div className="bg-primary border-[3px] border-foreground neo-brutalist-shadow p-8 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
              <div className="w-14 h-14 bg-background border-[3px] border-foreground flex items-center justify-center mb-6 rotate-6">
                <Zap className="h-7 w-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase">Export Ready</h3>
              <p className="text-base font-medium leading-relaxed">
                High-quality exports optimized for publications and presentations
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-muted border-[3px] border-foreground neo-brutalist-shadow p-10">
              <Shield className="h-10 w-10 mb-4 text-foreground" />
              <h3 className="text-3xl font-black mb-4 uppercase">Open Source & Free</h3>
              <p className="text-lg font-medium leading-relaxed">
                Built for the scientific community. No paywalls, no subscriptions. 
                Just powerful tools for creating beautiful illustrations.
              </p>
            </div>

            <div className="bg-card border-[3px] border-foreground neo-brutalist-shadow p-10">
              <Sparkles className="h-10 w-10 mb-4 text-foreground" />
              <h3 className="text-3xl font-black mb-4 uppercase">Professional Quality</h3>
              <p className="text-lg font-medium leading-relaxed">
                Export publication-ready graphics in multiple formats. 
                Perfect for journals, posters, and presentations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
