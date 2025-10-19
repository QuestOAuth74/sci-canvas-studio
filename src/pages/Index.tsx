import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Microscope, Palette, FolderOpen, Sparkles, Zap, Shield, Users, Heart, MessageCircleHeart } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import carousel1 from "@/assets/carousel-1.png";
import carousel2 from "@/assets/carousel-2.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header with User Menu */}
      <header className="absolute top-0 right-0 p-4 z-20">
        <UserMenu />
      </header>

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
          <div className="space-y-8 text-center animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-accent border-[3px] border-foreground neo-brutalist-shadow-sm font-bold text-sm uppercase animate-scale-in hover:rotate-1 transition-transform">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Free for Scientists</span>
            </div>
            
            {/* Logo and Title */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="p-4 bg-primary border-[4px] border-foreground neo-brutalist-shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300 hover:scale-110">
                  <Microscope className="h-12 w-12 md:h-16 md:w-16 text-foreground" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight hover:scale-105 transition-transform duration-300">
                  BioSketch
                </h1>
              </div>
              
              <p className="text-xl md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed opacity-90">
                Create stunning scientific illustrations with a bold, intuitive drag-and-drop interface. 
                Perfect for publications, presentations, and educational materials.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate(user ? "/projects" : "/auth")} 
                className="min-w-[240px] h-16 text-lg font-bold uppercase bg-primary hover:bg-primary border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none hover:scale-105 group"
              >
                <Palette className="h-6 w-6 mr-2 group-hover:rotate-12 transition-transform" />
                Start Creating
              </Button>
              {user ? (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/projects")}
                    className="min-w-[240px] h-16 text-lg font-bold uppercase bg-secondary hover:bg-secondary/80 border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none hover:scale-105 group"
                  >
                    <FolderOpen className="h-6 w-6 mr-2 group-hover:scale-110 transition-transform" />
                    My Projects
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/community")}
                    className="min-w-[240px] h-16 text-lg font-bold uppercase bg-accent hover:bg-accent/80 border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none hover:scale-105 group"
                  >
                    <Users className="h-6 w-6 mr-2 group-hover:scale-110 transition-transform" />
                    Community Gallery
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {/* Carousel Section */}
          <div className="py-12 animate-fade-in [animation-delay:300ms]">
            <div className="max-w-5xl mx-auto">
              <Carousel className="relative" opts={{ loop: true }}>
                <CarouselContent>
                  <CarouselItem>
                    <div className="p-2">
                      <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow overflow-hidden hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300">
                        <img 
                          src={carousel1} 
                          alt="BioSketch Showcase 1" 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-2">
                      <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow overflow-hidden hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300">
                        <img 
                          src={carousel2} 
                          alt="BioSketch Showcase 2" 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="bg-primary border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all -left-4 md:-left-16" />
                <CarouselNext className="bg-primary border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all -right-4 md:-right-16" />
              </Carousel>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 pt-8">
            <div className="bg-accent border-[4px] border-foreground neo-brutalist-shadow p-8 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300 hover:scale-105 rotate-1 hover:rotate-0 animate-fade-in group">
              <div className="w-16 h-16 bg-primary border-[3px] border-foreground flex items-center justify-center mb-6 rotate-3 group-hover:rotate-12 transition-all duration-300">
                <Palette className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase">Drag & Drop</h3>
              <p className="text-base font-medium leading-relaxed">
                Intuitive interface lets you arrange vector icons effortlessly on your canvas
              </p>
            </div>
            
            <div className="bg-secondary border-[4px] border-foreground neo-brutalist-shadow p-8 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300 hover:scale-105 -rotate-1 hover:rotate-0 animate-fade-in [animation-delay:100ms] group">
              <div className="w-16 h-16 bg-accent border-[3px] border-foreground flex items-center justify-center mb-6 -rotate-3 group-hover:-rotate-12 transition-all duration-300">
                <Microscope className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase">Organized Library</h3>
              <p className="text-base font-medium leading-relaxed">
                Scientific icons categorized for quick access and seamless workflow
              </p>
            </div>
            
            <div className="bg-primary border-[4px] border-foreground neo-brutalist-shadow p-8 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300 hover:scale-105 rotate-1 hover:rotate-0 animate-fade-in [animation-delay:200ms] group">
              <div className="w-16 h-16 bg-secondary border-[3px] border-foreground flex items-center justify-center mb-6 rotate-6 group-hover:rotate-180 transition-all duration-300">
                <Zap className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase">Export Ready</h3>
              <p className="text-base font-medium leading-relaxed">
                High-quality exports optimized for publications and presentations
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-muted border-[4px] border-foreground neo-brutalist-shadow p-10 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300 -rotate-1 hover:rotate-0 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-accent border-[3px] border-foreground rotate-3 group-hover:rotate-6 transition-transform">
                  <Shield className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-3xl font-black uppercase">Open Source & Free</h3>
              </div>
              <p className="text-lg font-medium leading-relaxed">
                Built for the scientific community. No paywalls, no subscriptions. 
                Just powerful tools for creating beautiful illustrations.
              </p>
            </div>

            <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-10 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300 rotate-1 hover:rotate-0 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary border-[3px] border-foreground -rotate-3 group-hover:-rotate-6 transition-transform">
                  <Sparkles className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-3xl font-black uppercase">Professional Quality</h3>
              </div>
              <p className="text-lg font-medium leading-relaxed">
                Export publication-ready graphics in multiple formats. 
                Perfect for journals, posters, and presentations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="relative z-10 border-t-[4px] border-foreground bg-muted/50 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* About Section */}
            <div className="bg-card border-[4px] border-foreground neo-brutalist-shadow p-8 md:p-10">
              <h2 className="text-3xl md:text-4xl font-black uppercase mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary border-[3px] border-foreground rotate-3">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                About BioSketch
              </h2>
              <div className="space-y-4 text-base md:text-lg font-medium leading-relaxed">
                <p>
                  BioSketch is an <strong>open-source project</strong> created by a community of scientists 
                  dedicated to providing <strong>free access to medical and scientific illustrations</strong> for everyone.
                </p>
                <p>
                  All resources are sourced from the open web and made available at <strong>no cost</strong>. 
                  Use our illustrations freely for publications, presentations, educational materials, and more.
                </p>
                <p className="text-primary font-bold">
                  No paywall. No subscriptions. Not for profit.
                </p>
              </div>
            </div>

            {/* Donation Section */}
            <div className="bg-accent border-[4px] border-foreground neo-brutalist-shadow p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-black uppercase mb-4 flex items-center gap-3">
                <div className="p-2 bg-secondary border-[3px] border-foreground -rotate-3">
                  <Heart className="h-6 w-6 text-foreground" />
                </div>
                Support the Project
              </h3>
              <p className="text-base md:text-lg font-medium leading-relaxed mb-6">
                While BioSketch is completely free to use, maintaining our servers and domain comes with costs. 
                If you find this project valuable, please consider supporting us with a donation to help keep 
                BioSketch accessible for the scientific community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base font-bold uppercase bg-primary hover:bg-primary border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none group"
                >
                  <Heart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Donate to BioSketch
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/testimonials")}
                  className="h-14 px-8 text-base font-bold uppercase bg-secondary hover:bg-secondary/80 border-[4px] border-foreground neo-brutalist-shadow hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none group"
                >
                  <MessageCircleHeart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Leave a Kind Word
                </Button>
              </div>
            </div>

            {/* Footer Image */}
            <div className="flex justify-center py-8">
              <img 
                src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                alt="BioSketch Art"
                width="150"
                height="150"
                className="border-[4px] border-foreground neo-brutalist-shadow"
              />
            </div>

            {/* Bottom Footer */}
            <div className="text-center pt-8 border-t-[3px] border-foreground/20">
              <p className="text-sm md:text-base font-bold uppercase opacity-70">
                Made with <Heart className="inline h-4 w-4 text-primary" /> by the Scientific Community
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
