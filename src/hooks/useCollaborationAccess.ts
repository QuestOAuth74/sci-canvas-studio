import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCollaborationAccess(projectId: string | null) {
  const { user } = useAuth();
  const [role, setRole] = useState<'owner' | 'admin' | 'editor' | 'viewer' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!projectId || !user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user is the project owner
        const { data: project } = await supabase
          .from('canvas_projects')
          .select('user_id')
          .eq('id', projectId)
          .single();

        if (project?.user_id === user.id) {
          setRole('owner');
        } else {
          // Check if user is a collaborator
          const { data: collab } = await supabase
            .from('project_collaborators')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .not('accepted_at', 'is', null)
            .maybeSingle();

          setRole(collab?.role as any || null);
        }
      } catch (error) {
        console.error('Error checking collaboration access:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [projectId, user]);

  const canEdit = role === 'owner' || role === 'admin' || role === 'editor';
  const canManageCollaborators = role === 'owner' || role === 'admin';

  return { role, canEdit, canManageCollaborators, loading };
}
