import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommentNotificationPayload {
  comment_id: string;
  project_id: string;
  comment_text: string;
  commenter_id: string;
  parent_comment_id?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: CommentNotificationPayload = await req.json();
    console.log("Processing comment notification:", payload);

    // Get commenter details
    const { data: commenter } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", payload.commenter_id)
      .single();

    if (!commenter) {
      throw new Error("Commenter not found");
    }

    const commenterName = commenter.full_name || commenter.email;

    // Get project details
    const { data: project } = await supabase
      .from("canvas_projects")
      .select("id, name, user_id")
      .eq("id", payload.project_id)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    // Get all collaborators including owner
    const { data: collaborators } = await supabase
      .from("project_collaborators")
      .select("user_id")
      .eq("project_id", payload.project_id)
      .not("accepted_at", "is", null);

    const allProjectMembers = new Set<string>([
      project.user_id,
      ...(collaborators || []).map(c => c.user_id)
    ]);

    // Remove commenter from notification recipients
    allProjectMembers.delete(payload.commenter_id);

    // Extract @mentions from comment text
    const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*?)(?=\s|$|@)/g;
    const mentions = [...payload.comment_text.matchAll(mentionRegex)].map(m => m[1].trim());
    console.log("Detected mentions:", mentions);

    // Find mentioned users
    const mentionedUserIds = new Set<string>();
    if (mentions.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", Array.from(allProjectMembers));

      profiles?.forEach(profile => {
        const name = profile.full_name || profile.email;
        if (mentions.some(mention => 
          name.toLowerCase().includes(mention.toLowerCase()) ||
          mention.toLowerCase().includes(name.toLowerCase())
        )) {
          mentionedUserIds.add(profile.id);
        }
      });
    }

    console.log("Mentioned user IDs:", Array.from(mentionedUserIds));

    // Prepare notification recipients
    const recipientIds = new Set<string>();
    
    // Add mentioned users
    mentionedUserIds.forEach(id => recipientIds.add(id));
    
    // Add project owner if not mentioned and not the commenter
    if (!mentionedUserIds.has(project.user_id) && project.user_id !== payload.commenter_id) {
      recipientIds.add(project.user_id);
    }

    // Create notifications and send emails
    const notifications = [];

    for (const userId of recipientIds) {
      const isMentioned = mentionedUserIds.has(userId);
      const isReply = !!payload.parent_comment_id;

      let subject: string;
      let message: string;

      if (isMentioned) {
        subject = isReply 
          ? `${commenterName} mentioned you in a reply`
          : `${commenterName} mentioned you in a comment`;
        message = `${commenterName} mentioned you in ${project.name}: "${payload.comment_text.slice(0, 150)}${payload.comment_text.length > 150 ? '...' : ''}"`;
      } else {
        subject = isReply
          ? `${commenterName} replied to a comment`
          : `New comment on ${project.name}`;
        message = `${commenterName} ${isReply ? 'replied' : 'commented'} on ${project.name}: "${payload.comment_text.slice(0, 150)}${payload.comment_text.length > 150 ? '...' : ''}"`;
      }

      // Get recipient email
      const { data: recipientProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();

      if (!recipientProfile?.email) {
        console.error(`No email found for user ${userId}`);
        continue;
      }

      const projectUrl = `https://tljsbmpglwmzyaoxsqyj.supabase.co/canvas?project=${payload.project_id}`;

      // Send email notification
      try {
        await resend.emails.send({
          from: "BioSketch <notifications@resend.dev>",
          to: [recipientProfile.email],
          subject,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">BioSketch</h1>
                  </div>
                  <div style="padding: 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">${subject}</h2>
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                      ${message}
                    </p>
                    <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="color: #495057; margin: 0; font-style: italic; line-height: 1.5;">
                        "${payload.comment_text.slice(0, 200)}${payload.comment_text.length > 200 ? '...' : ''}"
                      </p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Comment</a>
                    </div>
                    <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 20px 0 0 0; text-align: center;">
                      You received this notification because you are ${isMentioned ? 'mentioned in' : 'collaborating on'} this project.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        console.log(`Email sent to ${recipientProfile.email}`);
      } catch (emailError) {
        console.error(`Error sending email to ${recipientProfile.email}:`, emailError);
      }

      // Insert in-app notification
      const { error: notificationError } = await supabase
        .from("user_notifications")
        .insert({
          user_id: userId,
          subject,
          message,
          sender_name: commenterName,
          sent_via_email: true,
          is_read: false
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      } else {
        notifications.push({ userId, subject });
      }
    }

    console.log(`Created ${notifications.length} notifications for comment ${payload.comment_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications: notifications.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-comment-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
