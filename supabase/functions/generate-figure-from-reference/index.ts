import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize relationship types to canonical forms
function normalizeRelationship(relType: string): string {
  const normalized = relType.toLowerCase().trim();
  
  // Synonym mapping
  const synonyms: Record<string, string> = {
    'activate': 'activates',
    'activated': 'activates',
    'activation': 'activates',
    'inhibit': 'inhibits',
    'inhibited': 'inhibits',
    'inhibition': 'inhibits',
    'produce': 'produces',
    'produced': 'produces',
    'production': 'produces',
    'convert': 'converts',
    'converted': 'converts',
    'conversion': 'converts',
    'bind': 'binds_to',
    'binds': 'binds_to',
    'binding': 'binds_to',
    'bound': 'binds_to',
    'flow': 'flows_to',
    'flows': 'flows_to',
    'signal': 'signals',
    'signaling': 'signals',
    'signalling': 'signals',
  };
  
  return synonyms[normalized] || normalized;
}

// Strict style mapping based on relationship type
function getConnectorStyle(relType: string): any {
  const normalized = normalizeRelationship(relType);
  
  const styleMap: Record<string, any> = {
    'activates': { type: 'curved', style: 'solid', color: '#00AA00', endMarker: 'arrow', strokeWidth: 2 },
    'inhibits': { type: 'straight', style: 'dashed', color: '#FF0000', endMarker: 'tee', strokeWidth: 2 },
    'produces': { type: 'curved', style: 'solid', color: '#0066CC', endMarker: 'arrow', strokeWidth: 3 },
    'converts': { type: 'straight', style: 'solid', color: '#333333', endMarker: 'arrow', strokeWidth: 2 },
    'binds_to': { type: 'straight', style: 'dashed', color: '#666666', endMarker: 'circle', strokeWidth: 1 },
    'flows_to': { type: 'curved', style: 'solid', color: '#000000', endMarker: 'arrow', strokeWidth: 2 },
    'signals': { type: 'straight', style: 'dashed', color: '#FF6600', endMarker: 'arrow', strokeWidth: 1 },
    'source': { type: 'straight', style: 'solid', color: '#999999', endMarker: 'open-arrow', strokeWidth: 1 },
  };
  
  return styleMap[normalized] || { type: 'straight', style: 'solid', color: '#000000', endMarker: 'arrow', strokeWidth: 2 };
}

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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const { image, description, canvasWidth, canvasHeight, strict = false } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting AI analysis...');

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STEP 1: Vision Analysis with Enhanced Prompt
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
      "relationship_type": "activates|inhibits|produces|converts|binds_to|flows_to|signals|source",
      "connector_style": "solid_arrow|dashed_arrow|double_arrow|thick_line|thin_line",
      "directionality": "unidirectional|bidirectional",
      "label": "optional label on connector",
      "justification": "why this relationship exists"
    }
  ],
  "overall_layout": {
    "flow_direction": "left_to_right|top_to_bottom|circular|radial|hierarchical|network",
    "complexity": "simple|moderate|complex",
    "diagram_type": "pathway|cycle|network|hierarchy|process_flow"
  }
}

