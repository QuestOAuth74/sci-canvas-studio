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
    onError: () => {
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
    onError: () => {
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
    onError: () => {
      toast.error('Failed to delete notification');
    }
  });

  // Change password mutation
  const changePassword = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update to new password
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

    // Validate file type (only PNG and JPG)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PNG or JPG file only');
      return;
    }

    // Validate file size (max 500KB)
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
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen relative">
      {/* Paper aging effects */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-[hsl(var(--pencil-gray)_/_0.03)] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[hsl(var(--pencil-gray)_/_0.02)] to-transparent pointer-events-none" />
      
      {/* Hero Header with Banner - Notebook Style */}
      <div className="relative bg-card border-b-2 border-[hsl(var(--pencil-gray))] paper-shadow">
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-6 hover-lift"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Avatar - Polaroid Style */}
            <div className="relative group">
              <div className="p-3 bg-white border-2 border-[hsl(var(--pencil-gray))] shadow-lg rotate-[-2deg] group-hover:rotate-0 transition-transform">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
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
                    variant="sticky"
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
              <h1 className="text-4xl font-bold font-source-serif ink-text">
                {fullName || 'Your Name'}
              </h1>
              <p className="text-lg text-muted-foreground handwritten">
                {fieldOfStudy || 'Field of Study'} {country && `• ${country}`}
              </p>
              {quote && (
                <p className="text-sm italic text-muted-foreground max-w-2xl">
                  "{quote}"
                </p>
              )}
            </div>

            {/* Quick Stats - Sticky Notes */}
            <div className="flex gap-4">
              <div className="text-center p-4 bg-[hsl(var(--highlighter-yellow)_/_0.3)] border-2 border-[hsl(var(--highlighter-yellow))] shadow-md rotate-[-2deg]">
                <div className="text-2xl font-bold handwritten ink-text">{stats?.totalProjects || 0}</div>
                <div className="text-xs text-muted-foreground font-medium">Projects</div>
              </div>
              <div className="text-center p-4 bg-[hsl(var(--highlighter-yellow)_/_0.3)] border-2 border-[hsl(var(--highlighter-yellow))] shadow-md rotate-[1deg]">
                <div className="text-2xl font-bold handwritten ink-text">{stats?.totalImpact || 0}</div>
                <div className="text-xs text-muted-foreground font-medium">Impact</div>
              </div>
              <div className="text-center p-4 bg-[hsl(var(--highlighter-yellow)_/_0.3)] border-2 border-[hsl(var(--highlighter-yellow))] shadow-md rotate-[-1deg]">
                <div className="text-2xl font-bold handwritten ink-text">{stats?.totalCollaborations || 0}</div>
                <div className="text-xs text-muted-foreground font-medium">Collaborations</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <FeatureUnlockBanner />

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr,320px] gap-6 mt-6">
          {/* LEFT SIDEBAR - Stats & Activity */}
          <div className="space-y-6">
            {/* Stats Cards - Notebook Style */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2 handwritten text-base">
                ~ Your Stats ~
              </h3>
              
              <Card className="overflow-hidden border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover-lift smooth-transition rotate-[-1deg]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold ink-text">{stats?.totalProjects || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Projects</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover-lift smooth-transition rotate-[0.5deg]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
                      <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold ink-text">{stats?.totalViews || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Views</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover-lift smooth-transition rotate-[-0.5deg]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-md bg-pink-500/10 border border-pink-500/20">
                      <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold ink-text">{stats?.totalLikes || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Likes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover-lift smooth-transition rotate-[1deg]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-md bg-purple-500/10 border border-purple-500/20">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold ink-text">{stats?.totalCollaborations || 0}</div>
                      <div className="text-xs text-muted-foreground">Collaborations</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover-lift smooth-transition rotate-[-0.5deg]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/10">
                      <Copy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold">{stats?.totalClones || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Clones</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-3">
                  <div className="space-y-4">
                    {stats && stats.totalProjects > 0 ? (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">Created {stats.totalProjects} projects</p>
                            <p className="text-xs text-muted-foreground">Building your portfolio</p>
                          </div>
                        </div>
                        {stats.totalViews > 0 && (
                          <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">Gained {stats.totalViews} views</p>
                              <p className="text-xs text-muted-foreground">Your work is getting noticed</p>
                            </div>
                          </div>
                        )}
                        {stats.publicProjects > 0 && (
                          <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">Shared {stats.publicProjects} public projects</p>
                              <p className="text-xs text-muted-foreground">Contributing to the community</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                        <p className="text-xs text-muted-foreground">Start creating projects!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* CENTER COLUMN - Main Content */}
          <div className="space-y-6">
            
            <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>Manage your personal information and preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6 mt-0">
                {/* Form Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
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

                  {/* Email */}
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

                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger id="country" className="h-11 bg-background">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-[300px]">
                        {COUNTRIES.map((countryOption) => (
                          <SelectItem key={countryOption} value={countryOption}>
                            {countryOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Field of Study */}
                  <div className="space-y-2">
                    <Label htmlFor="fieldOfStudy" className="text-sm font-medium">Field of Study</Label>
                    <Select value={fieldOfStudy} onValueChange={setFieldOfStudy}>
                      <SelectTrigger id="fieldOfStudy" className="h-11 bg-background">
                        <SelectValue placeholder="Select your field of study" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {FIELDS_OF_STUDY.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quote */}
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {quote.length}/200 characters
                    </p>
                  </div>
                </div>

                {/* Author Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">Author Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief bio about yourself and your work. This will be displayed on your public author profile page..."
                    rows={5}
                    maxLength={500}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Your bio will be visible on your public author profile if you have approved community projects
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bio.length}/500 characters
                    </p>
                  </div>
                </div>

                {/* Password Section */}
                <div className="space-y-3 pt-6 border-t">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Password</Label>
                        <p className="text-sm text-muted-foreground">••••••••••••</p>
                      </div>
                    </div>
                    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="hover-scale">
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
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
                  className="w-full md:w-auto px-8 hover-scale"
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
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Bell className="h-5 w-5" />
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
                      className="hover-scale"
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
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <Card 
                          key={notification.id}
                          className={cn(
                            "smooth-transition hover-lift",
                            !notification.is_read && "border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent"
                          )}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {!notification.is_read && (
                                    <Badge variant="default" className="text-xs animate-pulse">New</Badge>
                                  )}
                                  <h4 className="font-semibold">{notification.subject}</h4>
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
                                    className="hover-scale"
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
                                  className="hover-scale"
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
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                      <BellOff className="h-8 w-8 text-muted-foreground/50" />
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

          {/* RIGHT COLUMN - Premium Features Sidebar */}
          {hasAccess && !featureAccessLoading && (
            <div className="lg:sticky lg:top-6 lg:self-start space-y-6">
              <Card className="overflow-hidden border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Premium Features</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Your unlocked tools
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* AI Figure Generator Card */}
                  <div className="group relative p-4 rounded-xl border bg-gradient-to-br from-background to-muted/10 hover:from-primary/5 hover:to-primary/10 smooth-transition hover-lift hover:border-primary/50 hover:shadow-lg">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 group-hover:from-primary/20 group-hover:to-primary/30 smooth-transition">
                          <Wand2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">AI Figure Generator</h3>
                          <Badge variant="secondary" className="text-xs mt-1">Premium</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Generate scientific figures from reference images using AI
                      </p>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => navigate('/canvas')}
                        className="w-full mt-1 hover-scale"
                      >
                        Open in Canvas
                      </Button>
                    </div>
                  </div>

                  {/* AI Icon Generator Card */}
                  <div className="group relative p-4 rounded-xl border bg-gradient-to-br from-background to-muted/10 hover:from-primary/5 hover:to-primary/10 smooth-transition hover-lift hover:border-primary/50 hover:shadow-lg">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 group-hover:from-primary/20 group-hover:to-primary/30 smooth-transition">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">AI Icon Generator</h3>
                          <Badge variant="secondary" className="text-xs mt-1">Premium</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Create custom scientific icons and symbols with AI
                      </p>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => navigate('/canvas')}
                        className="w-full mt-1 hover-scale"
                      >
                        Open in Canvas
                      </Button>
                    </div>
                  </div>

                  {/* PowerPoint Generator Card */}
                  <div className="group relative p-4 rounded-xl border bg-gradient-to-br from-background to-muted/10 hover:from-primary/5 hover:to-primary/10 smooth-transition hover-lift hover:border-primary/50 hover:shadow-lg">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 group-hover:from-primary/20 group-hover:to-primary/30 smooth-transition">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">PowerPoint Maker</h3>
                          <Badge variant="secondary" className="text-xs mt-1">Premium</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Convert your canvas designs into PowerPoint presentations
                      </p>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => navigate('/admin/powerpoint-generator')}
                        className="w-full mt-1 hover-scale"
                      >
                        Open Generator
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
