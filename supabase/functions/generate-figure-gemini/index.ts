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

    // Build style description based on selected style
    const getStyleDescription = (style: 'flat' | '3d' | 'sketch'): string => {
      switch (style) {
        case 'flat':
          return 'Flat vector style: Use solid, uniform colors without gradients or shading. Clean geometric shapes with sharp edges. Minimal shadows, no textures. Think modern infographic or icon style with distinct color blocks and clear outlines.';
        case '3d':
          return '3D rendered style: Add realistic depth, shadows, and lighting. Use gradients and shading to create volume. Include specular highlights and ambient occlusion. Render with smooth surfaces and realistic material properties like glass, metal, or organic textures.';
        case 'sketch':
          return 'Hand-drawn sketch style: Use pencil or pen-like strokes with visible line work. Include hatching and cross-hatching for shading. Imperfect, organic lines with varying thickness. Minimal color, mostly grayscale or limited palette. Scientific notebook aesthetic.';
        default:
          return 'Clean, professional scientific illustration style.';
      }
    };

    const styleDescription = getStyleDescription(style);

    // Build the system prompt based on mode
    let systemPrompt = '';
    let userPrompt = '';

    switch (mode) {
      case 'prompt_to_visual':
        systemPrompt = `You are a scientific illustration expert creating publication-quality figures.

VISUAL STYLE REQUIREMENTS:
${styleDescription}

SCIENTIFIC STANDARDS:
- Anatomically and scientifically accurate representations
- Clear labels and annotations where appropriate
- Professional composition suitable for academic journals
- White or transparent background preferred

Generate a scientific figure based on the user's description.`;
        userPrompt = prompt;
        break;

      case 'sketch_transform':
        systemPrompt = `You are a scientific illustration expert. Transform the provided hand-drawn sketch into a polished, professional scientific figure.

VISUAL STYLE REQUIREMENTS:
${styleDescription}

TRANSFORMATION GUIDELINES:
- Preserve the original concept and layout from the sketch
- Correct any anatomical or structural inaccuracies
- Add proper proportions and clean geometry
- Make it publication-ready while maintaining the original intent

Transform this sketch while applying the specified visual style.`;
        userPrompt = prompt || 'Transform this hand-drawn sketch into a professional scientific figure.';
        break;

      case 'image_enhancer':
        systemPrompt = `You are a scientific image enhancement specialist. Enhance the provided image to make it publication-ready.

VISUAL STYLE REQUIREMENTS:
${styleDescription}

ENHANCEMENT GUIDELINES:
- Sharpen edges and improve clarity
- Correct colors and improve contrast
- Remove noise and artifacts
- Maintain scientific accuracy
- Apply the specified visual style consistently throughout

Enhance this image while applying the specified visual style.`;
        userPrompt = prompt || 'Enhance this scientific image to be sharp, clean, and journal-ready.';
        break;

      case 'style_match':
        systemPrompt = `You are a scientific illustration expert. Generate a new figure that matches the visual style of the reference image provided.

STYLE MATCHING GUIDELINES:
- Analyze the reference image's color palette, line weights, and rendering technique
- Apply the same artistic style to the new content
- Match the level of detail and abstraction
- Maintain consistency with the reference's visual language

Additionally apply these style characteristics:
${styleDescription}

Generate the requested figure while matching the reference style.`;
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
