-- Add RLS policies for project_pages table
-- Users can manage pages for projects they own

-- Enable RLS on project_pages (if not already enabled)
ALTER TABLE public.project_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view pages of their projects" ON public.project_pages;
DROP POLICY IF EXISTS "Users can create pages for their projects" ON public.project_pages;
DROP POLICY IF EXISTS "Users can update pages of their projects" ON public.project_pages;
DROP POLICY IF EXISTS "Users can delete pages of their projects" ON public.project_pages;
DROP POLICY IF EXISTS "Admins can view all pages" ON public.project_pages;

-- Users can view pages of projects they own
CREATE POLICY "Users can view pages of their projects"
ON public.project_pages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.canvas_projects
    WHERE canvas_projects.id = project_pages.project_id
    AND canvas_projects.user_id = auth.uid()
  )
);

-- Users can create pages for projects they own
CREATE POLICY "Users can create pages for their projects"
ON public.project_pages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.canvas_projects
    WHERE canvas_projects.id = project_pages.project_id
    AND canvas_projects.user_id = auth.uid()
  )
);

-- Users can update pages of projects they own
CREATE POLICY "Users can update pages of their projects"
ON public.project_pages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.canvas_projects
    WHERE canvas_projects.id = project_pages.project_id
    AND canvas_projects.user_id = auth.uid()
  )
);

-- Users can delete pages of projects they own
CREATE POLICY "Users can delete pages of their projects"
ON public.project_pages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.canvas_projects
    WHERE canvas_projects.id = project_pages.project_id
    AND canvas_projects.user_id = auth.uid()
  )
);

-- Admins can view all pages
CREATE POLICY "Admins can view all pages"
ON public.project_pages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add index for better performance on project_id lookups
CREATE INDEX IF NOT EXISTS idx_project_pages_project_id ON public.project_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_pages_page_number ON public.project_pages(project_id, page_number);
