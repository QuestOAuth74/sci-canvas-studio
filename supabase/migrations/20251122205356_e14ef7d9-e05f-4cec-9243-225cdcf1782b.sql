-- Drop and recreate foreign key relationships to point to profiles table
-- The existing constraints likely point to auth.users which causes the join error

-- Drop existing constraints if they exist
ALTER TABLE public.project_collaboration_invitations
DROP CONSTRAINT IF EXISTS project_collaboration_invitations_inviter_id_fkey;

ALTER TABLE public.project_collaboration_invitations
DROP CONSTRAINT IF EXISTS project_collaboration_invitations_invitee_id_fkey;

-- Recreate foreign keys pointing to profiles table (not auth.users)
-- Add foreign key for inviter_id (the user who sent the invitation)
ALTER TABLE public.project_collaboration_invitations
ADD CONSTRAINT project_collaboration_invitations_inviter_id_fkey
FOREIGN KEY (inviter_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add foreign key for invitee_id (the user who will receive the invitation)
-- This is nullable since the invitee might not have an account yet
ALTER TABLE public.project_collaboration_invitations
ADD CONSTRAINT project_collaboration_invitations_invitee_id_fkey
FOREIGN KEY (invitee_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;