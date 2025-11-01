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

// Get connector style based on relationship type and visual analysis
function getConnectorStyle(relType: string, visualDetails?: any): any {
  const normalized = normalizeRelationship(relType);
  
  // Base style map (provides colors and markers based on semantic relationship)
  const styleMap: Record<string, any> = {
    'activates': { style: 'solid', color: '#00AA00', endMarker: 'arrow', strokeWidth: 2 },
    'inhibits': { style: 'dashed', color: '#FF0000', endMarker: 'tee', strokeWidth: 2 },
    'produces': { style: 'solid', color: '#0066CC', endMarker: 'arrow', strokeWidth: 3 },
    'converts': { style: 'solid', color: '#333333', endMarker: 'arrow', strokeWidth: 2 },
    'binds_to': { style: 'dashed', color: '#666666', endMarker: 'circle', strokeWidth: 1 },
    'flows_to': { style: 'solid', color: '#000000', endMarker: 'arrow', strokeWidth: 2 },
    'signals': { style: 'dashed', color: '#FF6600', endMarker: 'arrow', strokeWidth: 1 },
    'source': { style: 'solid', color: '#999999', endMarker: 'open-arrow', strokeWidth: 1 },
  };
  
  const baseStyle = styleMap[normalized] || { style: 'solid', color: '#000000', endMarker: 'arrow', strokeWidth: 2 };
  
  // Determine routing type from visual analysis (prefer straight lines for cleaner diagrams)
  let routingType = 'straight'; // Default to straight for cleaner layouts
  
  if (visualDetails?.line_type) {
    const lineType = visualDetails.line_type.toLowerCase();
    if (lineType.includes('curved') || lineType.includes('bezier')) {
      routingType = 'curved';
    } else if (lineType.includes('orthogonal') || lineType.includes('elbow')) {
      routingType = 'elbow';
    } else {
      routingType = 'straight';
    }
  }
  
  return {
    type: routingType,
    ...baseStyle
  };
}

