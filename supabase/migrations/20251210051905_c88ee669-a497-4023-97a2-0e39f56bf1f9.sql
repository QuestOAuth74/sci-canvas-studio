-- Create project_pages table for multi-page canvas support
CREATE TABLE public.project_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  page_name text NOT NULL DEFAULT 'Untitled Page',
  canvas_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  canvas_width integer NOT NULL DEFAULT 1200,
  canvas_height integer NOT NULL DEFAULT 800,
  paper_size text DEFAULT 'custom',
  background_color text DEFAULT '#ffffff',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, page_number)
);

-- Create index for faster lookups
CREATE INDEX idx_project_pages_project_id ON public.project_pages(project_id);
CREATE INDEX idx_project_pages_page_number ON public.project_pages(project_id, page_number);

-- Enable RLS
ALTER TABLE public.project_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Project owners can manage their pages
CREATE POLICY "Users can manage pages for their own projects"
  ON public.project_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM canvas_projects 
      WHERE id = project_pages.project_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM canvas_projects 
      WHERE id = project_pages.project_id 
      AND user_id = auth.uid()
    )
  );

-- Policy: Collaborators can view and edit pages
CREATE POLICY "Collaborators can access project pages"
  ON public.project_pages FOR ALL
  USING (
    user_is_project_collaborator(auth.uid(), project_id)
  )
  WITH CHECK (
    user_is_project_collaborator(auth.uid(), project_id)
  );

-- Policy: Admins can view all pages
CREATE POLICY "Admins can view all project pages"
  ON public.project_pages FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for project_pages
ALTER TABLE public.project_pages REPLICA IDENTITY FULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_project_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_project_pages_updated_at
  BEFORE UPDATE ON public.project_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_pages_updated_at();