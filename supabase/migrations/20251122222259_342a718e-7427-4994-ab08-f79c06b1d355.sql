-- Add RLS policy so collaborators can view projects they have access to
CREATE POLICY "Collaborators can view projects"
ON public.canvas_projects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_collaborators pc
    WHERE pc.project_id = canvas_projects.id
      AND pc.user_id = auth.uid()
      AND pc.accepted_at IS NOT NULL
  )
);

-- Create secure function to accept collaboration invitations by token
CREATE OR REPLACE FUNCTION public.accept_collaboration_invitation(
  _invitation_token text
)
RETURNS TABLE (
  project_id uuid,
  project_name text,
  role collaboration_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation project_collaboration_invitations%ROWTYPE;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to accept invitation';
  END IF;

  -- Look up invitation by token, ignoring RLS
  SELECT *
  INTO v_invitation
  FROM public.project_collaboration_invitations
  WHERE invitation_token = _invitation_token
    AND status = 'pending'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Check expiry
  IF v_invitation.expires_at < now() THEN
    UPDATE public.project_collaboration_invitations
    SET status = 'expired', responded_at = now()
    WHERE id = v_invitation.id;
    RAISE EXCEPTION 'This invitation has expired';
  END IF;

  -- Create or update collaborator record
  INSERT INTO public.project_collaborators (project_id, user_id, role, invited_by, accepted_at)
  VALUES (v_invitation.project_id, v_user_id, v_invitation.role, v_invitation.inviter_id, now())
  ON CONFLICT (project_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        accepted_at = now();

  -- Mark invitation as accepted
  UPDATE public.project_collaboration_invitations
  SET status = 'accepted',
      responded_at = now()
  WHERE id = v_invitation.id;

  -- Return project metadata
  RETURN QUERY
  SELECT
    cp.id,
    cp.name,
    v_invitation.role
  FROM public.canvas_projects cp
  WHERE cp.id = v_invitation.project_id;
END;
$$;