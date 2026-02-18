import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Home, LayoutGrid, Users, BookOpen, Settings, CreditCard } from 'lucide-react';
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
    { name: 'Pricing', url: '/pricing', icon: CreditCard },
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
    <nav className="sticky top-0 z-50 w-full bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group"
            >
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 group-hover:shadow-lg shadow-indigo-500/25 transition-all duration-300">
                <img
                  src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                  alt="BioSketch Logo"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                BioSketch
              </span>
            </button>
          </div>

          {/* Center - Navigation */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 bg-white/40 backdrop-blur-xl border border-white/30 py-1.5 px-2 rounded-xl">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;

                return (
                  <Link
                    key={item.name}
                    to={item.url}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                      "relative cursor-pointer text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200",
                      "text-muted-foreground hover:text-foreground",
                      isActive && "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={16} strokeWidth={2} />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Notifications, User Menu */}
          <div className="flex items-center gap-2">
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
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card border-l border-border">
                <div className="flex flex-col gap-2 mt-8">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">Navigation</p>
                  {filteredNavItems.map((item) => (
                    <Button
                      key={item.url}
                      variant={activeTab === item.name ? "secondary" : "ghost"}
                      onClick={() => handleNavClick(item.url)}
                      className="justify-start text-base"
                    >
                      <item.icon className="mr-3 h-4 w-4" />
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