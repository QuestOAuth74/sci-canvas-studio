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
import { Loader2, Upload, User as UserIcon, ArrowLeft, Bell, BellOff, Trash2, Lock, Sparkles, Wand2, FileText, Info, Mail, MessageSquare, AtSign, FolderOpen, Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { COUNTRIES, FIELDS_OF_STUDY } from '@/lib/constants';
import { FeatureUnlockBanner } from '@/components/community/FeatureUnlockBanner';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { PendingInvitations } from '@/components/profile/PendingInvitations';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStatsCard } from '@/components/profile/ProfileStatsCard';
import { ActivityTimeline } from '@/components/profile/ActivityTimeline';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAccess, isLoading: featureAccessLoading } = useFeatureAccess();
  const { invitations: pendingInvitations } = usePendingInvitations(user?.id, user?.email);
  const pendingInvitationsCount = pendingInvitations?.length || 0;
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

  // Fetch user project stats
  const { data: projectStats } = useQuery({
    queryKey: ['user-project-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canvas_projects')
        .select('id, approval_status, view_count, like_count, cloned_count')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const approved = data?.filter(p => p.approval_status === 'approved').length || 0;
      const totalViews = data?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;
      const totalLikes = data?.reduce((sum, p) => sum + (p.like_count || 0), 0) || 0;
      const totalClones = data?.reduce((sum, p) => sum + (p.cloned_count || 0), 0) || 0;
      
      return { total, approved, totalViews, totalLikes, totalClones };
    },
    enabled: !!user?.id
  });

  // Calculate profile completion
  const profileCompletion = (() => {
    let completed = 0;
    if (avatarUrl) completed += 25;
    if (fullName) completed += 20;
    if (country) completed += 15;
    if (fieldOfStudy) completed += 15;
    if (quote) completed += 12.5;
    if (bio) completed += 12.5;
    return Math.round(completed);
  })();

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 hover-scale"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Profile Header */}
        <ProfileHeader
          fullName={fullName}
          email={email}
          avatarUrl={avatarUrl}
          uploading={uploading}
          hasAccess={hasAccess}
          totalProjects={projectStats?.total || 0}
          approvedProjects={projectStats?.approved || 0}
          pendingInvitations={pendingInvitationsCount}
          profileCompletion={profileCompletion}
          onAvatarUpload={handleAvatarUpload}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr,320px] gap-6">
          {/* LEFT SIDEBAR - Stats Dashboard */}
          <div className="space-y-4">
            <ProfileStatsCard
              icon={FolderOpen}
              title="My Projects"
              value={projectStats?.total || 0}
              subtitle="Total created"
              gradient="from-blue-500 to-blue-600"
            />
            
            <ProfileStatsCard
              icon={Eye}
              title="Total Views"
              value={projectStats?.totalViews || 0}
              subtitle="Community impact"
              gradient="from-purple-500 to-purple-600"
            />
            
            <ProfileStatsCard
              icon={Heart}
              title="Total Likes"
              value={projectStats?.totalLikes || 0}
              subtitle="Project engagement"
              gradient="from-pink-500 to-pink-600"
            />

            <ActivityTimeline />
          </div>

          {/* CENTER COLUMN - Main Content */}
          <div className="space-y-6">
            <FeatureUnlockBanner />
            
            <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-heading-2">Profile Settings</CardTitle>
            <CardDescription>Manage your personal information and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 p-1">
                <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="invitations" className="gap-2 relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Mail className="h-4 w-4" />
                  Invitations
                  {pendingInvitationsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs absolute -top-1 -right-1"
                    >
                      {pendingInvitationsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2 relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Bell className="h-4 w-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs absolute -top-1 -right-1"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6 mt-6">
                {/* Profile Form in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-body-sm font-semibold">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="smooth-transition"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-body-sm font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="smooth-transition"
                    />
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-body-sm font-semibold">Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger id="country" className="bg-background smooth-transition">
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
                    <Label htmlFor="fieldOfStudy" className="text-body-sm font-semibold">Field of Study</Label>
                    <Select value={fieldOfStudy} onValueChange={setFieldOfStudy}>
                      <SelectTrigger id="fieldOfStudy" className="bg-background smooth-transition">
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

                {/* Quote - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="quote" className="text-body-sm font-semibold">Profile Quote</Label>
                  <Textarea
                    id="quote"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Share an inspiring quote or personal motto..."
                    rows={3}
                    maxLength={200}
                    className="smooth-transition resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-ui-caption text-muted-foreground">
                      {quote.length}/200 characters
                    </p>
                    <div className="h-1 w-32 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary smooth-transition"
                        style={{ width: `${(quote.length / 200) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Author Bio - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-body-sm font-semibold">Author Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief bio about yourself and your work. This will be displayed on your public author profile page..."
                    rows={5}
                    maxLength={500}
                    className="smooth-transition resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-ui-caption text-muted-foreground">
                      {bio.length}/500 characters
                    </p>
                    <div className="h-1 w-32 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary smooth-transition"
                        style={{ width: `${(bio.length / 500) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-ui-caption text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Your bio will be visible on your public author profile if you have approved community projects
                  </p>
                </div>

                {/* Password Section */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Password</Label>
                      <p className="text-sm text-muted-foreground">••••••••••••</p>
                    </div>
                    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
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

                {/* Save Button - Sticky */}
                <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border pt-6 mt-6">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-12 text-body font-semibold hover-scale"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="invitations" className="mt-6">
                <PendingInvitations />
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-body font-semibold text-foreground">
                      {notifications?.length || 0} Total Notifications
                    </p>
                    <p className="text-ui-caption text-muted-foreground">
                      {unreadCount} unread
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
                      {markAllAsRead.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <BellOff className="h-4 w-4 mr-2" />
                      )}
                      Mark all as read
                    </Button>
                  )}
                </div>
                
                {loadingNotifications ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {notifications.map((notification) => {
                        const isMention = notification.message.includes('@');
                        const isComment = notification.subject.toLowerCase().includes('comment');
                        
                        return (
                          <Card
                            key={notification.id}
                            className={cn(
                              "relative p-5 hover-lift smooth-transition",
                              !notification.is_read && "border-l-4 border-l-primary bg-primary/5"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div className={cn(
                                "p-2.5 rounded-lg flex-shrink-0",
                                isMention ? "bg-gradient-to-br from-orange-500 to-orange-600" :
                                isComment ? "bg-gradient-to-br from-green-500 to-green-600" :
                                "bg-gradient-to-br from-blue-500 to-blue-600"
                              )}>
                                {isMention ? <AtSign className="h-4 w-4 text-white" /> :
                                 isComment ? <MessageSquare className="h-4 w-4 text-white" /> :
                                 <Bell className="h-4 w-4 text-white" />}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-body text-foreground">{notification.subject}</h4>
                                  {!notification.is_read && (
                                    <Badge variant="default" className="h-5 px-2 text-xs">New</Badge>
                                  )}
                                </div>
                                <p className="text-body-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                                <div className="flex items-center gap-4 text-ui-caption text-muted-foreground">
                                  <span className="font-medium">From: {notification.sender_name}</span>
                                  <span>
                                    {formatDistanceToNow(new Date(notification.created_at || ''), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead.mutate(notification.id)}
                                    disabled={markAsRead.isPending}
                                    className="hover-scale"
                                    title="Mark as read"
                                  >
                                    <Bell className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification.mutate(notification.id)}
                                  disabled={deleteNotification.isPending}
                                  className="hover-scale"
                                  title="Delete notification"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <Card className="p-12 text-center border-dashed">
                    <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-body font-semibold text-foreground mb-1">No notifications yet</p>
                    <p className="text-body-sm text-muted-foreground">
                      You'll see notifications here when you receive collaboration invites, mentions, or comments
                    </p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
          </div>

          {/* RIGHT SIDEBAR - Premium Features */}
          <aside className="space-y-4">
            {!featureAccessLoading && !hasAccess && (
              <Card className="border-primary/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-body-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Unlock Premium Features
                  </CardTitle>
                  <CardDescription>
                    Get 3 approved public projects to unlock AI tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
                    <p className="text-display-2 font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                      {projectStats?.approved || 0} / 3
                    </p>
                    <p className="text-ui-caption text-muted-foreground">Approved Projects</p>
                  </div>
                  <p className="text-ui-caption text-muted-foreground leading-relaxed">
                    Submit projects to the community and get them approved to unlock premium access
                  </p>
                </CardContent>
              </Card>
            )}

            {hasAccess && !featureAccessLoading && (
              <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-body-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Premium Features
                  </CardTitle>
                  <CardDescription>
                    You have unlocked AI-powered tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-background rounded-xl hover-lift smooth-transition cursor-pointer"
                       onClick={() => navigate('/canvas')}>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                      <Wand2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-body-sm">AI Figure Generator</p>
                      <p className="text-ui-caption text-muted-foreground">Create complex scientific figures</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-background rounded-xl hover-lift smooth-transition cursor-pointer"
                       onClick={() => navigate('/canvas')}>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-body-sm">AI Icon Generator</p>
                      <p className="text-ui-caption text-muted-foreground">Generate custom icons</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-background rounded-xl hover-lift smooth-transition cursor-pointer"
                       onClick={() => navigate('/canvas')}>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-body-sm">PowerPoint Maker</p>
                      <p className="text-ui-caption text-muted-foreground">Convert figures to presentations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
