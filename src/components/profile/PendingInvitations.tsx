import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Mail, Calendar, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function PendingInvitations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { invitations, isLoading, acceptInvitation, declineInvitation } = usePendingInvitations(
    user?.id,
    user?.email
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg mb-2">No Pending Invitations</CardTitle>
          <CardDescription className="text-center">
            You don't have any pending collaboration invitations at the moment.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
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

  const getRoleIcon = (role: string) => {
    return <Shield className="h-3 w-3 mr-1" />;
  };

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {invitations.map((invitation) => (
          <Card key={invitation.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={invitation.inviter_avatar || undefined} />
                    <AvatarFallback>
                      {invitation.inviter_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-1">
                      {invitation.project_name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      <strong>{invitation.inviter_name}</strong> invited you to collaborate
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getRoleBadgeVariant(invitation.role)} className="text-xs">
                        {getRoleIcon(invitation.role)}
                        {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {invitation.personal_message && (
              <CardContent className="pt-0">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground italic">"{invitation.personal_message}"</p>
                </div>
              </CardContent>
            )}
            
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Clock className="h-3 w-3" />
                Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    acceptInvitation.mutate(invitation.id);
                  }}
                  disabled={acceptInvitation.isPending || declineInvitation.isPending}
                  className="flex-1"
                >
                  {acceptInvitation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    declineInvitation.mutate(invitation.id);
                  }}
                  disabled={acceptInvitation.isPending || declineInvitation.isPending}
                  className="flex-1"
                >
                  {declineInvitation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
