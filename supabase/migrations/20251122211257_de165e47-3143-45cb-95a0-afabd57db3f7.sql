-- Add RLS policy to allow collaborators to view each other's profiles
CREATE POLICY "Project collaborators can view each other's profiles"
ON profiles FOR SELECT
USING (
  -- Users can view profiles of collaborators on projects they own
  EXISTS (
    SELECT 1 FROM canvas_projects cp
    WHERE cp.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.project_id = cp.id
      AND pc.user_id = profiles.id
    )
  )
  OR
  -- Users can view profiles of other collaborators on projects where they are a collaborator
  EXISTS (
    SELECT 1 FROM project_collaborators pc1
    WHERE pc1.user_id = profiles.id
    AND EXISTS (
      SELECT 1 FROM project_collaborators pc2
      WHERE pc2.project_id = pc1.project_id
      AND pc2.user_id = auth.uid()
    )
  )
);