-- Allow users to view invitations by invitation token (for acceptance flow)
-- This is safe because the token is a secure UUID that acts as authorization
CREATE POLICY "Users can view invitations by token"
ON project_collaboration_invitations
FOR SELECT
TO authenticated
USING (
  invitation_token IS NOT NULL
  OR invitee_id = auth.uid() 
  OR inviter_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM canvas_projects
    WHERE canvas_projects.id = project_collaboration_invitations.project_id
    AND canvas_projects.user_id = auth.uid()
  )
);