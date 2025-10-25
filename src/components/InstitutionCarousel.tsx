import brown from "@/assets/institutions/brown.png";
import harvardMed from "@/assets/institutions/harvard-med.png";
import ucsd from "@/assets/institutions/uc-san-diego.png";
import upenn from "@/assets/institutions/upenn.png";
import yaleMed from "@/assets/institutions/yale-med.png";

export function InstitutionCarousel() {
  const institutions = [
    { name: "Brown University", logo: brown },
    { name: "Harvard Medical School", logo: harvardMed },
    { name: "UC San Diego", logo: ucsd },
    { name: "University of Pennsylvania", logo: upenn },
    { name: "Yale School of Medicine", logo: yaleMed },
  ];

  // Duplicate for seamless loop
  const duplicatedInstitutions = [...institutions, ...institutions];

  return (
    <div className="py-16 overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background animate-fade-in [animation-delay:200ms]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Trusted by Scientists From Leading Institutions
          </h2>
          <p className="text-xl font-bold text-muted-foreground">
            Join researchers worldwide using BioSketch
          </p>
        </div>
        
        {/* Continuous Marquee */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
          
          <div className="flex gap-8 animate-[scroll_30s_linear_infinite] hover:[animation-play-state:paused]">
            {duplicatedInstitutions.map((inst, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-64"
              >
                <div className="bg-gradient-to-br from-card via-card to-muted/30 border-[3px] border-foreground rounded-2xl neo-shadow p-8 h-40 flex items-center justify-center hover:neo-shadow-lg hover:scale-105 hover:-rotate-1 transition-all duration-500 group relative overflow-hidden">
                  {/* Animated background accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <img
                    src={inst.logo}
                    alt={inst.name}
                    className="relative z-10 max-h-24 max-w-full object-contain filter brightness-0 group-hover:brightness-100 transition-all duration-500 group-hover:scale-110"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subtext */}
        <p className="text-center mt-8 text-sm font-semibold text-muted-foreground/70 tracking-wide uppercase">
          And many more prestigious institutions worldwide
        </p>
      </div>
    </div>
  );
}
