import { useNavigate } from "react-router-dom";
import { Gravity, MatterBody } from "@/components/ui/gravity";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Palette, FolderOpen, Users, ArrowRight, Microscope, Dna, FlaskConical, Brain, Heart, Atom, TestTube } from "lucide-react";

export const GravityHero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const scienceKeywords = [
    { text: "DNA", icon: Dna, color: "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30" },
    { text: "Cells", icon: Microscope, color: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30" },
    { text: "Proteins", icon: FlaskConical, color: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30" },
    { text: "Neural", icon: Brain, color: "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30" },
    { text: "Cardiac", icon: Heart, color: "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30" },
    { text: "Molecular", icon: Atom, color: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-400/30" },
    { text: "Research", icon: TestTube, color: "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30" },
  ];

  return (
    <div className="relative w-full min-h-[600px] md:min-h-[700px]">
      {/* Gravity Physics Container */}
      <Gravity
        gravity={{ x: 0, y: 0.5 }}
        className="w-full h-[600px] md:h-[700px]"
        grabCursor={true}
        addTopWall={false}
      >
        {/* Floating Science Keywords */}
        {scienceKeywords.map((keyword, index) => (
          <MatterBody
            key={keyword.text}
            matterBodyOptions={{
              friction: 0.3,
              restitution: 0.6,
              density: 0.002,
            }}
            x={`${15 + (index * 12) % 70}%`}
            y={`${10 + (index * 8) % 30}%`}
            angle={-15 + index * 5}
          >
            <div className={`px-4 py-2 rounded-xl ${keyword.color} shadow-lg flex items-center gap-2 whitespace-nowrap`}>
              <keyword.icon className="h-4 w-4" />
              <span className="font-medium text-sm">{keyword.text}</span>
            </div>
          </MatterBody>
        ))}

        {/* Additional decorative elements */}
        <MatterBody
          matterBodyOptions={{ friction: 0.2, restitution: 0.8, density: 0.001 }}
          x="80%"
          y="15%"
          angle={10}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 shadow-lg shadow-violet-500/40" />
        </MatterBody>
        
        <MatterBody
          matterBodyOptions={{ friction: 0.2, restitution: 0.8, density: 0.001 }}
          x="10%"
          y="20%"
          angle={-20}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 rotate-45 shadow-lg shadow-cyan-500/40" />
        </MatterBody>

        <MatterBody
          matterBodyOptions={{ friction: 0.2, restitution: 0.8, density: 0.001 }}
          x="90%"
          y="25%"
          angle={15}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 shadow-lg shadow-pink-500/40" />
        </MatterBody>
        
        <MatterBody
          matterBodyOptions={{ friction: 0.2, restitution: 0.8, density: 0.001 }}
          x="5%"
          y="35%"
          angle={25}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/40" />
        </MatterBody>
        
        <MatterBody
          matterBodyOptions={{ friction: 0.2, restitution: 0.8, density: 0.001 }}
          x="95%"
          y="40%"
          angle={-10}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/40" />
        </MatterBody>
      </Gravity>

      {/* Static Hero Content - Overlaid on top */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <div className="text-center space-y-8 px-4 max-w-4xl">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 pointer-events-auto">
            <Microscope className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Trusted by Researchers Worldwide</span>
          </div>

          {/* Logo and Title */}
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-5 flex-wrap">
              <div className="p-4 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg pointer-events-auto">
                <img
                  src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                  alt="BioSketch Logo"
                  className="h-14 w-14 md:h-16 md:w-16 object-contain"
                />
              </div>
              <h1 className="text-5xl md:text-7xl font-sans font-bold tracking-tight text-foreground drop-shadow-sm">
                BioSketch
              </h1>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl md:text-3xl font-serif font-medium leading-tight text-foreground">
                Professional Scientific Illustration Software
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2">
                Design publication-quality figures for research papers, presentations, and grants.
                Trusted by scientists at leading institutions worldwide.
              </p>
            </div>
          </div>

          {/* Welcome Message for Logged-in Users */}
          {user && (
            <div className="flex items-center justify-center gap-3 animate-fade-in">
              <p className="text-xl font-serif text-foreground bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2">
                Welcome back, <span className="font-semibold text-primary">{user.user_metadata?.full_name?.split(" ")[0] || "there"}</span>
              </p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center items-center pt-4 pointer-events-auto">
            <Button 
              size="lg" 
              onClick={() => navigate(user ? "/projects" : "/auth")} 
              className="min-w-[180px] h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Palette className="h-5 w-5 mr-2" />
              {user ? "Start Creating" : "Start Free"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            {user && (
              <>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/projects")} 
                  className="min-w-[160px] h-12 text-base bg-background/80 backdrop-blur-sm"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  My Projects
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/community")} 
                  className="min-w-[160px] h-12 text-base bg-background/80 backdrop-blur-sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Community
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