CRITICAL INSTRUCTIONS:
1. Provide PRECISE position_x and position_y as percentages (0-100) from top-left
2. Measure spacing and alignment carefully - accuracy is critical
3. Identify connector types: solid arrows (→), dashed arrows (⇢), tee markers (⊣ for inhibition)
4. Note labels or text on connectors
5. Search terms: HIGHLY SPECIFIC first ["ACE2", "angiotensin converting enzyme 2", "enzyme", "biology"]
6. For receptors: include "receptor", "GPCR", "membrane" in search terms
7. For enzymes: include function and "enzyme" in search terms
8. Position accuracy within ±2% is required
9. Relationship types: use ONLY activates|inhibits|produces|converts|binds_to|flows_to|signals|source
10. Justification: brief explanation of why this connection exists in the diagram`;

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

    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // STEP 2: Enhanced Icon Matching with Receptor Priority
    console.log('Searching for matching icons...');
    const iconMatches = await Promise.all(
      analysis.identified_elements.map(async (element: any, idx: number) => {
        const searchTerms = element.search_terms || [element.name];
        const isReceptor = element.name.toLowerCase().includes('receptor') || 
                          element.category.toLowerCase().includes('receptor') ||
                          searchTerms.some((term: string) => 
                            term.toLowerCase().includes('receptor') ||
                            term.toLowerCase().includes('gpcr') ||
                            term.toLowerCase().includes('membrane') ||
                            term.toLowerCase().includes('channel')
                          );
        
        console.log(`[${idx}] Searching: ${element.name} (${isReceptor ? 'RECEPTOR' : 'standard'})`);
        console.log(`  Search terms: ${searchTerms.join(', ')}`);
        
        let matches: any[] = [];
        
        // Receptor enforcement: filter to receptor icons FIRST
        if (isReceptor) {
          const { data: receptorMatches } = await supabase
            .from('icons')
            .select('id, name, category, svg_content, thumbnail')
            .or('name.ilike.%receptor%,category.ilike.%receptor%,name.ilike.%channel%,name.ilike.%membrane%,name.ilike.%gpcr%')
            .limit(5);
          
          if (receptorMatches && receptorMatches.length > 0) {
            matches = receptorMatches;
            console.log(`  ✓ Receptor priority: Found ${matches.length} matches`);
          }
        }
        
        // Stage 1: Exact name match
        if (matches.length === 0) {
          const { data: exactMatch } = await supabase
            .from('icons')
            .select('id, name, category, svg_content, thumbnail')
            .ilike('name', element.name)
            .limit(3);
          
          if (exactMatch && exactMatch.length > 0) {
            matches = exactMatch;
            console.log(`  Stage 1 (exact): Found ${matches.length} matches`);
          }
        }
        
        // Stage 2: Search terms match
        if (matches.length < 3) {
          for (const term of searchTerms.slice(0, 3)) {
            const { data: termMatches } = await supabase
              .from('icons')
              .select('id, name, category, svg_content, thumbnail')
              .or(`name.ilike.%${term}%,category.ilike.%${term}%`)
              .limit(5);
            
            if (termMatches && termMatches.length > 0) {
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
        
        // Stage 3: Category fallback
        if (matches.length === 0) {
          const { data: categoryMatches } = await supabase
            .from('icons')
            .select('id, name, category, svg_content, thumbnail')
            .ilike('category', element.category)
            .limit(3);
          
          if (categoryMatches && categoryMatches.length > 0) {
            matches = categoryMatches;
            console.log(`  Stage 3 (category): Found ${matches.length} matches`);
          }
        }
        
        console.log(`  Total matches: ${matches.length}`);

        return {
          element,
          element_index: idx,
          matches: matches.slice(0, 5)
        };
      })
    );

    console.log(`Found matches for ${iconMatches.filter(m => m.matches.length > 0).length} elements`);

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

    // STEP 3: Generate Proposed Layout (let AI try)
    const layoutPrompt = `You are generating a scientific diagram layout. Recreate the reference image PRECISELY.

Canvas: ${canvasWidth}x${canvasHeight}

