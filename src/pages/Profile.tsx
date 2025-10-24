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
import { Loader2, Upload, User as UserIcon, ArrowLeft, Bell, BellOff, Trash2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { COUNTRIES, FIELDS_OF_STUDY } from '@/lib/constants';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [quote, setQuote] = useState('');
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your personal information and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications" className="relative">
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
              
              <TabsContent value="profile" className="space-y-6 mt-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="text-2xl">
                      {initials || <UserIcon className="h-12 w-12" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Label htmlFor="avatar-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        asChild
                      >
                        <span>
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Avatar
                            </>
                          )}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={country}
                    onValueChange={setCountry}
                  >
                    <SelectTrigger id="country" className="bg-background">
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
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Select
                    value={fieldOfStudy}
                    onValueChange={setFieldOfStudy}
                  >
                    <SelectTrigger id="fieldOfStudy" className="bg-background">
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

                {/* Quote */}
                <div className="space-y-2">
                  <Label htmlFor="quote">Profile Quote</Label>
                  <Textarea
                    id="quote"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Share an inspiring quote or personal motto..."
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {quote.length}/200 characters
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

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
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
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Your Notifications</h3>
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
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <Card 
                          key={notification.id}
                          className={cn(
                            "neo-brutalist-shadow-sm transition-all",
                            !notification.is_read && "border-l-4 border-l-primary bg-primary/5"
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  {!notification.is_read && (
                                    <Badge variant="default" className="text-xs">New</Badge>
                                  )}
                                  <h4 className="font-semibold text-sm">{notification.subject}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>From: {notification.sender_name}</span>
                                  <span>•</span>
                                  <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
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
                  <div className="text-center py-12">
                    <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
