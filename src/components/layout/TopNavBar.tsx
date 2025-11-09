import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Microscope, Menu } from 'lucide-react';
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
    <nav className="sticky top-0 z-50 w-full glass-card border-b border-border/40">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 group"
            >
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <Microscope className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
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
                    className="text-sm font-medium"
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
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => {
                    if (link.authRequired && !user) return null;
                    return (
                      <Button
                        key={link.path}
                        variant="ghost"
                        onClick={() => handleNavClick(link.path)}
                        className="justify-start text-base"
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
