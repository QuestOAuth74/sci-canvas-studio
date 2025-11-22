-- Drop the overly permissive policy that was just created
DROP POLICY IF EXISTS "Users can view invitations by token" ON project_collaboration_invitations;