import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stylePrompts = {
  medical: "Professional medical illustration icon, anatomical accuracy, clean lines, textbook quality, white background, simple and clear, high contrast",
  biochemical: "Biochemical pathway icon, molecular structure, scientific diagram style, clear symbols, white background, professional quality",
  cellular: "Cellular biology icon, microscopic detail, scientific illustration, clean and professional, white background",
  simple: "Simple icon design, minimal details, clear silhouette, professional scientific style, white background, easy to recognize",
  detailed: "Detailed scientific illustration icon, high accuracy, educational quality, clear features, white background, professional"
};

function buildEnhancedPrompt(userPrompt: string, style: keyof typeof stylePrompts): string {
  const basePrompt = stylePrompts[style];
  return `${basePrompt}. Transform this reference image to create: ${userPrompt}. 
Maintain scientific accuracy, use clean lines, ensure high contrast for visibility at small sizes, 
remove background clutter, optimize for use as an icon. Output should be clear, professional, and suitable for scientific diagrams.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    // Detailed logging
    console.log('🔐 Request received');
    console.log('🔐 Auth header present:', !!authHeader);
    console.log('🔐 Auth header format:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      throw new Error('No authorization header');
    }

    // Extract JWT token from header
    const jwt = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('🔑 Attempting to validate user with JWT...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    
    if (userError) {
      console.error('❌ Auth validation failed:', userError.message);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      console.error('❌ No user found in valid token');
      throw new Error('User not found');
    }

    console.log('✅ User authenticated successfully:', user.id);

    // Check if user is admin
    console.log('🔍 Checking user permissions...');
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!userRole;
    console.log('👤 User is admin:', isAdmin);

    // If not admin, check rate limits
    if (!isAdmin) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      console.log('📊 Checking rate limits for month:', currentMonth);
      
      const { data: usageData, error: usageError } = await supabaseClient
        .from('ai_generation_usage')
        .select('id', { count: 'exact', head: false })
        .eq('user_id', user.id)
        .eq('month_year', currentMonth);
      
      if (usageError) {
        console.error('❌ Error checking usage:', usageError);
        throw new Error('Failed to check usage limits');
      }
      
      const usageCount = usageData?.length || 0;
      console.log('📈 Current usage count:', usageCount, '/ 2');
      
      if (usageCount >= 2) {
        console.log('⛔ Rate limit exceeded for user:', user.id);
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
    }

    const { image, prompt, style = 'simple', size = '512x512' } = await req.json();

    if (!image || !prompt) {
      throw new Error('Missing required fields: image and prompt');
    }

    // Log request details
    console.log('📊 Request details:');
    console.log('  - Image size:', Math.round(image.length / 1024), 'KB');
    console.log('  - Prompt length:', prompt.length, 'chars');
    console.log('  - Style:', style);
    console.log('  - Target size:', size);

    console.log('🎨 Starting icon generation for user:', user.id);
    console.log('📝 Prompt:', prompt);
    console.log('🎭 Style:', style);

    // Validate image format
    if (!image.startsWith('data:image/')) {
      throw new Error('Invalid image format. Must be a data URL.');
    }

    // Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(prompt, style as keyof typeof stylePrompts);
    console.log('✨ Enhanced prompt:', enhancedPrompt);

    // Call Lovable AI Gateway for image transformation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('🤖 Calling Lovable AI (Gemini image model)...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: enhancedPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (aiResponse.status === 402) {
        throw new Error('CREDITS_DEPLETED');
      }
      
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      console.error('❌ No image in AI response:', JSON.stringify(aiData));
      throw new Error('No image generated by AI');
    }

    console.log('✅ Icon generated successfully');
    console.log('📦 Image size:', generatedImageUrl.length, 'bytes (base64)');

    // Track usage (only for non-admins)
    if (!isAdmin) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const supabaseAdminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { error: trackingError } = await supabaseAdminClient
        .from('ai_generation_usage')
        .insert({
          user_id: user.id,
          month_year: currentMonth,
          prompt: prompt,
          style: style,
          generated_at: new Date().toISOString()
        });
      
      if (trackingError) {
        console.error('⚠️ Failed to track usage:', trackingError);
        // Don't fail the request if tracking fails
      } else {
        console.log('✅ Usage tracked successfully');
      }
    }

    // Return the generated image
    // Frontend will handle upload to storage and database insertion
    return new Response(JSON.stringify({
      success: true,
      generatedImage: generatedImageUrl,
      prompt: enhancedPrompt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error in generate-icon-from-reference:', error);
    
    let statusCode = 500;
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorContext = '';
    
    if (errorMessage === 'RATE_LIMITED') {
      statusCode = 429;
      errorMessage = 'Rate limits exceeded. Please try again later.';
    } else if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
      statusCode = 429;
      errorMessage = 'Monthly generation limit reached';
      errorContext = 'You have used your 2 free AI icon generations for this month. Limit resets on the 1st of next month.';
    } else if (errorMessage === 'CREDITS_DEPLETED') {
      statusCode = 402;
      errorMessage = 'AI credits depleted. Please add credits in Settings → Workspace → Usage.';
    } else if (errorMessage === 'Unauthorized' || errorMessage === 'No authorization header') {
      statusCode = 401;
      errorMessage = 'Authentication required';
      errorContext = 'Please sign in again. Your session may have expired.';
    } else if (errorMessage.includes('Authentication failed')) {
      statusCode = 401;
      errorContext = 'Token validation failed. Please refresh the page and try again.';
    } else if (errorMessage === 'User not found') {
      statusCode = 401;
      errorContext = 'User session invalid. Please sign in again.';
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      context: errorContext,
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
