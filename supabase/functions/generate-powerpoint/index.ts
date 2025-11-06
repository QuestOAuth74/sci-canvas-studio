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
    
    // Extract images from DOCX
    const mediaFiles = zip.file(/^word\/media\//);
    const extractedImages: Array<{
      path: string;
      filename: string;
      base64: string;
      ext: string;
    }> = [];
    
    console.log(`Found ${mediaFiles.length} media files in DOCX`);
    
    for (const file of mediaFiles) {
      const filename = file.name.split('/').pop();
      if (!filename) continue;
      
      // Only process image files
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      if (!['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) {
        continue;
      }
      
      try {
        const imageData = await file.async('blob');
        const storagePath = `${generationId}/${filename}`;
        
        // Convert to base64 for PptxGenJS
        const arrayBuf = await imageData.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        // Upload to storage
        const { error: uploadError } = await supabaseClient.storage
          .from('ppt-images')
          .upload(storagePath, imageData, {
            contentType: imageData.type || `image/${ext}`,
            upsert: false
          });
        
        if (uploadError) {
          console.error(`Failed to upload image ${filename}:`, uploadError);
          continue;
        }
        
        console.log(`Uploaded image: ${filename}`);
        extractedImages.push({
          path: storagePath,
          filename: filename,
          base64: base64,
          ext: ext
        });
      } catch (err) {
        console.error(`Error processing image ${filename}:`, err);
      }
    }
    
    // Store image metadata in database
    if (extractedImages.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('powerpoint_images')
        .insert(
          extractedImages.map((img, index) => ({
            generation_id: generationId,
            storage_path: img.path,
            original_filename: img.filename,
            image_type: 'extracted',
            slide_index: index + 1, // Start from slide 1 (after title)
            position: 'center'
          }))
        );
      
      if (insertError) {
        console.error('Failed to store image metadata:', insertError);
      } else {
        console.log(`Stored metadata for ${extractedImages.length} images`);
      }
    }
    
    // Parse XML to extract structured content with formatting
    let cleanOutline = '';
    const paragraphs = docXml.split('</w:p>');
    
    for (const para of paragraphs) {
      if (!para.includes('<w:t>')) continue;
      
      // Check for heading styles
      const isHeading1 = para.includes('w:val="Heading1"') || para.includes('w:val="heading 1"');
      const isHeading2 = para.includes('w:val="Heading2"') || para.includes('w:val="heading 2"');
      const isHeading3 = para.includes('w:val="Heading3"') || para.includes('w:val="heading 3"');
      
      // Check for numbered/bulleted list
      const hasNumbering = para.includes('<w:numPr>');
      const numIdMatch = para.match(/<w:numId w:val="(\d+)"\/>/);
      const ilvlMatch = para.match(/<w:ilvl w:val="(\d+)"\/>/);
      
      // Determine list level (indentation)
      const listLevel = ilvlMatch ? parseInt(ilvlMatch[1]) : 0;
      const indent = '  '.repeat(listLevel);
      
      // Parse text runs with formatting
      const runs = para.match(/<w:r>.*?<\/w:r>/gs) || [];
      let formattedText = '';
      let hasBold = false;
      let hasItalic = false;
      let hasUnderline = false;
      
      for (const run of runs) {
        const textMatch = run.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
        if (!textMatch || !textMatch[1]) continue;
        
        const text = textMatch[1];
        const isBold = run.includes('<w:b/>') || run.includes('<w:b ');
        const isItalic = run.includes('<w:i/>') || run.includes('<w:i ');
        const isUnderline = run.includes('<w:u ');
        
        // Track if any formatting is present
        if (isBold) hasBold = true;
        if (isItalic) hasItalic = true;
        if (isUnderline) hasUnderline = true;
        
        // Mark formatting in text
        let marked = text;
        if (isBold) marked = `**${marked}**`;
        if (isItalic) marked = `*${marked}*`;
        if (isUnderline) marked = `__${marked}__`;
        
        formattedText += marked;
      }
      
      if (!formattedText.trim()) continue;
      
      // Format based on style
      if (isHeading1) {
        cleanOutline += `\n# ${formattedText.trim()}\n`;
      } else if (isHeading2) {
        cleanOutline += `\n## ${formattedText.trim()}\n`;
      } else if (isHeading3) {
        cleanOutline += `\n### ${formattedText.trim()}\n`;
      } else if (hasNumbering) {
        // Numbered or bulleted list
        const isNumbered = numIdMatch && parseInt(numIdMatch[1]) > 0;
        if (isNumbered) {
          cleanOutline += `${indent}1. ${formattedText.trim()}\n`;
        } else {
          cleanOutline += `${indent}- ${formattedText.trim()}\n`;
        }
      } else {
        cleanOutline += `${formattedText.trim()}\n`;
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
- Lines starting with "1." are numbered list items
- Lines starting with "-" are bullet points
- Indented items (with spaces) are sub-bullets/sub-numbers
- Text with **bold**, *italic*, or __underline__ should preserve that formatting
- Plain paragraphs may be quotes, descriptions, or content

${extractedImages.length > 0 ? `\nIMPORTANT: This document contains ${extractedImages.length} embedded images. Create slides with image layouts to utilize them effectively.\n` : ''}

Create diverse slide types:
- "bullets": Standard content with 3-5 bullet points (preserve formatting and list types)
- "two-column": Split bullets into two columns
- "quote": For memorable statements, key messages (provide quote + attribution)
- "image-left" or "image-right": Content with image on one side${extractedImages.length > 0 ? ' (PREFER THESE when images available)' : ''}
- "image-grid": Multiple images in a grid${extractedImages.length > 1 ? ' (USE THIS for multiple related images)' : ''}
- "image-top": Image above content
- "image-full": Full-slide image with minimal text overlay${extractedImages.length > 0 ? ' (USE for impactful visuals)' : ''}

IMPORTANT: Preserve text formatting (bold, italic, underline), numbered vs bulleted lists, and indentation levels from the source document.

Document outline:

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
                        enum: ['bullets', 'two-column', 'quote', 'image-left', 'image-right', 'image-grid', 'image-top', 'image-full'], 
                        description: 'Slide layout type' 
                      },
                      title: { type: 'string', description: 'Slide title' },
                      bullets: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            text: { type: 'string', description: 'Bullet text content' },
                            level: { type: 'number', description: 'Indentation level (0, 1, 2)', default: 0 },
                            listType: { type: 'string', enum: ['bullet', 'number'], description: 'Bullet or numbered list', default: 'bullet' },
                            bold: { type: 'boolean', description: 'Apply bold formatting', default: false },
                            italic: { type: 'boolean', description: 'Apply italic formatting', default: false },
                            underline: { type: 'boolean', description: 'Apply underline formatting', default: false }
                          },
                          required: ['text']
                        },
                        description: 'Formatted bullet points with text styling and list type'
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

    const renderImageGridSlide = (contentSlide: any, slide: any, spacing: any, availableImages: typeof extractedImages) => {
      const imageCount = Math.min(slide.imageCount || 4, availableImages.length || 4);
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
        
        if (availableImages[i]) {
          // Use actual image
          const img = availableImages[i];
          contentSlide.addImage({
            data: `data:image/${img.ext};base64,${img.base64}`,
            x, y, w: imageW, h: imageH,
            sizing: { type: 'contain', w: imageW, h: imageH }
          });
        } else {
          // Fallback placeholder
          contentSlide.addShape(pptx.ShapeType.rect, {
            x, y, w: imageW, h: imageH,
            fill: { color: 'E0E0E0' },
            line: { color: colors.secondary, width: 2 },
          });
          contentSlide.addText('[Image]', {
            x, y: y + imageH / 2 - 0.2, w: imageW, h: 0.4,
            fontSize: 14,
            color: '808080',
            align: 'center',
          });
        }
      }
    };

    const renderImageSideSlide = (contentSlide: any, slide: any, spacing: any, side: 'left' | 'right', availableImages: typeof extractedImages, imageIndex: number) => {
      const imageW = 3.8;
      const imageH = 4.0;
      const imageX = side === 'left' ? 0.5 : 5.7;
      const contentX = side === 'left' ? 4.8 : 0.5;
      const contentW = 4.7;
      
      // Image or placeholder
      if (availableImages[imageIndex]) {
        const img = availableImages[imageIndex];
        contentSlide.addImage({
          data: `data:image/${img.ext};base64,${img.base64}`,
          x: imageX, y: spacing.contentY, w: imageW, h: imageH,
          sizing: { type: 'contain', w: imageW, h: imageH }
        });
      } else {
        contentSlide.addShape(pptx.ShapeType.rect, {
          x: imageX, y: spacing.contentY, w: imageW, h: imageH,
          fill: { color: 'E0E0E0' },
          line: { color: colors.secondary, width: 2 },
        });
        contentSlide.addText('[Image]', {
          x: imageX, y: spacing.contentY + imageH / 2 - 0.2, w: imageW, h: 0.4,
          fontSize: 14,
          color: '808080',
          align: 'center',
        });
      }
      
      // Content bullets with formatting
      const bullets = slide.bullets || [];
      if (bullets.length > 0) {
        const bulletText = bullets.map((b: any) => {
          const text = typeof b === 'string' ? b : b.text;
          const level = typeof b === 'object' ? (b.level || 0) : 0;
          const listType = typeof b === 'object' ? (b.listType || 'bullet') : 'bullet';
          const bold = typeof b === 'object' ? (b.bold || false) : false;
          const italic = typeof b === 'object' ? (b.italic || false) : false;
          const underline = typeof b === 'object' ? (b.underline || false) : false;
          
          return {
            text,
            options: {
              bullet: listType === 'bullet' ? true : { type: 'number' as 'number' },
              indentLevel: level,
              bold,
              italic,
              underline
            }
          };
        });
        
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

    // Track image usage across slides
    let imageIndex = 0;

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
          const gridImages = extractedImages.slice(imageIndex, imageIndex + (slide.imageCount || 4));
          renderImageGridSlide(contentSlide, slide, spacing, gridImages);
          imageIndex += gridImages.length;
          break;
          
        case 'image-left':
          renderImageSideSlide(contentSlide, slide, spacing, 'left', extractedImages, imageIndex);
          if (extractedImages[imageIndex]) imageIndex++;
          break;
          
        case 'image-right':
          renderImageSideSlide(contentSlide, slide, spacing, 'right', extractedImages, imageIndex);
          if (extractedImages[imageIndex]) imageIndex++;
          break;
          
        case 'image-top':
          // Image or placeholder on top
          if (extractedImages[imageIndex]) {
            const img = extractedImages[imageIndex];
            contentSlide.addImage({
              data: `data:image/${img.ext};base64,${img.base64}`,
              x: 0.5, y: spacing.contentY, w: 9, h: 2.5,
              sizing: { type: 'contain', w: 9, h: 2.5 }
            });
            imageIndex++;
          } else {
            contentSlide.addShape(pptx.ShapeType.rect, {
              x: 0.5, y: spacing.contentY, w: 9, h: 2.5,
              fill: { color: 'E0E0E0' },
              line: { color: colors.secondary, width: 2 },
            });
            contentSlide.addText('[Image]', {
              x: 0.5, y: spacing.contentY + 1.0, w: 9, h: 0.4,
              fontSize: 14,
              color: '808080',
              align: 'center',
            });
          }
          
          if (bullets.length > 0) {
            const bulletText = bullets.map((b: any) => {
              const text = typeof b === 'string' ? b : b.text;
              const level = typeof b === 'object' ? (b.level || 0) : 0;
              const listType = typeof b === 'object' ? (b.listType || 'bullet') : 'bullet';
              const bold = typeof b === 'object' ? (b.bold || false) : false;
              const italic = typeof b === 'object' ? (b.italic || false) : false;
              const underline = typeof b === 'object' ? (b.underline || false) : false;
              
              return {
                text,
                options: {
                  bullet: listType === 'bullet' ? true : { type: 'number' as 'number' },
                  indentLevel: level,
                  bold,
                  italic,
                  underline
                }
              };
            });
            
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
          
        case 'image-full':
          // Full-slide image with text overlay
          if (extractedImages[imageIndex]) {
            const img = extractedImages[imageIndex];
            contentSlide.addImage({
              data: `data:image/${img.ext};base64,${img.base64}`,
              x: 0, y: 0, w: '100%', h: '100%',
              sizing: { type: 'cover', w: 10, h: 7.5 }
            });
            
            // Semi-transparent overlay for text readability
            if (slide.bullets && slide.bullets.length > 0) {
              contentSlide.addShape(pptx.ShapeType.rect, {
                x: 0, y: 5.5, w: '100%', h: 2,
                fill: { color: '000000', transparency: 50 }
              });
              
              const overlayText = slide.bullets.map((b: any) => typeof b === 'string' ? b : b.text).join(' • ');
              contentSlide.addText(overlayText, {
                x: 0.5, y: 6.0, w: 9, h: 1,
                fontSize: fonts.bodySize * 1.1,
                fontFace: fonts.body,
                color: 'FFFFFF',
                bold: true,
                align: 'center',
                valign: 'middle'
              });
            }
            imageIndex++;
          } else {
            // Fallback to regular bullets if no image
            if (bullets.length > 0) {
              const bulletText = bullets.map((b: any) => {
                const text = typeof b === 'string' ? b : b.text;
                const level = typeof b === 'object' ? (b.level || 0) : 0;
                const listType = typeof b === 'object' ? (b.listType || 'bullet') : 'bullet';
                const bold = typeof b === 'object' ? (b.bold || false) : false;
                const italic = typeof b === 'object' ? (b.italic || false) : false;
                const underline = typeof b === 'object' ? (b.underline || false) : false;
                
                return {
                  text,
                  options: {
                    bullet: listType === 'bullet' ? true : { type: 'number' as 'number' },
                    indentLevel: level,
                    bold,
                    italic,
                    underline
                  }
                };
              });
              
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
          }
          break;

        case 'two-column':
          if (bullets.length > 0) {
            const midpoint = Math.ceil(bullets.length / 2);
            
            const formatBullets = (bulletArray: any[]) => bulletArray.map((b: any) => {
              const text = typeof b === 'string' ? b : b.text;
              const level = typeof b === 'object' ? (b.level || 0) : 0;
              const listType = typeof b === 'object' ? (b.listType || 'bullet') : 'bullet';
              const bold = typeof b === 'object' ? (b.bold || false) : false;
              const italic = typeof b === 'object' ? (b.italic || false) : false;
              const underline = typeof b === 'object' ? (b.underline || false) : false;
              
              return {
                text,
                options: {
                  bullet: listType === 'bullet' ? true : { type: 'number' as 'number' },
                  indentLevel: level,
                  bold,
                  italic,
                  underline
                }
              };
            });
            
            const leftBullets = formatBullets(bullets.slice(0, midpoint));
            const rightBullets = formatBullets(bullets.slice(midpoint));
            
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
            const bulletText = bullets.map((b: any) => {
              const text = typeof b === 'string' ? b : b.text;
              const level = typeof b === 'object' ? (b.level || 0) : 0;
              const listType = typeof b === 'object' ? (b.listType || 'bullet') : 'bullet';
              const bold = typeof b === 'object' ? (b.bold || false) : false;
              const italic = typeof b === 'object' ? (b.italic || false) : false;
              const underline = typeof b === 'object' ? (b.underline || false) : false;
              
              return {
                text,
                options: {
                  bullet: listType === 'bullet' ? true : { type: 'number' as 'number' },
                  indentLevel: level,
                  bold,
                  italic,
                  underline
                }
              };
            });
            
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
