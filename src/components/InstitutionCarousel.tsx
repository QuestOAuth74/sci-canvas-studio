import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
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

  return (
    <div className="py-12 animate-fade-in [animation-delay:200ms]">
      <div className="max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
            Trusted by Scientists From Leading Institutions
          </h2>
          <p className="text-lg font-semibold text-muted-foreground">
            Join researchers worldwide using BioSketch
          </p>
        </div>
        
        {/* Carousel */}
        <Carousel
          plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
          className="relative"
          opts={{ loop: true, align: "start" }}
        >
          <CarouselContent>
            {institutions.map((inst, index) => (
              <CarouselItem key={index} className="md:basis-1/3 lg:basis-1/4">
                <div className="p-4">
                  <div className="bg-card border-[3px] border-foreground rounded-xl neo-shadow p-6 h-32 flex items-center justify-center hover:neo-shadow-lg transition-all duration-300 group">
                    <img
                      src={inst.logo}
                      alt={inst.name}
                      className="max-h-20 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-60 group-hover:opacity-100"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
