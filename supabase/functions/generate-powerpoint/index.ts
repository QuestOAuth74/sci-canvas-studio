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
      originalSize: number;
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
        
        console.log(`Uploaded image: ${filename} (${(arrayBuf.byteLength / 1024).toFixed(1)}KB)`);
        extractedImages.push({
          path: storagePath,
          filename: filename,
          base64: base64,
          ext: ext,
          originalSize: arrayBuf.byteLength
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
    
    // Parse relationships file to map rId to media files
    const relsFile = zip.file('word/_rels/document.xml.rels');
    const relsXml = relsFile ? await relsFile.async('string') : '';
    const relIdToFile = new Map<string, string>();
    const relMatches = relsXml.matchAll(/<Relationship Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g);
    for (const match of relMatches) {
      relIdToFile.set(match[1], match[2]);
    }
    
    // Parse XML to extract structured content with formatting
    let cleanOutline = '';
    const allParagraphs = docXml.split('</w:p>');
    
    // Build image position map with context
    const imagePositionMap = new Map<string, {
      paragraphIndex: number;
      relId: string;
      beforeParagraphs: string[];
      afterParagraphs: string[];
      caption?: string;
    }>();
    
    allParagraphs.forEach((para, index) => {
      // Check for embedded image (drawing or pict)
      const drawingMatch = para.match(/<a:blip r:embed="(rId\d+)"/);
      const pictMatch = para.match(/<v:imagedata r:id="(rId\d+)"/);
      
      const relId = drawingMatch?.[1] || pictMatch?.[1];
      if (!relId) return;
      
      const filename = relIdToFile.get(relId);
      if (!filename) return;
      
      // Extract surrounding context (3 paragraphs before and after)
      const beforeParagraphs = allParagraphs.slice(Math.max(0, index - 3), index)
        .map(p => {
          const textMatches = p.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          return textMatches?.map(m => m.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1')).join(' ');
        })
        .filter(Boolean) as string[];
      
      const afterParagraphs = allParagraphs.slice(index + 1, index + 4)
        .map(p => {
          const textMatches = p.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          return textMatches?.map(m => m.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1')).join(' ');
        })
        .filter(Boolean) as string[];
      
      // Try to extract caption (often immediately after image)
      const captionCandidate = afterParagraphs[0];
      const isCaption = captionCandidate && captionCandidate.length < 150 && 
                        (captionCandidate.toLowerCase().includes('figure') || 
                         captionCandidate.toLowerCase().includes('image') ||
                         captionCandidate.toLowerCase().includes('caption'));
      
      imagePositionMap.set(filename, {
        paragraphIndex: index,
        relId,
        beforeParagraphs,
        afterParagraphs,
        caption: isCaption ? captionCandidate : undefined
      });
    });
    
    console.log(`Mapped ${imagePositionMap.size} images to document positions`);
    
    for (const para of allParagraphs) {
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

    // Fetch real icons from database for bullet points
    const { data: bulletIcons } = await supabaseClient
      .from('icons')
      .select('id, name, svg_content, category')
      .eq('category', 'general-items')
      .limit(8);
    
    console.log(`Fetched ${bulletIcons?.length || 0} bullet icons from database`);
    
    // Convert SVG icons to base64 data URLs
    const iconDataUrls = bulletIcons?.map(icon => {
      const svgBase64 = btoa(icon.svg_content);
      return `data:image/svg+xml;base64,${svgBase64}`;
    }) || [];

    // Icon sets for enhanced bullets (fallback to simple shapes if no DB icons)
    const ICON_SETS: Record<string, string[]> = {
      default: ['●', '■', '▲', '◆', '★'],
      scientific: ['🔬', '⚗️', '🧬', '🔭', '📊'],
      medical: ['💊', '⚕️', '🏥', '💉', '🫀'],
      educational: ['📚', '✏️', '🎓', '📖', '💡']
    };

    // Helper: Convert hex color to lighter shade
    function lightenColor(hexColor: string, percent: number): string {
      const cleanHex = hexColor.replace('#', '');
      const num = parseInt(cleanHex, 16);
      const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent / 100));
      const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent / 100));
      const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent / 100));
      return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
    }

    // Helper: Add shaded background box
    function addShadedBox(
      slide: any,
      x: number,
      y: number,
      w: number,
      h: number,
      config: any,
      colors: any
    ) {
      const bgColor = config?.backgroundColor || lightenColor(colors.primary.replace('#', ''), 85);
      const opacity = config?.opacity || 22;  // Increased default from 10 to 22
      const padding = config?.padding || 0.3;  // Slightly more padding
      
      slide.addShape(pptx.ShapeType.rect, {
        x: x - padding,
        y: y - padding,
        w: w + (padding * 2),
        h: h + (padding * 2),
        fill: { color: bgColor, transparency: 100 - opacity },
        line: { type: 'none' }
      });
    }

    // Helper: Render circular icon bullet with real SVG icon
    function renderIconBullet(
      slide: any,
      text: string,
      x: number,
      y: number,
      iconIndex: number,
      colors: any,
      fonts: any,
      config: any,
      iconDataUrls: string[]
    ) {
      const circleSize = config?.circleSize || 0.35;
      const circleColor = (config?.circleColor || colors.primary).replace('#', '');
      
      // Add circle background
      slide.addShape(pptx.ShapeType.ellipse, {
        x: x,
        y: y,
        w: circleSize,
        h: circleSize,
        fill: { color: circleColor },
        line: { type: 'none' }
      });
      
      // Add real SVG icon from database (if available)
      if (iconDataUrls && iconDataUrls.length > 0) {
        const iconUrl = iconDataUrls[iconIndex % iconDataUrls.length];
        try {
          slide.addImage({
            data: iconUrl,
            x: x + 0.06,
            y: y + 0.06,
            w: circleSize - 0.12,
            h: circleSize - 0.12,
            sizing: { type: 'contain', w: circleSize - 0.12, h: circleSize - 0.12 }
          });
        } catch (e) {
          // Fallback to unicode if image fails
          const icons = ICON_SETS[config?.iconSet || 'default'] || ICON_SETS.default;
          const icon = icons[iconIndex % icons.length];
          slide.addText(icon, {
            x: x,
            y: y,
            w: circleSize,
            h: circleSize,
            fontSize: 14,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle'
          });
        }
      } else {
        // Fallback to unicode if no database icons
        const icons = ICON_SETS[config?.iconSet || 'default'] || ICON_SETS.default;
        const icon = icons[iconIndex % icons.length];
        slide.addText(icon, {
          x: x,
          y: y,
          w: circleSize,
          h: circleSize,
          fontSize: 14,
          color: 'FFFFFF',
          align: 'center',
          valign: 'middle'
        });
      }
      
      // Add text next to icon
      slide.addText(text, {
        x: x + circleSize + 0.15,
        y: y + 0.02,
        w: 8.5 - (x + circleSize + 0.15),
        h: circleSize - 0.04,
        fontSize: fonts.bodySize * 0.95,
        fontFace: fonts.body,
        color: colors.text.replace('#', ''),
        valign: 'top'
      });
    }

    // Helper: Determine if slide should use enhanced bullets (selective application)
    function shouldUseEnhancedBullets(slide: any, slideIndex: number, totalSlides: number): boolean {
      const title = slide.title?.toLowerCase() || '';
      
      // Priority 1: Key findings, results, conclusions
      if (title.includes('key') || title.includes('finding') || title.includes('result') || 
          title.includes('conclusion') || title.includes('summary') || title.includes('takeaway') ||
          title.includes('highlight')) {
        return true;
      }
      
      // Priority 2: Methods, methodology, approach
      if (title.includes('method') || title.includes('approach') || title.includes('procedure') ||
          title.includes('technique') || title.includes('protocol')) {
        return true;
      }
      
      // Priority 3: Objectives, aims, goals
      if (title.includes('objective') || title.includes('aim') || title.includes('goal') || 
          title.includes('purpose') || title.includes('target')) {
        return true;
      }
      
      // Priority 4: Important highlights detected from slide content
      if (slide.bullets && slide.bullets.length > 0 && slide.bullets.length <= 5) {
        const bulletText = slide.bullets.map((b: any) => 
          typeof b === 'string' ? b : b.text
        ).join(' ').toLowerCase();
        
        if (bulletText.includes('significant') || bulletText.includes('important') || 
            bulletText.includes('critical') || bulletText.includes('primary') ||
            bulletText.includes('essential') || bulletText.includes('key')) {
          return true;
        }
      }
      
      // Priority 5: AI-marked slides
      if (slide.enhanceBullets === true || slide.highlightBox === true) {
        return true;
      }
      
      // Don't use on every slide - maximum 40% of slides should have enhanced styling
      return false;
    }

    // Build image context for AI
    const imageContexts = extractedImages.map((img, idx) => {
      const position = imagePositionMap.get(img.filename);
      if (!position) {
        return `Image ${idx + 1}: ${img.filename} (position unknown)`;
      }
      
      const beforeText = position.beforeParagraphs.slice(-2).join(' | ').substring(0, 150);
      const afterText = position.afterParagraphs.slice(0, 2).join(' | ').substring(0, 150);
      
      return `Image ${idx + 1}: "${img.filename}"
  - Position: Paragraph ${position.paragraphIndex} of ${allParagraphs.length}
  - Before: ${beforeText}
  - After: ${afterText}${position.caption ? `\n  - Caption: ${position.caption}` : ''}`;
    }).join('\n\n');

    // Helper function to upload Word document to Manus
    async function uploadFileToManus(
      fileBuffer: ArrayBuffer,
      filename: string
    ): Promise<string> {
      const manusApiKey = Deno.env.get('MANUS_API_KEY');
      if (!manusApiKey) {
        throw new Error('MANUS_API_KEY not configured');
      }

      console.log(`📤 Creating Manus file record for: ${filename}`);
      const createFileResponse = await fetch('https://api.manus.ai/v1/files', {
        method: 'POST',
        headers: {
          'API_KEY': manusApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename })
      });

      if (!createFileResponse.ok) {
        const errorText = await createFileResponse.text();
        throw new Error(`Failed to create Manus file record: ${createFileResponse.status} - ${errorText}`);
      }

      const createFileData = await createFileResponse.json();
      const uploadUrl = createFileData.upload_url;
      const fileId = createFileData.id;

      if (!uploadUrl || !fileId) {
        throw new Error('Manus did not return upload_url or file id');
      }

      console.log(`📤 Uploading file to Manus presigned URL, file_id: ${fileId}`);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        body: fileBuffer
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file to Manus: ${uploadResponse.status}`);
      }

      console.log(`✅ File uploaded to Manus successfully, file_id: ${fileId}`);
      return fileId;
    }

    // Helper function to create Manus AI task for full PowerPoint generation with diagrams
    async function createManusFullGenerationTask(
      fileId: string,
      filename: string,
      imageCount: number
    ): Promise<string> {
      const manusApiKey = Deno.env.get('MANUS_API_KEY');
      if (!manusApiKey) {
        throw new Error('MANUS_API_KEY not configured');
      }

      const prompt = `Create a professional PowerPoint presentation (.pptx file) from the attached Word document.

