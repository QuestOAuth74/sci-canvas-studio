import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { invitationId }: InvitationRequest = await req.json();

    console.log("Processing invitation email for:", invitationId);

    // Fetch invitation details with project and user info
    const { data: invitation, error: inviteError } = await supabase
      .from("project_collaboration_invitations")
      .select(`
        *,
        project:canvas_projects(name, id),
        inviter:profiles!inviter_id(full_name, email)
      `)
      .eq("id", invitationId)
      .single();

    if (inviteError || !invitation) {
      console.error("Invitation not found:", inviteError);
      return new Response(
        JSON.stringify({ error: "Invitation not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const inviterName = invitation.inviter.full_name || invitation.inviter.email;
    const projectName = invitation.project.name;
    const siteUrl = "https://biosketch.art";
    const acceptUrl = `${siteUrl}/canvas?invitation=${invitation.invitation_token}`;

    const roleDescription = invitation.role === 'editor' 
      ? 'Editor (can edit canvas)' 
      : invitation.role === 'viewer' 
        ? 'Viewer (read-only)' 
        : 'Admin (full access)';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🤝 Collaboration Invitation</h1>
          </div>

          <div style="background-color: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi there! 👋</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              <strong>${inviterName}</strong> has invited you to collaborate on their BioSketch project:
            </p>

            <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; color: #374151; font-weight: 600; font-size: 18px;">"${projectName}"</p>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                Your role: <strong>${roleDescription}</strong>
              </p>
            </div>

            ${invitation.personal_message ? `
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #374151; font-style: italic;">"${invitation.personal_message}"</p>
                <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">— ${inviterName}</p>
              </div>
            ` : ""}

            <h3 style="color: #1f2937; margin-top: 32px; margin-bottom: 16px;">What is collaboration on BioSketch?</h3>
            <ul style="color: #4b5563; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Work together on scientific illustrations in real-time</li>
              <li style="margin-bottom: 8px;">Add comments and discussions directly on the canvas</li>
              <li style="margin-bottom: 8px;">See who's actively working on the project</li>
              <li style="margin-bottom: 8px;">Track changes and view version history</li>
            </ul>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${acceptUrl}"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Accept Invitation & Start Collaborating →
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              This invitation will expire in 7 days. If you don't have a BioSketch account yet, 
              you'll be prompted to create one (it's free!).
            </p>

            <p style="color: #9ca3af; font-size: 14px; margin-top: 16px;">
              Not interested? Just ignore this email.
            </p>
          </div>

          <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">
              This email was sent because ${inviterName} invited you to collaborate on BioSketch.
            </p>
            <p style="margin: 8px 0 0 0;">
              BioSketch • Free Scientific Illustration Tool • 
              <a href="https://biosketch.art" style="color: #667eea; text-decoration: none;">biosketch.art</a>
            </p>
          </div>

        </body>
      </html>
    `;

    console.log("Sending email to:", invitation.invitee_email);

    const emailResponse = await resend.emails.send({
      from: "BioSketch <noreply@biosketch.art>",
      to: [invitation.invitee_email],
      subject: `${inviterName} invited you to collaborate on "${projectName}"`,
      html: emailHtml,
    });

    console.log("Collaboration invitation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation email sent successfully",
        id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-collaboration-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation email",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
