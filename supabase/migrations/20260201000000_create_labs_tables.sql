-- =====================================================
-- Lab Collaboration Feature Migration
-- Creates tables for lab groups, memberships, invitations,
-- project collections, lab projects, and canvas presence
-- =====================================================

-- =====================================================
-- Part 1: Create Enums
-- =====================================================

-- Lab member roles
DO $$ BEGIN
  CREATE TYPE lab_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Lab member status
DO $$ BEGIN
  CREATE TYPE lab_member_status AS ENUM ('active', 'suspended', 'removed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- Part 2: Create Tables
-- =====================================================

-- Labs table - main lab/group entity
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for owner lookup
CREATE INDEX IF NOT EXISTS idx_labs_owner_id ON labs(owner_id);

-- Lab members table - membership tracking
CREATE TABLE IF NOT EXISTS lab_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role lab_role NOT NULL DEFAULT 'member',
  status lab_member_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lab_id, user_id)
);

-- Create indexes for lab members
CREATE INDEX IF NOT EXISTS idx_lab_members_lab_id ON lab_members(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_members_user_id ON lab_members(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_members_status ON lab_members(status);

-- Lab invitations table - pending invites
CREATE TABLE IF NOT EXISTS lab_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role lab_role NOT NULL DEFAULT 'member',
  token VARCHAR(64) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  personal_message TEXT,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for lab invitations
CREATE INDEX IF NOT EXISTS idx_lab_invitations_lab_id ON lab_invitations(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_invitations_email ON lab_invitations(email);
CREATE INDEX IF NOT EXISTS idx_lab_invitations_token ON lab_invitations(token);
CREATE INDEX IF NOT EXISTS idx_lab_invitations_status ON lab_invitations(status);

-- Project collections table - user portfolios for sharing multiple projects
CREATE TABLE IF NOT EXISTS project_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for user lookup
CREATE INDEX IF NOT EXISTS idx_project_collections_user_id ON project_collections(user_id);

-- Project collection items table - many-to-many: collection <-> projects
CREATE TABLE IF NOT EXISTS project_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES project_collections(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  display_order INTEGER DEFAULT 0,
  UNIQUE(collection_id, project_id)
);

-- Create indexes for collection items
CREATE INDEX IF NOT EXISTS idx_project_collection_items_collection_id ON project_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_project_collection_items_project_id ON project_collection_items(project_id);

-- Lab projects table - share projects with entire lab
CREATE TABLE IF NOT EXISTS lab_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level collaboration_role NOT NULL DEFAULT 'viewer',
  shared_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lab_id, project_id)
);

-- Create indexes for lab projects
CREATE INDEX IF NOT EXISTS idx_lab_projects_lab_id ON lab_projects(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_projects_project_id ON lab_projects(project_id);

-- Canvas presence table - real-time cursor/viewport tracking
CREATE TABLE IF NOT EXISTS canvas_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cursor_x DOUBLE PRECISION,
  cursor_y DOUBLE PRECISION,
  viewport_x DOUBLE PRECISION,
  viewport_y DOUBLE PRECISION,
  viewport_zoom DOUBLE PRECISION,
  color VARCHAR(7), -- Hex color for cursor
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create indexes for canvas presence
CREATE INDEX IF NOT EXISTS idx_canvas_presence_project_id ON canvas_presence(project_id);
CREATE INDEX IF NOT EXISTS idx_canvas_presence_user_id ON canvas_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_presence_last_seen ON canvas_presence(last_seen_at);

-- =====================================================
-- Part 3: Create Helper Functions
-- =====================================================

-- Function to check if user is a lab member with required role
CREATE OR REPLACE FUNCTION user_is_lab_member(
  check_user_id UUID,
  check_lab_id UUID,
  required_role lab_role DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  member_role lab_role;
  member_status lab_member_status;
BEGIN
  SELECT role, status INTO member_role, member_status
  FROM lab_members
  WHERE user_id = check_user_id
    AND lab_id = check_lab_id;

  -- Not a member
  IF member_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Member is not active
  IF member_status != 'active' THEN
    RETURN FALSE;
  END IF;

  -- No specific role required, just check membership
  IF required_role IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check role hierarchy: owner > admin > member
  CASE required_role
    WHEN 'member' THEN
      RETURN TRUE; -- Any role satisfies member requirement
    WHEN 'admin' THEN
      RETURN member_role IN ('admin', 'owner');
    WHEN 'owner' THEN
      RETURN member_role = 'owner';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION user_is_lab_member(UUID, UUID, lab_role) TO authenticated;

COMMENT ON FUNCTION user_is_lab_member IS
  'Check if a user is an active member of a lab with at least the required role.
   Role hierarchy: owner > admin > member. If required_role is NULL, just checks membership.';

-- Function to accept a lab invitation
CREATE OR REPLACE FUNCTION accept_lab_invitation(invitation_token VARCHAR)
RETURNS TABLE (
  lab_id UUID,
  lab_name VARCHAR,
  role lab_role
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inv_record RECORD;
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get and validate invitation
  SELECT li.*, l.name as lab_name
  INTO inv_record
  FROM lab_invitations li
  JOIN labs l ON l.id = li.lab_id
  WHERE li.token = invitation_token
    AND li.status = 'pending'
    AND li.expires_at > now();

  IF inv_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM lab_members
    WHERE lab_members.lab_id = inv_record.lab_id
      AND lab_members.user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Already a member of this lab';
  END IF;

  -- Create membership
  INSERT INTO lab_members (lab_id, user_id, role, status, invited_by)
  VALUES (inv_record.lab_id, current_user_id, inv_record.role, 'active', inv_record.invited_by);

  -- Update invitation status
  UPDATE lab_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = inv_record.id;

  -- Return lab info
  RETURN QUERY SELECT inv_record.lab_id, inv_record.lab_name::VARCHAR, inv_record.role;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_lab_invitation(VARCHAR) TO authenticated;

COMMENT ON FUNCTION accept_lab_invitation IS
  'Accept a lab invitation using the invitation token. Creates membership and marks invitation as accepted.';

-- Function to get user's labs with role info
CREATE OR REPLACE FUNCTION get_user_labs(check_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  lab_id UUID,
  lab_name VARCHAR,
  lab_description TEXT,
  lab_avatar_url TEXT,
  user_role lab_role,
  member_count BIGINT,
  project_count BIGINT,
  joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Default to current user if not specified
  IF check_user_id IS NULL THEN
    check_user_id := auth.uid();
  END IF;

  RETURN QUERY
  SELECT
    l.id as lab_id,
    l.name::VARCHAR as lab_name,
    l.description as lab_description,
    l.avatar_url as lab_avatar_url,
    lm.role as user_role,
    (SELECT COUNT(*) FROM lab_members WHERE lab_members.lab_id = l.id AND status = 'active') as member_count,
    (SELECT COUNT(*) FROM lab_projects WHERE lab_projects.lab_id = l.id) as project_count,
    lm.joined_at
  FROM labs l
  JOIN lab_members lm ON lm.lab_id = l.id
  WHERE lm.user_id = check_user_id
    AND lm.status = 'active'
  ORDER BY lm.joined_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_labs(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_labs IS
  'Get all labs that a user is an active member of, including their role and counts.';

-- Function to check if user can access a project via lab sharing
CREATE OR REPLACE FUNCTION user_can_access_project_via_lab(
  check_user_id UUID,
  check_project_id UUID,
  required_permission collaboration_role DEFAULT 'viewer'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  project_permission collaboration_role;
BEGIN
  -- Check if project is shared with any lab the user is a member of
  SELECT lp.permission_level INTO project_permission
  FROM lab_projects lp
  JOIN lab_members lm ON lm.lab_id = lp.lab_id
  WHERE lp.project_id = check_project_id
    AND lm.user_id = check_user_id
    AND lm.status = 'active'
  ORDER BY
    CASE lp.permission_level
      WHEN 'admin' THEN 1
      WHEN 'editor' THEN 2
      WHEN 'viewer' THEN 3
    END
  LIMIT 1;

  IF project_permission IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check permission hierarchy: admin > editor > viewer
  CASE required_permission
    WHEN 'viewer' THEN
      RETURN TRUE;
    WHEN 'editor' THEN
      RETURN project_permission IN ('editor', 'admin');
    WHEN 'admin' THEN
      RETURN project_permission = 'admin';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION user_can_access_project_via_lab(UUID, UUID, collaboration_role) TO authenticated;

COMMENT ON FUNCTION user_can_access_project_via_lab IS
  'Check if a user can access a project through lab sharing with at least the required permission level.';

-- =====================================================
-- Part 4: Enable RLS and Create Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_presence ENABLE ROW LEVEL SECURITY;

-- Labs policies
CREATE POLICY "Lab members can view their labs"
  ON labs FOR SELECT
  USING (user_is_lab_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create labs"
  ON labs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Lab owners and admins can update labs"
  ON labs FOR UPDATE
  USING (user_is_lab_member(auth.uid(), id, 'admin'));

CREATE POLICY "Only lab owners can delete labs"
  ON labs FOR DELETE
  USING (auth.uid() = owner_id);

-- Lab members policies
CREATE POLICY "Lab members can view other members"
  ON lab_members FOR SELECT
  USING (user_is_lab_member(auth.uid(), lab_id));

CREATE POLICY "Lab admins can add members"
  ON lab_members FOR INSERT
  WITH CHECK (user_is_lab_member(auth.uid(), lab_id, 'admin'));

CREATE POLICY "Lab admins can update members except owner"
  ON lab_members FOR UPDATE
  USING (
    user_is_lab_member(auth.uid(), lab_id, 'admin')
    AND role != 'owner'
  );

CREATE POLICY "Lab admins can remove members except owner"
  ON lab_members FOR DELETE
  USING (
    user_is_lab_member(auth.uid(), lab_id, 'admin')
    AND role != 'owner'
  );

CREATE POLICY "Members can leave labs"
  ON lab_members FOR DELETE
  USING (
    auth.uid() = user_id
    AND role != 'owner'
  );

-- Lab invitations policies
CREATE POLICY "Lab admins can view invitations"
  ON lab_invitations FOR SELECT
  USING (user_is_lab_member(auth.uid(), lab_id, 'admin'));

CREATE POLICY "Invitees can view their invitations by token"
  ON lab_invitations FOR SELECT
  USING (
    status = 'pending'
    AND expires_at > now()
  );

CREATE POLICY "Lab admins can create invitations"
  ON lab_invitations FOR INSERT
  WITH CHECK (user_is_lab_member(auth.uid(), lab_id, 'admin'));

CREATE POLICY "Lab admins can update invitations"
  ON lab_invitations FOR UPDATE
  USING (user_is_lab_member(auth.uid(), lab_id, 'admin'));

CREATE POLICY "Lab admins can delete invitations"
  ON lab_invitations FOR DELETE
  USING (user_is_lab_member(auth.uid(), lab_id, 'admin'));

-- Project collections policies
CREATE POLICY "Users can view their own collections"
  ON project_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections"
  ON project_collections FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create their own collections"
  ON project_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON project_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON project_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Project collection items policies
CREATE POLICY "Users can view items in their collections"
  ON project_collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collections pc
      WHERE pc.id = collection_id
        AND (pc.user_id = auth.uid() OR pc.is_public = true)
    )
  );

CREATE POLICY "Users can add items to their collections"
  ON project_collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collections pc
      WHERE pc.id = collection_id
        AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their collections"
  ON project_collection_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_collections pc
      WHERE pc.id = collection_id
        AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from their collections"
  ON project_collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_collections pc
      WHERE pc.id = collection_id
        AND pc.user_id = auth.uid()
    )
  );

-- Lab projects policies
CREATE POLICY "Lab members can view lab projects"
  ON lab_projects FOR SELECT
  USING (user_is_lab_member(auth.uid(), lab_id));

CREATE POLICY "Lab admins can share projects"
  ON lab_projects FOR INSERT
  WITH CHECK (
    user_is_lab_member(auth.uid(), lab_id, 'admin')
    OR (
      -- Project owner can also share their projects
      EXISTS (
        SELECT 1 FROM canvas_projects cp
        WHERE cp.id = project_id
          AND cp.user_id = auth.uid()
      )
      AND user_is_lab_member(auth.uid(), lab_id)
    )
  );

CREATE POLICY "Lab admins can update shared projects"
  ON lab_projects FOR UPDATE
  USING (user_is_lab_member(auth.uid(), lab_id, 'admin'));

CREATE POLICY "Lab admins can remove shared projects"
  ON lab_projects FOR DELETE
  USING (user_is_lab_member(auth.uid(), lab_id, 'admin'));

CREATE POLICY "Project owner can remove their project from lab"
  ON lab_projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM canvas_projects cp
      WHERE cp.id = project_id
        AND cp.user_id = auth.uid()
    )
  );

-- Canvas presence policies
CREATE POLICY "Collaborators can view presence"
  ON canvas_presence FOR SELECT
  USING (
    -- Project owner
    EXISTS (
      SELECT 1 FROM canvas_projects cp
      WHERE cp.id = project_id
        AND cp.user_id = auth.uid()
    )
    OR
    -- Direct collaborator
    user_is_project_collaborator(project_id, auth.uid())
    OR
    -- Lab member with access
    user_can_access_project_via_lab(auth.uid(), project_id)
  );

CREATE POLICY "Users can update their own presence"
  ON canvas_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their presence"
  ON canvas_presence FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their presence"
  ON canvas_presence FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Part 5: Create Triggers for updated_at
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at
DROP TRIGGER IF EXISTS update_labs_updated_at ON labs;
CREATE TRIGGER update_labs_updated_at
  BEFORE UPDATE ON labs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_members_updated_at ON lab_members;
CREATE TRIGGER update_lab_members_updated_at
  BEFORE UPDATE ON lab_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_collections_updated_at ON project_collections;
CREATE TRIGGER update_project_collections_updated_at
  BEFORE UPDATE ON project_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Part 6: Auto-create owner as member when lab is created
-- =====================================================

CREATE OR REPLACE FUNCTION create_lab_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lab_members (lab_id, user_id, role, status, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active', NEW.owner_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_lab_owner_membership_trigger ON labs;
CREATE TRIGGER create_lab_owner_membership_trigger
  AFTER INSERT ON labs
  FOR EACH ROW
  EXECUTE FUNCTION create_lab_owner_membership();

-- =====================================================
-- Part 7: Cleanup expired invitations periodically
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_lab_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE lab_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_lab_invitations() TO authenticated;

-- =====================================================
-- Part 8: Grant permissions
-- =====================================================

GRANT ALL ON labs TO authenticated;
GRANT ALL ON lab_members TO authenticated;
GRANT ALL ON lab_invitations TO authenticated;
GRANT ALL ON project_collections TO authenticated;
GRANT ALL ON project_collection_items TO authenticated;
GRANT ALL ON lab_projects TO authenticated;
GRANT ALL ON canvas_presence TO authenticated;

-- Grant usage on sequences if any
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE labs IS 'Lab groups for team collaboration. Each lab has an owner and can have multiple members with different roles.';
COMMENT ON TABLE lab_members IS 'Membership records linking users to labs with role and status tracking.';
COMMENT ON TABLE lab_invitations IS 'Pending invitations to join labs. Includes token-based acceptance and expiration.';
COMMENT ON TABLE project_collections IS 'User-created portfolios/collections for grouping multiple projects.';
COMMENT ON TABLE project_collection_items IS 'Many-to-many relationship between collections and projects.';
COMMENT ON TABLE lab_projects IS 'Projects shared with entire labs with specific permission levels.';
COMMENT ON TABLE canvas_presence IS 'Real-time tracking of user cursors and viewports for collaborative editing.';
