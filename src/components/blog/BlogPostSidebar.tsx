import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, Image, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

interface FeaturedProject {
  id: string;
  name: string;
  thumbnail_url: string | null;
  view_count: number;
}

interface BlogPostSidebarProps {
  content: any;
}

const extractHeadings = (content: any): TableOfContentsItem[] => {
  const headings: TableOfContentsItem[] = [];
  
  const traverse = (node: any) => {
    if (!node) return;
    
    if (node.type === 'heading' && node.attrs?.level && node.content) {
      const text = node.content
        .map((n: any) => (n.text ? n.text : ''))
        .join('');
      
      if (text) {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({
          id,
          text,
          level: node.attrs.level,
        });
      }
    }
    
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  };
  
  traverse(content);
  return headings;
};

export const BlogPostSidebar = ({ content }: BlogPostSidebarProps) => {
  const [headings, setHeadings] = useState<TableOfContentsItem[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const extracted = extractHeadings(content);
    setHeadings(extracted);
  }, [content]);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      const { data } = await supabase
        .from('canvas_projects')
        .select('id, name, thumbnail_url, view_count')
        .eq('is_public', true)
        .eq('approval_status', 'approved')
        .order('view_count', { ascending: false })
        .limit(3);
      
      if (data) {
        setFeaturedProjects(data);
      }
    };
    
    fetchFeaturedProjects();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-6 sticky top-8">
      {/* Table of Contents - Notebook Style */}
      {headings.length > 0 && (
        <Card className="notebook-sidebar ruled-lines bg-[#f9f6f0] border-[hsl(var(--pencil-gray))] overflow-hidden pl-8 relative">
          {/* Spiral binding */}
          <div className="spiral-binding">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="spiral-hole" />
            ))}
          </div>
          
          <CardHeader className="bg-[#f9f6f0]/80">
            <CardTitle className="notebook-section-header text-xl">
              <List className="w-4 h-4 inline mr-2" />
              Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-1">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm paper-tab
                  transition-all duration-200
                  ${activeId === heading.id 
                    ? 'paper-tab-active' 
                    : ''
                  }
                  ${heading.level === 2 ? 'ml-0' : heading.level === 3 ? 'ml-4' : 'ml-8'}
                `}
              >
                {heading.text}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Featured Templates - Polaroid Style */}
      {featuredProjects.length > 0 && (
        <Card className="notebook-sidebar ruled-lines bg-[#f9f6f0] border-[hsl(var(--pencil-gray))] overflow-hidden pl-8 relative">
          {/* Spiral binding */}
          <div className="spiral-binding">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="spiral-hole" />
            ))}
          </div>
          
          <CardHeader className="bg-[#f9f6f0]/80">
            <CardTitle className="notebook-section-header text-xl">
              <Image className="w-4 h-4 inline mr-2" />
              Featured Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {featuredProjects.map((project, index) => {
              const rotation = (index % 2 === 0 ? 1 : -1) * (Math.random() * 2 + 1);
              return (
                <Link
                  key={project.id}
                  to={`/community?preview=${project.id}`}
                  className="block group"
                >
                  <div 
                    className="relative bg-white p-2 paper-shadow hover:shadow-lg transition-all duration-200"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    {/* Tape decoration */}
                    <div className="washi-tape top-0 left-1/2 -translate-x-1/2" />
                    
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.name}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Image className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="p-3 bg-white">
                      <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-[hsl(var(--ink-blue))] transition-colors font-['Caveat'] text-[hsl(var(--ink-blue))]">
                        {project.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.view_count} views
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
            
            <Link
              to="/community"
              className="block w-full py-3 px-4 text-center font-semibold text-sm sticky-note bg-[hsl(var(--highlighter-yellow))] hover:shadow-lg transition-all duration-200"
            >
              Browse All Templates →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
