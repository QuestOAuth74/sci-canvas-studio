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
      {/* Table of Contents */}
      {headings.length > 0 && (
        <Card className="border-[4px] border-foreground neo-shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/10 border-b-[4px] border-foreground">
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <div className="w-8 h-8 bg-primary border-[2px] border-foreground rounded-lg flex items-center justify-center">
                <List className="w-4 h-4 text-primary-foreground" />
              </div>
              Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-1">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg font-semibold text-sm
                  transition-all duration-200 border-[2px] border-transparent
                  hover:border-foreground hover:bg-primary/5 hover:translate-x-[2px]
                  ${activeId === heading.id 
                    ? 'bg-primary/10 border-foreground text-primary shadow-[2px_2px_0px_0px_hsl(var(--foreground))]' 
                    : 'text-foreground/80'
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

      {/* Featured Templates */}
      {featuredProjects.length > 0 && (
        <Card className="border-[4px] border-foreground neo-shadow-lg overflow-hidden">
          <CardHeader className="bg-secondary/10 border-b-[4px] border-foreground">
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <div className="w-8 h-8 bg-secondary border-[2px] border-foreground rounded-lg flex items-center justify-center">
                <Image className="w-4 h-4 text-secondary-foreground" />
              </div>
              Featured Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {featuredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/community?preview=${project.id}`}
                className="block group"
              >
                <div className="relative border-[3px] border-foreground rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[6px_6px_0px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
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
                  
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-accent text-accent-foreground border-[2px] border-foreground neo-shadow-sm font-bold">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Badge>
                  </div>
                  
                  <div className="p-3 bg-card border-t-[3px] border-foreground">
                    <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {project.name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">
                      {project.view_count} views
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            
            <Link
              to="/community"
              className="block w-full py-3 px-4 text-center font-bold text-sm bg-gradient-to-r from-primary/10 to-secondary/10 border-[3px] border-foreground rounded-xl shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:shadow-[5px_5px_0px_0px_hsl(var(--foreground))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
            >
              Browse All Templates →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
