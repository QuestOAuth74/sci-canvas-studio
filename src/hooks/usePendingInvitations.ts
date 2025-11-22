import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingInvitation {
  id: string;
  project_id: string;
  inviter_id: string;
  invitee_email: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  personal_message: string | null;
  project_name: string;
  inviter_name: string;
  inviter_avatar: string | null;
}

export function usePendingInvitations(userId: string | undefined, userEmail: string | undefined) {
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['pending-invitations', userId, userEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_collaboration_invitations')
        .select(`
          *,
          project:canvas_projects(name),
          inviter:profiles!project_collaboration_invitations_inviter_id_fkey(full_name, avatar_url)
        `)
        .or(`invitee_email.eq.${userEmail},invitee_id.eq.${userId}`)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((inv: any) => ({
        id: inv.id,
        project_id: inv.project_id,
        inviter_id: inv.inviter_id,
        invitee_email: inv.invitee_email,
        role: inv.role,
        status: inv.status,
        created_at: inv.created_at,
        expires_at: inv.expires_at,
        personal_message: inv.personal_message,
        project_name: inv.project?.name || 'Unknown Project',
        inviter_name: inv.inviter?.full_name || 'Unknown User',
        inviter_avatar: inv.inviter?.avatar_url || null,
      })) as PendingInvitation[];
    },
    enabled: !!(userId && userEmail),
  });

  const acceptInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const invitation = invitations?.find((inv) => inv.id === invitationId);
      if (!invitation) throw new Error('Invitation not found');

      // Create collaborator record
      const { error: collabError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: invitation.project_id,
          user_id: userId!,
          role: invitation.role,
          invited_by: invitation.inviter_id,
          accepted_at: new Date().toISOString(),
        });

      if (collabError) throw collabError;

      // Update invitation status
      const { error: inviteError } = await supabase
        .from('project_collaboration_invitations')
        .update({ 
          status: 'accepted',
          invitee_id: userId!,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (inviteError) throw inviteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast.success('Invitation accepted! You can now access the project.');
    },
    onError: (error: any) => {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    },
  });

  const declineInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('project_collaboration_invitations')
        .update({ 
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast.success('Invitation declined');
    },
    onError: (error: any) => {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    },
  });

  return {
    invitations: invitations || [],
    isLoading,
    acceptInvitation,
    declineInvitation,
  };
}
