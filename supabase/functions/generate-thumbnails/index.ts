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

interface RequestBody {
  mode?: 'missing' | 'bad_only' | 'all';
  limit?: number;
  lastId?: string | null;
  normalizeColors?: boolean;
  neutralColor?: string;
}

interface ThumbnailOptions {
  normalizeColors: boolean;
  neutralColor: string;
}

// Heuristic to detect "bad" thumbnails
function isBadThumbnail(thumbnail: string | null): boolean {
  if (!thumbnail || thumbnail.length < 40) return true;
  
  // Check for DOCTYPE fragments
  if (thumbnail.includes('<!DOCTYPE') || thumbnail.includes('!DOCTYPE')) return true;
  
  // Check for missing xmlns
  if (!thumbnail.includes('xmlns=')) return true;
  
  // Check if it starts with <svg
  if (!thumbnail.trim().startsWith('<svg')) return true;
  
  // Check for black-only fills/strokes
  const blackPatterns = [
    'fill="#000"', 'fill="#000000"', 'fill: #000', 'fill:#000',
    'stroke="#000"', 'stroke="#000000"', 'stroke: #000', 'stroke:#000',
    'fill="rgb(0,0,0)"', 'fill="rgb(0, 0, 0)"',
    'stroke="rgb(0,0,0)"', 'stroke="rgb(0, 0, 0)"'
  ];
  
  return blackPatterns.some(pattern => thumbnail.includes(pattern));
}

// Generate optimized thumbnail from full SVG
function generateThumbnail(svgContent: string, options: ThumbnailOptions): string {
  try {
    // Remove XML declaration, comments, and DOCTYPE (including multi-line DTD definitions)
    let optimized = svgContent
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<!DOCTYPE\s+svg[^>]*(?:\[[\s\S]*?\])?[^>]*>/gi, '')
      .trim();
    
    // Remove Inkscape/Sodipodi namespaces and attributes to reduce size
    optimized = optimized
      .replace(/xmlns:inkscape="[^"]*"/g, '')
      .replace(/xmlns:sodipodi="[^"]*"/g, '')
      .replace(/inkscape:[^=]*="[^"]*"\s*/g, '')
      .replace(/sodipodi:[^=]*="[^"]*"\s*/g, '');
    
    // Ensure xmlns is present after DOCTYPE removal
    if (!/xmlns=/.test(optimized)) {
      optimized = optimized.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

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

    // Remove unnecessary attributes for thumbnails (id, class, style, data-*)
    optimized = optimized
      .replace(/\s+id=["'][^"']*["']/g, '')
      .replace(/\s+class=["'][^"']*["']/g, '')
      .replace(/\s+style=["'][^"']*["']/g, '')
      .replace(/\s+data-[^=]*=["'][^"']*["']/g, '');

    // Color normalization
    if (options.normalizeColors) {
      const { neutralColor } = options;
      
      // Replace black fills and strokes with neutral color
      optimized = optimized
        .replace(/fill=["']#000000["']/g, `fill="${neutralColor}"`)
        .replace(/fill=["']#000["']/g, `fill="${neutralColor}"`)
        .replace(/fill=["']rgb\(0,\s*0,\s*0\)["']/g, `fill="${neutralColor}"`)
        .replace(/stroke=["']#000000["']/g, `stroke="${neutralColor}"`)
        .replace(/stroke=["']#000["']/g, `stroke="${neutralColor}"`)
        .replace(/stroke=["']rgb\(0,\s*0,\s*0\)["']/g, `stroke="${neutralColor}"`);
      
      // If no fill or stroke attributes found, add currentColor to root
      if (!/fill=/.test(optimized) && !/stroke=/.test(optimized)) {
        optimized = optimized.replace(
          /<svg/,
          `<svg fill="currentColor" style="color: ${neutralColor}"`
        );
      }
    }

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

    // Parse request body
    const body: RequestBody = req.method === 'POST' ? await req.json() : {};
    const mode = body.mode || 'missing';
    const limit = Math.min(Math.max(body.limit || 20, 5), 50); // Clamp between 5-50
    const lastId = body.lastId || null;
    const normalizeColors = body.normalizeColors !== false; // Default true
    const neutralColor = body.neutralColor || '#94a3b8';

    console.log(`Starting thumbnail generation: mode=${mode}, limit=${limit}, lastId=${lastId}, normalizeColors=${normalizeColors}`);

    // Build query based on mode
    let query = supabase
      .from('icons')
      .select('id, name, svg_content, thumbnail')
      .order('id', { ascending: true })
      .limit(limit);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    if (mode === 'missing') {
      query = query.is('thumbnail', null);
    } else if (mode === 'bad_only') {
      query = query.not('thumbnail', 'is', null);
    }
    // 'all' mode has no filter

    const { data: icons, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching icons:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch icons', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!icons || icons.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No icons to process', 
          mode,
          limit,
          processed: 0,
          failed: 0,
          scanned: 0,
          lastId: null,
          hasMore: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetched ${icons.length} icons for processing`);

    let processed = 0;
    let failed = 0;
    let scanned = 0;
    let newLastId = icons[icons.length - 1]?.id || lastId;

    const options: ThumbnailOptions = {
      normalizeColors,
      neutralColor
    };

    // Process icons one at a time to minimize memory usage
    for (const icon of icons as IconRecord[]) {
      scanned++;
      
      // For bad_only mode, check if thumbnail needs reprocessing
      if (mode === 'bad_only' && !isBadThumbnail(icon.thumbnail)) {
        continue; // Skip good thumbnails
      }

      try {
        const thumbnail = generateThumbnail(icon.svg_content, options);
        
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
            console.log(`Progress: ${processed} icons processed, ${scanned} scanned`);
          }
        }
      } catch (error) {
        console.error(`Error processing icon ${icon.name}:`, error);
        failed++;
      }
    }

    // Check if there are more icons to process
    const hasMore = icons.length === limit;

    // Get total count for 'missing' and 'all' modes
    let totalMatched: number | undefined;
    if (mode === 'missing' || mode === 'all') {
      let countQuery = supabase.from('icons').select('*', { count: 'exact', head: true });
      if (mode === 'missing') {
        countQuery = countQuery.is('thumbnail', null);
      }
      const { count } = await countQuery;
      totalMatched = count || 0;
    }

    console.log(`Batch complete. Mode: ${mode}, Scanned: ${scanned}, Processed: ${processed}, Failed: ${failed}, HasMore: ${hasMore}`);

    return new Response(
      JSON.stringify({
        message: 'Thumbnail generation complete',
        mode,
        limit,
        processed,
        failed,
        scanned,
        totalMatched,
        lastId: newLastId,
        hasMore
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
