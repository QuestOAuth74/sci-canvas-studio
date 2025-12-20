import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, Image, ChevronRight, Sparkles } from "lucide-react";
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
    <div className="space-y-6">
      {/* Table of Contents - Modern Academic */}
      {headings.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              <List className="w-4 h-4" />
              Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <nav className="space-y-0.5">
              {headings.map((heading, index) => (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={`
                    group w-full text-left py-2 px-3 rounded-md text-sm transition-all duration-200
                    ${activeId === heading.id 
                      ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                    ${heading.level === 2 ? 'pl-3' : heading.level === 3 ? 'pl-6' : 'pl-9'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${activeId === heading.id ? 'text-primary' : 'text-muted-foreground/50'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="line-clamp-2">{heading.text}</span>
                  </span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      )}

      {/* Featured Templates - Modern Grid */}
      {featuredProjects.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              Featured Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {featuredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/community?preview=${project.id}`}
                className="group block"
              >
                <div className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {project.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {project.view_count.toLocaleString()} views
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                </div>
              </Link>
            ))}
            
            <Link
              to="/community"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mt-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
            >
              Browse All Templates
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
