import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Home, LayoutGrid, Users, BookOpen, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { UserNotificationBell } from '@/components/UserNotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export const TopNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Gallery', url: '/projects', icon: LayoutGrid, authRequired: true },
    { name: 'Community', url: '/community', icon: Users },
    { name: 'Blog', url: '/blog', icon: BookOpen },
    ...(isAdmin ? [{ name: 'Admin', url: '/admin', icon: Settings }] : []),
  ];

  // Filter items based on auth status
  const filteredNavItems = navItems.filter(item => {
    if (item.authRequired) return !!user;
    return true;
  });

  const [activeTab, setActiveTab] = useState(filteredNavItems[0]?.name || '');

  useEffect(() => {
    const currentItem = filteredNavItems.find(item => location.pathname === item.url);
    if (currentItem) {
      setActiveTab(currentItem.name);
    }
  }, [location.pathname, filteredNavItems]);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#f9f6f0] ruled-lines border-b-2 border-[hsl(var(--pencil-gray))] paper-shadow">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between relative">
          {/* Margin line decoration */}
          <div className="margin-line" />
          
          {/* Left side - Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 group"
            >
              <img 
                src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                alt="BioSketch Logo"
                className="h-10 w-10 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-lg font-bold font-sans text-[hsl(var(--ink-blue))] group-hover:text-[hsl(var(--pencil-gray))] transition-colors">
                BioSketch
              </span>
            </button>
          </div>

          {/* Center - Tubelight Navigation */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-sm">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;

                return (
                  <Link
                    key={item.name}
                    to={item.url}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                      "relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-colors",
                      "text-foreground/80 hover:text-primary",
                      isActive && "bg-muted text-primary",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={16} strokeWidth={2.5} />
                      {item.name}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="lamp"
                        className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                          <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                          <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                          <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                        </div>
                      </motion.div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Notifications, User Menu */}
          <div className="flex items-center gap-3">
            {/* Admin Notification Bell */}
            {isAdmin && (
              <div className="hidden md:block">
                <AdminNotificationBell />
              </div>
            )}

            {/* User Notification Bell */}
            {user && (
              <div className="hidden md:block">
                <UserNotificationBell />
              </div>
            )}

            {/* User Menu or Sign In */}
            <UserMenu showName={true} />

            {/* Mobile Menu Toggle */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden pencil-button">
                  <Menu className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-[#f9f6f0] ruled-lines border-l-2 border-[hsl(var(--pencil-gray))]">
                <div className="flex flex-col gap-4 mt-8">
                  {filteredNavItems.map((item) => (
                    <Button
                      key={item.url}
                      variant="ghost"
                      onClick={() => handleNavClick(item.url)}
                      className="justify-start text-base text-[hsl(var(--ink-blue))] hover:bg-[hsl(var(--highlighter-yellow)_/_0.2)] pencil-sketch"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};