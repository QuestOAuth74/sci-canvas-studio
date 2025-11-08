import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Bell, FolderOpen, MessageSquare, Image, Mail, MessageCircle, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationItemProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}

const NotificationItem = ({ icon, label, count, onClick }: NotificationItemProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <Badge variant="secondary" className="text-xs">
      {count}
    </Badge>
  </button>
);

export const AdminNotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [pendingProjects, setPendingProjects] = useState(0);
  const [pendingTestimonials, setPendingTestimonials] = useState(0);
  const [pendingIconSubmissions, setPendingIconSubmissions] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [totalFeedback, setTotalFeedback] = useState(0);

  const totalCount = 
    pendingProjects + 
    pendingTestimonials + 
    pendingIconSubmissions + 
    unreadMessages + 
    totalFeedback;

  const fetchCounts = async () => {
    // Fetch pending projects
    const { count: projectsCount } = await supabase
      .from('canvas_projects')
      .select('id', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    // Fetch pending testimonials
    const { count: testimonialsCount } = await supabase
      .from('testimonials')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', false);

    // Fetch pending icon submissions
    const { count: iconsCount } = await supabase
      .from('icon_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    // Fetch unread contact messages
    const { count: messagesCount } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    // Fetch unviewed tool feedback
    const { count: feedbackCount } = await supabase
      .from('tool_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('is_viewed', false);

    setPendingProjects(projectsCount || 0);
    setPendingTestimonials(testimonialsCount || 0);
    setPendingIconSubmissions(iconsCount || 0);
    setUnreadMessages(messagesCount || 0);
    setTotalFeedback(feedbackCount || 0);
  };

  useEffect(() => {
    fetchCounts();

    // Set up real-time subscriptions
    const projectsChannel = supabase
      .channel('admin-projects-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'canvas_projects'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    const testimonialsChannel = supabase
      .channel('admin-testimonials-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'testimonials'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    const iconsChannel = supabase
      .channel('admin-icon-submissions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'icon_submissions'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('admin-contact-messages-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contact_messages'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    const feedbackChannel = supabase
      .channel('admin-tool-feedback-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tool_feedback'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(testimonialsChannel);
      supabase.removeChannel(iconsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(feedbackChannel);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    setOpen(false);
  };

  const clearAllNotifications = async () => {
    try {
      const promises = [];
      
      // Mark all unread contact messages as read
      if (unreadMessages > 0) {
        promises.push(
          supabase
            .from('contact_messages')
            .update({ is_read: true })
            .eq('is_read', false)
        );
      }
      
      // Mark all unviewed tool feedback as viewed
      if (totalFeedback > 0) {
        promises.push(
          supabase
            .from('tool_feedback')
            .update({ is_viewed: true })
            .eq('is_viewed', false)
        );
      }
      
      // Execute all updates
      if (promises.length > 0) {
        await Promise.all(promises);
        
        toast.success('Notifications cleared', {
          description: `Marked ${unreadMessages} messages and ${totalFeedback} feedback as viewed`
        });
        
        // Refresh counts
        fetchCounts();
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications', {
        description: 'Please try again'
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          title="Admin Notifications"
        >
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {totalCount > 99 ? '99+' : totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Pending Reviews</h3>
            <Badge variant="secondary">{totalCount}</Badge>
          </div>
          
          <Separator />
          
          {totalCount > 0 ? (
            <>
              <div className="space-y-2">
                {pendingProjects > 0 && (
                  <NotificationItem
                    icon={<FolderOpen className="h-4 w-4" />}
                    label="Submitted Projects"
                    count={pendingProjects}
                    onClick={() => scrollToSection('submitted-projects')}
                  />
                )}
                
                {pendingTestimonials > 0 && (
                  <NotificationItem
                    icon={<MessageSquare className="h-4 w-4" />}
                    label="Testimonials"
                    count={pendingTestimonials}
                    onClick={() => scrollToSection('testimonials')}
                  />
                )}
                
                {pendingIconSubmissions > 0 && (
                  <NotificationItem
                    icon={<Image className="h-4 w-4" />}
                    label="Icon Submissions"
                    count={pendingIconSubmissions}
                    onClick={() => scrollToSection('icon-submissions')}
                  />
                )}
                
                {unreadMessages > 0 && (
                  <NotificationItem
                    icon={<Mail className="h-4 w-4" />}
                    label="Contact Messages"
                    count={unreadMessages}
                    onClick={() => scrollToSection('contact-messages')}
                  />
                )}
                
                {totalFeedback > 0 && (
                  <NotificationItem
                    icon={<MessageCircle className="h-4 w-4" />}
                    label="Tool Feedback"
                    count={totalFeedback}
                    onClick={() => scrollToSection('tool-feedback')}
                  />
                )}
              </div>
              
              {(unreadMessages > 0 || totalFeedback > 0) && (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={clearAllNotifications}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Clear All Notifications
                  </Button>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending items</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
