-- Create enums for collaboration roles and invitation status
CREATE TYPE collaboration_role AS ENUM ('viewer', 'editor', 'admin');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Table 1: project_collaborators - Active collaborators on projects
CREATE TABLE public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.canvas_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role collaboration_role NOT NULL DEFAULT 'editor',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  
  UNIQUE(project_id, user_id),
  CONSTRAINT no_self_collaboration CHECK (user_id != invited_by)
);

COMMENT ON TABLE public.project_collaborators IS 'Active collaborators on canvas projects';
COMMENT ON COLUMN public.project_collaborators.role IS 'viewer: read-only, editor: can edit canvas, admin: can edit + manage collaborators';

CREATE INDEX idx_collaborators_project ON public.project_collaborators(project_id);
CREATE INDEX idx_collaborators_user ON public.project_collaborators(user_id);

-- RLS Policies for project_collaborators
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project collaborators"
  ON public.project_collaborators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canvas_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Project owners and admins can invite collaborators"
  ON public.project_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM canvas_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_collaborators.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Owners and admins can update collaborators"
  ON public.project_collaborators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canvas_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_collaborators.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Owners and admins can remove collaborators"
  ON public.project_collaborators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canvas_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_collaborators.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Table 2: project_collaboration_invitations - Pending invitations
CREATE TABLE public.project_collaboration_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.canvas_projects(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role collaboration_role NOT NULL DEFAULT 'editor',
  status invitation_status NOT NULL DEFAULT 'pending',
  personal_message TEXT,
  invitation_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  CONSTRAINT valid_email CHECK (invitee_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

COMMENT ON TABLE public.project_collaboration_invitations IS 'Pending collaboration invitations';

CREATE INDEX idx_invitations_project ON public.project_collaboration_invitations(project_id);
CREATE INDEX idx_invitations_email ON public.project_collaboration_invitations(invitee_email);
CREATE INDEX idx_invitations_token ON public.project_collaboration_invitations(invitation_token);
CREATE INDEX idx_invitations_status ON public.project_collaboration_invitations(status);

-- RLS Policies for project_collaboration_invitations
ALTER TABLE public.project_collaboration_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant invitations"
  ON public.project_collaboration_invitations FOR SELECT
  TO authenticated
  USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM canvas_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can create invitations"
  ON public.project_collaboration_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    inviter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM canvas_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Invitees can respond to invitations"
  ON public.project_collaboration_invitations FOR UPDATE
  TO authenticated
  USING (invitee_id = auth.uid());

CREATE POLICY "Inviters can cancel invitations"
  ON public.project_collaboration_invitations FOR DELETE
  TO authenticated
  USING (inviter_id = auth.uid());

-- Table 3: project_comments - Comments and discussions
CREATE TABLE public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.canvas_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  canvas_position JSONB,
  parent_comment_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT comment_not_empty CHECK (LENGTH(TRIM(comment_text)) > 0),
  CONSTRAINT comment_max_length CHECK (LENGTH(comment_text) <= 2000)
);

COMMENT ON TABLE public.project_comments IS 'Comments and discussions on canvas projects';

CREATE INDEX idx_comments_project ON public.project_comments(project_id);
CREATE INDEX idx_comments_user ON public.project_comments(user_id);
CREATE INDEX idx_comments_created ON public.project_comments(created_at DESC);
CREATE INDEX idx_comments_parent ON public.project_comments(parent_comment_id);

-- RLS Policies for project_comments
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collaborators can view comments"
  ON public.project_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canvas_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_comments.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can add comments"
  ON public.project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM canvas_projects
        WHERE id = project_id AND user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM project_collaborators
        WHERE project_id = project_comments.project_id
        AND user_id = auth.uid()
        AND role IN ('editor', 'admin')
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.project_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments, owners can delete all"
  ON public.project_comments FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM canvas_projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- Helper function: Check user access to project
CREATE OR REPLACE FUNCTION public.user_can_access_project(
  _project_id UUID,
  _user_id UUID,
  _required_role collaboration_role DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM canvas_projects
    WHERE id = _project_id AND user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE project_id = _project_id
    AND user_id = _user_id
    AND accepted_at IS NOT NULL
    AND (
      _required_role IS NULL
      OR
      CASE _required_role
        WHEN 'viewer' THEN role IN ('viewer', 'editor', 'admin')
        WHEN 'editor' THEN role IN ('editor', 'admin')
        WHEN 'admin' THEN role = 'admin'
      END
    )
  );
$$;

-- Function: Auto-match invitations to existing users
CREATE OR REPLACE FUNCTION public.match_invitation_to_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_user_id UUID;
BEGIN
  SELECT id INTO matched_user_id
  FROM auth.users
  WHERE email = NEW.invitee_email
  LIMIT 1;
  
  IF matched_user_id IS NOT NULL THEN
    NEW.invitee_id := matched_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER match_invitation_to_user_trigger
  BEFORE INSERT ON public.project_collaboration_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.match_invitation_to_user();