import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, ShieldCheck, Users, UserCircle, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NavigationTestIds } from '@/lib/test-ids';

interface UserMenuProps {
  showName?: boolean;
}

// Generate Gravatar URL from email
const getGravatarUrl = (email: string) => {
  const trimmedEmail = email.toLowerCase().trim();
  // Use identicon as default - Gravatar generates unique geometric pattern
  return `https://www.gravatar.com/avatar/${encodeURIComponent(trimmedEmail)}?d=identicon&s=80`;
};

export const UserMenu = ({ showName = false }: UserMenuProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch user profile to get uploaded avatar
  const { data: profile } = useQuery({
    queryKey: ['user-profile-avatar', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Priority: profile avatar > auth metadata avatar > gravatar
  const avatarUrl = profile?.avatar_url 
    || user?.user_metadata?.avatar_url 
    || (user?.email ? getGravatarUrl(user.email) : undefined);

  // Get user display name
  const displayName = user?.user_metadata?.full_name 
    ? user.user_metadata.full_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'User';

  // Get user initials
  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  if (!user) {
    return (
      <Button onClick={() => navigate('/auth')} variant="outline">
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {showName ? (
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted" data-testid={NavigationTestIds.USER_MENU_TRIGGER}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden lg:inline-block">
              Hi, {displayName}
            </span>
          </Button>
        ) : (
          <Button variant="outline" size="icon" className="rounded-full" data-testid={NavigationTestIds.USER_MENU_TRIGGER}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-card border-white/20 dark:border-white/10">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            {isAdmin && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Administrator
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <UserCircle className="mr-2 h-4 w-4" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/community')}>
          <Users className="mr-2 h-4 w-4" />
          Community Gallery
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-submissions')}>
          <Upload className="mr-2 h-4 w-4" />
          My Icon Submissions
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <Settings className="mr-2 h-4 w-4" />
            Admin Panel
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} data-testid={NavigationTestIds.SIGNOUT_BUTTON}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
