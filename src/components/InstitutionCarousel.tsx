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

  // Duplicate institutions array for seamless loop
  const duplicatedInstitutions = [...institutions, ...institutions];

  return (
    <div className="py-12 animate-fade-in [animation-delay:200ms] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
            Trusted by Scientists From Leading Institutions
          </h2>
          <p className="text-lg font-semibold text-muted-foreground">
            Join researchers worldwide using BioSketch
          </p>
        </div>
        
        {/* Marquee Container */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling Content */}
          <div className="flex gap-8 animate-marquee hover:[animation-play-state:paused]">
            {duplicatedInstitutions.map((inst, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-64"
              >
                <div className="bg-card border-2 border-border rounded-xl p-8 h-32 flex items-center justify-center transition-all duration-300 hover:border-primary hover:shadow-lg group">
                  <img
                    src={inst.logo}
                    alt={inst.name}
                    className="max-h-20 max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