CRITICAL REQUIREMENTS:
1. Generate a complete PowerPoint file in .pptx format
2. Create 12-18 slides with professional layouts
3. **GENERATE FLOWCHARTS AND DIAGRAMS** to visualize complex concepts:
   - Process flows with arrows and decision nodes
   - System architecture diagrams with labeled components
   - Cause-effect relationships with connecting arrows
   - Timeline diagrams for sequential processes
   - Comparison matrices for side-by-side analysis
   - Block diagrams with hierarchical structures
   - Venn diagrams for overlapping concepts
   - Data visualizations (charts, graphs)
4. The document contains ${imageCount} images - incorporate them where contextually relevant
5. For any multi-step processes → Create flowcharts
6. For system descriptions → Create architecture diagrams  
7. For comparisons → Create matrix or side-by-side layouts
8. For relationships → Create connected node diagrams
9. Use professional color schemes suitable for scientific/academic presentations
10. Include clear, concise titles and bullet points
11. Add smooth transitions between sections
12. Generate speaker notes with key talking points

STYLE: Scientific/Academic presentation suitable for research conferences
VISUAL QUALITY: High-quality diagrams with clear labels, consistent styling, professional aesthetics
OUTPUT FORMAT: Complete PowerPoint (.pptx) file with all diagrams, flowcharts, and figures embedded

