import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Palette, ArrowRight, Microscope } from "lucide-react";
import noPreview from "@/assets/no_preview.png";

interface AccordionItemData {
  id: string;
  title: string;
  imageUrl: string;
}

const defaultItems: AccordionItemData[] = [
  { id: '1', title: 'Molecular Pathways', imageUrl: '' },
  { id: '2', title: 'Cell Biology', imageUrl: '' },
  { id: '3', title: 'Protein Structures', imageUrl: '' },
  { id: '4', title: 'Neural Networks', imageUrl: '' },
  { id: '5', title: 'Genomics', imageUrl: '' },
];

interface AccordionItemProps {
  item: AccordionItemData;
  isActive: boolean;
  onMouseEnter: () => void;
}

const AccordionItem = ({ item, isActive, onMouseEnter }: AccordionItemProps) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      className={`relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-in-out ${
        isActive ? 'flex-[4]' : 'flex-1'
      }`}
      style={{ minHeight: '350px' }}
    >
      <img
        src={item.imageUrl || noPreview}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500"
        onError={(e) => { 
          e.currentTarget.onerror = null; 
          e.currentTarget.src = noPreview; 
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div
        className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${
          isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <span className="text-lg font-semibold text-white drop-shadow-lg">
          {item.title}
        </span>
      </div>
    </div>
  );
};

export function HeroImageAccordion() {
  const [activeIndex, setActiveIndex] = useState(2);
  const [accordionItems, setAccordionItems] = useState<AccordionItemData[]>(defaultItems);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadCommunityProjects();
  }, []);

  const loadCommunityProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("canvas_projects")
        .select("id, title, thumbnail_url")
        .eq("is_public", true)
        .eq("approval_status", "approved")
        .not("thumbnail_url", "is", null)
        .order("view_count", { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        const items: AccordionItemData[] = data.map((project) => ({
          id: project.id,
          title: project.title || 'Scientific Figure',
          imageUrl: project.thumbnail_url || '',
        }));
        setAccordionItems(items);
      }
    } catch (error) {
      console.error("Error loading community projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemHover = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Side: Text Content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
              <Microscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Trusted by Researchers Worldwide</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="p-3 rounded-xl bg-card border border-border/50 shadow-lg">
                  <img
                    src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                    alt="BioSketch Logo"
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-foreground">
                  BioSketch
                </h1>
              </div>
              
              <h2 className="text-xl md:text-2xl font-serif font-medium leading-tight text-foreground max-w-xl mx-auto lg:mx-0">
                Professional Scientific Illustration Software
              </h2>
              
              <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Design publication-quality figures for research papers, presentations, and grants. 
                Trusted by scientists at leading institutions worldwide.
              </p>
            </div>

            {user && (
              <p className="text-lg font-serif text-foreground">
                Welcome back, <span className="font-semibold text-primary">{user.user_metadata?.full_name?.split(" ")[0] || "there"}</span>
              </p>
            )}

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                onClick={() => navigate(user ? "/projects" : "/auth")} 
                className="min-w-[180px] h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Palette className="h-5 w-5 mr-2" />
                {user ? "Start Creating" : "Start Free"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right Side: Image Accordion */}
          <div className="flex-1 w-full max-w-2xl">
            <div className="flex gap-2 h-[350px] md:h-[400px]">
              {accordionItems.map((item, index) => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isActive={activeIndex === index}
                  onMouseEnter={() => handleItemHover(index)}
                />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Hover to explore community creations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
