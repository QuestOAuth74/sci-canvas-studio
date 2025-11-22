import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';

const invitationSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
    .toLowerCase(),
  role: z.enum(['viewer', 'editor', 'admin'], {
    required_error: "Please select a role"
  }),
  personalMessage: z.string()
    .trim()
    .max(500, { message: "Message must be less than 500 characters" })
    .optional()
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface InviteCollaboratorDialogProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteCollaboratorDialog({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess
}: InviteCollaboratorDialogProps) {
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('editor');
  const [personalMessage, setPersonalMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const checkEmailExists = async (email: string) => {
    if (!email.trim()) {
      setEmailExists(null);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailExists(null);
      return;
    }

    setCheckingEmail(true);
    try {
      // Check if user exists with this email
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Error checking email:', error);
        setEmailExists(null);
        return;
      }

      setEmailExists(!!data);
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailExists(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleEmailBlur = () => {
    if (inviteeEmail.trim()) {
      checkEmailExists(inviteeEmail);
    }
  };

  const handleEmailChange = (value: string) => {
    setInviteeEmail(value);
    setEmailExists(null);
    if (validationErrors.email) {
      setValidationErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      invitationSchema.parse({
        email: inviteeEmail,
        role,
        personalMessage
      });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSendInvitation = async () => {
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to send invitations');
        return;
      }

      // Check if trying to invite yourself
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profile?.email.toLowerCase() === inviteeEmail.toLowerCase()) {
        toast.error('You cannot invite yourself to collaborate');
        return;
      }

      // Check if user is already a collaborator
      const { data: existingCollab } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingCollab) {
        toast.error('This user is already a collaborator on this project');
        return;
      }

      // Check for existing pending invitation
      const { data: existingInvite } = await supabase
        .from('project_collaboration_invitations')
        .select('id')
        .eq('project_id', projectId)
        .eq('invitee_email', inviteeEmail.toLowerCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existingInvite) {
        toast.error('A pending invitation already exists for this email');
        return;
      }

      // Create invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from('project_collaboration_invitations')
        .insert({
          project_id: projectId,
          inviter_id: user.id,
          invitee_email: inviteeEmail.toLowerCase(),
          role,
          personal_message: personalMessage.trim() || null
        })
        .select()
        .single();

      if (inviteError) {
        throw inviteError;
      }

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke(
        'send-collaboration-invitation',
        { body: { invitationId: invitation.id } }
      );

      if (emailError) {
        console.warn('Email sending failed, but invitation created:', emailError);
        toast.warning('Invitation created, but email notification failed. The user can still accept from their dashboard.');
      } else {
        toast.success(
          emailExists 
            ? 'Invitation sent! The collaborator will receive an email notification.'
            : 'Invitation sent! If the user signs up with this email, they\'ll see the invitation.'
        );
      }

      onSuccess();
      onClose();
      
      // Reset form
      setInviteeEmail('');
      setPersonalMessage('');
      setRole('editor');
      setEmailExists(null);
      setValidationErrors({});
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
      // Reset form after closing animation
      setTimeout(() => {
        setInviteeEmail('');
        setPersonalMessage('');
        setRole('editor');
        setEmailExists(null);
        setValidationErrors({});
      }, 200);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Collaborator
          </DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on "{projectName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={inviteeEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="colleague@university.edu"
                disabled={sending}
                className={validationErrors.email ? 'border-destructive' : ''}
              />
              {checkingEmail && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {validationErrors.email && (
              <p className="text-sm text-destructive">{validationErrors.email}</p>
            )}
            {emailExists === true && !validationErrors.email && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  ✓ User found! They'll receive an email invitation.
                </AlertDescription>
              </Alert>
            )}
            {emailExists === false && !validationErrors.email && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  This email is not registered yet. They'll receive the invitation when they sign up.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Collaboration Role <span className="text-destructive">*</span>
            </Label>
            <Select value={role} onValueChange={(value: any) => setRole(value)} disabled={sending}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Viewer</span>
                    <span className="text-xs text-muted-foreground">Can view and comment only</span>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Editor</span>
                    <span className="text-xs text-muted-foreground">Can edit canvas and add comments</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">Full access + can manage collaborators</span>
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
              onChange={(e) => {
                setPersonalMessage(e.target.value);
                if (validationErrors.personalMessage) {
                  setValidationErrors(prev => {
                    const { personalMessage, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              placeholder="Add a personal note to your invitation..."
              rows={3}
              maxLength={500}
              disabled={sending}
              className={validationErrors.personalMessage ? 'border-destructive' : ''}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {personalMessage.length}/500 characters
              </p>
              {validationErrors.personalMessage && (
                <p className="text-xs text-destructive">{validationErrors.personalMessage}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSendInvitation} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
