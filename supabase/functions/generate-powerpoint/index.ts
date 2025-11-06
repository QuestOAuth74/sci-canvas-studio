import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// @ts-ignore
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header - JWT is already verified by Supabase since verify_jwt = true
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create admin client with service role key for admin check
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create client with user's JWT for other operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from JWT (pass token explicitly to avoid env/session issues)
    const jwt = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check admin access using service role client
    const { data: roles } = await supabaseAdmin
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

    // Parse DOCX content properly using JSZip
    const arrayBuffer = await wordDoc.arrayBuffer();
    console.log('Document downloaded, size:', arrayBuffer.byteLength);
    
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file('word/document.xml');
    
    if (!docXmlFile) {
      throw new Error('Invalid DOCX file - word/document.xml not found');
    }
    
    const docXml = await docXmlFile.async('string');
    
    // Parse XML to extract structured content
    let cleanOutline = '';
    const paragraphs = docXml.split('</w:p>');
    
    for (const para of paragraphs) {
      if (!para.includes('<w:t>')) continue;
      
      // Check for heading styles
      const isHeading1 = para.includes('w:val="Heading1"') || para.includes('w:val="heading 1"');
      const isHeading2 = para.includes('w:val="Heading2"') || para.includes('w:val="heading 2"');
      const isHeading3 = para.includes('w:val="Heading3"') || para.includes('w:val="heading 3"');
      const isBullet = para.includes('<w:numPr>');
      
      // Extract all text content
      const textMatches = para.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      const text = textMatches
        .map(m => m.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1'))
        .join('');
      
      if (!text.trim()) continue;
      
      // Format based on style
      if (isHeading1) {
        cleanOutline += `\n# ${text.trim()}\n`;
      } else if (isHeading2) {
        cleanOutline += `\n## ${text.trim()}\n`;
      } else if (isHeading3) {
        cleanOutline += `\n### ${text.trim()}\n`;
      } else if (isBullet) {
        cleanOutline += `- ${text.trim()}\n`;
      } else {
        cleanOutline += `${text.trim()}\n`;
      }
    }
    
    // Fallback if extraction was poor
    if (cleanOutline.trim().length < 50) {
      const allText = docXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      cleanOutline = allText
        .map(m => m.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1'))
        .join('\n');
    }
    
    console.log('Extracted outline (first 400 chars):', cleanOutline.substring(0, 400));

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
            content: 'You are a presentation expert. Analyze document structure to create engaging PowerPoint slides with varied layouts.',
          },
          {
            role: 'user',
            content: `Convert this outline into PowerPoint slides. The input format:
- Lines starting with "#" or "##" are headings (use as slide titles or section markers)
- Lines starting with "-" are bullet points
- Plain paragraphs may be quotes, descriptions, or content

Create diverse slide types:
- "bullets": Standard content with 3-5 bullet points
- "two-column": Split bullets into two columns
- "quote": For memorable statements, key messages (provide quote + attribution)
- "image-left" or "image-right": Content with image placeholder on one side
- "image-grid": Multiple image placeholders (2-4 images)
- "image-top": Image above content

Use document headings as slide titles. Keep bullets concise. Document outline:

${cleanOutline.substring(0, 8000)}`,
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
                      type: { 
                        type: 'string', 
                        enum: ['bullets', 'two-column', 'quote', 'image-left', 'image-right', 'image-grid', 'image-top'], 
                        description: 'Slide layout type' 
                      },
                      title: { type: 'string', description: 'Slide title' },
                      bullets: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Bullet points for content slides'
                      },
                      quote: { type: 'string', description: 'Quote text for quote slides' },
                      attribution: { type: 'string', description: 'Author or source of quote' },
                      imageCount: { type: 'number', description: 'Number of image placeholders (1-4)' },
                      notes: { type: 'string', description: 'Speaker notes or additional context' }
                    },
                    required: ['type', 'title']
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
      slides: [{ type: 'bullets', title: 'Content', bullets: ['No content extracted from document'] }]
    };

    // Ensure at least one slide exists
    if (!slideData.slides || slideData.slides.length === 0) {
      slideData.slides = [{ type: 'bullets', title: 'No Content', bullets: ['Document appears empty'] }];
    }

    console.log('AI structured slides:', slideData.slides.length);

    // Generate PowerPoint using PptxGenJS
    const PptxGenJS = await import('https://esm.sh/pptxgenjs@3.12.0');
    const pptx = new PptxGenJS.default();

    // Get template configuration (built-in or custom)
    let colors: any;
    let fonts: any = { title: 'Arial', body: 'Arial', titleSize: 44, bodySize: 18 };
    let layouts: any = { titleSlide: 'centered', contentSlide: 'bullets', spacing: 'normal' };

    if (templateId.startsWith('custom-')) {
      // Fetch custom template from database
      const customTemplateId = templateId.replace('custom-', '');
      const { data: customTemplate } = await supabaseClient
        .from('powerpoint_custom_templates')
        .select('*')
        .eq('id', customTemplateId)
        .single();

      if (customTemplate) {
        colors = {
          primary: customTemplate.colors.primary.replace('#', ''),
          secondary: customTemplate.colors.secondary.replace('#', ''),
          accent: customTemplate.colors.accent.replace('#', ''),
          text: customTemplate.colors.text.replace('#', ''),
          background: customTemplate.colors.background?.replace('#', '') || 'FFFFFF',
        };
        fonts = customTemplate.fonts;
        layouts = customTemplate.layouts;
      } else {
        colors = { primary: '1e3a8a', secondary: '3b82f6', text: '1e293b', background: 'FFFFFF' };
      }
    } else {
      // Use built-in templates
      const builtInTemplates: Record<string, any> = {
        'scientific-report': { primary: '1e3a8a', secondary: '3b82f6', text: '1e293b', background: 'FFFFFF' },
        'research-presentation': { primary: '064e3b', secondary: '047857', text: '1f2937', background: 'FFFFFF' },
        'medical-briefing': { primary: '991b1b', secondary: 'dc2626', text: '111827', background: 'FFFFFF' },
        'educational-lecture': { primary: 'ea580c', secondary: '2563eb', text: '0f172a', background: 'FFFFFF' },
      };
      colors = builtInTemplates[templateId] || builtInTemplates['scientific-report'];
    }

    // Title slide with custom layout
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: colors.primary };
    
    let titleX = 0.5, titleY = 2.5;
    if (layouts.titleSlide === 'left') {
      titleX = 0.5;
      titleY = 2.0;
    } else if (layouts.titleSlide === 'right') {
      titleX = 1.5;
      titleY = 2.0;
    }
    
    titleSlide.addText(slideData.title, {
      x: titleX,
      y: titleY,
      w: layouts.titleSlide === 'centered' ? 9 : 8,
      h: 1.5,
      fontSize: fonts.titleSize,
      fontFace: fonts.title,
      bold: true,
      color: 'FFFFFF',
      align: layouts.titleSlide === 'centered' ? 'center' : layouts.titleSlide,
    });

    // Helper functions for rendering different slide types
    const renderQuoteSlide = (contentSlide: any, slide: any, spacing: any) => {
      const quoteText = slide.quote || 'Quote content';
      contentSlide.addText(`"${quoteText}"`, {
        x: 1.0,
        y: 2.5,
        w: 8,
        h: 2.5,
        fontSize: fonts.bodySize * 1.4,
        fontFace: fonts.body,
        italic: true,
        color: colors.primary,
        align: 'center',
        valign: 'middle',
      });
      
      if (slide.attribution) {
        contentSlide.addText(`— ${slide.attribution}`, {
          x: 1.0,
          y: 5.2,
          w: 8,
          h: 0.5,
          fontSize: fonts.bodySize * 0.9,
          fontFace: fonts.body,
          color: colors.text,
          align: 'center',
        });
      }
    };

    const renderImageGridSlide = (contentSlide: any, slide: any, spacing: any) => {
      const imageCount = slide.imageCount || 4;
      const cols = imageCount <= 2 ? imageCount : 2;
      const rows = Math.ceil(imageCount / cols);
      const imageW = 4.0;
      const imageH = 2.5;
      const gap = 0.5;
      
      for (let i = 0; i < imageCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 0.5 + col * (imageW + gap);
        const y = spacing.contentY + row * (imageH + gap);
        
        contentSlide.addShape(pptx.ShapeType.rect, {
          x, y, w: imageW, h: imageH,
          fill: { color: 'E0E0E0' },
          line: { color: colors.secondary, width: 2 },
        });
        contentSlide.addText('[Image Placeholder]', {
          x, y: y + imageH / 2 - 0.2, w: imageW, h: 0.4,
          fontSize: 14,
          color: '808080',
          align: 'center',
        });
      }
    };

    const renderImageSideSlide = (contentSlide: any, slide: any, spacing: any, side: 'left' | 'right') => {
      const imageW = 3.8;
      const imageH = 4.0;
      const imageX = side === 'left' ? 0.5 : 5.7;
      const contentX = side === 'left' ? 4.8 : 0.5;
      const contentW = 4.7;
      
      // Image placeholder
      contentSlide.addShape(pptx.ShapeType.rect, {
        x: imageX, y: spacing.contentY, w: imageW, h: imageH,
        fill: { color: 'E0E0E0' },
        line: { color: colors.secondary, width: 2 },
      });
      contentSlide.addText('[Image Placeholder]', {
        x: imageX, y: spacing.contentY + imageH / 2 - 0.2, w: imageW, h: 0.4,
        fontSize: 14,
        color: '808080',
        align: 'center',
      });
      
      // Content bullets
      const bullets = slide.bullets || [];
      if (bullets.length > 0) {
        const bulletText = bullets.map((b: string) => ({ text: b, options: { bullet: true } }));
        contentSlide.addText(bulletText, {
          x: contentX,
          y: spacing.contentY,
          w: contentW,
          h: imageH,
          fontSize: fonts.bodySize * 0.95,
          fontFace: fonts.body,
          color: colors.text,
        });
      }
    };

    // Content slides with custom layout
    const spacingMap: Record<string, { titleY: number; contentY: number; contentH: number }> = { 
      compact: { titleY: 0.3, contentY: 1.0, contentH: 5.5 }, 
      normal: { titleY: 0.5, contentY: 1.5, contentH: 4.5 }, 
      spacious: { titleY: 0.7, contentY: 2.0, contentH: 4.0 } 
    };
    const spacing = spacingMap[layouts.spacing as string] || spacingMap.normal;

    slideData.slides.forEach((slide: any) => {
      const contentSlide = pptx.addSlide();
      contentSlide.background = { color: colors.background };
      
      contentSlide.addText(slide.title, {
        x: 0.5,
        y: spacing.titleY,
        w: 9,
        h: 0.75,
        fontSize: fonts.titleSize * 0.73,
        fontFace: fonts.title,
        bold: true,
        color: colors.primary,
      });

      const slideType = slide.type || 'bullets';
      const bullets = slide.bullets || [];

      switch (slideType) {
        case 'quote':
          renderQuoteSlide(contentSlide, slide, spacing);
          break;
          
        case 'image-grid':
          renderImageGridSlide(contentSlide, slide, spacing);
          break;
          
        case 'image-left':
          renderImageSideSlide(contentSlide, slide, spacing, 'left');
          break;
          
        case 'image-right':
          renderImageSideSlide(contentSlide, slide, spacing, 'right');
          break;
          
        case 'image-top':
          // Image placeholder on top
          contentSlide.addShape(pptx.ShapeType.rect, {
            x: 0.5, y: spacing.contentY, w: 9, h: 2.5,
            fill: { color: 'E0E0E0' },
            line: { color: colors.secondary, width: 2 },
          });
          contentSlide.addText('[Image Placeholder]', {
            x: 0.5, y: spacing.contentY + 1.0, w: 9, h: 0.4,
            fontSize: 14,
            color: '808080',
            align: 'center',
          });
          
          if (bullets.length > 0) {
            const bulletText = bullets.map((b: string) => ({ text: b, options: { bullet: true } }));
            contentSlide.addText(bulletText, {
              x: 0.5,
              y: spacing.contentY + 3.0,
              w: 9,
              h: 2.5,
              fontSize: fonts.bodySize,
              fontFace: fonts.body,
              color: colors.text,
            });
          }
          break;

        case 'two-column':
          if (bullets.length > 0) {
            const midpoint = Math.ceil(bullets.length / 2);
            const leftBullets = bullets.slice(0, midpoint).map((b: string) => ({ text: b, options: { bullet: true } }));
            const rightBullets = bullets.slice(midpoint).map((b: string) => ({ text: b, options: { bullet: true } }));
            
            contentSlide.addText(leftBullets, {
              x: 0.5,
              y: spacing.contentY,
              w: 4.25,
              h: spacing.contentH,
              fontSize: fonts.bodySize,
              fontFace: fonts.body,
              color: colors.text,
            });
            
            contentSlide.addText(rightBullets, {
              x: 5.25,
              y: spacing.contentY,
              w: 4.25,
              h: spacing.contentH,
              fontSize: fonts.bodySize,
              fontFace: fonts.body,
              color: colors.text,
            });
          }
          break;

        default: // 'bullets' and fallback
          if (bullets.length > 0) {
            const bulletText = bullets.map((b: string) => ({ text: b, options: { bullet: true } }));
            contentSlide.addText(bulletText, {
              x: 0.5,
              y: spacing.contentY,
              w: 9,
              h: spacing.contentH,
              fontSize: fonts.bodySize,
              fontFace: fonts.body,
              color: colors.text,
            });
          }
          break;
      }
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
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const body = await req.json();
      const generationId = body.generationId;
      if (generationId) {
        await supabaseAdmin
          .from('powerpoint_generations')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', generationId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
