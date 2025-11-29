import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stylePrompts = {
  pencil: `Hand-drawn pencil sketch style scientific illustration.
Create with:
- Fine pencil line work with varying pressure
- Subtle cross-hatching for shading and depth
- Sketch-like imperfect lines that feel organic
- Grayscale tones with occasional soft highlights
- Scientific accuracy with artistic hand-drawn quality
- Clean white or transparent background
- Textbook illustration feel like vintage anatomy drawings`,

  biomedical: `Clean flat vector style scientific illustration.
Create with:
- Smooth, clean vector shapes with no rough edges
- Soft pastel color palette (muted pinks, blues, greens, purples)
- Subtle gradients for depth, never harsh shadows
- Consistent line weights throughout
- Minimal design focusing on essential shapes
- Professional scientific accuracy
- No harsh black outlines - use soft colored edges
- Modern, approachable scientific illustration style
- Transparent or clean white background`,

  oil: `Oil painting style artistic scientific illustration.
Create with:
- Rich, textured brush strokes visible in the rendering
- Deep, saturated color palette with warm undertones
- Dramatic lighting with painterly shadows
- Blended edges that feel soft and organic
- Artistic interpretation while maintaining scientific accuracy
- Canvas-like texture effect
- Renaissance medical illustration influence
- Atmospheric depth and rich visual presence`
};

const creativityPrompts = {
  faithful: `IMPORTANT: Recreate this image with high fidelity. 
Maintain exact proportions, colors, structural details, and overall composition. 
Make only minimal adjustments for clarity. Stay very close to the original.`,
  
  balanced: `Transform this image while maintaining scientific accuracy. 
Keep key visual elements and proportions but allow stylistic improvements. 
Balance originality with recognizability.`,
  
  creative: `Use this image as creative inspiration. 
Feel free to reimagine the design artistically while preserving the core scientific concept. 
Explore creative interpretations with varied colors, styles, and artistic elements.`
};

function buildEnhancedPrompt(
  userPrompt: string, 
  style: keyof typeof stylePrompts,
  backgroundType: 'transparent' | 'white' = 'transparent',
  creativityLevel: 'faithful' | 'balanced' | 'creative' = 'balanced'
): string {
  const basePrompt = stylePrompts[style];
  const creativityInstruction = creativityPrompts[creativityLevel];
  
  const backgroundInstruction = backgroundType === 'transparent'
    ? `Output MUST be a PNG with a fully transparent background (RGBA, alpha channel).
Do not include any white or colored background, shadows, borders, glow, or backdrop layers of any kind.`
    : `Output MUST be a PNG with a clean, solid white background (#FFFFFF).
Ensure the subject has clear edges against the white background.`;
  
  return `${creativityInstruction}

${basePrompt}. Transform this reference image to create: ${userPrompt}.
Ensure scientific accuracy, clean edges, and high contrast at small sizes.
${backgroundInstruction}
Optimize for use as a small scientific icon.`;
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

    // Check user permissions and rate limits using RPC
    console.log('🔍 Checking user permissions and rate limits...');
    const { data: canGenerateData, error: canGenerateError } = await supabaseClient
      .rpc('can_user_generate', { _user_id: user.id });

    if (canGenerateError) {
      console.error('❌ Error checking generation permissions:', canGenerateError);
      throw new Error('Failed to check generation permissions');
    }

    console.log('📊 Generation check result:', canGenerateData);

    const isAdmin = canGenerateData.isAdmin;
    const hasPremium = canGenerateData.hasPremium;
    const canGenerate = canGenerateData.canGenerate;

    console.log('👤 User is admin:', isAdmin);
    console.log('⭐ User has premium:', hasPremium);
    console.log('✅ Can generate:', canGenerate);

    // Check if user has premium access
    if (!isAdmin && !hasPremium) {
      const needsApproved = canGenerateData.needsApproved || 3;
      console.log('⛔ User does not have premium access. Needs', needsApproved, 'more approved projects');
      throw new Error('PREMIUM_REQUIRED');
    }

    // Check if user has exceeded rate limit
    if (!isAdmin && !canGenerate) {
      const used = canGenerateData.used || 0;
      const limit = canGenerateData.limit || 3;
      console.log('⛔ Rate limit exceeded for user:', user.id, `(${used}/${limit})`);
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    const { image, prompt, style = 'simple', size = '512x512', backgroundType = 'transparent', creativityLevel = 'balanced' } = await req.json();

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
    console.log('🖼️ Background type:', backgroundType);
    console.log('🎨 Creativity level:', creativityLevel);

    // Validate image format
    if (!image.startsWith('data:image/')) {
      throw new Error('Invalid image format. Must be a data URL.');
    }

    // Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(
      prompt, 
      style as keyof typeof stylePrompts,
      backgroundType as 'transparent' | 'white',
      creativityLevel as 'faithful' | 'balanced' | 'creative'
    );
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

    // Log format for diagnostics
    const isPng = generatedImageUrl.startsWith('data:image/png');
    const isJpeg = generatedImageUrl.startsWith('data:image/jpeg') || 
                   generatedImageUrl.startsWith('data:image/jpg') || 
                   generatedImageUrl.startsWith('data:image/webp');
    console.log('🧪 Model output format:', isPng ? 'PNG' : isJpeg ? 'JPEG/WEBP' : 'Unknown');

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
    } else if (errorMessage === 'PREMIUM_REQUIRED') {
      statusCode = 403;
      errorMessage = 'Premium access required';
      errorContext = 'AI icon generation requires 3+ approved public projects. Share your projects to the community to unlock this feature.';
    } else if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
      statusCode = 429;
      errorMessage = 'Monthly generation limit reached';
      errorContext = 'You have used your 3 free AI icon generations for this month. Limit resets on the 1st of next month.';
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
