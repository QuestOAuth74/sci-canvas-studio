-- Create function to send comment notifications
CREATE OR REPLACE FUNCTION public.notify_comment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the edge function to handle notifications
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-comment-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'comment_id', NEW.id,
      'project_id', NEW.project_id,
      'comment_text', NEW.comment_text,
      'commenter_id', NEW.user_id,
      'parent_comment_id', NEW.parent_comment_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on project_comments
DROP TRIGGER IF EXISTS trigger_notify_comment_created ON public.project_comments;
CREATE TRIGGER trigger_notify_comment_created
  AFTER INSERT ON public.project_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment_created();

-- Add settings for edge function URL (these should be set by Supabase)
-- Run these as superuser or in a migration:
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://tljsbmpglwmzyaoxsqyj.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';

COMMENT ON FUNCTION public.notify_comment_created() IS 'Triggers notification edge function when a comment is created';
COMMENT ON TRIGGER trigger_notify_comment_created ON public.project_comments IS 'Sends notifications for new comments and mentions';
