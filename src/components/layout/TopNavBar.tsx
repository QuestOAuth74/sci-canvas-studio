import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LayoutGrid, Users, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { UserNotificationBell } from '@/components/UserNotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavBar } from '@/components/ui/tubelight-navbar';

export const TopNavBar = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Gallery', url: '/projects', icon: LayoutGrid },
    { name: 'Community', url: '/community', icon: Users },
    { name: 'Blog', url: '/blog', icon: BookOpen },
    ...(isAdmin ? [{ name: 'Admin', url: '/admin', icon: Settings }] : []),
  ];

  // Filter items based on auth status
  const filteredNavItems = navItems.filter(item => {
    if (item.url === '/projects') return !!user;
    return true;
  });

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Tubelight Navigation Bar */}
      {filteredNavItems.length > 0 && (
        <NavBar items={filteredNavItems} />
      )}

      {/* Top Bar with Logo and User Menu */}
      <nav className="sticky top-0 z-40 w-full bg-[#f9f6f0] ruled-lines border-b-2 border-[hsl(var(--pencil-gray))] paper-shadow">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between relative">
            {/* Margin line decoration */}
            <div className="margin-line" />
            {/* Left side - Logo */}
            <div className="flex items-center gap-8">
              {/* Logo */}
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
    </>
  );
};