// Robust JSON extraction with multiple fallback strategies
function extractJSON(text: string): any {
  // Strategy 1: Try parsing raw text
  try {
    return JSON.parse(text);
  } catch {}
  
  // Strategy 2: Look for markdown code blocks
  const markdownMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (markdownMatch) {
    try {
      return JSON.parse(markdownMatch[1]);
    } catch {}
  }
  
  // Strategy 3: Find JSON object boundaries more carefully
  const jsonMatch = text.match(/\{(?:[^{}]|(\{(?:[^{}]|(\{[^{}]*\}))*\}))*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }
  
  // Strategy 4: Remove common prefixes and try again
  const cleaned = text
    .replace(/^[^{]*/, '') // Remove everything before first {
    .replace(/[^}]*$/, ''); // Remove everything after last }
  
  if (cleaned) {
    try {
      return JSON.parse(cleaned);
    } catch {}
  }
  
  return null;
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

    // STEP 1A: PASS 1 - Element Detection & Precise Positioning
    console.log('[PROGRESS] element_detection | 0% | Starting element analysis...');
    console.log('Pass 1: Analyzing elements and positions...');
    
    const elementSystemPrompt = `You are a scientific illustration analysis expert. PASS 1: Analyze elements and their precise positions.

CRITICAL: Distinguish between simple geometric shapes with labels vs. biological/scientific elements:
- Simple shapes: rectangles, circles, ovals with text labels → mark as "shape" type
- Biological elements: proteins, organs, cells, molecules → mark as "icon" type

For shapes with text, extract the ACTUAL TEXT CONTENT visible inside the shape.

Return valid JSON ONLY:
{
  "identified_elements": [
    {
      "name": "precise element name or label text",
      "element_type": "shape|icon",
      "shape_type": "rectangle|circle|oval|none",
      "shape_subtype": "text_label|simple_shape|complex_shape",
      "category": "biology|chemistry|physics|anatomy|protein|enzyme|receptor|organ|cell|molecule|signal|text_label",
      "description": "detailed description including visual characteristics",
      "position_x": 45.5,
      "position_y": 30.2,
      "bounding_box": { "width": 120, "height": 80 },
      "estimated_size": "large|medium|small",
      "rotation": 0,
      "visual_notes": "color, shape, distinguishing features",
      "fill_color": "#RRGGBB if colored shape",
      "stroke_color": "#RRGGBB if bordered",
      "text_content": "the actual text visible inside or on the shape (for shapes only)",
      "text_properties": {
        "font_size": "small|medium|large",
        "text_alignment": "center|left|right",
        "multiline": true|false
      },
      "rounded_corners": true|false,
      "search_terms": ["most_specific_term", "broader_term", "category_term", "alternative_name"]
    }
  ],
  "spatial_analysis": {
    "alignment": {
      "horizontally_aligned": [[0, 1], [2, 3]],
      "vertically_aligned": [[0, 2], [1, 3]]
    },
    "spacing": [
      { "from": 0, "to": 1, "distance_pixels": 150, "distance_percent": 15.0 }
    ],
    "layout_pattern": "grid|vertical_flow|horizontal_flow|branching|circular|free_form"
  },
  "overall_layout": {
    "flow_direction": "left_to_right|top_to_bottom|circular|radial|hierarchical|network",
    "complexity": "simple|moderate|complex",
    "diagram_type": "pathway|cycle|network|hierarchy|process_flow"
  }
}

ELEMENT TYPE DETECTION:
- If element is a simple rectangle/circle/oval with text → element_type: "shape"
- If element is a biological/scientific icon/illustration → element_type: "icon"
- Shapes should have fill_color and stroke_color if visible
- Icons need search_terms for database matching

SPATIAL ANALYSIS REQUIREMENTS:
- Provide pixel coordinates if measurable, AND precise percentages (0-100)
- Measure distances between adjacent elements in pixels AND percentages
- Identify which elements are aligned (share x or y coordinates within ±2%)
- Note spacing consistency: evenly spaced or clustered?
- Detect layout patterns: grid, hierarchy, pathway, etc.
- Bounding box: estimate width and height in pixels if visible
- Search terms: HIGHLY SPECIFIC first, then broader ["ACE2", "angiotensin converting enzyme 2", "enzyme", "biology"]
- Position accuracy within ±2% is CRITICAL`;

    const elementUserPrompt = description 
      ? `PASS 1 - Analyze elements and positions in this diagram. User description: "${description}"`
      : "PASS 1 - Analyze all elements and their precise positions.";

    const elementResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: elementSystemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: elementUserPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 4000,
      }),
    });

    if (!elementResponse.ok) {
      const errorText = await elementResponse.text();
      console.error('Pass 1 error:', elementResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to analyze elements' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const elementData = await elementResponse.json();
    const elementText = elementData.choices[0].message.content;
    console.log('Pass 1 complete');
    console.log('GPT-5 Response length:', elementText?.length || 0);
    console.log('Response preview:', elementText?.substring(0, 200));
    console.log('[PROGRESS] element_detection | 100% | Element analysis complete');

    const elementAnalysis = extractJSON(elementText);
    if (!elementAnalysis) {
      console.error('Failed to extract JSON from GPT-5 response:', elementText);
      return new Response(JSON.stringify({ error: 'Failed to parse element analysis - invalid JSON format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STEP 1B: PASS 2 - Deep Connector Analysis
    console.log('[PROGRESS] connector_analysis | 0% | Starting connector analysis...');
    console.log('Pass 2: Analyzing connectors in detail...');
    
    const connectorSystemPrompt = `You are a connector analysis expert. PASS 2: Analyze ONLY the connectors/arrows/lines between elements.

Elements identified (for reference):
${elementAnalysis.identified_elements.map((e: any, i: number) => `${i}: ${e.name} at (${e.position_x}, ${e.position_y})`).join('\n')}

Return valid JSON ONLY:
{
  "connectors": [
    {
      "from_element": 0,
      "to_element": 1,
      "relationship_type": "activates|inhibits|produces|converts|binds_to|flows_to|signals|source",
      "visual_style": {
        "line_type": "straight|curved|orthogonal|bezier",
        "line_style": "solid|dashed|dotted|double",
        "thickness": "thin|medium|thick",
        "color": "#000000"
      },
      "markers": {
        "start": "none|arrow|circle|diamond|tee",
        "end": "none|arrow|circle|diamond|tee"
      },
      "routing": {
        "path_description": "direct|curves_around|multiple_waypoints",
        "approximate_waypoints": [[x1,y1], [x2,y2]]
      },
      "label": "text on or near connector",
      "label_position": "midpoint|offset",
      "directionality": "unidirectional|bidirectional",
      "justification": "why this connection exists"
    }
  ]
}

CONNECTOR ANALYSIS REQUIREMENTS:
- Identify ALL connectors: arrows, lines, paths between elements
- Line type: CRITICAL - accurately identify if straight, curved, orthogonal (90° turns), or complex bezier
  * Straight lines are most common in hierarchical/flow diagrams
  * Only mark as curved if there is visible curvature
  * Default to straight when uncertain
- Line style: solid (━), dashed (┄), dotted (···), double (═)
- Thickness: thin (1-2px), medium (2-3px), thick (4+px)
- Markers: arrow (→), tee (⊣ for inhibition), circle (○), diamond (◊), none
- Path: does it go directly or curve around other elements?
- Labels: any text written on or near the connector
- Relationship type: use ONLY activates|inhibits|produces|converts|binds_to|flows_to|signals|source
- Color: if not black, specify hex color
- IMPORTANT: Be precise about line_type - this determines visual routing in the final diagram`;

    const connectorUserPrompt = "PASS 2 - Analyze ALL connectors, arrows, and lines in detail.";

    const connectorResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: connectorSystemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: connectorUserPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 3000,
      }),
    });

    if (!connectorResponse.ok) {
      const errorText = await connectorResponse.text();
      console.error('Pass 2 error:', connectorResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to analyze connectors' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const connectorData = await connectorResponse.json();
    const connectorText = connectorData.choices[0].message.content;
    console.log('Pass 2 complete');
    console.log('Connector response length:', connectorText?.length || 0);
    console.log('[PROGRESS] connector_analysis | 100% | Connector analysis complete');

    const connectorAnalysis = extractJSON(connectorText);
    if (!connectorAnalysis) {
      console.error('Failed to extract JSON from connector response:', connectorText);
      return new Response(JSON.stringify({ error: 'Failed to parse connector analysis - invalid JSON format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Merge analyses into final structure
    const analysis = {
      identified_elements: elementAnalysis.identified_elements,
      spatial_relationships: connectorAnalysis.connectors.map((c: any) => ({
        from_element: c.from_element,
        to_element: c.to_element,
        relationship_type: c.relationship_type,
        connector_style: c.visual_style?.line_style || 'solid',
        directionality: c.directionality,
        label: c.label || '',
        justification: c.justification || '',
        visual_details: c.visual_style,
        markers: c.markers,
        routing: c.routing
      })),
      spatial_analysis: elementAnalysis.spatial_analysis,
      overall_layout: elementAnalysis.overall_layout
    };

    console.log(`Analysis complete: ${analysis.identified_elements.length} elements, ${analysis.spatial_relationships.length} connectors`);

    // STEP 2A: AI-Powered Search Term Generation (only for icon elements)
    console.log('[PROGRESS] search_term_generation | 0% | Generating search terms...');
    console.log('Generating optimal search terms with AI...');
    const elementsWithAISearchTerms = await Promise.all(
      analysis.identified_elements.map(async (element: any, idx: number) => {
        // Skip search term generation for shape elements
        if (element.element_type === 'shape') {
          console.log(`[${idx}] Skipping search for shape: ${element.name}`);
          return { ...element, element_type: 'shape', ai_search_terms: [], search_confidence: 'n/a' };
        }
        const searchTermPrompt = `Element: "${element.name}"
Description: "${element.description}"
Category: "${element.category}"
Visual notes: "${element.visual_notes}"

Generate 5 optimal database search terms to find a matching biological/scientific icon.
Consider: scientific names, common names, visual descriptors, related terms, broader categories.

Return ONLY JSON:
{
  "search_terms": ["term1", "term2", "term3", "term4", "term5"],
  "confidence": "high|medium|low"
}`;

        try {
          const searchTermResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are a scientific terminology expert. Always return valid JSON only.' },
                { role: 'user', content: searchTermPrompt }
              ],
              max_tokens: 300,
            }),
          });

          if (searchTermResponse.ok) {
            const data = await searchTermResponse.json();
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return { ...element, ai_search_terms: parsed.search_terms, search_confidence: parsed.confidence };
            }
          }
        } catch (error) {
          console.log(`  AI search term generation failed for ${element.name}, using fallback`);
        }

        // Fallback to original search terms
        return { ...element, ai_search_terms: element.search_terms, search_confidence: 'fallback' };
      })
    );

    // STEP 2B: Enhanced Icon Matching with Receptor Priority (skip shapes)
    console.log('Searching for matching icons...');
    const iconMatches = await Promise.all(
      elementsWithAISearchTerms.map(async (element: any, idx: number) => {
        // Skip icon matching for shape elements
        if (element.element_type === 'shape') {
          return {
            element_index: idx,
            element,
            matches: [] // No icon matches for shapes
          };
        }
        const searchTerms = element.ai_search_terms || element.search_terms || [element.name];
        const isReceptor = element.name.toLowerCase().includes('receptor') || 
                          element.category.toLowerCase().includes('receptor') ||
                          searchTerms.some((term: string) => 
                            term.toLowerCase().includes('receptor') ||
                            term.toLowerCase().includes('gpcr') ||
                            term.toLowerCase().includes('membrane') ||
                            term.toLowerCase().includes('channel')
                          );
        
        console.log(`[${idx}] Searching: ${element.name} (${isReceptor ? 'RECEPTOR' : 'standard'})`);
        console.log(`  AI-generated search terms: ${searchTerms.join(', ')}`);
        
        let matches: any[] = [];
        
        // Receptor enforcement: filter to receptor icons FIRST
        if (isReceptor) {
          const { data: receptorMatches } = await supabase
            .from('icons')
            .select('id, name, category, svg_content, thumbnail')
            .or('name.ilike.%receptor%,category.ilike.%receptor%,name.ilike.%channel%,name.ilike.%membrane%,name.ilike.%gpcr%')
            .limit(8);
          
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
            .limit(5);
          
          if (exactMatch && exactMatch.length > 0) {
            matches = exactMatch;
            console.log(`  Stage 1 (exact): Found ${matches.length} matches`);
          }
        }
        
        // Stage 2: AI-generated search terms match
        if (matches.length < 5) {
          for (const term of searchTerms.slice(0, 5)) {
            const { data: termMatches } = await supabase
              .from('icons')
              .select('id, name, category, svg_content, thumbnail')
              .or(`name.ilike.%${term}%,category.ilike.%${term}%`)
              .limit(8);
            
            if (termMatches && termMatches.length > 0) {
              termMatches.forEach(m => {
                if (!matches.find(existing => existing.id === m.id)) {
                  matches.push(m);
                }
              });
              console.log(`  Stage 2 (AI term "${term}"): Found ${termMatches.length} matches`);
              if (matches.length >= 8) break;
            }
          }
        }
        
        // Stage 3: Category fallback
        if (matches.length === 0) {
          const { data: categoryMatches } = await supabase
            .from('icons')
            .select('id, name, category, svg_content, thumbnail')
            .ilike('category', element.category)
            .limit(5);
          
          if (categoryMatches && categoryMatches.length > 0) {
            matches = categoryMatches;
            console.log(`  Stage 3 (category): Found ${matches.length} matches`);
          }
        }
        
        console.log(`  Total candidate matches: ${matches.length}`);

        return {
          element,
          element_index: idx,
          matches: matches.slice(0, 8) // Keep top 8 for verification
        };
      })
    );

    // STEP 2C: AI-Powered Icon Verification
    console.log('[PROGRESS] icon_verification | 0% | Verifying icon matches...');
    console.log('Verifying icon matches with AI...');
    const verifiedMatches = await Promise.all(
      iconMatches.map(async (match) => {
        if (match.matches.length === 0) {
          return match;
        }

        if (match.matches.length === 1) {
          console.log(`  [${match.element_index}] Only 1 match, skipping verification`);
          return match;
        }

        const verificationPrompt = `Element from scientific diagram:
Name: "${match.element.name}"
Description: "${match.element.description}"
Category: "${match.element.category}"
Visual characteristics: "${match.element.visual_notes}"

Available icon options:
${match.matches.map((icon: any, i: number) => `${i + 1}. "${icon.name}" (category: ${icon.category})`).join('\n')}

Question: Which icon option is the BEST semantic and visual match for this biological element?
Consider: scientific accuracy, semantic meaning, visual representation, common usage in diagrams.

Return ONLY JSON:
{
  "best_match_index": 1,
  "confidence": "high|medium|low",
  "reasoning": "brief explanation"
}`;

        try {
          const verifyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are a scientific illustration expert specializing in biological icon selection.' },
                { role: 'user', content: verificationPrompt }
              ],
              max_tokens: 200,
            }),
          });

          if (verifyResponse.ok) {
            const data = await verifyResponse.json();
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
              const verification = JSON.parse(jsonMatch[0]);
              const bestIdx = verification.best_match_index - 1; // Convert to 0-indexed
              
              if (bestIdx >= 0 && bestIdx < match.matches.length) {
                // Reorder matches to put best match first
                const bestMatch = match.matches[bestIdx];
                const reorderedMatches = [bestMatch, ...match.matches.filter((_: any, i: number) => i !== bestIdx)];
                
                console.log(`  [${match.element_index}] AI verified: "${bestMatch.name}" (${verification.confidence} confidence)`);
                console.log(`    Reasoning: ${verification.reasoning}`);
                
                return {
                  ...match,
                  matches: reorderedMatches.slice(0, 5),
                  verification: {
                    confidence: verification.confidence,
                    reasoning: verification.reasoning
                  }
                };
              }
            }
          }
        } catch (error) {
          console.log(`  [${match.element_index}] Verification failed, using database order`);
        }

        // Fallback: keep original order
        return { ...match, matches: match.matches.slice(0, 5) };
      })
    );

    const iconMatchesVerified = verifiedMatches;
    console.log(`Icon matching complete: ${iconMatchesVerified.filter(m => m.matches.length > 0).length} elements matched`);
    console.log('[PROGRESS] icon_verification | 100% | Icon verification complete');

    // Separate shapes and icons
    const shapeElements = iconMatchesVerified.filter(m => m.element.element_type === 'shape');
    const iconElements = iconMatchesVerified.filter(m => m.matches.length > 0);
    
    console.log(`Elements breakdown: ${shapeElements.length} shapes, ${iconElements.length} icons`);
    
    if (shapeElements.length === 0 && iconElements.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No elements could be processed from the reference image',
        suggestion: 'Try uploading a clearer reference image'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STEP 3: Generate Layout Deterministically (no LLM - more reliable)
    console.log('[PROGRESS] layout_generation | 0% | Generating layout...');
    console.log('Generating layout deterministically from analyzed elements...');
    
    // Build layout with both shapes and icons
    const allElements = [...shapeElements, ...iconElements];
    
    // Detect if this is a hierarchical/flow diagram for better layout
    const isHierarchical = analysis.overall_layout?.flow_direction?.includes('top_to_bottom') || 
                          analysis.overall_layout?.diagram_type?.includes('hierarchy') ||
                          analysis.overall_layout?.diagram_type?.includes('pathway');
    
    // If hierarchical, organize elements by vertical position for proper alignment
    const sortedElements = isHierarchical 
      ? [...allElements].sort((a, b) => (a.element.position_y || 0) - (b.element.position_y || 0))
      : allElements;
    
    const composedObjects = sortedElements.map((m) => {
      let x = Math.max(0, Math.min(100, m.element.position_x));
      let y = Math.max(0, Math.min(100, m.element.position_y));
      
      // For hierarchical layouts, snap Y positions to create clear tiers
      if (isHierarchical && analysis.spatial_analysis?.alignment) {
        const verticalGroups = analysis.spatial_analysis.alignment.horizontally_aligned || [];
        for (const group of verticalGroups) {
          if (group.includes(m.element_index)) {
            // Find average Y position for this tier
            const tierElements = allElements.filter(e => group.includes(e.element_index));
            const avgY = tierElements.reduce((sum, e) => sum + (e.element.position_y || 0), 0) / tierElements.length;
            y = Math.round(avgY);
            break;
          }
        }
      }
      
      // For shapes: create shape objects with text content
      if (m.element.element_type === 'shape') {
        let width = 100, height = 60;
        if (m.element.bounding_box) {
          width = m.element.bounding_box.width || 100;
          height = m.element.bounding_box.height || 60;
        }
        
        return {
          type: 'shape',
          element_index: m.element_index,
          shape_type: m.element.shape_type || 'rectangle',
          shape_subtype: m.element.shape_subtype,
          x,
          y,
          width,
          height,
          rotation: m.element.rotation || 0,
          label: m.element.name,
          text_content: m.element.text_content,
          text_properties: m.element.text_properties,
          rounded_corners: m.element.rounded_corners || (m.element.shape_type === 'rectangle'),
          fill_color: m.element.fill_color || '#E8F5E9',
          stroke_color: m.element.stroke_color || '#2E7D32',
          stroke_width: 2
        };
      }
      
      // For icons: create icon objects
      const chosenIcon = m.matches[0];
      let scale = 0.5;
      if (m.element.bounding_box?.width) {
        scale = Math.max(0.4, Math.min(1.2, m.element.bounding_box.width / 200));
      } else {
        const sizeMap: Record<string, number> = { large: 0.8, medium: 0.5, small: 0.35 };
        scale = sizeMap[m.element.estimated_size] || 0.5;
      }
      
      return {
        type: 'icon',
        element_index: m.element_index,
        icon_id: chosenIcon.id,
        icon_name: chosenIcon.name,
        x,
        y,
        scale,
        rotation: m.element.rotation || 0,
        label: m.element.name,
        labelPosition: 'bottom'
      };
    });
    
    // Build connectors from spatial relationships
    const composedConnectors = (analysis.spatial_relationships || []).map((rel: any) => {
      const fromElem = allElements.find((m: any) => m.element_index === rel.from_element);
      const toElem = allElements.find((m: any) => m.element_index === rel.to_element);
      
      if (!fromElem || !toElem) return null;
      
      const fromIdx = allElements.indexOf(fromElem);
      const toIdx = allElements.indexOf(toElem);
      
      // Pass visual details to respect the actual line type from the reference image
      const style = getConnectorStyle(rel.relationship_type, rel.visual_details);
      
      return {
        from: fromIdx,
        to: toIdx,
        type: style.type,
        style: style.style,
        strokeWidth: style.strokeWidth,
        color: style.color,
        endMarker: style.endMarker,
        startMarker: 'none',
        label: rel.label || ''
      };
    }).filter(Boolean);
    
    const proposedLayout = {
      objects: composedObjects,
      connectors: composedConnectors
    };
    
    console.log(`Layout composed: ${proposedLayout.objects.length} objects, ${proposedLayout.connectors.length} connectors`);
    console.log('[PROGRESS] layout_generation | 100% | Layout generation complete');


    // STEP 3.5: Optional Self-Critique (only in strict mode, resilient to refusals)
    let critiqueResult: any = null;
    
    if (strict) {
      console.log('[PROGRESS] self_critique | 0% | Starting self-critique...');
      console.log('AI self-critique: reviewing layout against reference (strict mode)...');
      
      try {
        const critiquePrompt = `You generated this layout:

PROPOSED LAYOUT:
${JSON.stringify(proposedLayout, null, 2)}

ORIGINAL ANALYSIS (from reference image):
Elements: ${JSON.stringify(analysis.identified_elements.map((e: any) => ({
  name: e.name,
  position_x: e.position_x,
  position_y: e.position_y,
  bounding_box: e.bounding_box
})), null, 2)}

Spatial Analysis: ${JSON.stringify(analysis.spatial_analysis, null, 2)}

Relationships: ${JSON.stringify(analysis.spatial_relationships.length)} connectors expected

TASK: Compare your proposed layout against the reference image and original analysis.

Identify ALL issues with your layout:
1. POSITION ERRORS: Elements not at correct positions (compare to position_x, position_y)
2. SPACING PROBLEMS: Elements too close/far compared to reference
3. ALIGNMENT ISSUES: Elements that should align but don't (check spatial_analysis.alignment)
4. MISSING/WRONG CONNECTORS: Count and verify all relationships
5. SIZE INCONSISTENCIES: Elements scaled incorrectly
6. ROTATION ERRORS: Incorrect rotation angles

Return ONLY JSON:
{
  "overall_accuracy": "excellent|good|fair|poor",
  "issues": [
    {
      "type": "position|spacing|connector|alignment|size|rotation",
      "severity": "critical|moderate|minor",
      "element_or_connector": "name or connector description",
      "problem": "specific issue description",
      "current_value": "what you generated",
      "should_be": "what it should be"
    }
  ],
  "recommended_fixes": [
    {
      "fix_type": "move_object|adjust_spacing|add_connector|remove_connector|adjust_scale|adjust_rotation",
      "target": "element_index or connector indices",
      "action": "specific fix to apply",
      "new_x": 45.5,
      "new_y": 30.2,
      "new_scale": 0.6,
      "reason": "why this fix improves accuracy"
    }
  ],
  "confidence": "high|medium|low"
}`;

        const critiqueResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5',
            messages: [
              { role: 'system', content: 'You are a scientific diagram layout critic. Compare layouts to reference images and identify all discrepancies. Always return valid JSON.' },
              {
                role: 'user',
                content: [
                  { type: 'text', text: critiquePrompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                    }
                  }
                ]
              }
            ],
            response_format: { type: 'json_object' },
            max_completion_tokens: 2000,
          }),
        });

        if (critiqueResponse.ok) {
          const critiqueData = await critiqueResponse.json();
          const critiqueText = critiqueData.choices[0].message.content;
          
          // Check for refusal
          if (critiqueText.toLowerCase().includes("i'm sorry") || 
              critiqueText.toLowerCase().includes("i can't") ||
              critiqueText.toLowerCase().includes("cannot assist")) {
            console.log('Critique refused by AI, skipping critique step');
          } else {
            const critiqueJsonMatch = critiqueText.match(/\{[\s\S]*\}/);
            
            if (critiqueJsonMatch) {
              critiqueResult = JSON.parse(critiqueJsonMatch[0]);
              console.log(`Self-critique complete: ${critiqueResult.overall_accuracy} accuracy`);
              console.log(`  Issues found: ${critiqueResult.issues?.length || 0}`);
              console.log(`  Fixes recommended: ${critiqueResult.recommended_fixes?.length || 0}`);
              
              // Apply automatic fixes to proposedLayout
              if (critiqueResult.recommended_fixes && critiqueResult.recommended_fixes.length > 0) {
                let fixesApplied = 0;
                
                for (const fix of critiqueResult.recommended_fixes) {
                  try {
                    if (fix.fix_type === 'move_object' && fix.target !== undefined) {
                      const objIdx = proposedLayout.objects?.findIndex((o: any) => o.element_index === fix.target);
                      if (objIdx >= 0 && proposedLayout.objects[objIdx]) {
                        if (fix.new_x !== undefined) proposedLayout.objects[objIdx].x = fix.new_x;
                        if (fix.new_y !== undefined) proposedLayout.objects[objIdx].y = fix.new_y;
                        fixesApplied++;
                        console.log(`    Applied fix: moved element ${fix.target} to (${fix.new_x}, ${fix.new_y})`);
                      }
                    } else if (fix.fix_type === 'adjust_scale' && fix.target !== undefined) {
                      const objIdx = proposedLayout.objects?.findIndex((o: any) => o.element_index === fix.target);
                      if (objIdx >= 0 && proposedLayout.objects[objIdx] && fix.new_scale !== undefined) {
                        proposedLayout.objects[objIdx].scale = fix.new_scale;
                        fixesApplied++;
                        console.log(`    Applied fix: adjusted scale of element ${fix.target} to ${fix.new_scale}`);
                      }
                    } else if (fix.fix_type === 'adjust_rotation' && fix.target !== undefined) {
                      const objIdx = proposedLayout.objects?.findIndex((o: any) => o.element_index === fix.target);
                      if (objIdx >= 0 && proposedLayout.objects[objIdx] && fix.new_rotation !== undefined) {
                        proposedLayout.objects[objIdx].rotation = fix.new_rotation;
                        fixesApplied++;
                        console.log(`    Applied fix: adjusted rotation of element ${fix.target}`);
                      }
                    }
                  } catch (fixError) {
                    console.log(`    Failed to apply fix: ${fix.fix_type}`);
                  }
                }
                
                console.log(`  Total fixes applied: ${fixesApplied}`);
              }
            }
          }
        }
      } catch (critiqueError) {
        console.log('Self-critique failed, proceeding without critique:', critiqueError);
      }
      
      console.log('[PROGRESS] self_critique | 100% | Self-critique complete');
    } else {
      console.log('Skipping self-critique (not in strict mode)');
    }

    // STEP 4: Build Deterministic Final Layout
    console.log('[PROGRESS] final_processing | 0% | Building final layout...');
    console.log('Building deterministic final layout...');
    
    // Build objects with strict positioning from analysis (shapes + icons)
    const finalObjects = allElements.map((m) => {
      const x = Math.max(0, Math.min(100, m.element.position_x));
      const y = Math.max(0, Math.min(100, m.element.position_y));
      
      // For shapes
      if (m.element.element_type === 'shape') {
        const proposedObj = proposedLayout.objects?.find((o: any) => o.element_index === m.element_index);
        let width = proposedObj?.width || m.element.bounding_box?.width || 100;
        let height = proposedObj?.height || m.element.bounding_box?.height || 60;
        
        return {
          type: 'shape',
          element_index: m.element_index,
          shape_type: m.element.shape_type || 'rectangle',
          x,
          y,
          width,
          height,
          rotation: m.element.rotation || 0,
          label: m.element.name,
          fill_color: m.element.fill_color || '#E8F5E9',
          stroke_color: m.element.stroke_color || '#2E7D32',
          stroke_width: 2
        };
      }
      
      // For icons
      const proposedObj = proposedLayout.objects?.find((o: any) => o.element_index === m.element_index);
      const chosenIcon = proposedObj?.icon_id && m.matches.find((i: any) => i.id === proposedObj.icon_id)
        ? m.matches.find((i: any) => i.id === proposedObj.icon_id)
        : m.matches[0];

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
      const strictStyle = getConnectorStyle(relType, rel.visual_details);

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
      icons_matched: iconElements.length,
      shapes_identified: shapeElements.length,
      total_objects: finalObjects.length,
      total_connectors: finalConnectors.length,
      avg_position_deviation_percent: avgDeviation,
      connector_styles: connectorStyleBreakdown,
      checks_passed: checks.filter(c => c.status === 'pass').length,
      checks_corrected: checks.filter(c => c.status === 'corrected').length,
      checks_missing: checks.filter(c => c.status === 'missing').length,
      layout_source: 'deterministic',
      self_critique: critiqueResult ? {
        overall_accuracy: critiqueResult.overall_accuracy,
        issues_found: critiqueResult.issues?.length || 0,
        fixes_recommended: critiqueResult.recommended_fixes?.length || 0,
        confidence: critiqueResult.confidence,
        critical_issues: critiqueResult.issues?.filter((i: any) => i.severity === 'critical').length || 0,
        moderate_issues: critiqueResult.issues?.filter((i: any) => i.severity === 'moderate').length || 0,
        minor_issues: critiqueResult.issues?.filter((i: any) => i.severity === 'minor').length || 0
      } : null
    };

    console.log('Final layout complete:', metadata);
    console.log('[PROGRESS] final_processing | 100% | Final layout complete');

    return new Response(
      JSON.stringify({
        analysis,
        proposed_layout: proposedLayout,
        layout: finalLayout,
        checks,
        metadata,
        critique: critiqueResult || null
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
