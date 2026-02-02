import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Share2, Mail, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

const shareSchema = z.object({
  senderName: z.string().max(100, 'Name must be less than 100 characters').optional(),
  recipientName: z.string().min(2, 'Recipient name is required').max(100, 'Name must be less than 100 characters'),
  recipientEmail: z.string().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  personalMessage: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

interface ShareWithColleagueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareWithColleagueDialog({ open, onOpenChange }: ShareWithColleagueDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    senderName: user?.user_metadata?.full_name || '',
    recipientName: '',
    recipientEmail: '',
    personalMessage: "I've been using BioSketch for my scientific illustrations and thought you might find it useful too! It's completely free and has made creating diagrams so much easier.",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = shareSchema.parse(formData);

      setIsSubmitting(true);

      const { data, error } = await supabase.functions.invoke('send-share-email', {
        body: {
          senderName: validatedData.senderName || 'A BioSketch User',
          recipientName: validatedData.recipientName,
          recipientEmail: validatedData.recipientEmail,
          personalMessage: validatedData.personalMessage || '',
        },
      });

      if (error) {
        console.error('Error sending share email:', error);
        toast.error('Failed to send email. Please try again.');
        return;
      }

      toast.success(`BioSketch shared successfully with ${validatedData.recipientName}!`);

      setFormData({
        senderName: user?.user_metadata?.full_name || '',
        recipientName: '',
        recipientEmail: '',
        personalMessage: "I've been using BioSketch for my scientific illustrations and thought you might find it useful too! It's completely free and has made creating diagrams so much easier.",
      });

      onOpenChange(false);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('Error sharing:', error);
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Share2 className="h-5 w-5" />
            Share with Colleague
          </DialogTitle>
          <DialogDescription>
            Invite a colleague to try BioSketch. We'll send them an email with information about the tool.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="senderName" className="font-medium">Your Name (Optional)</Label>
            <Input
              id="senderName"
              placeholder="Your name"
              value={formData.senderName}
              onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName" className="font-medium">Colleague's Name *</Label>
            <Input
              id="recipientName"
              placeholder="Who do you want to share BioSketch with?"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientEmail" className="font-medium">Colleague's Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="colleague@university.edu"
              value={formData.recipientEmail}
              onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
              required
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personalMessage" className="font-medium">Personal Message (Optional)</Label>
            <Textarea
              id="personalMessage"
              placeholder="Add a personal note..."
              value={formData.personalMessage}
              onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.personalMessage.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
