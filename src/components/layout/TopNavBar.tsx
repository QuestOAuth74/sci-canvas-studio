import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { UserNotificationBell } from '@/components/UserNotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const TopNavBar = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Gallery', path: '/projects', authRequired: true },
    { label: 'Community', path: '/community', authRequired: false },
    { label: 'Blog', path: '/blog', authRequired: false },
  ];

  if (isAdmin) {
    navLinks.push({ label: 'Admin', path: '/admin', authRequired: true });
  }

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
          {/* Left side - Logo and Navigation */}
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
              <span className="text-lg font-bold font-['Caveat'] text-[hsl(var(--ink-blue))] group-hover:text-[hsl(var(--pencil-gray))] transition-colors">
                BioSketch
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                if (link.authRequired && !user) return null;
                return (
                  <Button
                    key={link.path}
                    variant="ghost"
                    onClick={() => handleNavClick(link.path)}
                    className="text-sm font-medium text-[hsl(var(--ink-blue))] hover:bg-[hsl(var(--highlighter-yellow)_/_0.2)] hover:text-[hsl(var(--pencil-gray))] transition-all pencil-sketch"
                  >
                    {link.label}
                  </Button>
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
                  {navLinks.map((link) => {
                    if (link.authRequired && !user) return null;
                    return (
                      <Button
                        key={link.path}
                        variant="ghost"
                        onClick={() => handleNavClick(link.path)}
                        className="justify-start text-base text-[hsl(var(--ink-blue))] hover:bg-[hsl(var(--highlighter-yellow)_/_0.2)] pencil-sketch"
                      >
                        {link.label}
                      </Button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
