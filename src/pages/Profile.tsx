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
    <div className="min-h-screen bg-background relative">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      
      {/* Hero Header */}
      <div className="relative bg-card/50 border-b border-border/50">
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="p-1 bg-card rounded-2xl border border-border/50 shadow-lg">
                <Avatar className="h-32 w-32 rounded-xl">
                  <AvatarImage src={avatarUrl} alt={fullName} className="rounded-xl" />
                  <AvatarFallback className="text-4xl rounded-xl bg-primary/10 text-primary">
                    {initials || <UserIcon className="h-16 w-16" />}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-2 -right-2 z-10">
                <Input
                  id="avatar-upload-header"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Label htmlFor="avatar-upload-header">
                  <Button
                    type="button"
                    size="icon"
                    className="h-10 w-10 rounded-full shadow-lg"
                    disabled={uploading}
                    onClick={() => document.getElementById('avatar-upload-header')?.click()}
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                    </span>
                  </Button>
                </Label>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">
                {fullName || 'Your Name'}
              </h1>
              <p className="text-lg text-muted-foreground">
                {fieldOfStudy || 'Field of Study'} {country && `• ${country}`}
              </p>
              {quote && (
                <p className="text-sm italic text-muted-foreground max-w-2xl">
                  "{quote}"
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3">
              <Card className="border border-border/50 bg-card hover:shadow-lg transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-serif font-semibold text-foreground">{stats?.totalProjects || 0}</div>
                  <div className="text-xs text-muted-foreground font-medium">Projects</div>
                </CardContent>
              </Card>
              <Card className="border border-border/50 bg-card hover:shadow-lg transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-serif font-semibold text-foreground">{stats?.totalImpact || 0}</div>
                  <div className="text-xs text-muted-foreground font-medium">Impact</div>
                </CardContent>
              </Card>
              <Card className="border border-border/50 bg-card hover:shadow-lg transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-serif font-semibold text-foreground">{stats?.totalCollaborations || 0}</div>
                  <div className="text-xs text-muted-foreground font-medium">Collaborations</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <FeatureUnlockBanner />

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr,300px] gap-6 mt-6">
          {/* LEFT SIDEBAR - Stats & Activity */}
          <div className="space-y-5">
            {/* Refined Stats Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Statistics
                </h3>
              </div>
              
              {/* Compact Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="group p-3.5 rounded-xl bg-gradient-to-br from-card to-muted/20 border border-border/40 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground leading-none">{stats?.totalProjects || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">Projects</div>
                    </div>
                  </div>
                </div>

                <div className="group p-3.5 rounded-xl bg-gradient-to-br from-card to-muted/20 border border-border/40 hover:border-emerald-500/40 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground leading-none">{stats?.totalViews || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">Views</div>
                    </div>
                  </div>
                </div>

                <div className="group p-3.5 rounded-xl bg-gradient-to-br from-card to-muted/20 border border-border/40 hover:border-rose-500/40 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground leading-none">{stats?.totalLikes || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">Likes</div>
                    </div>
                  </div>
                </div>

                <div className="group p-3.5 rounded-xl bg-gradient-to-br from-card to-muted/20 border border-border/40 hover:border-violet-500/40 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground leading-none">{stats?.totalCollaborations || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">Collabs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clone Stats - Full Width */}
              <div className="group p-3.5 rounded-xl bg-gradient-to-br from-card to-muted/20 border border-border/40 hover:border-amber-500/40 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Copy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-foreground leading-none">{stats?.totalClones || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">Times Cloned</div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      Impact Score
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline - Refined */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Activity
                </h3>
              </div>
              
              <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-muted/10 overflow-hidden">
                <ScrollArea className="h-[240px]">
                  <div className="p-4 space-y-4">
                    {stats && stats.totalProjects > 0 ? (
                      <>
                        <div className="flex gap-3 items-start">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FolderOpen className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground leading-tight">Created {stats.totalProjects} projects</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Building your portfolio</p>
                          </div>
                        </div>
                        
                        {stats.totalViews > 0 && (
                          <div className="flex gap-3 items-start">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">Gained {stats.totalViews} views</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Your work is getting noticed</p>
                            </div>
                          </div>
                        )}
                        
                        {stats.publicProjects > 0 && (
                          <div className="flex gap-3 items-start">
                            <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Award className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">Shared {stats.publicProjects} public projects</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Contributing to the community</p>
                            </div>
                          </div>
                        )}
                        
                        {stats.totalLikes > 0 && (
                          <div className="flex gap-3 items-start">
                            <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Heart className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">Received {stats.totalLikes} likes</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Community appreciation</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <Clock className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Start creating projects!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN - Main Content */}
          <div className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader className="border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-serif">
                      <UserCircle className="h-5 w-5 text-primary" />
                      Profile Settings
                    </CardTitle>
                    <CardDescription>Manage your personal information and preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="profile">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="relative">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="space-y-6 mt-0">
                    {/* Form Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger id="country" className="h-11">
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
                        <Label htmlFor="fieldOfStudy" className="text-sm font-medium">Field of Study</Label>
                        <Select value={fieldOfStudy} onValueChange={setFieldOfStudy}>
                          <SelectTrigger id="fieldOfStudy" className="h-11">
                            <SelectValue placeholder="Select your field of study" />
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
                      <Label htmlFor="quote" className="text-sm font-medium">Profile Quote</Label>
                      <Textarea
                        id="quote"
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        placeholder="Share an inspiring quote or personal motto..."
                        rows={3}
                        maxLength={200}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground text-right">{quote.length}/200</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm font-medium">Author Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Write a brief bio about yourself and your work..."
                        rows={5}
                        maxLength={500}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Visible on your public author profile
                        </p>
                        <p className="text-xs text-muted-foreground">{bio.length}/500</p>
                      </div>
                    </div>

                    {/* Password Section */}
                    <div className="space-y-3 pt-6 border-t border-border/50">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Password</Label>
                            <p className="text-sm text-muted-foreground">••••••••••••</p>
                          </div>
                        </div>
                        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Lock className="h-4 w-4 mr-2" />
                              Change
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Password</DialogTitle>
                              <DialogDescription>
                                Enter your current password and choose a new one.
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
                                  placeholder="Enter current password"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Enter new password"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                  id="confirm-password"
                                  type="password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="Confirm new password"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setPasswordDialogOpen(false);
                                  setCurrentPassword('');
                                  setNewPassword('');
                                  setConfirmPassword('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handlePasswordChange}
                                disabled={changePassword.isPending}
                              >
                                {changePassword.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  'Update Password'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Save Button */}
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      size="lg"
                      className="w-full md:w-auto px-8"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="notifications" className="space-y-4 mt-0">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-serif font-semibold flex items-center gap-2">
                          <Bell className="h-5 w-5 text-primary" />
                          Your Notifications
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAllAsRead.mutate()}
                          disabled={markAllAsRead.isPending}
                        >
                          <BellOff className="h-4 w-4 mr-2" />
                          Mark All Read
                        </Button>
                      )}
                    </div>
                    
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : notifications && notifications.length > 0 ? (
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-3">
                          {notifications.map((notification) => (
                            <Card 
                              key={notification.id}
                              className={cn(
                                "border border-border/50 hover:shadow-lg transition-all",
                                !notification.is_read && "border-l-4 border-l-primary bg-primary/5"
                              )}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {!notification.is_read && (
                                        <Badge variant="default" className="text-xs">New</Badge>
                                      )}
                                      <h4 className="font-semibold text-foreground">{notification.subject}</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {notification.sender_name}
                                      </span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    {!notification.is_read && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => markAsRead.mutate(notification.id)}
                                        disabled={markAsRead.isPending}
                                        title="Mark as read"
                                      >
                                        <Bell className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm('Are you sure you want to delete this notification?')) {
                                          deleteNotification.mutate(notification.id);
                                        }
                                      }}
                                      disabled={deleteNotification.isPending}
                                      title="Delete notification"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-16 space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                          <BellOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-muted-foreground">No notifications yet</p>
                          <p className="text-sm text-muted-foreground mt-1">When you receive notifications, they'll appear here</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Download Quota & Premium Features */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-5">
            <DownloadQuotaCard />
            <AIGenerationQuotaCard />
            
            {/* Premium Features - Refined */}
            {hasAccess && !featureAccessLoading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Premium Tools
                  </h3>
                </div>
                
                <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-muted/10 overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* AI Figure Generator */}
                    <div 
                      className="group p-3 rounded-lg border border-border/30 bg-card/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-200"
                      onClick={() => navigate('/canvas')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                          <Wand2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">AI Figure Generator</h4>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Pro</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Generate figures from references</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Icon Generator */}
                    <div 
                      className="group p-3 rounded-lg border border-border/30 bg-card/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-200"
                      onClick={() => navigate('/canvas')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-violet-500/10 transition-colors">
                          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">AI Icon Generator</h4>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Pro</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Create custom scientific icons</p>
                        </div>
                      </div>
                    </div>

                    {/* PowerPoint Generator */}
                    <div 
                      className="group p-3 rounded-lg border border-border/30 bg-card/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-200"
                      onClick={() => navigate('/admin/powerpoint-generator')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-amber-500/10 transition-colors">
                          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">PowerPoint Maker</h4>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Pro</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Convert designs to presentations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}