Analyze the Word document thoroughly and create a comprehensive presentation with rich visual elements.`;

      console.log('🎨 Creating Manus AI full generation task with file attachment...');
      
      const response = await fetch('https://api.manus.ai/v1/tasks', {
        method: 'POST',
        headers: {
          'API_KEY': manusApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          attachments: [{
            filename: filename,
            file_id: fileId
          }],
          taskMode: 'agent',
          agentProfile: 'quality'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Manus task creation failed:', response.status, errorText);
        throw new Error(`Manus task creation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // FIX: Manus returns task_id (underscore), not taskId (camelCase)
      const taskId = result.task_id || result.id || result.taskId;
      
      if (!taskId) {
        console.error('Manus API response:', JSON.stringify(result));
        throw new Error('No task ID returned from Manus API');
      }

      console.log(`✅ Manus task created: ${taskId}`);
      return taskId;
    }

    // Helper function to poll Manus task completion with progress updates
    async function pollManusTaskCompletion(
      taskId: string,
      generationId: string,
      supabaseAdmin: any,
      maxAttempts: number = 24,
      intervalMs: number = 5000
    ): Promise<string> {
      const manusApiKey = Deno.env.get('MANUS_API_KEY');
      if (!manusApiKey) {
        throw new Error('MANUS_API_KEY not configured');
      }
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`⏳ Polling Manus task ${taskId}, attempt ${attempt + 1}/${maxAttempts}`);
        
        const response = await fetch(`https://api.manus.ai/v1/tasks/${taskId}`, {
          headers: { 'API_KEY': manusApiKey }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to check task status: ${response.status} - ${errorText}`);
        }

        const taskData = await response.json();
        console.log(`📊 Task status: ${taskData.status} (attempt ${attempt + 1}/${maxAttempts})`);
        
        // Log full response for debugging
        if (taskData.status !== 'running' && taskData.status !== 'pending') {
          console.log('Full task data:', JSON.stringify(taskData, null, 2));
        }

        if (taskData.status === 'completed' || taskData.status === 'finished' || taskData.status === 'success') {
          // Try multiple possible locations for the file URL
          const fileUrl = taskData.result?.fileUrl || 
                         taskData.result?.url ||
                         taskData.result?.file_url ||
                         taskData.outputs?.[0]?.url ||
                         taskData.files?.[0]?.url ||
                         taskData.artifacts?.[0]?.url ||
                         taskData.download_url ||
                         taskData.downloadUrl ||
                         taskData.result;
          
          if (!fileUrl) {
            console.error('Task completed but no file URL found. Full task data:', JSON.stringify(taskData, null, 2));
            throw new Error('Task completed but no file URL found in result. Check logs for task response structure.');
          }

          console.log(`✅ Task completed, file URL: ${fileUrl}`);
          return fileUrl;
        }

        if (taskData.status === 'failed' || taskData.status === 'error') {
          const errorMsg = taskData.error || taskData.message || taskData.error_message || 'Unknown error';
          throw new Error(`Manus task failed: ${errorMsg}`);
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }

      throw new Error('Manus task timeout: exceeded maximum polling attempts (2 minutes). Task may still be processing.');
    }

    // Helper function to download Manus-generated PowerPoint
    async function downloadManusGeneratedFile(fileUrl: string): Promise<Blob> {
      console.log('Downloading Manus-generated PowerPoint from:', fileUrl);
      
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      return await response.blob();
    }

    // Helper function to call Manus AI for slide structure generation
    async function generateSlideStructureWithManus(
      docOutline: string,
      imageContexts: string,
      imageCount: number
    ) {
      const manusApiKey = Deno.env.get('MANUS_API_KEY');
      if (!manusApiKey) {
        throw new Error('MANUS_API_KEY not configured');
      }

      const prompt = `You are a PowerPoint presentation designer. Convert this Word document content into a structured slide deck.

DOCUMENT CONTENT:
${docOutline}

AVAILABLE IMAGES (${imageCount} total):
${imageContexts || 'No images available'}

INSTRUCTIONS:
1. Create 8-15 slides with diverse, engaging layouts
2. For every image, create an "image-left" or "image-right" slide with related text content
3. Use contextual information to match images with relevant text
4. Alternate between layouts for visual variety
5. Use "quote" slides for impactful statements
6. Use "two-column" for comparisons
7. Ensure each slide has a clear, concise title
8. Limit bullets to 5 per slide for readability
9. **Mark important slides:** Add "enhanceBullets: true" to 3-5 key slides (findings, methods, objectives, conclusions) that should have visual emphasis
10. Do NOT mark every slide - only the most critical ones should have enhanced styling

Return a JSON array of slides with this structure:
{
  "title": "Presentation Title",
  "slides": [
    {
      "type": "bullets",
      "title": "Background Information",
      "bullets": [
        {
          "text": "Point 1",
          "level": 0,
          "listType": "bullet",
          "bold": false,
          "italic": false,
          "underline": false
        }
      ]
    },
    {
      "type": "bullets",
      "title": "Key Findings",
      "enhanceBullets": true,
      "bullets": [{"text": "Important finding 1"}, {"text": "Important finding 2"}]
    },
    {
      "type": "image-left",
      "title": "Methodology Overview",
      "enhanceBullets": true,
      "bullets": [{"text": "Step 1"}, {"text": "Step 2"}],
      "imageCaption": "Process diagram",
      "preferredImageIndex": 0
    }
  ]
}

Available slide types: "bullets", "two-column", "quote", "image-left", "image-right", "image-grid", "image-top", "image-full"`;

      console.log('Calling Manus AI for slide structure generation...');
      
      const response = await fetch('https://open.manus.ai/v1/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${manusApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          response_format: { type: 'json_object' },
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Manus API error:', response.status, errorText);
        throw new Error(`Manus API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Manus AI response received successfully');
      
      // Parse the response - adjust based on actual Manus API response format
      let slideData: any;
      if (result.choices && result.choices[0]?.message?.content) {
        slideData = JSON.parse(result.choices[0].message.content);
      } else if (result.result) {
        slideData = typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
      } else if (result.content) {
        slideData = typeof result.content === 'string' ? JSON.parse(result.content) : result.content;
      } else {
        throw new Error('Unexpected Manus API response format');
      }

      // Validate response structure
      if (!slideData.title || !slideData.slides || !Array.isArray(slideData.slides)) {
        throw new Error('Invalid Manus response structure');
      }

      console.log(`✅ Manus AI generated ${slideData.slides.length} slides`);
      return slideData;
    }

    // Helper function to call Lovable AI (fallback)
    async function generateSlideStructureWithLovable(
      docOutline: string,
      imageContexts: string
    ) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      console.log('Using Lovable AI for slide structure generation...');

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

${extractedImages.length > 0 ? `
CRITICAL: This document contains ${extractedImages.length} embedded images with context:

${imageContexts}

INSTRUCTIONS FOR IMAGE PLACEMENT:
1. Create "image-left" or "image-right" slides for EVERY image
2. Use the "Before" and "After" context to determine relevant content for each image slide
3. Place text content that discusses or relates to the image on the same slide
4. Use extracted captions when available in imageCaption field
5. If multiple images appear near the same content, consider "image-grid" layout
6. Prioritize two-column layouts (image + text side-by-side) over other layouts
7. Set preferredImageIndex (0-based) to specify which image to use
8. **Mark important slides:** Add "enhanceBullets: true" to 3-5 key slides (findings, methods, objectives, conclusions) for visual emphasis
9. Do NOT mark every slide - only the most critical content should have enhanced styling
` : ''}

Create diverse slide types:
- "image-left" or "image-right": **PRIMARY CHOICE** when images available - image on one side, related text on other
- "bullets": Standard content with 3-5 bullet points (use only when no related images)
- "two-column": Split bullets into two columns (use when no images available)
- "quote": For memorable statements, key messages (provide quote + attribution)
- "image-grid": Multiple images in a grid${extractedImages.length > 1 ? ' (USE for multiple related images)' : ''}
- "image-top": Image above content
- "image-full": Full-slide image with minimal text overlay

IMPORTANT: Preserve text formatting (bold, italic, underline), numbered vs bulleted lists, and indentation levels from the source document.

Document outline:

${docOutline.substring(0, 8000)}`,
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
                        imageCaption: { type: 'string', description: 'Caption or description for the image' },
                        preferredImageIndex: { type: 'number', description: 'Specific image index to use (0-based)' },
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
        console.error('Lovable AI API error:', aiResponse.status, errorText);
        throw new Error(`Lovable AI processing failed: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
      const slideData = toolCall ? JSON.parse(toolCall.function.arguments) : {
        title: 'Generated Presentation',
        slides: [{ type: 'bullets', title: 'Content', bullets: ['No content extracted from document'] }]
      };

      console.log(`✅ Lovable AI generated ${slideData.slides.length} slides`);
      return slideData;
    }

    // Fetch AI provider settings from database
    const { data: settingsData } = await supabaseClient
      .from('ai_provider_settings')
      .select('setting_value')
      .eq('setting_key', 'powerpoint_generation')
      .single();

    const aiSettings = settingsData?.setting_value as any || {
      primary_provider: 'manus',
      fallback_enabled: true,
      timeout_ms: 45000,
      generation_mode: 'full'
    };

    const generationMode = aiSettings.generation_mode || 'full';

    console.log('AI Provider Settings:', {
      primary: aiSettings.primary_provider,
      fallback: aiSettings.fallback_enabled,
      timeout: aiSettings.timeout_ms,
      mode: generationMode
    });

    // === FULL GENERATION MODE: Manus creates complete PowerPoint with diagrams ===
    if (generationMode === 'full' && aiSettings.primary_provider === 'manus') {
      console.log('🎨 Using FULL generation mode - Manus AI will create complete PowerPoint with diagrams');
      
      try {
        // Step 1: Upload Word document to Manus
        console.log('📤 Uploading Word document to Manus...');
        const manusFileId = await uploadFileToManus(arrayBuffer, wordDocPath.split('/').pop() || 'document.docx');
        
        // Step 2: Create Manus task with file attachment
        console.log('🎨 Creating Manus task with Word document attached...');
        const taskId = await createManusFullGenerationTask(
          manusFileId,
          wordDocPath.split('/').pop() || 'document.docx',
          extractedImages.length
        );
        
        // Step 3: Update generation record with task ID
        await supabaseAdmin
          .from('powerpoint_generations')
          .update({ 
            status: 'processing'
          })
          .eq('id', generationId);

        // Step 4: Poll for completion with progress updates
        console.log('⏳ Waiting for Manus to generate PowerPoint with diagrams...');
        const fileUrl = await pollManusTaskCompletion(taskId, generationId, supabaseAdmin);

        // Step 5: Download generated PowerPoint
        console.log('📥 Manus PowerPoint ready, downloading...');
        const pptxBlob = await downloadManusGeneratedFile(fileUrl);

        // Step 6: Upload to Supabase storage
        const pptxFileName = `${generationId}_manus_full.pptx`;
        const { error: uploadError } = await supabaseClient.storage
          .from('ppt-generated')
          .upload(pptxFileName, pptxBlob, {
            contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Failed to upload PowerPoint: ${uploadError.message}`);
        }

        console.log('✅ PowerPoint uploaded successfully');

        // Step 7: Update generation record with success
        await supabaseAdmin
          .from('powerpoint_generations')
          .update({
            status: 'completed',
            storage_path: pptxFileName,
            completed_at: new Date().toISOString()
          })
          .eq('id', generationId);

        // Step 8: Track AI usage
        await supabaseClient.from('ai_generation_usage').insert({
          user_id: user.id,
          month_year: new Date().toISOString().substring(0, 7),
          generation_type: 'powerpoint_full',
          metadata: {
            ai_provider: 'manus',
            task_id: taskId,
            file_id: manusFileId,
            slides_generated: 'full_presentation',
            mode: 'quality',
            image_count: extractedImages.length,
            template_id: templateId,
            file_size: pptxBlob.size
          }
        });

        return new Response(
          JSON.stringify({ 
            message: 'PowerPoint generated successfully with Manus AI (full mode)',
            generationId,
            filePath: pptxFileName,
            mode: 'full'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (fullGenError: any) {
        console.error('❌ Full generation mode failed:', fullGenError.message);
        
        if (!aiSettings.fallback_enabled) {
          throw new Error(`Full generation failed (fallback disabled): ${fullGenError.message}`);
        }
        
        console.log('🔄 Falling back to structure generation mode...');
        // Continue to structure generation below
      }
    }

    // === STRUCTURE GENERATION MODE: Generate JSON structure, render with PptxGenJS ===
    console.log('📋 Using STRUCTURE generation mode');

    // Try primary provider first, fallback to secondary if enabled
    let slideData: any;
    let aiProvider = aiSettings.primary_provider;
    const secondaryProvider = aiSettings.primary_provider === 'manus' ? 'lovable' : 'manus';

    // Timeout wrapper for AI calls
    const withTimeout = async (promise: Promise<any>, timeoutMs: number) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
    };

    try {
      if (aiSettings.primary_provider === 'manus') {
        slideData = await withTimeout(
          generateSlideStructureWithManus(cleanOutline, imageContexts, extractedImages.length),
          aiSettings.timeout_ms
        );
      } else {
        slideData = await withTimeout(
          generateSlideStructureWithLovable(cleanOutline, imageContexts),
          aiSettings.timeout_ms
        );
      }
    } catch (primaryError: any) {
      console.warn(`⚠️ ${aiSettings.primary_provider} AI failed: ${primaryError.message}`);
      
      if (aiSettings.fallback_enabled) {
        console.log(`🔄 Attempting fallback to ${secondaryProvider} AI...`);
        aiProvider = secondaryProvider;
        
        try {
          if (secondaryProvider === 'manus') {
            slideData = await withTimeout(
              generateSlideStructureWithManus(cleanOutline, imageContexts, extractedImages.length),
              aiSettings.timeout_ms
            );
          } else {
            slideData = await withTimeout(
              generateSlideStructureWithLovable(cleanOutline, imageContexts),
              aiSettings.timeout_ms
            );
          }
        } catch (secondaryError: any) {
          console.error('❌ Both AI providers failed');
          throw new Error(`AI generation failed - ${aiSettings.primary_provider}: ${primaryError.message}, ${secondaryProvider}: ${secondaryError.message}`);
        }
      } else {
        throw new Error(`AI generation failed (fallback disabled): ${primaryError.message}`);
      }
    }

    // Ensure at least one slide exists
    if (!slideData.slides || slideData.slides.length === 0) {
      slideData.slides = [{ type: 'bullets', title: 'No Content', bullets: ['Document appears empty'] }];
    }

    console.log(`AI structured slides: ${slideData.slides.length} (provider: ${aiProvider})`);

    // Track AI provider usage for analytics
    try {
      await supabaseClient.from('ai_generation_usage').insert({
        user_id: user.id,
        month_year: new Date().toISOString().substring(0, 7),
        generation_type: 'powerpoint',
        metadata: {
          ai_provider: aiProvider,
          slide_count: slideData.slides.length,
          image_count: extractedImages.length,
          template_id: templateId
        }
      });
    } catch (usageError) {
      console.warn('Failed to track AI usage:', usageError);
      // Don't fail the entire generation if usage tracking fails
    }

    // Generate PowerPoint using PptxGenJS
    const PptxGenJS = await import('https://esm.sh/pptxgenjs@3.12.0');
    const pptx = new PptxGenJS.default();

    // Get template configuration (built-in or custom)
    let colors: any;
    let fonts: any = { title: 'Arial', body: 'Arial', titleSize: 44, bodySize: 18 };
    let layouts: any = { titleSlide: 'centered', contentSlide: 'bullets', spacing: 'normal' };
    let enhancedBullets: any = null;
    let shadedBoxes: any = null;

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
        enhancedBullets = customTemplate.enhanced_bullets;
        shadedBoxes = customTemplate.shaded_boxes;
      } else {
        colors = { primary: '1e3a8a', secondary: '3b82f6', text: '1e293b', background: 'FFFFFF' };
      }
    } else {
      // Use built-in templates with enhanced bullets and shaded boxes
      const builtInConfigs: Record<string, any> = {
        'scientific-report': { 
          colors: { primary: '1e3a8a', secondary: '3b82f6', text: '1e293b', background: 'FFFFFF' },
          enhancedBullets: { enabled: true, iconSet: 'scientific', circleSize: 0.35, circleColor: '3b82f6', iconColor: 'ffffff' },
          shadedBoxes: { enabled: true, opacity: 25, backgroundColor: 'dbeafe', padding: 0.3 }
        },
        'research-presentation': { 
          colors: { primary: '064e3b', secondary: '047857', text: '1f2937', background: 'FFFFFF' },
          enhancedBullets: { enabled: true, iconSet: 'scientific', circleSize: 0.35, circleColor: '047857', iconColor: 'ffffff' },
          shadedBoxes: { enabled: true, opacity: 25, backgroundColor: 'bbf7d0', padding: 0.3 }
        },
        'medical-briefing': { 
          colors: { primary: '991b1b', secondary: 'dc2626', text: '111827', background: 'FFFFFF' },
          enhancedBullets: { enabled: true, iconSet: 'medical', circleSize: 0.35, circleColor: 'dc2626', iconColor: 'ffffff' },
          shadedBoxes: { enabled: true, opacity: 25, backgroundColor: 'fecaca', padding: 0.3 }
        },
        'educational-lecture': { 
          colors: { primary: 'ea580c', secondary: '2563eb', text: '0f172a', background: 'FFFFFF' },
          enhancedBullets: { enabled: true, iconSet: 'educational', circleSize: 0.35, circleColor: '2563eb', iconColor: 'ffffff' },
          shadedBoxes: { enabled: true, opacity: 25, backgroundColor: 'fed7aa', padding: 0.3 }
        },
      };
      const config = builtInConfigs[templateId] || builtInConfigs['scientific-report'];
      colors = config.colors;
      enhancedBullets = config.enhancedBullets;
      shadedBoxes = config.shadedBoxes;
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

    // Helper to optimize and resize images based on layout
    const getOptimizedImageDimensions = (layoutType: string) => {
      const layouts: Record<string, { w: number; h: number; quality: number }> = {
        'image-left': { w: 4.0, h: 4.2, quality: 85 },
        'image-right': { w: 4.0, h: 4.2, quality: 85 },
        'full-image': { w: 9.0, h: 5.0, quality: 90 },
        'image-grid': { w: 4.5, h: 3.0, quality: 80 },
        'title-image': { w: 8.0, h: 4.5, quality: 90 },
        'image-top': { w: 9.0, h: 4.0, quality: 85 }
      };
      
      return layouts[layoutType] || layouts['image-left'];
    };

    const renderImageGridSlide = (contentSlide: any, slide: any, spacing: any, availableImages: typeof extractedImages) => {
      const dimensions = getOptimizedImageDimensions('image-grid');
      const imageCount = Math.min(slide.imageCount || 4, availableImages.length || 4);
      const cols = imageCount <= 2 ? imageCount : 2;
      const rows = Math.ceil(imageCount / cols);
      const imageW = dimensions.w;
      const imageH = dimensions.h;
      const gap = 0.5;
      
      console.log(`Rendering image-grid: ${imageCount} images at ${imageW}x${imageH} each`);
      
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

    const renderImageSideSlide = (contentSlide: any, slide: any, spacing: any, side: 'left' | 'right', availableImages: typeof extractedImages, imageIndex: number, imageCaption: string | undefined, slideIndex: number, totalSlides: number) => {
      const layoutType = side === 'left' ? 'image-left' : 'image-right';
      const dimensions = getOptimizedImageDimensions(layoutType);
      
      const imageW = dimensions.w;
      const imageH = dimensions.h;
      const imageX = side === 'left' ? 0.5 : 5.5;
      const contentX = side === 'left' ? 5.0 : 0.5;
      const contentW = 4.5;
      
      // Image or placeholder
      if (availableImages[imageIndex]) {
        const img = availableImages[imageIndex];
        
        console.log(`Rendering ${layoutType}: ${img.filename} (${(img.originalSize / 1024).toFixed(1)}KB) at ${dimensions.w}x${dimensions.h}`);
        
        contentSlide.addImage({
          data: `data:image/${img.ext};base64,${img.base64}`,
          x: imageX, y: spacing.contentY, w: imageW, h: imageH,
          sizing: { type: 'contain', w: imageW, h: imageH },
          rounding: false,
          transparency: 0
        });
        
        // Add caption below image if available
        if (imageCaption) {
          contentSlide.addText(imageCaption, {
            x: imageX,
            y: spacing.contentY + imageH + 0.1,
            w: imageW,
            h: 0.3,
            fontSize: 10,
            fontFace: fonts.body,
            color: '666666',
            align: 'center',
            italic: true
          });
        }
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
        const shouldEnhance = shouldUseEnhancedBullets(slide, slideIndex, slideData.slides.length);
        const useIconBullets = enhancedBullets?.enabled && shouldEnhance;
        const useShadedBoxes = shadedBoxes?.enabled && shouldEnhance;
        
        if (useIconBullets) {
          const bulletConfig = enhancedBullets;
          const boxConfig = shadedBoxes;
          
          // Calculate content height based on bullets
          const bulletHeight = Math.min(bullets.length * 0.6, imageH);
          
          // Add shaded box if enabled
          if (useShadedBoxes) {
            addShadedBox(contentSlide, contentX, spacing.contentY, contentW, bulletHeight, boxConfig, colors);
          }
          
          // Render each bullet with icon
          let currentY = spacing.contentY + 0.2;
          bullets.forEach((b: any, index: number) => {
            const text = typeof b === 'string' ? b : b.text;
            renderIconBullet(contentSlide, text, contentX + 0.2, currentY, index, colors, fonts, bulletConfig, iconDataUrls);
            currentY += 0.55;
          });
        } else {
          // Original bullet rendering
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
            lineSpacing: 20
          });
        }
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

    slideData.slides.forEach((slide: any, slideIndex: number) => {
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
        case 'image-right': {
          const targetIndex = slide.preferredImageIndex !== undefined ? slide.preferredImageIndex : imageIndex;
          const imageToUse = extractedImages[targetIndex];
          const position = imageToUse ? imagePositionMap.get(imageToUse.filename) : undefined;
          
          renderImageSideSlide(
            contentSlide, 
            slide, 
            spacing, 
            slideType === 'image-left' ? 'left' : 'right', 
            extractedImages, 
            targetIndex,
            slide.imageCaption || position?.caption,
            slideIndex,
            slideData.slides.length
          );
          
          if (imageToUse && slide.preferredImageIndex === undefined) {
            imageIndex++;
          }
          break;
        }
          
        case 'image-top':
          // Image or placeholder on top
          if (extractedImages[imageIndex]) {
            const img = extractedImages[imageIndex];
            const dimensions = getOptimizedImageDimensions('image-top');
            
            console.log(`Rendering image-top: ${img.filename} at ${dimensions.w}x${dimensions.h}`);
            
            contentSlide.addImage({
              data: `data:image/${img.ext};base64,${img.base64}`,
              x: 0.5, y: spacing.contentY, w: dimensions.w, h: dimensions.h,
              sizing: { type: 'contain', w: dimensions.w, h: dimensions.h }
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
            const shouldEnhance = shouldUseEnhancedBullets(slide, slideIndex, slideData.slides.length);
            const useIconBullets = enhancedBullets?.enabled && shouldEnhance;
            const useShadedBoxes = shadedBoxes?.enabled && shouldEnhance;
            
            if (useIconBullets) {
              const bulletConfig = enhancedBullets;
              const boxConfig = shadedBoxes;
              
              // Calculate content height based on bullets
              const bulletHeight = Math.min(bullets.length * 0.6, 2.5);
              
              // Add shaded box if enabled
              if (useShadedBoxes) {
                addShadedBox(contentSlide, 0.5, spacing.contentY + 3.0, 9, bulletHeight, boxConfig, colors);
              }
              
              // Render each bullet with icon
              let currentY = spacing.contentY + 3.2;
              bullets.forEach((b: any, index: number) => {
                const text = typeof b === 'string' ? b : b.text;
                renderIconBullet(contentSlide, text, 0.7, currentY, index, colors, fonts, bulletConfig, iconDataUrls);
                currentY += 0.55;
              });
            } else {
              // Original bullet rendering
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
          }
          break;
          
        case 'image-full':
          // Full-slide image with text overlay
          if (extractedImages[imageIndex]) {
            const img = extractedImages[imageIndex];
            const dimensions = getOptimizedImageDimensions('full-image');
            
            console.log(`Rendering image-full: ${img.filename} at ${dimensions.w}x${dimensions.h}`);
            
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
            const shouldEnhance = shouldUseEnhancedBullets(slide, slideIndex, slideData.slides.length);
            const useIconBullets = enhancedBullets?.enabled && shouldEnhance;
            const useShadedBoxes = shadedBoxes?.enabled && shouldEnhance;
            const midpoint = Math.ceil(bullets.length / 2);
            
            if (useIconBullets) {
              const bulletConfig = enhancedBullets;
              const boxConfig = shadedBoxes;
              
              // Add shaded boxes for both columns
              if (useShadedBoxes) {
                addShadedBox(contentSlide, 0.5, spacing.contentY, 4.25, spacing.contentH, boxConfig, colors);
                addShadedBox(contentSlide, 5.25, spacing.contentY, 4.25, spacing.contentH, boxConfig, colors);
              }
              
              // Left column
              let currentY = spacing.contentY + 0.2;
              bullets.slice(0, midpoint).forEach((b: any, index: number) => {
                const text = typeof b === 'string' ? b : b.text;
                renderIconBullet(contentSlide, text, 0.7, currentY, index, colors, fonts, bulletConfig, iconDataUrls);
                currentY += 0.55;
              });
              
              // Right column
              currentY = spacing.contentY + 0.2;
              bullets.slice(midpoint).forEach((b: any, index: number) => {
                const text = typeof b === 'string' ? b : b.text;
                renderIconBullet(contentSlide, text, 5.45, currentY, index + midpoint, colors, fonts, bulletConfig, iconDataUrls);
                currentY += 0.55;
              });
            } else {
              // Original formatting
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
          }
          break;

        default: // 'bullets' and fallback
          if (bullets.length > 0) {
            const shouldEnhance = shouldUseEnhancedBullets(slide, slideIndex, slideData.slides.length);
            const useIconBullets = enhancedBullets?.enabled && shouldEnhance;
            const useShadedBoxes = shadedBoxes?.enabled && shouldEnhance;
            
            if (useIconBullets) {
              const bulletConfig = enhancedBullets;
              const boxConfig = shadedBoxes;
              
              // Calculate content height based on bullets
              const bulletHeight = bullets.length * 0.6;
              const contentH = Math.min(bulletHeight, spacing.contentH);
              
              // Add shaded box if enabled
              if (useShadedBoxes) {
                addShadedBox(contentSlide, 0.5, spacing.contentY, 9, contentH, boxConfig, colors);
              }
              
              // Render each bullet with icon
              let currentY = spacing.contentY + 0.2;
              bullets.forEach((b: any, index: number) => {
                const text = typeof b === 'string' ? b : b.text;
                renderIconBullet(contentSlide, text, 0.7, currentY, index, colors, fonts, bulletConfig, iconDataUrls);
                currentY += 0.55;
              });
            } else {
              // Original bullet rendering
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
