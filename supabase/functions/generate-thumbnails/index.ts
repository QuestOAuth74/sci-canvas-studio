import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IconRecord {
  id: string;
  name: string;
  svg_content: string;
  thumbnail: string | null;
}

// Generate optimized thumbnail from full SVG
function generateThumbnail(svgContent: string): string {
  try {
    // Remove XML declaration and comments
    let optimized = svgContent
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();

    // Extract viewBox or width/height for aspect ratio
    const viewBoxMatch = optimized.match(/viewBox=["']([^"']*)["']/);
    const widthMatch = optimized.match(/width=["']([^"']*)["']/);
    const heightMatch = optimized.match(/height=["']([^"']*)["']/);

    // Ensure viewBox exists
    if (!viewBoxMatch && widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      if (!isNaN(width) && !isNaN(height)) {
        optimized = optimized.replace(
          '<svg',
          `<svg viewBox="0 0 ${width} ${height}"`
        );
      }
    }

    // Remove unnecessary attributes for thumbnails
    optimized = optimized
      .replace(/\s+id=["'][^"']*["']/g, '')
      .replace(/\s+class=["'][^"']*["']/g, '')
      .replace(/\s+style=["'][^"']*["']/g, '')
      .replace(/\s+data-[^=]*=["'][^"']*["']/g, '');

    // Reduce precision of numbers (6 decimals -> 2 decimals)
    optimized = optimized.replace(/(\d+\.\d{3,})/g, (match) => {
      return parseFloat(match).toFixed(2);
    });

    // Remove extra whitespace
    optimized = optimized
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();

    // If still too large, apply more aggressive optimization
    if (optimized.length > 15000) {
      // Remove title and desc tags
      optimized = optimized
        .replace(/<title>[\s\S]*?<\/title>/gi, '')
        .replace(/<desc>[\s\S]*?<\/desc>/gi, '');
      
      // Simplify path data even more (1 decimal)
      optimized = optimized.replace(/(\d+\.\d{2,})/g, (match) => {
        return parseFloat(match).toFixed(1);
      });
    }

    return optimized;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return svgContent; // Fallback to original
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check authentication (admin only)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting thumbnail generation...');

    // Fetch icons in smaller batch without thumbnails (memory efficient)
    const { data: icons, error: fetchError } = await supabase
      .from('icons')
      .select('id, name, svg_content')
      .is('thumbnail', null)
      .limit(50); // Process max 50 at a time to avoid memory issues

    if (fetchError) {
      console.error('Error fetching icons:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch icons', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!icons || icons.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No icons need thumbnail generation', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${icons.length} icons...`);

    let processed = 0;
    let failed = 0;

    // Process icons one at a time to minimize memory usage
    for (const icon of icons as IconRecord[]) {
      try {
        const thumbnail = generateThumbnail(icon.svg_content);
        
        // Free memory immediately after processing
        icon.svg_content = '';
        
        const { error: updateError } = await supabase
          .from('icons')
          .update({ thumbnail })
          .eq('id', icon.id);

        if (updateError) {
          console.error(`Failed to update icon ${icon.name}:`, updateError);
          failed++;
        } else {
          processed++;
          if (processed % 10 === 0) {
            console.log(`Progress: ${processed}/${icons.length} icons processed`);
          }
        }
      } catch (error) {
        console.error(`Error processing icon ${icon.name}:`, error);
        failed++;
      }
    }

    console.log(`Thumbnail generation complete. Processed: ${processed}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        message: 'Thumbnail generation complete',
        processed,
        failed,
        total: icons.length,
        remaining: failed // Indicates if there are more to process
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
