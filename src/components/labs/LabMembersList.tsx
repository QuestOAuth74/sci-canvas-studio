import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Crown, Shield, User, UserMinus, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type LabRole = Database['public']['Enums']['lab_role'];
type LabMemberStatus = Database['public']['Enums']['lab_member_status'];

interface LabMember {
  id: string;
  user_id: string;
  role: LabRole;
  status: LabMemberStatus;
  joined_at: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

interface LabMembersListProps {
  labId: string;
  currentUserRole: LabRole;
  onMembersChange?: () => void;
}

const roleIcons: Record<LabRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleColors: Record<LabRole, string> = {
  owner: 'bg-amber-100 text-amber-800 border-amber-300',
  admin: 'bg-blue-100 text-blue-800 border-blue-300',
  member: 'bg-gray-100 text-gray-800 border-gray-300',
};

export function LabMembersList({ labId, currentUserRole, onMembersChange }: LabMembersListProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<LabMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'remove' | 'promote' | 'demote';
    member: LabMember | null;
  }>({ open: false, type: 'remove', member: null });

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  useEffect(() => {
    loadMembers();
  }, [labId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lab_members')
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          profile:profiles (
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('lab_id', labId)
        .eq('status', 'active')
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Sort: owner first, then admins, then members
      const sortedMembers = (data || []).sort((a, b) => {
        const roleOrder: Record<LabRole, number> = { owner: 0, admin: 1, member: 2 };
        return roleOrder[a.role] - roleOrder[b.role];
      });

      setMembers(sortedMembers as unknown as LabMember[]);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (member: LabMember, newRole: 'admin' | 'member') => {
    if (member.role === 'owner') {
      toast.error('Cannot change the role of the lab owner');
      return;
    }

    setActionLoading(member.id);
    try {
      const { error } = await supabase
        .from('lab_members')
        .update({ role: newRole })
        .eq('id', member.id);

      if (error) throw error;

      toast.success(`${member.profile?.full_name || 'Member'} is now ${newRole === 'admin' ? 'an admin' : 'a member'}`);
      loadMembers();
      onMembersChange?.();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, type: 'remove', member: null });
    }
  };

  const handleRemoveMember = async (member: LabMember) => {
    if (member.role === 'owner') {
      toast.error('Cannot remove the lab owner');
      return;
    }

    setActionLoading(member.id);
    try {
      const { error } = await supabase
        .from('lab_members')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      toast.success(`${member.profile?.full_name || 'Member'} has been removed from the lab`);
      loadMembers();
      onMembersChange?.();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, type: 'remove', member: null });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {members.map((member) => {
          const RoleIcon = roleIcons[member.role];
          const isCurrentUser = member.user_id === user?.id;
          const displayName = member.profile?.full_name || member.profile?.email || 'Unknown User';
          const initials = displayName.slice(0, 2).toUpperCase();

          return (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{displayName}</span>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                </p>
              </div>

              <Badge
                variant="outline"
                className={`gap-1 ${roleColors[member.role]}`}
              >
                <RoleIcon className="h-3 w-3" />
                {member.role}
              </Badge>

              {canManageMembers && member.role !== 'owner' && !isCurrentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={actionLoading === member.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role === 'member' ? (
                      <DropdownMenuItem
                        onClick={() =>
                          setConfirmDialog({ open: true, type: 'promote', member })
                        }
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Make Admin
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() =>
                          setConfirmDialog({ open: true, type: 'demote', member })
                        }
                      >
                        <ShieldOff className="h-4 w-4 mr-2" />
                        Remove Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        setConfirmDialog({ open: true, type: 'remove', member })
                      }
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove from Lab
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'remove' && 'Remove Member'}
              {confirmDialog.type === 'promote' && 'Promote to Admin'}
              {confirmDialog.type === 'demote' && 'Remove Admin Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'remove' &&
                `Are you sure you want to remove ${confirmDialog.member?.profile?.full_name || 'this member'} from the lab? They will need a new invitation to rejoin.`}
              {confirmDialog.type === 'promote' &&
                `Make ${confirmDialog.member?.profile?.full_name || 'this member'} an admin? They will be able to manage members and invitations.`}
              {confirmDialog.type === 'demote' &&
                `Remove admin privileges from ${confirmDialog.member?.profile?.full_name || 'this member'}? They will become a regular member.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmDialog.member) return;
                if (confirmDialog.type === 'remove') {
                  handleRemoveMember(confirmDialog.member);
                } else if (confirmDialog.type === 'promote') {
                  handleRoleChange(confirmDialog.member, 'admin');
                } else if (confirmDialog.type === 'demote') {
                  handleRoleChange(confirmDialog.member, 'member');
                }
              }}
              className={
                confirmDialog.type === 'remove'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {confirmDialog.type === 'remove' && 'Remove'}
              {confirmDialog.type === 'promote' && 'Make Admin'}
              {confirmDialog.type === 'demote' && 'Remove Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
