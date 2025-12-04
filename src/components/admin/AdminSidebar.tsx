import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  MessageSquare,
  BookOpen,
  Upload,
  Users,
  ImagePlus,
  Package,
  FileText,
  Shield,
  Tags,
  MessageCircle,
  Star,
  LineChart,
  Megaphone,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

const menuItems: MenuGroup[] = [
  {
    group: "Management",
    items: [
      { id: 'announcements', label: 'Announcements', icon: Megaphone },
      { id: 'submitted-projects', label: 'Submitted Projects', icon: FolderKanban },
      { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    ]
  },
  {
    group: "Blog",
    items: [
      { id: 'blog-management', label: 'Blog Management', icon: BookOpen, route: '/admin/blog' },
    ]
  },
  {
    group: "Community",
    items: [
      { id: 'community-metrics', label: 'Metrics Inflator', icon: LineChart },
      { id: 'icon-submissions', label: 'Icon Submissions', icon: Upload },
      { id: 'community-uploads', label: 'Community Uploads', icon: Users },
    ]
  },
  {
    group: "Icons",
    items: [
      { id: 'upload-icons', label: 'Upload Icons', icon: ImagePlus },
      { id: 'icon-cleanup', label: 'Icon Cleanup', icon: Shield },
      { id: 'thumbnail-generator', label: 'Thumbnails', icon: Package },
      { id: 'manage-icons', label: 'Manage Icons', icon: Package },
      { id: 'clean-names', label: 'Clean Names', icon: FileText },
      { id: 'icon-sanitizer', label: 'Sanitizer', icon: Shield },
      { id: 'categories', label: 'Categories', icon: Tags },
    ]
  },
  {
    group: "Support",
    items: [
      { id: 'contact-messages', label: 'Contact Messages', icon: MessageCircle },
      { id: 'tool-feedback', label: 'Tool Feedback', icon: Star },
    ]
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('submitted-projects');

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    const sections = menuItems.flatMap(group => group.items).map(item => item.id);
    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.route) {
      navigate(item.route);
    } else {
      scrollToSection(item.id);
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        {menuItems.map(group => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(item => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "hover:bg-muted/50 cursor-pointer",
                        activeSection === item.id && !item.route && "bg-muted text-primary font-medium"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
