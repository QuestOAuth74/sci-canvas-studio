import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Users,
  FolderOpen,
  Clock,
  Crown,
  Shield,
  User,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CreateLabDialog } from './CreateLabDialog';
import { Database } from '@/integrations/supabase/types';

type LabRole = Database['public']['Enums']['lab_role'];

interface UserLab {
  lab_id: string;
  lab_name: string;
  lab_description: string | null;
  lab_avatar_url: string | null;
  user_role: LabRole;
  member_count: number;
  project_count: number;
  joined_at: string;
}

interface PendingInvitation {
  id: string;
  lab_id: string;
  role: LabRole;
  personal_message: string | null;
  expires_at: string;
  lab: {
    name: string;
    description: string | null;
  } | null;
  inviter: {
    full_name: string | null;
  } | null;
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

export function LabDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [labs, setLabs] = useState<UserLab[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user's labs
      const { data: labsData, error: labsError } = await supabase.rpc('get_user_labs', {
        check_user_id: user?.id,
      });

      if (labsError) throw labsError;
      setLabs(labsData || []);

      // Load pending invitations for user's email
      if (user?.email) {
        const { data: invitesData, error: invitesError } = await supabase
          .from('lab_invitations')
          .select(`
            id,
            lab_id,
            role,
            personal_message,
            expires_at,
            lab:labs (
              name,
              description
            ),
            inviter:profiles (
              full_name
            )
          `)
          .eq('email', user.email.toLowerCase())
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());

        if (invitesError) throw invitesError;
        setInvitations((invitesData as unknown as PendingInvitation[]) || []);
      }
    } catch (error) {
      console.error('Error loading lab data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabCreated = (labId: string) => {
    loadData();
    navigate(`/labs/${labId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Labs</h1>
          <p className="text-muted-foreground mt-1">
            Collaborate with your team on shared projects
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Lab
        </Button>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Pending Invitations ({invitations.length})
            </CardTitle>
            <CardDescription>
              You've been invited to join the following labs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border"
                >
                  <div>
                    <h4 className="font-medium">{invite.lab?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invite.inviter?.full_name || 'Unknown'} as{' '}
                      {invite.role}
                    </p>
                    {invite.personal_message && (
                      <p className="text-sm mt-1 italic">
                        "{invite.personal_message}"
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => navigate(`/lab/invite/${invite.id}`)}
                    size="sm"
                  >
                    View Invitation
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labs Grid */}
      {labs.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No labs yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create a lab to start collaborating with your team on scientific
              illustrations and diagrams.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Lab
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => {
            const RoleIcon = roleIcons[lab.user_role];

            return (
              <Card
                key={lab.lab_id}
                className="group cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                onClick={() => navigate(`/labs/${lab.lab_id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={lab.lab_avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {lab.lab_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge
                      variant="outline"
                      className={`gap-1 ${roleColors[lab.user_role]}`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {lab.user_role}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3">{lab.lab_name}</CardTitle>
                  {lab.lab_description && (
                    <CardDescription className="line-clamp-2">
                      {lab.lab_description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {lab.member_count} member{lab.member_count !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="h-4 w-4" />
                      {lab.project_count} project{lab.project_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Joined {formatDistanceToNow(new Date(lab.joined_at), { addSuffix: true })}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateLabDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onLabCreated={handleLabCreated}
      />
    </div>
  );
}
