import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscribeRequest {
  email: string;
  source: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, source, userId }: SubscribeRequest = await req.json();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate source
    if (!source || typeof source !== 'string') {
      console.log('Invalid source:', source);
      return new Response(
        JSON.stringify({ error: 'Invalid subscription source' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const { data: existing, error: lookupError } = await supabase
      .from('email_subscriptions')
      .select('id, is_active, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (lookupError) {
      console.error('Database lookup error:', lookupError);
      throw new Error('Failed to check subscription status');
    }

    if (existing && existing.is_active) {
      console.log('User already subscribed:', normalizedEmail);
      return new Response(
        JSON.stringify({ 
          message: 'Already subscribed', 
          alreadySubscribed: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reactivate if previously unsubscribed
    if (existing && !existing.is_active) {
      console.log('Reactivating subscription for:', normalizedEmail);
      const { error: updateError } = await supabase
        .from('email_subscriptions')
        .update({ 
          is_active: true, 
          unsubscribed_at: null,
          subscribed_at: new Date().toISOString(),
          subscription_source: source
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Reactivation error:', updateError);
        throw new Error('Failed to reactivate subscription');
      }
    } else {
      // Create new subscription
      console.log('Creating new subscription for:', normalizedEmail);
      const { error: insertError } = await supabase
        .from('email_subscriptions')
        .insert({
          email: normalizedEmail,
          user_id: userId || null,
          subscription_source: source,
          is_active: true
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to create subscription');
      }
    }

    // Send welcome email via Resend
    console.log('Sending welcome email to:', normalizedEmail);
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    try {
      const emailResult = await resend.emails.send({
        from: "BioSketch <onboarding@resend.dev>",
        to: [normalizedEmail],
        subject: "Welcome to BioSketch! 🎨",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0066cc; margin: 0; font-size: 32px;">Welcome to BioSketch!</h1>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Thanks for subscribing to our newsletter! You're now part of a community of scientists creating beautiful illustrations.
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; font-weight: 600;">
                Here's what you'll receive:
              </p>
              
              <ul style="color: #555; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>📚 <strong>Weekly tips</strong> on scientific illustration best practices</li>
                <li>🎨 <strong>New features</strong> and tools announcements</li>
                <li>🌟 <strong>Community highlights</strong> and inspiration</li>
                <li>📖 <strong>Educational content</strong> and tutorials</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://tljsbmpglwmzyaoxsqyj.supabase.co/canvas" 
                 style="display: inline-block; padding: 14px 32px; background: #0066cc; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Start Creating Now
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 32px;">
              <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                You're receiving this because you subscribed to BioSketch updates.<br/>
                <a href="https://tljsbmpglwmzyaoxsqyj.supabase.co/unsubscribe" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
      });

      console.log('Welcome email sent successfully:', emailResult);
    } catch (emailError) {
      // Log email error but don't fail the subscription
      console.error('Failed to send welcome email:', emailError);
      // Still return success since subscription was created
    }

    console.log(`Newsletter subscription successful: ${normalizedEmail} from ${source}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription successful' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error in subscribe-newsletter:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