ELEMENTS WITH ICONS:
${JSON.stringify(elementsWithMatches.map((m) => ({
  index: m.element_index,
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

RELATIONSHIPS:
${JSON.stringify(analysis.spatial_relationships, null, 2)}

OUTPUT (JSON ONLY):
{
  "objects": [
    {
      "type": "icon",
      "element_index": 0,
      "icon_id": "uuid-from-available-icons",
      "icon_name": "name",
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
      "label": "optional"
    }
  ]
}

Generate now. Return ONLY valid JSON.`;

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
    console.log('AI proposed layout generated');

    const layoutJsonMatch = layoutText.match(/\{[\s\S]*\}/);
    if (!layoutJsonMatch) {
      return new Response(JSON.stringify({ error: 'Failed to parse layout response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const proposedLayout = JSON.parse(layoutJsonMatch[0]);

    // STEP 4: Build Deterministic Final Layout
    console.log('Building deterministic final layout...');
    
    // Build objects with strict positioning from analysis
    const finalObjects = elementsWithMatches.map((m) => {
      const proposedObj = proposedLayout.objects?.find((o: any) => o.element_index === m.element_index);
      const chosenIcon = proposedObj?.icon_id && m.matches.find((i: any) => i.id === proposedObj.icon_id)
        ? m.matches.find((i: any) => i.id === proposedObj.icon_id)
        : m.matches[0]; // fallback to best match

      // Clamp positions to [0, 100]
      const x = Math.max(0, Math.min(100, m.element.position_x));
      const y = Math.max(0, Math.min(100, m.element.position_y));

      // Scale: use AI's suggestion if available, else use size mapping
      let scale = 0.5;
      if (proposedObj?.scale) {
        scale = proposedObj.scale;
      } else {
        const sizeMap: Record<string, number> = { large: 0.8, medium: 0.5, small: 0.35 };
        scale = sizeMap[m.element.estimated_size] || 0.5;
      }

      return {
        type: "icon",
        element_index: m.element_index,
        icon_id: chosenIcon.id,
        icon_name: chosenIcon.name,
        x,
        y,
        scale,
        rotation: m.element.rotation || 0,
        label: m.element.name,
        labelPosition: "bottom" as const
      };
    });

    // Build connectors from analysis.spatial_relationships with strict styling
    const finalConnectors: any[] = [];
    const checks: any[] = [];

    for (const rel of analysis.spatial_relationships || []) {
      const fromObj = finalObjects.find(o => o.element_index === rel.from_element);
      const toObj = finalObjects.find(o => o.element_index === rel.to_element);

      if (!fromObj || !toObj) {
        checks.push({
          relationship: `${rel.from_element} → ${rel.to_element}`,
          status: 'missing',
          issue: 'One or both elements not matched to icons'
        });
        continue;
      }

      const fromIdx = finalObjects.indexOf(fromObj);
      const toIdx = finalObjects.indexOf(toObj);

      const relType = normalizeRelationship(rel.relationship_type);
      const strictStyle = getConnectorStyle(relType);

      const proposedConn = proposedLayout.connectors?.find((c: any) => 
        c.from === fromIdx && c.to === toIdx
      );

      // Check if AI got it right
      let styleIssues: string[] = [];
      if (proposedConn) {
        if (proposedConn.endMarker !== strictStyle.endMarker) {
          styleIssues.push(`endMarker: expected ${strictStyle.endMarker}, got ${proposedConn.endMarker}`);
        }
        if (proposedConn.style !== strictStyle.style) {
          styleIssues.push(`style: expected ${strictStyle.style}, got ${proposedConn.style}`);
        }
        if (proposedConn.color !== strictStyle.color) {
          styleIssues.push(`color: expected ${strictStyle.color}, got ${proposedConn.color}`);
        }
      }

      checks.push({
        relationship: `${fromObj.label} → ${toObj.label}`,
        relationship_type: relType,
        status: styleIssues.length === 0 ? 'pass' : 'corrected',
        issues: styleIssues,
        corrected_style: strictStyle
      });

      finalConnectors.push({
        from: fromIdx,
        to: toIdx,
        type: strictStyle.type,
        style: strictStyle.style,
        strokeWidth: strictStyle.strokeWidth,
        color: strictStyle.color,
        endMarker: strictStyle.endMarker,
        startMarker: 'none',
        label: rel.label || ''
      });
    }

    const finalLayout = {
      objects: finalObjects,
      connectors: finalConnectors
    };

    // Compute position deviation
    let totalDeviation = 0;
    let deviationCount = 0;
    proposedLayout.objects?.forEach((pObj: any) => {
      const fObj = finalObjects.find(o => o.element_index === pObj.element_index);
      if (fObj && pObj.x !== undefined && pObj.y !== undefined) {
        const dx = Math.abs(pObj.x - fObj.x);
        const dy = Math.abs(pObj.y - fObj.y);
        totalDeviation += dx + dy;
        deviationCount += 2;
      }
    });
    const avgDeviation = deviationCount > 0 ? (totalDeviation / deviationCount).toFixed(2) : '0';

    const connectorStyleBreakdown = finalConnectors.reduce((acc: any, conn: any) => {
      const key = `${conn.type}-${conn.style}-${conn.endMarker}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const metadata = {
      elements_identified: analysis.identified_elements.length,
      icons_matched: elementsWithMatches.length,
      total_objects: finalObjects.length,
      total_connectors: finalConnectors.length,
      avg_position_deviation_percent: avgDeviation,
      connector_styles: connectorStyleBreakdown,
      checks_passed: checks.filter(c => c.status === 'pass').length,
      checks_corrected: checks.filter(c => c.status === 'corrected').length,
      checks_missing: checks.filter(c => c.status === 'missing').length,
    };

    console.log('Final layout complete:', metadata);

    return new Response(
      JSON.stringify({
        analysis,
        proposed_layout: proposedLayout,
        layout: finalLayout,
        checks,
        metadata,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
