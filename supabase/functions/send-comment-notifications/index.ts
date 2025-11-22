import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

    // Create notifications
    const notifications = [];
    const emailPromises = [];

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

      // Insert notification
      const { error: notificationError } = await supabase
        .from("user_notifications")
        .insert({
          user_id: userId,
          subject,
          message,
          sender_name: commenterName,
          sent_via_email: false,
          is_read: false
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      } else {
        notifications.push({ userId, subject });
      }

      // Send email if Resend is configured
      if (resend) {
        const { data: recipient } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (recipient?.email) {
          emailPromises.push(
            resend.emails.send({
              from: "BioSketch <notifications@resend.dev>",
              to: [recipient.email],
              subject,
              html: `
                <h2>${subject}</h2>
                <p>${message}</p>
                <p><a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/canvas?project=${payload.project_id}">View project</a></p>
                <hr />
                <p style="color: #666; font-size: 12px;">You received this notification because you're collaborating on this project or were mentioned in a comment.</p>
              `
            }).catch(error => {
              console.error("Error sending email:", error);
              return null;
            })
          );
        }
      }
    }

    // Wait for all emails to send
    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
      console.log(`Sent ${emailPromises.length} email notifications`);
    }

    console.log(`Created ${notifications.length} notifications for comment ${payload.comment_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications: notifications.length,
        emails_sent: emailPromises.length
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
