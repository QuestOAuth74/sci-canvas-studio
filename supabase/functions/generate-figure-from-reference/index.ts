import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize relationship types to canonical forms
function normalizeRelationship(relType: string | undefined): string {
  if (!relType || typeof relType !== 'string') {
    console.log('⚠️ Invalid relationship type:', relType, '- defaulting to "source"');
    return 'source'; // Safe default
  }
  
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
function getConnectorStyle(relType: string | undefined, visualDetails?: any): any {
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
    const lineType = String(visualDetails.line_type).toLowerCase();
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

// Attempt to repair truncated JSON by balancing brackets/braces and removing trailing commas
function tryRepairJsonString(input: string): any | null {
  // Quick bailouts
  if (!input || typeof input !== 'string') return null;

  const removeTrailingCommas = (s: string) => s.replace(/,\s*(?=[}\]])/g, '');

  try {
    return JSON.parse(input);
  } catch {}

  // Enhanced repair logic for connector-specific truncation patterns
  let repaired = input.trim();
  
  // Remove incomplete property at the end (common truncation pattern)
  // Example: {"connectors":[{...},{...},{"from_element":5,"to_el
  repaired = repaired.replace(/,?\s*"[^"]*$/, ''); // Remove incomplete string key
  repaired = repaired.replace(/,?\s*[^,\}\]]*$/, ''); // Remove incomplete value
  
  // Balance brackets/braces using a simple stack
  const stack: string[] = [];
  const openers = new Set(['{', '[']);
  const pairs: Record<string, string> = { '{': '}', '[': ']' };

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (openers.has(ch)) {
      stack.push(ch);
    } else if (ch === '}' || ch === ']') {
      if (stack.length > 0) stack.pop();
    }
  }

  // Remove trailing dangling characters
  repaired = removeTrailingCommas(repaired);
  repaired = repaired.replace(/[,\s]*$/, '');

  // Append missing closers in reverse order
  while (stack.length > 0) {
    const opener = stack.pop()!;
    repaired += pairs[opener];
  }

  // Final cleanup and parse attempt
  repaired = removeTrailingCommas(repaired);
  try {
    const parsed = JSON.parse(repaired);
    // Validate that we have a connectors array
    if (parsed && parsed.connectors && Array.isArray(parsed.connectors)) {
      console.log(`✓ Successfully repaired JSON with ${parsed.connectors.length} connectors`);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
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

    // User is authenticated, proceed with generation

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
    
    // Phase 5: Use image size heuristic instead of AI pre-check (saves 500 tokens)
    let useChunkedMode = false; // Removed chunking mode for simplicity
    let elementCount = 0; // No longer doing pre-count
    
    console.log('[PROGRESS] element_detection | 10% | Starting detailed analysis...');
    
    const elementSystemPrompt = `You are a scientific illustration analysis expert. PASS 1: Analyze elements MINIMAL OUTPUT.

ULTRA-COMPACT JSON REQUIRED. Use SHORT property names:

{
  "e": [
    {
      "n": "name",
      "t": "shape|icon",
      "s": "rect|circle|oval",
      "x": 45.5,
      "y": 30.2,
      "txt": "text visible inside shape (shapes only)",
      "st": ["search", "terms"]
    }
  ]
}

RULES:
- "n" (name): Element name or label text
- "t" (type): "shape" for geometric shapes with text, "icon" for biological/scientific elements
- "s" (shape): ONLY if t="shape". Values: "rect", "circle", "oval"
- "x" (position_x): Horizontal position 0-100%
- "y" (position_y): Vertical position 0-100%
- "txt" (text): ONLY for shapes - actual visible text content
- "st" (search_terms): ONLY for icons - ["specific", "broader", "category"]

CRITICAL LIMITS:
- MAX ${useChunkedMode ? '20' : '40'} elements ${useChunkedMode ? 'in this batch' : 'total'}
- OMIT all optional fields
- NO descriptions, colors, bounding boxes, or extra metadata
- Position accuracy ±2% is critical
- Search terms: most specific first, max 4 terms per icon`;

    const elementUserPrompt = description 
      ? `PASS 1 - Analyze elements and positions in this diagram. User description: "${description}"${useChunkedMode ? ' Return first 20 elements (top-left to center region).' : ''}`
      : `PASS 1 - Analyze all elements and their precise positions.${useChunkedMode ? ' Return first 20 elements (top-left to center region).' : ''}`;

    console.log('[PROGRESS] element_detection | 20% | Analyzing batch 1...');

    const elementResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Phase 1: Switch to gpt-4o-mini (10x cheaper)
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
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_element_analysis',
              description: 'Return ultra-compact element analysis',
              parameters: {
                type: 'object',
                properties: {
                  e: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        n: { type: 'string' },
                        t: { type: 'string', enum: ['shape', 'icon'] },
                        s: { type: 'string', enum: ['rect', 'circle', 'oval'] },
                        x: { type: 'number' },
                        y: { type: 'number' },
                        txt: { type: 'string' },
                        st: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['n', 't', 'x', 'y']
                    }
                  }
                },
                required: ['e']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'return_element_analysis' } },
        max_tokens: 5000, // Phase 1: Increased to handle all elements in one pass
      }),
    });

    if (!elementResponse.ok) {
      const errorText = await elementResponse.text();
      console.error('Pass 1 OpenAI error:', elementResponse.status, errorText);
      
      let errorMsg = 'Element analysis failed';
      if (elementResponse.status === 429) {
        errorMsg = 'Rate limit exceeded. Please try again in a moment.';
      } else if (elementResponse.status === 401) {
        errorMsg = 'OpenAI API key is invalid or missing';
      }
      
      return new Response(JSON.stringify({ 
        error: errorMsg,
        details: `OpenAI returned ${elementResponse.status}`,
        hint: 'Check edge function logs for details'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const elementData = await elementResponse.json();
    console.log('Pass 1 complete');
    
    // Extract JSON from function call arguments (priority), then content (fallback)
    let elementAnalysis = null;
    let parseFailedDueToTruncation = false;
    
    // Strategy 1: Extract from tool_calls (primary for function calling)
    if (elementData.choices[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const args = elementData.choices[0].message.tool_calls[0].function.arguments;
        const parsed = typeof args === 'string' ? JSON.parse(args) : args;
        // Normalize ultra-compact format to standard format
        elementAnalysis = {
          identified_elements: (parsed.e || []).map((el: any) => ({
            name: el.n,
            element_type: el.t,
            shape_type: el.s,
            position_x: el.x,
            position_y: el.y,
            text_content: el.txt,
            search_terms: el.st
          })),
          spatial_analysis: {},
          overall_layout: {}
        };
        console.log('✓ Extracted from tool_calls (ultra-compact)');
      } catch (e) {
        console.log('Failed to parse tool_calls arguments:', e);
        // Attempt repair of truncated JSON from tool_calls
        const argStr = elementData.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
        const repaired = typeof argStr === 'string' ? tryRepairJsonString(argStr) : null;
        if (repaired && repaired.e) {
          elementAnalysis = {
            identified_elements: (repaired.e || []).map((el: any) => ({
              name: el.n,
              element_type: el.t,
              shape_type: el.s,
              position_x: el.x,
              position_y: el.y,
              text_content: el.txt,
              search_terms: el.st
            })),
            spatial_analysis: {},
            overall_layout: {}
          };
          parseFailedDueToTruncation = false;
          console.log('✓ Repaired truncated JSON from tool_calls');
        } else {
          parseFailedDueToTruncation = true; // Likely truncated JSON
        }
      }
    }
    
    // Strategy 2: Extract from legacy function_call (secondary)
    if (!elementAnalysis && elementData.choices[0]?.message?.function_call?.arguments) {
      try {
        const args = elementData.choices[0].message.function_call.arguments;
        const parsed = typeof args === 'string' ? JSON.parse(args) : args;
        elementAnalysis = {
          identified_elements: (parsed.e || []).map((el: any) => ({
            name: el.n,
            element_type: el.t,
            shape_type: el.s,
            position_x: el.x,
            position_y: el.y,
            text_content: el.txt,
            search_terms: el.st
          })),
          spatial_analysis: {},
          overall_layout: {}
        };
        console.log('✓ Extracted from function_call (ultra-compact)');
      } catch (e) {
        console.log('Failed to parse function_call arguments:', e);
        const argStr = elementData.choices[0]?.message?.function_call?.arguments;
        const repaired = typeof argStr === 'string' ? tryRepairJsonString(argStr) : null;
        if (repaired && repaired.e) {
          elementAnalysis = {
            identified_elements: (repaired.e || []).map((el: any) => ({
              name: el.n,
              element_type: el.t,
              shape_type: el.s,
              position_x: el.x,
              position_y: el.y,
              text_content: el.txt,
              search_terms: el.st
            })),
            spatial_analysis: {},
            overall_layout: {}
          };
          parseFailedDueToTruncation = false;
          console.log('✓ Repaired truncated JSON from function_call');
        } else {
          parseFailedDueToTruncation = true;
        }
      }
    }
    
    // Strategy 3: Extract from content (fallback)
    if (!elementAnalysis && elementData.choices[0]?.message?.content) {
      elementAnalysis = extractJSON(elementData.choices[0].message.content);
      if (elementAnalysis) {
        console.log('✓ Extracted from content');
      }
    }
    
    console.log('[PROGRESS] element_detection | 100% | Element analysis complete');
    
    // Phase 1: Removed chunked mode to simplify (single-pass only)

    // Retry logic for PASS 1 if we failed to extract valid JSON
    if (!elementAnalysis || !elementAnalysis.identified_elements) {
      const finishReason = elementData.choices?.[0]?.finish_reason;
      
      if (finishReason === 'length' || parseFailedDueToTruncation) {
        console.log('⚠ Pass 1 hit length limit or truncated JSON. Retrying with higher token limit...');
        console.log(`📊 Current state: Finish reason=${finishReason}, Parse failed=${parseFailedDueToTruncation}`);
        console.log(`📊 Detected element count: ${elementCount}, Using chunked mode: ${useChunkedMode}`);
        
        const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Phase 1: Use cheaper model for retry too
            messages: [
              { 
                role: 'system', 
                content: 'Return function call ONLY. No prose. Strictly minimal JSON. Analyze elements and positions precisely.' 
              },
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
            tools: [
              {
                type: 'function',
                function: {
                  name: 'return_element_analysis',
                  description: 'Return ultra-compact element analysis',
                  parameters: {
                    type: 'object',
                    properties: {
                      e: { type: 'array' }
                    },
                    required: ['e']
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'return_element_analysis' } },
            max_tokens: 4500,
          }),
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          if (retryData.choices[0]?.message?.tool_calls?.[0]?.function?.arguments) {
            try {
              const args = retryData.choices[0].message.tool_calls[0].function.arguments;
              const parsed = typeof args === 'string' ? JSON.parse(args) : args;
              elementAnalysis = {
                identified_elements: (parsed.e || []).map((el: any) => ({
                  name: el.n,
                  element_type: el.t,
                  shape_type: el.s,
                  position_x: el.x,
                  position_y: el.y,
                  text_content: el.txt,
                  search_terms: el.st
                })),
                spatial_analysis: {},
                overall_layout: {}
              };
              console.log('✓ Retry successful - extracted from tool_calls (ultra-compact)');
            } catch (e) {
              console.log('Retry failed to parse tool_calls');
            }
          }
        }
      }
      
      // If still no analysis after retry
      if (!elementAnalysis || !elementAnalysis.identified_elements) {
        console.error('❌ Failed to extract element analysis after retry.');
        console.error('📊 Finish reason:', finishReason);
        console.error('📊 Element count estimate:', elementCount);
        console.error('📊 Chunked mode was:', useChunkedMode);
        console.error('📊 Response preview:', JSON.stringify(elementData).slice(0, 500));
        
        // Provide helpful user guidance based on detected issues
        let userHint = 'Try enabling strict mode, using a smaller/clearer image, or simplifying the reference.';
        let additionalInfo = '';
        
        if (elementCount > 40) {
          userHint = `Your diagram contains approximately ${elementCount} elements, which is very complex. Consider:`;
          additionalInfo = '\n• Breaking it into multiple smaller diagrams (recommended)\n• Simplifying by removing less important elements\n• Using a clearer source image with higher resolution';
        } else if (elementCount > 25) {
          userHint = `Your diagram contains approximately ${elementCount} elements. Try:`;
          additionalInfo = '\n• Using a higher quality source image\n• Ensuring elements are clearly visible and well-separated\n• Enabling strict mode for more thorough processing';
        } else if (finishReason === 'length') {
          userHint = 'The AI response was truncated. Try:';
          additionalInfo = '\n• Using a clearer, higher-contrast image\n• Ensuring the diagram is well-lit and focused\n• Reducing image complexity if possible';
        }
        
        return new Response(JSON.stringify({ 
          error: 'Element analysis incomplete',
          stage: 'element_detection',
          finish_reason: finishReason,
          detected_elements: elementCount > 0 ? elementCount : 'unknown',
          hint: userHint,
          details: additionalInfo.trim(),
          suggestion: 'Please try again with a simpler or clearer diagram.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Log successful element detection with stats
    const detectedCount = elementAnalysis.identified_elements?.length || 0;
    console.log(`✅ Element detection complete: ${detectedCount} elements identified`);
    console.log(`📊 Shapes: ${elementAnalysis.identified_elements.filter((e: any) => e.element_type === 'shape').length}`);
    console.log(`📊 Icons: ${elementAnalysis.identified_elements.filter((e: any) => e.element_type === 'icon').length}`);
    
    // Warn if detected count differs significantly from initial estimate
    if (elementCount > 0 && Math.abs(detectedCount - elementCount) > 10) {
      console.log(`⚠️ Note: Initial estimate was ${elementCount} elements, but detected ${detectedCount}. This is expected for complex diagrams.`);
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
        model: 'gpt-4o-mini',
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
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_connector_analysis',
              description: 'Return the connector analysis with all connectors and their properties',
              parameters: {
                type: 'object',
                properties: {
                  connectors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        from_element: { type: 'number' },
                        to_element: { type: 'number' },
                        relationship_type: { type: 'string' },
                        visual_style: {
                          type: 'object',
                          properties: {
                            line_type: { type: 'string' },
                            line_style: { type: 'string' },
                            thickness: { type: 'string' },
                            color: { type: 'string' }
                          }
                        },
                        markers: {
                          type: 'object',
                          properties: {
                            start: { type: 'string' },
                            end: { type: 'string' }
                          }
                        },
                        routing: { type: 'object' },
                        label: { type: 'string' },
                        label_position: { type: 'string' },
                        directionality: { type: 'string' },
                        justification: { type: 'string' }
                      },
                      required: ['from_element', 'to_element', 'relationship_type']
                    }
                  }
                },
                required: ['connectors']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'return_connector_analysis' } },
        max_tokens: 1500, // Increased from 800 to handle complex diagrams with many connectors
      }),
    });

    if (!connectorResponse.ok) {
      const errorText = await connectorResponse.text();
      console.error('❌ Pass 2 OpenAI error:', connectorResponse.status, errorText);
      console.error('📊 Elements being analyzed:', elementAnalysis.identified_elements?.length || 0);
      
      let errorMsg = 'Connector analysis failed';
      if (connectorResponse.status === 429) {
        errorMsg = 'Rate limit exceeded. Please try again in a moment.';
      } else if (connectorResponse.status === 401) {
        errorMsg = 'OpenAI API key is invalid or missing';
      }
      
      return new Response(JSON.stringify({ 
        error: errorMsg,
        stage: 'connector_analysis',
        details: `OpenAI returned ${connectorResponse.status}`,
        hint: 'Check edge function logs for details. Element detection was successful.',
        elements_detected: elementAnalysis.identified_elements?.length || 0
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const connectorData = await connectorResponse.json();
    console.log('✅ Pass 2 complete');
    console.log('[PROGRESS] connector_analysis | 100% | Connector analysis complete');
    
    // Log finish_reason to detect truncation
    const finishReason = connectorData.choices?.[0]?.finish_reason;
    console.log(`🔍 Finish reason: ${finishReason}`);
    if (finishReason === 'length') {
      console.log('⚠️ WARNING: Response was truncated due to token limit. Attempting to salvage partial data...');
    }
    
    // Phase 4: Simplified connector extraction (no retry logic)
    let connectorAnalysis = null;
    
    // Extract from tool_calls
    if (connectorData.choices[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const args = connectorData.choices[0].message.tool_calls[0].function.arguments;
        connectorAnalysis = typeof args === 'string' ? JSON.parse(args) : args;
        console.log('✓ Extracted from tool_calls');
      } catch (e) {
        console.log('Failed to parse tool_calls arguments:', e);
        // Log preview of truncated JSON for debugging
        const argStr = connectorData.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (typeof argStr === 'string') {
          console.log(`📝 Truncated JSON preview (last 200 chars): ...${argStr.slice(-200)}`);
        }
        // Try repair with enhanced logic
        const repaired = typeof argStr === 'string' ? tryRepairJsonString(argStr) : null;
        if (repaired && repaired.connectors) {
          connectorAnalysis = repaired;
          console.log(`✓ Repaired truncated JSON from tool_calls - salvaged ${repaired.connectors.length} connectors`);
        }
      }
    }
    
    // Fallback: Extract from content
    if (!connectorAnalysis && connectorData.choices[0]?.message?.content) {
      connectorAnalysis = extractJSON(connectorData.choices[0].message.content);
      if (connectorAnalysis) {
        console.log('✓ Extracted from content');
      }
    }
    
    // If still no analysis, proceed with empty connectors
    if (!connectorAnalysis || !connectorAnalysis.connectors) {
      console.log('⚠️ Connector analysis failed, proceeding with empty connectors array');
      connectorAnalysis = { connectors: [] };
    }
    
    // Log successful connector detection
    if (connectorAnalysis && connectorAnalysis.connectors) {
      const connectorCount = connectorAnalysis.connectors?.length || 0;
      console.log(`✅ Connector analysis complete: ${connectorCount} connectors identified`);
    }

    // Merge analyses into final structure
    const analysis = {
      identified_elements: elementAnalysis.identified_elements,
      spatial_relationships: connectorAnalysis.connectors.map((c: any) => ({
        from_element: c.from_element,
        to_element: c.to_element,
        relationship_type: c.relationship_type || 'source', // Default to 'source' if undefined
        connector_style: c.visual_style?.line_style || 'solid',
        directionality: c.directionality || 'unidirectional',
        label: c.label || '',
        justification: c.justification || '',
        visual_details: c.visual_style || {},
        markers: c.markers || { start: 'none', end: 'arrow' },
        routing: c.routing || { path_description: 'direct' }
      })),
      spatial_analysis: elementAnalysis.spatial_analysis,
      overall_layout: elementAnalysis.overall_layout
    };

    console.log(`✅ Analysis complete: ${analysis.identified_elements.length} elements, ${analysis.spatial_relationships.length} connectors`);
    console.log(`📊 Total detected: ${detectedCount} elements (${elementAnalysis.identified_elements.filter((e: any) => e.element_type === 'shape').length} shapes, ${elementAnalysis.identified_elements.filter((e: any) => e.element_type === 'icon').length} icons)`);

    // STEP 2A: Phase 2 - Deterministic Search Term Generation (NO AI - saves 2,250 tokens)
    console.log('[PROGRESS] search_term_generation | 0% | Generating search terms...');
    console.log('Generating search terms deterministically...');
    
    function generateSearchTerms(name: string | undefined, category: string | undefined = ''): string[] {
      const terms: string[] = [];
      
      // Safety check: handle undefined or null values
      if (!name || typeof name !== 'string') {
        console.log('⚠️ Invalid name for search term generation:', name);
        return category && typeof category === 'string' ? [category.toLowerCase()] : ['unknown'];
      }
      
      const nameLower = name.toLowerCase();
      
      // Add the original name
      terms.push(nameLower);
      
      // Extract keywords from name
      const words = nameLower.split(/[\s\-_()]+/).filter(w => w.length > 2);
      terms.push(...words);
      
      // Add biological synonyms based on keywords
      const synonymMap: Record<string, string[]> = {
        'receptor': ['protein', 'membrane', 'gpcr', 'channel'],
        'enzyme': ['protein', 'catalytic', 'kinase'],
        'cell': ['cellular', 'organelle'],
        'protein': ['molecule', 'factor'],
        'gene': ['dna', 'sequence'],
        'rna': ['mrna', 'transcript'],
        'antibody': ['immunoglobulin', 'immune'],
        'virus': ['viral', 'pathogen'],
        'bacteria': ['bacterial', 'microbe']
      };
      
      for (const [key, synonyms] of Object.entries(synonymMap)) {
        if (nameLower.includes(key)) {
          terms.push(...synonyms);
        }
      }
      
      // Add category if provided
      if (category && typeof category === 'string') {
        terms.push(category.toLowerCase());
      }
      
      // Deduplicate and return top 5
      return [...new Set(terms)].slice(0, 5);
    }
    
    const elementsWithAISearchTerms = analysis.identified_elements.map((element: any, idx: number) => {
      // Skip search term generation for shape elements
      if (element.element_type === 'shape') {
        console.log(`[${idx}] Skipping search for shape: ${element.name}`);
        return { ...element, element_type: 'shape', ai_search_terms: [], search_confidence: 'n/a' };
      }
      
      const searchTerms = element.search_terms?.length > 0 
        ? element.search_terms 
        : generateSearchTerms(element.name, element.category);
      
      return { ...element, ai_search_terms: searchTerms, search_confidence: 'deterministic' };
    });

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
        const searchTerms = element.ai_search_terms || element.search_terms || [element.name || ''];
        const safeName = (element.name || '').toString().toLowerCase();
        const safeCategory = (element.category || '').toString().toLowerCase();
        const isReceptor = safeName.includes('receptor') || 
                          safeCategory.includes('receptor') ||
                          searchTerms.some((term: string) => {
                            const t = (term || '').toString().toLowerCase();
                            return t.includes('receptor') || t.includes('gpcr') || t.includes('membrane') || t.includes('channel');
                          });
        
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

    // STEP 2C: Phase 3 - Score-Based Icon Verification (saves ~1,950 tokens)
    console.log('[PROGRESS] icon_verification | 0% | Verifying icon matches...');
    console.log('Verifying icon matches with score-based ranking...');
    
    function calculateMatchScore(iconName: string | undefined, iconCategory: string | undefined, elementName: string | undefined, searchTerms: string[] | undefined): number {
      // Safety checks for undefined values
      if (!iconName || typeof iconName !== 'string') return 0;
      if (!iconCategory || typeof iconCategory !== 'string') iconCategory = '';
      if (!elementName || typeof elementName !== 'string') return 0;
      if (!searchTerms || !Array.isArray(searchTerms)) searchTerms = [];
      
      const iconNameLower = iconName.toLowerCase();
      const iconCategoryLower = iconCategory.toLowerCase();
      const elementNameLower = elementName.toLowerCase();
      
      let score = 0;
      
      // Exact name match
      if (iconNameLower === elementNameLower) {
        score += 100;
      } else if (iconNameLower.includes(elementNameLower) || elementNameLower.includes(iconNameLower)) {
        score += 80;
      }
      
      // Search term matches
      let termMatches = 0;
      for (const term of searchTerms) {
        if (!term || typeof term !== 'string') continue; // Skip invalid terms
        const termLower = term.toLowerCase();
        if (iconNameLower.includes(termLower)) {
          termMatches++;
          score += 15;
        }
        if (iconCategoryLower.includes(termLower)) {
          termMatches++;
          score += 10;
        }
      }
      
      // Bonus for matching all terms
      if (searchTerms.length > 0 && termMatches >= searchTerms.length) {
        score += 20;
      }
      
      // Category match bonus
      if (iconCategoryLower && iconCategoryLower === elementNameLower) {
        score += 30;
      }
      
      return score;
    }
    
    const verifiedMatches = iconMatches.map((match) => {
      if (match.matches.length === 0) {
        return match;
      }

      if (match.matches.length === 1) {
        console.log(`  [${match.element_index}] Only 1 match, using it directly`);
        return match;
      }

      // Score all matches
      const scoredMatches = match.matches.map((icon: any) => ({
        ...icon,
        score: calculateMatchScore(icon.name, icon.category, match.element.name, match.element.ai_search_terms || [])
      }));
      
      // Sort by score (highest first)
      scoredMatches.sort((a: any, b: any) => b.score - a.score);
      
      console.log(`  [${match.element_index}] Top match: "${scoredMatches[0].name}" (score: ${scoredMatches[0].score})`);
      
      // Phase 3: Only use AI verification if top 2 scores are within 10 points (rare case)
      const topTwo = scoredMatches.slice(0, 2);
      if (topTwo.length === 2 && Math.abs(topTwo[0].score - topTwo[1].score) <= 10) {
        console.log(`    Scores are close (${topTwo[0].score} vs ${topTwo[1].score}), may need AI verification in future`);
        // For now, just use the top score
      }
      
      return {
        ...match,
        matches: scoredMatches.slice(0, 5),
        verification: {
          confidence: scoredMatches[0].score >= 80 ? 'high' : scoredMatches[0].score >= 50 ? 'medium' : 'low',
          reasoning: `Score-based ranking: ${scoredMatches[0].score} points`
        }
      };
    });

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
    
    // Phase 6: Skip critique for simple diagrams (<10 elements)
    if (strict && allElements.length >= 10) {
      console.log('[PROGRESS] self_critique | 0% | Starting self-critique...');
      console.log('AI self-critique: reviewing layout against reference (strict mode)...');
      
      try {
        // Phase 6: Simplified critique prompt to reduce tokens
        const critiquePrompt = `Compare the proposed layout to the reference image. Check ONLY position accuracy and connector count.

ELEMENTS (expected positions):
${analysis.identified_elements.map((e: any, i: number) => `${i}: ${e.name} at (${e.position_x}, ${e.position_y})`).join('\n')}

PROPOSED POSITIONS:
${proposedLayout.objects?.map((o: any, i: number) => `${i}: at (${o.x}, ${o.y})`).join('\n')}

CONNECTORS: Expected ${analysis.spatial_relationships.length}, proposed ${proposedLayout.connectors?.length || 0}

Return JSON:
{
  "overall_accuracy": "excellent|good|fair|poor",
  "issues": [{"type": "position|connector", "severity": "critical|moderate|minor", "element_or_connector": "name", "problem": "brief"}],
  "recommended_fixes": [{"fix_type": "move_object", "target": 0, "new_x": 45, "new_y": 30, "reason": "brief"}],
  "confidence": "high|medium|low"
}`;

        const critiqueResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
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
            max_tokens: 400, // Phase 6: Reduced tokens for self-critique
          }),
        });

        if (critiqueResponse.ok) {
          const critiqueData = await critiqueResponse.json();
          const critiqueTextRaw = critiqueData.choices?.[0]?.message?.content ?? '';
          const critiqueText = typeof critiqueTextRaw === 'string' ? critiqueTextRaw : '';
          
          // Check for refusal (safely)
          const lower = critiqueText.toLowerCase();
          if (lower.includes("i'm sorry") || lower.includes("i can't") || lower.includes('cannot assist')) {
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
    } else if (strict && allElements.length < 10) {
      console.log('Skipping self-critique (diagram too simple - less than 10 elements)');
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
