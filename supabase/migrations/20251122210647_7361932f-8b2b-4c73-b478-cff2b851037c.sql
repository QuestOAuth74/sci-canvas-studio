-- Add last_email_sent_at field to track resend attempts
ALTER TABLE project_collaboration_invitations
ADD COLUMN last_email_sent_at timestamptz;