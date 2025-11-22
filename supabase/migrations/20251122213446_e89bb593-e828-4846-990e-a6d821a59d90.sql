-- Remove the problematic trigger-based notification system
DROP TRIGGER IF EXISTS trigger_notify_comment_created ON public.project_comments;
DROP FUNCTION IF EXISTS public.notify_comment_created();

COMMENT ON TABLE public.project_comments IS 'Project comments with support for threading and mentions. Notifications are handled via client-side edge function calls.';
