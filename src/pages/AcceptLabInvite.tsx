import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Crown,
  Shield,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type LabRole = Database['public']['Enums']['lab_role'];

interface InvitationDetails {
  id: string;
  lab_id: string;
  email: string;
  role: LabRole;
  token: string;
  personal_message: string | null;
  expires_at: string;
  status: string;
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

const roleDescriptions: Record<LabRole, string> = {
  owner: 'Full control over the lab',
  admin: 'Can manage members, invitations, and lab settings',
  member: 'Can view and collaborate on lab projects',
};

export default function AcceptLabInvite() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  useEffect(() => {
    // If user is not logged in after auth loading, redirect to auth
    if (!authLoading && !user && invitation) {
      const returnUrl = `/lab/invite/${token}`;
      navigate(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, authLoading, invitation, token, navigate]);

  const loadInvitation = async () => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('lab_invitations')
        .select(`
          id,
          lab_id,
          email,
          role,
          token,
          personal_message,
          expires_at,
          status,
          lab:labs (
            name,
            description
          ),
          inviter:profiles (
            full_name
          )
        `)
        .eq('token', token)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Invitation not found or has been cancelled');
        } else {
          throw fetchError;
        }
        return;
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      // Check if invitation is already accepted/declined
      if (data.status !== 'pending') {
        setError(`This invitation has already been ${data.status}`);
        return;
      }

      setInvitation(data as InvitationDetails);
    } catch (err: any) {
      console.error('Error loading invitation:', err);
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation || !user) return;

    // Check if user email matches invitation email
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      toast.error('This invitation was sent to a different email address');
      return;
    }

    setAccepting(true);
    try {
      const { data, error: acceptError } = await supabase.rpc(
        'accept_lab_invitation',
        { invitation_token: invitation.token }
      );

      if (acceptError) throw acceptError;

      if (data && data.length > 0) {
        toast.success(`Welcome to ${data[0].lab_name}!`);
        navigate(`/labs/${data[0].lab_id}`);
      } else {
        throw new Error('Failed to join lab');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast.error(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    setDeclining(true);
    try {
      const { error: declineError } = await supabase
        .from('lab_invitations')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (declineError) throw declineError;

      toast.success('Invitation declined');
      navigate('/labs');
    } catch (err: any) {
      console.error('Error declining invitation:', err);
      toast.error(err.message || 'Failed to decline invitation');
    } finally {
      setDeclining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle>Unable to Process Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/labs')} className="w-full">
              Go to My Labs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const RoleIcon = roleIcons[invitation.role];
  const emailMismatch =
    user && user.email?.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <CardTitle>Lab Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a lab on BioSketch
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Lab Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="text-xl font-semibold">{invitation.lab?.name}</h3>
            {invitation.lab?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {invitation.lab.description}
              </p>
            )}
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="gap-2 px-4 py-2 text-base">
              <RoleIcon className="h-4 w-4" />
              Joining as {invitation.role}
            </Badge>
          </div>

          {/* Role Description */}
          <p className="text-sm text-muted-foreground text-center">
            {roleDescriptions[invitation.role]}
          </p>

          {/* Personal Message */}
          {invitation.personal_message && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm italic">"{invitation.personal_message}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                — {invitation.inviter?.full_name || 'Unknown'}
              </p>
            </div>
          )}

          {/* Invited By */}
          <p className="text-sm text-center text-muted-foreground">
            Invited by{' '}
            <span className="font-medium">
              {invitation.inviter?.full_name || 'a lab admin'}
            </span>
          </p>

          {/* Email Mismatch Warning */}
          {emailMismatch && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This invitation was sent to {invitation.email}, but you're logged
                in as {user?.email}. Please log in with the correct account.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              disabled={accepting || declining}
            >
              {declining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Decline'
              )}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleAccept}
              disabled={accepting || declining || emailMismatch}
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Accept & Join
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
