import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type GenerationMode = 'prompt_to_visual' | 'sketch_transform' | 'image_enhancer' | 'style_match';

interface GenerationRequest {
  mode: GenerationMode;
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
  referenceImage?: string; // base64 encoded image
  contextImage?: string; // base64 encoded context/style reference
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { mode, prompt, style, referenceImage, contextImage } = await req.json() as GenerationRequest;

    console.log(`[generate-figure-gemini] Mode: ${mode}, Style: ${style}, Prompt length: ${prompt.length}`);

    // Build the system prompt based on mode
    let systemPrompt = '';
    let userPrompt = '';

    switch (mode) {
      case 'prompt_to_visual':
        systemPrompt = `You are a scientific illustration expert. Generate a clear, professional scientific figure based on the user's description. 
Style: ${style === 'flat' ? 'Clean flat design with solid colors and clear outlines' : style === '3d' ? 'Detailed 3D rendering with realistic shading and depth' : 'Hand-drawn sketch style with pencil-like textures'}.
Focus on scientific accuracy and clarity. The figure should be suitable for academic publications.`;
        userPrompt = prompt;
        break;

      case 'sketch_transform':
        systemPrompt = `You are a scientific illustration expert. Transform the provided hand-drawn sketch into a polished, professional scientific figure.
Maintain the core structure and concept from the sketch while enhancing it with:
Style: ${style === 'flat' ? 'Clean flat design with solid colors and clear outlines' : style === '3d' ? 'Detailed 3D rendering with realistic shading and depth' : 'Refined hand-drawn aesthetic with consistent line weights'}.
Keep scientific accuracy and improve visual clarity for academic use.`;
        userPrompt = prompt || 'Transform this hand-drawn sketch into a professional scientific figure.';
        break;

      case 'image_enhancer':
        systemPrompt = `You are a scientific image enhancement specialist. Enhance the provided image to make it publication-ready.
Apply: Sharp edges, clean lines, consistent colors, and professional appearance.
Style: ${style === 'flat' ? 'Clean flat design' : style === '3d' ? 'Enhanced 3D appearance' : 'Refined sketch style'}.
Remove noise, improve contrast, and ensure the image meets journal publication standards.`;
        userPrompt = prompt || 'Enhance this scientific image to be sharp, clean, and journal-ready.';
        break;

      case 'style_match':
        systemPrompt = `You are a scientific illustration expert. Generate a new figure that matches the visual style of the reference image provided.
Capture the artistic style, color palette, line weights, and overall aesthetic.
Generate: ${prompt}
Style reference should be closely followed while creating original scientific content.`;
        userPrompt = prompt;
        break;

      default:
        throw new Error(`Invalid generation mode: ${mode}`);
    }

    // Prepare the content parts for Gemini
    const parts: any[] = [];

    // Add system instruction
    parts.push({ text: systemPrompt });
    parts.push({ text: userPrompt });

    // Add reference image if provided (for sketch_transform, image_enhancer, style_match)
    if (referenceImage) {
      const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: base64Data
        }
      });
    }

    // Add context/style image if provided (for style_match)
    if (contextImage) {
      const base64Data = contextImage.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: base64Data
        }
      });
    }

    // Call Gemini API with image generation
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: parts
            }
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[generate-figure-gemini] Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('[generate-figure-gemini] Gemini response received');

    // Extract the generated image from the response
    let generatedImage: string | null = null;
    let textResponse: string | null = null;

    if (geminiData.candidates && geminiData.candidates[0]?.content?.parts) {
      for (const part of geminiData.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          generatedImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
        if (part.text) {
          textResponse = part.text;
        }
      }
    }

    if (!generatedImage) {
      console.log('[generate-figure-gemini] No image generated, text response:', textResponse);
      throw new Error('Failed to generate image. The model may not support image generation for this request.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        image: generatedImage,
        description: textResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[generate-figure-gemini] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
