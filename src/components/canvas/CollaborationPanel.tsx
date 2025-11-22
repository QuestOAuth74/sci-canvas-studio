import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, MessageSquare, MoreVertical, Crown, Shield, Eye, Trash2, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InviteCollaboratorDialog } from './InviteCollaboratorDialog';
import { ProjectCommentsSection } from './ProjectCommentsSection';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CollaborationPanelProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  onClose?: () => void;
}

export function CollaborationPanel({ projectId, projectName, isOwner, onClose }: CollaborationPanelProps) {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [projectOwner, setProjectOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const loadCollaborationData = async () => {
    try {
      // Load project owner
      const { data: project } = await supabase
        .from('canvas_projects')
        .select(`
          user_id,
          owner:profiles!user_id(id, full_name, avatar_url, email)
        `)
        .eq('id', projectId)
        .single();

      if (project?.owner) {
        setProjectOwner(project.owner);
      }

      // Load active collaborators
      const { data: collabData, error: collabError } = await supabase
        .from('project_collaborators')
        .select(`
          *,
          user:profiles!user_id(id, full_name, avatar_url, email)
        `)
        .eq('project_id', projectId)
        .not('accepted_at', 'is', null)
        .order('accepted_at', { ascending: true });

      if (collabError) throw collabError;
      setCollaborators(collabData || []);

      // Load pending invitations (only if owner or admin)
      if (isOwner) {
        const { data: inviteData, error: inviteError } = await supabase
          .from('project_collaboration_invitations')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (inviteError) throw inviteError;
        setInvitations(inviteData || []);
      }
    } catch (error: any) {
      console.error('Error loading collaboration data:', error);
      toast.error('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborationData();

    // Set up real-time subscription for collaborators
    const channel = supabase
      .channel(`project-${projectId}-collaboration`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_collaborators',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadCollaborationData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_collaboration_invitations',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadCollaborationData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleRemoveCollaborator = async (collaboratorId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
      toast.success('Collaborator removed');
      loadCollaborationData();
    } catch (error: any) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Are you sure you want to cancel the invitation to ${email}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('project_collaboration_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      toast.success('Invitation cancelled');
      loadCollaborationData();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'editor':
        return <Users className="h-3 w-3" />;
      case 'viewer':
        return <Eye className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Collaboration
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInviteDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Invite
              </Button>
            )}
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pb-0 pt-3">
        <Tabs defaultValue="collaborators" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="collaborators" className="text-xs">
              Team ({collaborators.length + 1})
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Discussion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collaborators" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {/* Project Owner */}
                {projectOwner && (
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={projectOwner.avatar_url} />
                      <AvatarFallback>
                        {getInitials(projectOwner.full_name, projectOwner.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {isOwner ? 'You' : (projectOwner.full_name || projectOwner.email)}
                        </span>
                        <Badge variant="default" className="gap-1 text-xs">
                          <Crown className="h-3 w-3" />
                          Owner
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Project creator</p>
                    </div>
                  </div>
                )}

                {/* Active Collaborators */}
                {collaborators.map((collab) => (
                  <div key={collab.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={collab.user.avatar_url} />
                      <AvatarFallback>
                        {getInitials(collab.user.full_name, collab.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {collab.user.full_name || collab.user.email}
                        </span>
                        <Badge variant={getRoleBadgeVariant(collab.role)} className="gap-1 text-xs capitalize">
                          {getRoleIcon(collab.role)}
                          {collab.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(collab.accepted_at), { addSuffix: true })}
                      </p>
                    </div>
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveCollaborator(collab.id, collab.user.full_name || collab.user.email)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}

                {/* Pending Invitations */}
                {isOwner && invitations.length > 0 && (
                  <>
                    <div className="pt-3 mt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Pending Invitations ({invitations.length})
                      </p>
                    </div>
                    {invitations.map((invite) => (
                      <div key={invite.id} className="flex items-start gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-amber-100 dark:bg-amber-900/50">
                            {invite.invitee_email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium truncate">{invite.invitee_email}</span>
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                            <Badge variant="outline" className="text-xs capitalize">{invite.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Invited {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleCancelInvitation(invite.id, invite.invitee_email)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </>
                )}

                {collaborators.length === 0 && invitations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No collaborators yet</p>
                    {isOwner && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => setInviteDialogOpen(true)}
                      >
                        Invite someone to collaborate
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-hidden mt-0">
            <ProjectCommentsSection projectId={projectId} />
          </TabsContent>
        </Tabs>
      </CardContent>

      <InviteCollaboratorDialog
        projectId={projectId}
        projectName={projectName}
        isOpen={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onSuccess={loadCollaborationData}
      />
    </Card>
  );
}
