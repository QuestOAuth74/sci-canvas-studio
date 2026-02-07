import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, X, UserPlus, Crown, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type LabRole = Database['public']['Enums']['lab_role'];

interface LabInviteDialogProps {
  labId: string;
  labName: string;
  isOpen: boolean;
  onClose: () => void;
  onInvitesSent?: () => void;
}

const roleDescriptions: Record<Exclude<LabRole, 'owner'>, string> = {
  admin: 'Can manage members, invitations, and lab settings',
  member: 'Can view and collaborate on lab projects',
};

export function LabInviteDialog({
  labId,
  labName,
  isOpen,
  onClose,
  onInvitesSent,
}: LabInviteDialogProps) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState<Exclude<LabRole, 'owner'>>('member');
  const [personalMessage, setPersonalMessage] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (trimmed && validateEmail(trimmed) && !emails.includes(trimmed)) {
      if (emails.length >= 10) {
        toast.error('Maximum 10 invitations at a time');
        return;
      }
      setEmails([...emails, trimmed]);
      setEmailInput('');
    } else if (trimmed && !validateEmail(trimmed)) {
      toast.error('Please enter a valid email address');
    } else if (emails.includes(trimmed)) {
      toast.error('This email is already in the list');
    }
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSendInvites = async () => {
    if (!user) {
      toast.error('You must be logged in to send invites');
      return;
    }

    if (emails.length === 0) {
      toast.error('Please add at least one email address');
      return;
    }

    setSending(true);
    try {
      // Create invitations for each email
      const invitations = emails.map((email) => ({
        lab_id: labId,
        email,
        role,
        personal_message: personalMessage.trim() || null,
        invited_by: user.id,
      }));

      const { error } = await supabase.from('lab_invitations').insert(invitations);

      if (error) throw error;

      toast.success(
        `${emails.length} invitation${emails.length > 1 ? 's' : ''} sent successfully`
      );
      onInvitesSent?.();
      handleClose();
    } catch (error: any) {
      console.error('Error sending invites:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('Some invitations already exist for these emails');
      } else {
        toast.error(error.message || 'Failed to send invitations');
      }
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setEmails([]);
    setEmailInput('');
    setRole('member');
    setPersonalMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite to {labName}
          </DialogTitle>
          <DialogDescription>
            Send email invitations to add members to your lab
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="emails">
              Email Addresses <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="emails"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter email and press Enter"
                disabled={emails.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addEmail}
                disabled={emails.length >= 10}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {emails.length}/10 emails added
            </p>

            {/* Email List */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted rounded-lg">
                {emails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="gap-1 pl-2 pr-1 py-1"
                  >
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:text-destructive rounded-full p-0.5 hover:bg-background"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as Exclude<LabRole, 'owner'>)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Member</div>
                      <div className="text-xs text-muted-foreground">
                        {roleDescriptions.member}
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-muted-foreground">
                        {roleDescriptions.admin}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Personal Message <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="message"
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Add a personal note to your invitation..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {personalMessage.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSendInvites} disabled={sending || emails.length === 0}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send {emails.length} Invitation{emails.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
