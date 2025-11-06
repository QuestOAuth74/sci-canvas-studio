import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin access
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Admin access required');
    }

    const { generationId, wordDocPath, templateId } = await req.json();

    console.log('Starting PowerPoint generation:', { generationId, wordDocPath, templateId });

    // Download Word document from storage
    const { data: wordDoc, error: downloadError } = await supabaseClient.storage
      .from('ppt-word-uploads')
      .download(wordDocPath);

    if (downloadError) {
      throw new Error(`Failed to download Word document: ${downloadError.message}`);
    }

    // Parse document content (simplified - in production use proper DOCX parser)
    const docText = await wordDoc.text();
    console.log('Document downloaded, size:', docText.length);

    // Call Lovable AI to structure content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a presentation expert. Convert document content into PowerPoint slide structure with titles and bullet points.',
          },
          {
            role: 'user',
            content: `Convert this document into a PowerPoint presentation structure. Create slides with concise titles and 3-5 bullet points each. Identify natural content breaks. Document content:\n\n${docText.substring(0, 10000)}`,
          },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_slides',
            description: 'Structure content into PowerPoint slides',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Presentation title' },
                slides: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      bullets: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    },
                    required: ['title', 'bullets']
                  }
                }
              },
              required: ['title', 'slides']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_slides' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const slideData = toolCall ? JSON.parse(toolCall.function.arguments) : {
      title: 'Generated Presentation',
      slides: [{ title: 'Content', bullets: ['Processing failed - content preview available'] }]
    };

    console.log('AI structured slides:', slideData.slides.length);

    // Generate PowerPoint using PptxGenJS
    const PptxGenJS = await import('https://esm.sh/pptxgenjs@3.12.0');
    const pptx = new PptxGenJS.default();

    // Get template colors
    const templates: Record<string, any> = {
      'scientific-report': { primary: '1e3a8a', secondary: '3b82f6', text: '1e293b' },
      'research-presentation': { primary: '064e3b', secondary: '047857', text: '1f2937' },
      'medical-briefing': { primary: '991b1b', secondary: 'dc2626', text: '111827' },
      'educational-lecture': { primary: 'ea580c', secondary: '2563eb', text: '0f172a' },
    };
    const colors = templates[templateId] || templates['scientific-report'];

    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: colors.primary };
    titleSlide.addText(slideData.title, {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });

    // Content slides
    slideData.slides.forEach((slide: any) => {
      const contentSlide = pptx.addSlide();
      contentSlide.addText(slide.title, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 32,
        bold: true,
        color: colors.primary,
      });

      const bulletText = slide.bullets.map((b: string) => ({ text: b, options: { bullet: true } }));
      contentSlide.addText(bulletText, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 4.5,
        fontSize: 18,
        color: colors.text,
      });
    });

    // Generate PPTX file
    const pptxData = await pptx.write({ outputType: 'arraybuffer' });
    const pptxBlob = new Uint8Array(pptxData as ArrayBuffer);

    // Upload to storage
    const generatedFileName = `${generationId}.pptx`;
    const { error: uploadError } = await supabaseClient.storage
      .from('ppt-generated')
      .upload(generatedFileName, pptxBlob, {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });

    if (uploadError) {
      throw new Error(`Failed to upload generated file: ${uploadError.message}`);
    }

    // Update database
    const { error: updateError } = await supabaseClient
      .from('powerpoint_generations')
      .update({
        status: 'completed',
        storage_path: generatedFileName,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    if (updateError) {
      throw new Error(`Failed to update status: ${updateError.message}`);
    }

    console.log('PowerPoint generation completed successfully');

    return new Response(
      JSON.stringify({ success: true, generationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-powerpoint:', error);

    // Try to update status to failed
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const { generationId } = await req.json();
      await supabaseClient
        .from('powerpoint_generations')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', generationId);
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
