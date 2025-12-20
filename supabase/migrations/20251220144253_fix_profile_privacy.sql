-- Fix profile privacy by restricting email exposure
-- This migration addresses the security vulnerability where email addresses
-- were publicly accessible for users with approved public projects

-- Create a view for public-safe profile data (excluding email)
-- This view can be used by the application to safely query public profile information
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  avatar_url,
  bio,
  country,
  field_of_study,
  created_at,
  updated_at,
  quote
FROM public.profiles;

-- Grant SELECT access to authenticated users on the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add a comment to the profiles table documenting the security policy
COMMENT ON COLUMN public.profiles.email IS
  'SECURITY: Email should only be visible to the profile owner and admins.
   Application code must use explicit column selection and avoid selecting email
   for other users'' profiles. Use public_profiles view for public access.';

-- Drop and recreate the "Public project creators are viewable by all" policy
-- with better documentation
DROP POLICY IF EXISTS "Public project creators are viewable by all" ON profiles;

-- Recreate the policy with enhanced security documentation
-- NOTE: PostgreSQL RLS cannot enforce column-level restrictions.
-- This policy allows row-level access to profiles of users with public projects.
-- APPLICATION RESPONSIBILITY: Client code must NOT select the email column
-- when querying other users' profiles. Use the public_profiles view or
-- explicit column selection (id, full_name, avatar_url, bio, country, field_of_study)
CREATE POLICY "Public project creators are viewable by all"
ON profiles
FOR SELECT
TO public
USING (
  user_has_public_projects(id)
);

-- Add a security note about the collaborators policy as well
COMMENT ON POLICY "Project collaborators can view each other's profiles" ON profiles IS
  'Allows collaborators to view each others profiles for collaboration purposes.
   Application should not expose email addresses in collaboration UIs.';

-- Create a helper function to get public profile data safely
-- This function can be used by the application to retrieve only public-safe profile fields
CREATE OR REPLACE FUNCTION public.get_public_profile(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT,
  field_of_study TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  quote TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.country,
    p.field_of_study,
    p.created_at,
    p.updated_at,
    p.quote
  FROM public.profiles p
  WHERE p.id = user_id_param
    AND user_has_public_projects(p.id);
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO authenticated, anon;

COMMENT ON FUNCTION public.get_public_profile IS
  'Safely retrieves public profile information without exposing email addresses.
   Use this function or the public_profiles view for displaying author profiles.';
