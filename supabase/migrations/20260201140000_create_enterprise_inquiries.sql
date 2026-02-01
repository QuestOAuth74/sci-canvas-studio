-- Create enterprise_inquiries table for storing Enterprise plan contact requests
CREATE TABLE IF NOT EXISTS public.enterprise_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT NOT NULL,
  team_size TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.enterprise_inquiries ENABLE ROW LEVEL SECURITY;

-- Only admins can view inquiries
CREATE POLICY "Admins can view all enterprise inquiries"
ON public.enterprise_inquiries FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert (submit inquiry form)
CREATE POLICY "Anyone can submit enterprise inquiry"
ON public.enterprise_inquiries FOR INSERT
WITH CHECK (true);

-- Only admins can update
CREATE POLICY "Admins can update enterprise inquiries"
ON public.enterprise_inquiries FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_enterprise_inquiries_status ON public.enterprise_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_inquiries_created_at ON public.enterprise_inquiries(created_at DESC);

-- Add comment
COMMENT ON TABLE public.enterprise_inquiries IS 'Stores contact form submissions from the Enterprise pricing tier';
