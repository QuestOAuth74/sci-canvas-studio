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

    // Scientific accuracy guidelines - applied to all modes
    const scientificAccuracyGuidelines = `
SCIENTIFIC ACCURACY REQUIREMENTS:
- Anatomically accurate representations based on established scientific references (e.g., Gray's Anatomy for human anatomy, Alberts' Molecular Biology of the Cell for cellular structures)
- Correct proportions and spatial relationships between structures
- Accurate representation of biological processes and molecular interactions
- Use standard scientific nomenclature and labeling conventions
- Maintain proper scale relationships where applicable
- Follow established conventions for depicting biological structures (e.g., mitochondria with cristae, cell membranes as lipid bilayers)
- Ensure molecular structures reflect actual 3D conformations when relevant
- Use scientifically appropriate color coding (e.g., oxygen in red, nitrogen in blue for molecular models)`;

    // Build the system prompt based on mode
    let systemPrompt = '';
    let userPrompt = '';

    switch (mode) {
      case 'prompt_to_visual':
        systemPrompt = `You are a scientific illustration expert creating publication-quality figures for peer-reviewed journals and academic textbooks.

VISUAL STYLE REQUIREMENTS:
${styleDescription}

${scientificAccuracyGuidelines}

PUBLICATION STANDARDS:
- Suitable for high-impact academic journals (Nature, Science, Cell)
- Clear visual hierarchy with proper emphasis on key elements
- Professional composition with balanced negative space
- White or transparent background preferred
- Include scale bars where appropriate
- Use clear, legible labels and annotations

Generate a scientifically rigorous figure based on the user's description.`;
        userPrompt = prompt;
        break;

      case 'sketch_transform':
        systemPrompt = `You are a scientific illustration expert specializing in transforming hand-drawn sketches into publication-ready figures.

VISUAL STYLE REQUIREMENTS:
${styleDescription}

${scientificAccuracyGuidelines}

TRANSFORMATION GUIDELINES:
- Preserve the original concept and layout from the sketch
- Correct any anatomical or structural inaccuracies based on established scientific references
- Add proper proportions following standard anatomical and biological conventions
- Ensure structures match their real-world counterparts (e.g., organelle shapes, protein conformations)
- Clean up geometry while maintaining scientific authenticity
- Add appropriate scientific detail that may be missing from the sketch
- Make it publication-ready while maintaining the original intent

Transform this sketch into an anatomically accurate, professionally rendered scientific figure.`;
        userPrompt = prompt || 'Transform this hand-drawn sketch into a professional, anatomically accurate scientific figure.';
        break;

      case 'image_enhancer':
        systemPrompt = `You are a scientific image enhancement specialist with expertise in biomedical and scientific visualization.

VISUAL STYLE REQUIREMENTS:
${styleDescription}

${scientificAccuracyGuidelines}

ENHANCEMENT GUIDELINES:
- Sharpen edges and improve clarity while preserving scientific accuracy
- Correct colors using standard scientific color conventions
- Improve contrast to highlight key structures
- Remove noise and artifacts without losing important detail
- Ensure anatomical structures remain accurate after enhancement
- Maintain proper proportions and spatial relationships
- Apply the specified visual style consistently throughout
- Preserve any labels, scale bars, or annotations

Enhance this image to meet publication standards while ensuring scientific accuracy.`;
        userPrompt = prompt || 'Enhance this scientific image to be sharp, clean, anatomically accurate, and journal-ready.';
        break;

      case 'style_match':
        systemPrompt = `You are a scientific illustration expert specializing in consistent visual style application across scientific figures.

${scientificAccuracyGuidelines}

STYLE MATCHING GUIDELINES:
- Analyze the reference image's color palette, line weights, and rendering technique
- Apply the same artistic style to the new content
- Match the level of detail and abstraction
- Maintain consistency with the reference's visual language
- Ensure the new figure maintains scientific accuracy regardless of style

Additionally apply these style characteristics:
${styleDescription}

Generate the requested figure matching the reference style while ensuring anatomical and scientific accuracy.`;
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
