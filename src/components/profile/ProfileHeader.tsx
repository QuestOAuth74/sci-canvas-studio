import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Upload, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileHeaderProps {
  fullName: string;
  email: string;
  avatarUrl: string;
  uploading: boolean;
  hasAccess: boolean;
  totalProjects: number;
  approvedProjects: number;
  pendingInvitations: number;
  profileCompletion: number;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileHeader({
  fullName,
  email,
  avatarUrl,
  uploading,
  hasAccess,
  totalProjects,
  approvedProjects,
  pendingInvitations,
  profileCompletion,
  onAvatarUpload,
}: ProfileHeaderProps) {
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Hero Banner with Gradient */}
      <div className="h-48 bg-gradient-to-br from-primary via-primary/80 to-accent relative">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative -mt-20 px-8 pb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
          {/* Avatar */}
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-4xl bg-muted">
                {initials || <User className="h-16 w-16" />}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload Overlay */}
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 smooth-transition flex items-center justify-center cursor-pointer">
              <Input
                id="avatar-upload-header"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={onAvatarUpload}
                className="hidden"
              />
              <Label htmlFor="avatar-upload-header" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-white" />
                )}
              </Label>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-heading-1 font-bold text-foreground">{fullName || 'User Profile'}</h1>
              {hasAccess && (
                <Badge variant="gradient" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Premium Access
                </Badge>
              )}
            </div>
            <p className="text-body text-muted-foreground">{email}</p>

            {/* Profile Completion */}
            <div className="space-y-2 max-w-md">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-muted-foreground">Profile Completion</span>
                <span className="font-semibold text-foreground">{profileCompletion}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent smooth-transition"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg">
            <div className="text-center">
              <div className="text-heading-2 font-bold text-foreground">{totalProjects}</div>
              <div className="text-ui-caption text-muted-foreground">Projects</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-heading-2 font-bold text-foreground">{approvedProjects}</div>
              <div className="text-ui-caption text-muted-foreground">Approved</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-heading-2 font-bold text-foreground">{pendingInvitations}</div>
              <div className="text-ui-caption text-muted-foreground">Invites</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
