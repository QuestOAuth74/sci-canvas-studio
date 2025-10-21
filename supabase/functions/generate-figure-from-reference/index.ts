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

    const systemPrompt = `You are a scientific illustration analysis expert specializing in biological diagrams. Analyze the provided reference image with EXTREME PRECISION.

Your response must be valid JSON following this exact structure:
{
  "identified_elements": [
    {
      "name": "precise element name",
      "category": "biology|chemistry|physics|anatomy|protein|enzyme|receptor|organ|cell|molecule",
      "description": "detailed description including visual characteristics",
      "position_x": 45.5,
      "position_y": 30.2,
      "estimated_size": "large|medium|small",
      "rotation": 0,
      "visual_notes": "color, shape, distinguishing features",
      "search_terms": ["most_specific_term", "broader_term", "category_term", "alternative_name"]
    }
  ],
  "spatial_relationships": [
    {
      "from_element": 0,
      "to_element": 1,
      "relationship_type": "activates|inhibits|produces|converts|binds_to|flows_to|signals",
      "connector_style": "solid_arrow|dashed_arrow|double_arrow|thick_line|thin_line",
      "directionality": "unidirectional|bidirectional",
      "label": "optional label on connector (e.g., enzyme name, +/-)"
    }
  ],
  "overall_layout": {
    "flow_direction": "left_to_right|top_to_bottom|circular|radial|hierarchical|network",
    "complexity": "simple|moderate|complex",
    "diagram_type": "pathway|cycle|network|hierarchy|process_flow"
  }
}

CRITICAL INSTRUCTIONS:
1. Provide PRECISE position_x and position_y as percentages (0-100) measuring from top-left corner
2. Measure distances and spacing carefully - this is critical for layout accuracy
3. Identify connector types accurately (solid vs dashed vs arrows vs double arrows)
4. Note any labels or text on connectors
5. Search terms should be HIGHLY SPECIFIC first, then broader (e.g., ["angiotensinogen", "protein precursor", "hormone", "biology"])
6. For biological elements, prioritize scientific accuracy over visual appearance
7. If you see a receptor, specify its type and include "receptor", "GPCR", "membrane" in search terms
8. If you see an enzyme, include its name, function, and "enzyme" in search terms
9. estimated_size should reflect relative size in the reference image (large/medium/small)
10. Position coordinates must be accurate within 5% - measure carefully`;

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
        max_tokens: 4000,
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

    // Step 2: Search icons database for matches with multi-stage approach
    console.log('Searching for matching icons...');
    const iconMatches = await Promise.all(
      analysis.identified_elements.map(async (element: any) => {
        const searchTerms = element.search_terms || [element.name];
        const isReceptor = element.name.toLowerCase().includes('receptor') || 
                          element.category.toLowerCase().includes('receptor') ||
                          searchTerms.some((term: string) => 
                            term.toLowerCase().includes('receptor') ||
                            term.toLowerCase().includes('gpcr') ||
                            term.toLowerCase().includes('membrane')
                          );
        
        console.log(`Searching for: ${element.name} (${isReceptor ? 'RECEPTOR' : 'standard'})`);
        console.log(`  Search terms: ${searchTerms.join(', ')}`);
        
        // Multi-stage search
        let matches: any[] = [];
        
        // Stage 1: Exact name match
        const { data: exactMatch } = await supabase
          .from('icons')
          .select('id, name, category, svg_content, thumbnail')
          .ilike('name', element.name)
          .limit(3);
        
        if (exactMatch && exactMatch.length > 0) {
          matches = exactMatch;
          console.log(`  Stage 1 (exact): Found ${matches.length} matches`);
        }
        
        // Stage 2: Search terms match (if no exact match or need more)
        if (matches.length < 3) {
          for (const term of searchTerms.slice(0, 3)) {
            const { data: termMatches } = await supabase
              .from('icons')
              .select('id, name, category, svg_content, thumbnail')
              .or(`name.ilike.%${term}%,category.ilike.%${term}%`)
              .limit(5);
            
            if (termMatches && termMatches.length > 0) {
              // Add unique matches
              termMatches.forEach(m => {
                if (!matches.find(existing => existing.id === m.id)) {
                  matches.push(m);
                }
              });
              console.log(`  Stage 2 (term "${term}"): Found ${termMatches.length} matches`);
              if (matches.length >= 5) break;
            }
          }
        }
        
        // Stage 3: Receptor priority search
        if (isReceptor && matches.length < 3) {
          const { data: receptorMatches } = await supabase
            .from('icons')
            .select('id, name, category, svg_content, thumbnail')
            .or('name.ilike.%receptor%,category.ilike.%receptor%,name.ilike.%channel%,name.ilike.%membrane%')
            .limit(5);
          
          if (receptorMatches && receptorMatches.length > 0) {
            receptorMatches.forEach(m => {
              if (!matches.find(existing => existing.id === m.id)) {
                matches.push(m);
              }
            });
            console.log(`  Stage 3 (receptor): Found ${receptorMatches.length} matches`);
          }
        }
        
        // Stage 4: Category fallback
        if (matches.length === 0) {
          const { data: categoryMatches } = await supabase
            .from('icons')
            .select('id, name, category, svg_content, thumbnail')
            .ilike('category', element.category)
            .limit(3);
          
          if (categoryMatches && categoryMatches.length > 0) {
            matches = categoryMatches;
            console.log(`  Stage 4 (category): Found ${matches.length} matches`);
          }
        }
        
        console.log(`  Total matches: ${matches.length}`);

        return {
          element,
          matches: matches.slice(0, 5) // Limit to top 5
        };
      })
    );

    console.log(`Found matches for ${iconMatches.filter(m => m.matches.length > 0).length} elements`);

    // Filter to only include elements with icon matches
    const elementsWithMatches = iconMatches.filter(m => m.matches.length > 0);
    
    if (elementsWithMatches.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No matching icons found in database for any elements',
        suggestion: 'Try uploading icons that match the biological/scientific elements in your reference image'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Generate layout using AI with enhanced prompt
    const layoutPrompt = `You are generating a scientific diagram layout that must PRECISELY recreate the reference image.

Canvas dimensions: ${canvasWidth}x${canvasHeight}

AVAILABLE ELEMENTS WITH ICONS:
${JSON.stringify(elementsWithMatches.map((m, idx) => ({
  index: idx,
  element_name: m.element.name,
  position_x: m.element.position_x,
  position_y: m.element.position_y,
  estimated_size: m.element.estimated_size,
  rotation: m.element.rotation || 0,
  category: m.element.category,
  available_icons: m.matches.slice(0, 3).map((i: any) => ({ 
    id: i.id, 
    name: i.name, 
    category: i.category 
  }))
})), null, 2)}

SPATIAL RELATIONSHIPS TO RECREATE:
${JSON.stringify(analysis.spatial_relationships, null, 2)}

CRITICAL SIZING REQUIREMENTS:
- Target icon size: 200x200 pixels
- Scale based on estimated_size from analysis:
  * "large": scale 0.7-0.9
  * "medium": scale 0.5-0.7
  * "small": scale 0.3-0.5
- Icons should maintain relative size differences from reference

CRITICAL POSITIONING REQUIREMENTS:
- Use the EXACT position_x and position_y from the elements above
- DO NOT modify positions by more than ±5%
- Maintain relative spacing EXACTLY as shown in reference
- If reference shows tight clustering, cluster tightly
- If reference shows wide spacing, maintain wide spacing
- Align objects that appear aligned in the reference image
- Ensure minimum 50px spacing between adjacent objects

CONNECTOR STYLING RULES (FOLLOW STRICTLY):
Based on relationship_type, use these styles:
- "activates" → { "type": "curved", "style": "solid", "color": "#00AA00", "endMarker": "arrow", "strokeWidth": 2 }
- "inhibits" → { "type": "straight", "style": "dashed", "color": "#FF0000", "endMarker": "tee", "strokeWidth": 2 }
- "produces" → { "type": "curved", "style": "solid", "color": "#0066CC", "endMarker": "arrow", "strokeWidth": 3 }
- "converts" → { "type": "straight", "style": "solid", "color": "#333333", "endMarker": "arrow", "strokeWidth": 2 }
- "binds_to" → { "type": "straight", "style": "dashed", "color": "#666666", "endMarker": "circle", "strokeWidth": 1 }
- "flows_to" → { "type": "curved", "style": "solid", "color": "#000000", "endMarker": "arrow", "strokeWidth": 2 }
- "signals" → { "type": "straight", "style": "dashed", "color": "#FF6600", "endMarker": "arrow", "strokeWidth": 1 }

CONNECTOR LABEL REQUIREMENTS:
- If relationship has a "label" field, include it in the connector
- Labels should be positioned at connector midpoint
- Use fontSize: 11 for labels

OUTPUT FORMAT (VALID JSON ONLY):
{
  "objects": [
    {
      "type": "icon",
      "icon_id": "uuid-from-available-icons",
      "icon_name": "name-from-available-icons",
      "x": 45.5,
      "y": 30.2,
      "scale": 0.6,
      "rotation": 0,
      "label": "Element Name",
      "labelPosition": "bottom"
    }
  ],
  "connectors": [
    {
      "from": 0,
      "to": 1,
      "type": "curved",
      "style": "solid",
      "strokeWidth": 2,
      "color": "#000000",
      "endMarker": "arrow",
      "startMarker": "none",
      "label": "optional label"
    }
  ]
}

VALIDATION RULES:
1. ALL icon_id values MUST be from the available_icons list above
2. ALL x,y positions MUST use position_x, position_y from elements (±5% max)
3. EVERY connector MUST follow the styling rules based on relationship_type
4. Number of objects should match number of elements with available icons
5. Connectors should recreate ALL spatial_relationships from analysis
6. Choose the BEST matching icon_id from available_icons for each element

Generate the layout now. Return ONLY valid JSON.`;

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
        max_tokens: 4000,
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

    // Validate and filter objects with valid icon_ids
    const validObjects = (layout.objects || []).filter((obj: any) => {
      const isValidUUID = obj.icon_id && 
        typeof obj.icon_id === 'string' && 
        obj.icon_id.length === 36 && 
        obj.icon_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (!isValidUUID) {
        console.log(`Filtered out object with invalid icon_id: ${obj.icon_name || 'unknown'} (${obj.icon_id})`);
      }
      return isValidUUID;
    });

    // Update connector indices to match filtered objects
    const validConnectors = (layout.connectors || []).filter((conn: any) => {
      return conn.from < validObjects.length && conn.to < validObjects.length;
    });

    const finalLayout = {
      objects: validObjects,
      connectors: validConnectors
    };

    // Add metadata with detailed feedback
    const positionAccuracy = validObjects.every((obj: any) => 
      obj.x >= 0 && obj.x <= 100 && obj.y >= 0 && obj.y <= 100
    ) ? "All positions within valid range (0-100%)" : "Some positions out of range";
    
    const connectorStyles = validConnectors.reduce((acc: any, conn: any) => {
      const style = `${conn.type}-${conn.style}`;
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {});

    const response = {
      layout: finalLayout,
      metadata: {
        elements_identified: analysis.identified_elements.length,
        icons_matched: elementsWithMatches.length,
        total_objects: validObjects.length,
        total_connectors: validConnectors.length,
        filtered_objects: (layout.objects?.length || 0) - validObjects.length,
        target_icon_size: '200x200px',
        receptor_icons_used: validObjects.filter((obj: any) => obj.icon_name.toLowerCase().includes('receptor')).length,
        position_accuracy: positionAccuracy,
        connector_styles: connectorStyles,
        avg_scale: validObjects.reduce((sum: number, obj: any) => sum + (obj.scale || 0.5), 0) / validObjects.length
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
