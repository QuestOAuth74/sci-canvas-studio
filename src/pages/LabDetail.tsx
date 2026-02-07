import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Users,
  FolderOpen,
  Settings,
  UserPlus,
  Crown,
  Shield,
  User,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LabMembersList,
  LabProjectsList,
  LabSettings,
  LabInviteDialog,
} from '@/components/labs';
import { Database } from '@/integrations/supabase/types';

type LabRole = Database['public']['Enums']['lab_role'];

interface Lab {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: LabRole;
  expires_at: string;
  created_at: string;
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

export default function LabDetail() {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lab, setLab] = useState<Lab | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<LabRole | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  useEffect(() => {
    if (labId && user) {
      loadLabData();
    }
  }, [labId, user]);

  const loadLabData = async () => {
    if (!labId || !user) return;

    setLoading(true);
    try {
      // Load lab details
      const { data: labData, error: labError } = await supabase
        .from('labs')
        .select('*')
        .eq('id', labId)
        .single();

      if (labError) throw labError;
      setLab(labData);

      // Load current user's role
      const { data: memberData, error: memberError } = await supabase
        .from('lab_members')
        .select('role')
        .eq('lab_id', labId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (!memberData) {
        toast.error('You are not a member of this lab');
        navigate('/labs');
        return;
      }

      setCurrentUserRole(memberData.role);

      // Load member count
      const { count: membersCount } = await supabase
        .from('lab_members')
        .select('*', { count: 'exact', head: true })
        .eq('lab_id', labId)
        .eq('status', 'active');

      setMemberCount(membersCount || 0);

      // Load project count
      const { count: projectsCount } = await supabase
        .from('lab_projects')
        .select('*', { count: 'exact', head: true })
        .eq('lab_id', labId);

      setProjectCount(projectsCount || 0);

      // Load pending invitations (for admins/owners)
      if (memberData.role === 'owner' || memberData.role === 'admin') {
        const { data: invitesData } = await supabase
          .from('lab_invitations')
          .select('id, email, role, expires_at, created_at')
          .eq('lab_id', labId)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        setPendingInvitations(invitesData || []);
      }
    } catch (error: any) {
      console.error('Error loading lab:', error);
      toast.error(error.message || 'Failed to load lab');
      navigate('/labs');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('lab_invitations')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      loadLabData();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast.error(error.message || 'Failed to cancel invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            <Skeleton className="h-8 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!lab || !currentUserRole) {
    return null;
  }

  const RoleIcon = roleIcons[currentUserRole];
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/labs')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Labs
        </Button>

        {/* Lab Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={lab.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {lab.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{lab.name}</h1>
                <Badge
                  variant="outline"
                  className={`gap-1 ${roleColors[currentUserRole]}`}
                >
                  <RoleIcon className="h-3 w-3" />
                  {currentUserRole}
                </Badge>
              </div>
              {lab.description && (
                <p className="text-muted-foreground mt-1 max-w-xl">
                  {lab.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4" />
                  {projectCount} project{projectCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {canManage && (
            <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Members
            </Button>
          )}
        </div>

        {/* Pending Invitations (for admins) */}
        {canManage && pendingInvitations.length > 0 && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Pending Invitations ({pendingInvitations.length})
            </h3>
            <div className="space-y-2">
              {pendingInvitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg"
                >
                  <div>
                    <span className="font-medium">{invite.email}</span>
                    <span className="text-muted-foreground ml-2">
                      as {invite.role}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(invite.id)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="projects" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <LabProjectsList
              labId={lab.id}
              currentUserRole={currentUserRole}
              onProjectsChange={loadLabData}
            />
          </TabsContent>

          <TabsContent value="members">
            <LabMembersList
              labId={lab.id}
              currentUserRole={currentUserRole}
              onMembersChange={loadLabData}
            />
          </TabsContent>

          <TabsContent value="settings">
            <LabSettings
              lab={lab}
              currentUserRole={currentUserRole}
              onLabUpdated={loadLabData}
            />
          </TabsContent>
        </Tabs>
      </main>

      <LabInviteDialog
        labId={lab.id}
        labName={lab.name}
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onInvitesSent={loadLabData}
      />
    </div>
  );
}
