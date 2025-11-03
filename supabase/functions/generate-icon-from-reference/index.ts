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

    // Call OpenAI Image Generation API
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('🤖 Calling OpenAI Image Generation...');
    
    // Convert base64 data URL to buffer
    const base64Data = image.split(',')[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Create form data for OpenAI API
    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'reference.png');
    formData.append('prompt', enhancedPrompt);
    formData.append('model', 'gpt-image-1');
    formData.append('n', '1');
    formData.append('size', size);
    formData.append('response_format', 'b64_json');

    const aiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ OpenAI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (aiResponse.status === 402) {
        throw new Error('CREDITS_DEPLETED');
      }
      
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedImageB64 = aiData.data?.[0]?.b64_json;

    if (!generatedImageB64) {
      console.error('❌ No image in OpenAI response:', JSON.stringify(aiData));
      throw new Error('No image generated by OpenAI');
    }

    // Convert to data URL format for frontend
    const generatedImageUrl = `data:image/png;base64,${generatedImageB64}`;

    console.log('✅ Icon generated successfully');
    console.log('📦 Image size:', generatedImageUrl.length, 'bytes (base64)');

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
