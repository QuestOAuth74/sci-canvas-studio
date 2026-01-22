import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload, User as UserIcon, ArrowLeft, Bell, BellOff, Trash2, Lock, Sparkles, Wand2, FileText, Info, UserCircle, FolderOpen, Users, Eye, Heart, Copy, Mail, Clock, TrendingUp, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { COUNTRIES, FIELDS_OF_STUDY } from '@/lib/constants';
import { FeatureUnlockBanner } from '@/components/community/FeatureUnlockBanner';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { DownloadQuotaCard } from '@/components/profile/DownloadQuotaCard';
import { AIGenerationQuotaCard } from '@/components/profile/AIGenerationQuotaCard';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAccess, isLoading: featureAccessLoading } = useFeatureAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [quote, setQuote] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [country, setCountry] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      const [projectsRes, collaborationsRes] = await Promise.all([
        supabase
          .from('canvas_projects')
          .select('id, view_count, like_count, cloned_count, is_public', { count: 'exact' })
          .eq('user_id', user?.id),
        supabase
          .from('project_collaborators')
          .select('id', { count: 'exact' })
          .eq('user_id', user?.id)
          .not('accepted_at', 'is', null)
      ]);

      const projects = projectsRes.data || [];
      const totalProjects = projects.length;
      const publicProjects = projects.filter(p => p.is_public).length;
      const totalViews = projects.reduce((sum, p) => sum + (p.view_count || 0), 0);
      const totalLikes = projects.reduce((sum, p) => sum + (p.like_count || 0), 0);
      const totalClones = projects.reduce((sum, p) => sum + (p.cloned_count || 0), 0);
      const totalCollaborations = collaborationsRes.count || 0;

      return {
        totalProjects,
        publicProjects,
        totalViews,
        totalLikes,
        totalClones,
        totalCollaborations,
        totalImpact: totalViews + totalLikes + totalClones
      };
    },
    enabled: !!user?.id
  });

  // Fetch user notifications
  const { data: notifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  // Mark notification as read mutation
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] });
      toast.success('Notification marked as read');
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  });

  // Mark all as read mutation
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] });
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  });

  // Delete notification mutation
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] });
      toast.success('Notification deleted');
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  });

  // Change password mutation
  const changePassword = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    }
  });

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    changePassword.mutate({ currentPassword, newPassword });
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setEmail(data.email || user?.email || '');
        setQuote(data.quote || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setCountry(data.country || '');
        setFieldOfStudy(data.field_of_study || '');
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PNG or JPG file only');
      return;
    }

    if (file.size > 500 * 1024) {
      toast.error('Image must be less than 500KB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-assets')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email: email,
          quote: quote,
          bio: bio,
          avatar_url: avatarUrl,
          country: country,
          field_of_study: fieldOfStudy,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <div className="border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Profile Header - Minimal */}
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-20 w-20 rounded-2xl border-2 border-border/50">
                <AvatarImage src={avatarUrl} alt={fullName} className="rounded-2xl" />
                <AvatarFallback className="text-2xl rounded-2xl bg-muted text-muted-foreground">
                  {initials || <UserIcon className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <Input
                id="avatar-upload-header"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => document.getElementById('avatar-upload-header')?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {fullName || 'Your Name'}
              </h1>
              <p className="text-muted-foreground">
                {fieldOfStudy}{fieldOfStudy && country && ' · '}{country}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-semibold text-foreground">{stats?.totalProjects || 0}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-foreground">{stats?.totalViews || 0}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-foreground">{stats?.totalLikes || 0}</p>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <FeatureUnlockBanner />

        {/* Two Column Layout - Simplified */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8 mt-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Profile Tab Switcher */}
            <div className="flex rounded-lg bg-muted/50 p-1 w-fit">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="bg-transparent p-0 h-auto gap-1">
                  <TabsTrigger 
                    value="profile" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm"
                  >
                    Profile
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm relative"
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6 space-y-6">
                  {/* Form */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm text-muted-foreground">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className="h-11 border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="h-11 border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm text-muted-foreground">Country</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger id="country" className="h-11 border-border/50">
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {COUNTRIES.map((countryOption) => (
                              <SelectItem key={countryOption} value={countryOption}>
                                {countryOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fieldOfStudy" className="text-sm text-muted-foreground">Field of Study</Label>
                        <Select value={fieldOfStudy} onValueChange={setFieldOfStudy}>
                          <SelectTrigger id="fieldOfStudy" className="h-11 border-border/50">
                            <SelectValue placeholder="Select your field" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELDS_OF_STUDY.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quote" className="text-sm text-muted-foreground">Profile Quote</Label>
                      <Textarea
                        id="quote"
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        placeholder="Share an inspiring quote..."
                        rows={2}
                        className="resize-none border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm text-muted-foreground">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="resize-none border-border/50"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button onClick={handleSave} disabled={saving} className="h-10">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="h-10">
                            <Lock className="h-4 w-4 mr-2" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Enter your current password and a new password.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="current-password">Current Password</Label>
                              <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                              <Input
                                id="confirm-new-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handlePasswordChange} disabled={changePassword.isPending}>
                              {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Update Password
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                  <div className="space-y-4">
                    {unreadCount > 0 && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAllAsRead.mutate()}
                          disabled={markAllAsRead.isPending}
                          className="text-muted-foreground"
                        >
                          Mark all as read
                        </Button>
                      </div>
                    )}
                    
                    <ScrollArea className="h-[400px]">
                      {loadingNotifications ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : notifications && notifications.length > 0 ? (
                        <div className="space-y-2">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                "p-4 rounded-lg border transition-colors",
                                notification.is_read 
                                  ? "bg-background border-border/50" 
                                  : "bg-muted/30 border-border"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">{notification.subject}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {!notification.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => markAsRead.mutate(notification.id)}
                                    >
                                      <Bell className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => deleteNotification.mutate(notification.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <BellOff className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Sidebar - Quotas & Stats */}
          <div className="space-y-6">
            <DownloadQuotaCard />
            <AIGenerationQuotaCard />
            
            {/* Stats Summary */}
            <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Activity</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Public projects</span>
                  <span className="text-sm font-medium text-foreground">{stats?.publicProjects || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Collaborations</span>
                  <span className="text-sm font-medium text-foreground">{stats?.totalCollaborations || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total clones</span>
                  <span className="text-sm font-medium text-foreground">{stats?.totalClones || 0}</span>
                </div>
              </div>
            </div>

            {/* Premium Features */}
            {hasAccess && !featureAccessLoading && (
              <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Premium Tools</p>
                <div className="space-y-2">
                  <button 
                    onClick={() => navigate('/canvas')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors text-left"
                  >
                    <Wand2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">AI Figure Generator</span>
                  </button>
                  <button 
                    onClick={() => navigate('/canvas')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors text-left"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">AI Icon Generator</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}