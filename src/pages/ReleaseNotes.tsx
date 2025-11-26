import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { SEOHead } from "@/components/SEO/SEOHead";

const ReleaseNotes = () => {
  const navigate = useNavigate();

  const releases = [
    {
      version: "2.1.1",
      date: "January 2025",
      title: "Lab Notebook Theme",
      features: [
        {
          title: "Lab Notebook Visual Theme",
          description: "Complete redesign with warm, organic notebook aesthetic featuring ruled lines, handwritten accents (Caveat font), and academic typography (Source Serif 4).",
          icon: "📔"
        },
        {
          title: "Notebook-Styled Components",
          description: "Pages now feature paper textures, sticky notes, washi tape decorations, torn notebook page cards, and spiral binding effects throughout the interface.",
          icon: "✏️"
        },
        {
          title: "Enhanced Navigation",
          description: "Top navigation bar updated with notebook theme including paper texture, handwritten logo font, and highlighter-yellow hover accents.",
          icon: "🎨"
        },
        {
          title: "Community & Blog Updates",
          description: "Community gallery and blog pages redesigned with paper-tab filters, sticky note stats, and torn page project cards for authentic notebook feel.",
          icon: "📰"
        }
      ]
    },
    {
      version: "1.1.0",
      date: "December 2024",
      title: "Community & Collaboration",
      features: [
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
      ]
    }
  ];

  return (
    <div className="min-h-screen notebook-page ruled-lines">
      <SEOHead
        title="What's New - BioSketch Release Notes"
        description="Latest features and improvements in BioSketch. Discover new tools for creating scientific illustrations including community gallery, icon suggestions, and advanced connectors."
        canonical="https://biosketch.art/release-notes"
      />
      
      {/* Margin line decoration */}
      <div className="margin-line" />
      
      {/* Header */}
      <header className="border-b-2 border-[hsl(var(--pencil-gray))] bg-[#f9f6f0] paper-shadow sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="pencil-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Page Header - Sticky Note */}
          <div className="text-center animate-fade-in">
            <div className="sticky-note inline-block max-w-2xl mx-auto rotate-[-0.5deg] shadow-none">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-[hsl(var(--ink-blue))]" />
                <span className="font-source-serif text-sm uppercase tracking-wide text-[hsl(var(--pencil-gray))]">Release History</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-['Caveat'] text-[hsl(var(--ink-blue))] mb-4">
                What's New
              </h1>
              
              <p className="text-xl md:text-2xl font-source-serif text-[hsl(var(--pencil-gray))]">
                The latest features and improvements in BioSketch
              </p>
            </div>
          </div>

          {/* Timeline of Releases */}
          <div className="relative space-y-16">
            {/* Vertical timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[hsl(var(--pencil-gray))]/30 hidden md:block" />
            
            {releases.map((release, releaseIndex) => (
              <div key={release.version} className="relative">
                {/* Timeline dot */}
                <div className="absolute left-8 -translate-x-1/2 w-4 h-4 rounded-full bg-[hsl(var(--ink-blue))] border-2 border-[#f9f6f0] hidden md:block" />
                
                {/* Release Version Header - Paper Clipped Card */}
                <div className="md:ml-20">
                  <div className="bg-[#f9f6f0] border-2 border-[hsl(var(--pencil-gray))] rounded-lg paper-shadow p-6 mb-6 relative">
                    {/* Paper clip decoration */}
                    <div className="absolute -top-4 right-8 w-12 h-16 border-2 border-[hsl(var(--pencil-gray))]/50 rounded-t-lg bg-[hsl(var(--pencil-gray))]/10" />
                    <div className="absolute -top-4 right-8 w-12 h-8 border-2 border-[hsl(var(--pencil-gray))]/50 rounded-t-lg bg-[hsl(var(--pencil-gray))]/20" />
                    
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(var(--ink-blue))]/10 border border-[hsl(var(--ink-blue))]/20 mb-3">
                          <span className="font-['Caveat'] text-2xl text-[hsl(var(--ink-blue))]">v{release.version}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-['Caveat'] text-[hsl(var(--ink-blue))] mb-2">
                          {release.title}
                        </h2>
                      </div>
                      <div className="font-['Caveat'] text-xl text-[hsl(var(--pencil-gray))]">
                        ~ {release.date} ~
                      </div>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {release.features.map((feature, featureIndex) => {
                      const rotations = [-0.5, 0.5, -0.3, 0.3];
                      const rotation = rotations[featureIndex % rotations.length];
                      
                      return (
                        <div
                          key={featureIndex}
                          className="sticky-note hover:scale-[1.02] transition-all animate-fade-in shadow-none"
                          style={{ 
                            animationDelay: `${(releaseIndex * 5 + featureIndex) * 100}ms`,
                            transform: `rotate(${rotation}deg)`
                          }}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="text-3xl flex-shrink-0">
                              {feature.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--ink-blue))] flex-shrink-0" />
                                <h3 className="text-xl font-['Caveat'] text-[hsl(var(--ink-blue))]">{feature.title}</h3>
                              </div>
                              <p className="text-sm leading-relaxed font-source-serif text-[hsl(var(--pencil-gray))]">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section - Sticky Note */}
          <div className="sticky-note text-center rotate-[0.5deg] shadow-none">
            <h2 className="text-3xl md:text-4xl font-['Caveat'] text-[hsl(var(--ink-blue))] mb-4">
              Ready to Create?
            </h2>
            <p className="text-lg font-source-serif text-[hsl(var(--pencil-gray))] max-w-xl mx-auto mb-6">
              Start using these powerful features to create stunning scientific illustrations today.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/projects")}
              className="h-14 px-10 text-lg pencil-button font-['Caveat'] text-xl"
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
