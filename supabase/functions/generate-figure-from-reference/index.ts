import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.log('Admin check failed:', roleError);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image, description, canvasWidth, canvasHeight } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting AI analysis...');

    // Step 1: Analyze image with OpenAI Vision
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a scientific illustration analysis assistant. Analyze the provided reference image and identify all biological/scientific elements, their spatial relationships, and connections.

Your response must be valid JSON following this exact structure:
{
  "identified_elements": [
    {
      "name": "element name",
      "category": "biology|chemistry|physics|anatomy|etc",
      "description": "brief description",
      "position": "approximate position in image",
      "search_terms": ["term1", "term2", "term3"]
    }
  ],
  "spatial_relationships": [
    {
      "from_element": 0,
      "to_element": 1,
      "relationship": "above|below|left|right|connected|flows_to",
      "connector_type": "straight|curved|arrow"
    }
  ],
  "overall_layout": {
    "flow_direction": "left_to_right|top_to_bottom|circular|hierarchical",
    "complexity": "simple|moderate|complex"
  }
}

Focus on accuracy over completeness. Only identify elements you are confident about.`;

    const userPrompt = description 
      ? `Analyze this scientific diagram. User description: "${description}"`
      : "Analyze this scientific diagram and identify all elements.";

    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('OpenAI Vision API error:', visionResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to analyze image' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const visionData = await visionResponse.json();
    const analysisText = visionData.choices[0].message.content;
    console.log('Vision analysis:', analysisText);

    // Parse JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Step 2: Search icons database for matches
    console.log('Searching for matching icons...');
    const iconMatches = await Promise.all(
      analysis.identified_elements.map(async (element: any) => {
        const searchTerms = element.search_terms.join(' | ');
        
        // Search using full-text search and name matching
        const { data: icons, error } = await supabase
          .from('icons')
          .select('id, name, category, svg_content, thumbnail')
          .or(`name.ilike.%${element.name}%,category.ilike.%${element.category}%`)
          .limit(5);

        if (error) {
          console.error('Icon search error:', error);
          return { element, matches: [] };
        }

        return {
          element,
          matches: icons || []
        };
      })
    );

    console.log(`Found matches for ${iconMatches.filter(m => m.matches.length > 0).length} elements`);

    // Step 3: Generate layout using AI
    const layoutPrompt = `Based on this analysis, create a canvas layout. 
Canvas dimensions: ${canvasWidth}x${canvasHeight}

Analysis: ${JSON.stringify(analysis)}

Icon matches available: ${JSON.stringify(iconMatches.map(m => ({
  element: m.element.name,
  available_icons: m.matches.map(i => ({ id: i.id, name: i.name, category: i.category }))
})))}

Generate a JSON layout with proper positioning. Use percentages for x,y coordinates (0-100).
Return ONLY valid JSON in this format:
{
  "objects": [
    {
      "type": "icon",
      "icon_id": "uuid-from-matches",
      "icon_name": "name",
      "x": 20,
      "y": 30,
      "scale": 1.0,
      "rotation": 0,
      "label": "optional label",
      "labelPosition": "bottom"
    }
  ],
  "connectors": [
    {
      "from": 0,
      "to": 1,
      "type": "straight",
      "style": "solid",
      "strokeWidth": 2,
      "color": "#000000"
    }
  ]
}`;

    const layoutResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a layout generation assistant. Always respond with valid JSON only.' },
          { role: 'user', content: layoutPrompt }
        ],
        max_tokens: 2000,
      }),
    });

    if (!layoutResponse.ok) {
      const errorText = await layoutResponse.text();
      console.error('Layout generation error:', layoutResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate layout' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const layoutData = await layoutResponse.json();
    const layoutText = layoutData.choices[0].message.content;
    console.log('Layout generated:', layoutText);

    const layoutJsonMatch = layoutText.match(/\{[\s\S]*\}/);
    if (!layoutJsonMatch) {
      return new Response(JSON.stringify({ error: 'Failed to parse layout response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const layout = JSON.parse(layoutJsonMatch[0]);

    // Add metadata
    const response = {
      layout,
      metadata: {
        elements_identified: analysis.identified_elements.length,
        icons_matched: iconMatches.filter(m => m.matches.length > 0).length,
        total_objects: layout.objects?.length || 0,
        total_connectors: layout.connectors?.length || 0,
      }
    };

    console.log('Generation complete:', response.metadata);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-figure-from-reference:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
