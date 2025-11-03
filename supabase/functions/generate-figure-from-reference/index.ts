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

// Attempt to repair truncated JSON by balancing brackets/braces and removing trailing commas
function tryRepairJsonString(input: string): any | null {
  // Quick bailouts
  if (!input || typeof input !== 'string') return null;

  const removeTrailingCommas = (s: string) => s.replace(/,\s*(?=[}\]])/g, '');

  try {
    return JSON.parse(input);
  } catch {}

  // Balance brackets/braces using a simple stack
  const stack: string[] = [];
  const openers = new Set(['{', '[']);
  const pairs: Record<string, string> = { '{': '}', '[': ']' };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (openers.has(ch)) {
      stack.push(ch);
    } else if (ch === '}' || ch === ']') {
      if (stack.length > 0) stack.pop();
    }
  }

  let repaired = removeTrailingCommas(input.trim());
  // Remove trailing dangling characters that often appear after truncation
  repaired = repaired.replace(/[,\s]*$/, '');

  // Append missing closers in reverse order
  while (stack.length > 0) {
    const opener = stack.pop()!;
    repaired += pairs[opener];
  }

  // Final cleanup and parse attempt
  repaired = removeTrailingCommas(repaired);
  try {
    return JSON.parse(repaired);
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
    
    // Phase 3: Adaptive element count check
    const countSystemPrompt = `Count total elements in this diagram. Return ONLY a number.
    
Count all distinct elements: shapes with text, biological icons, proteins, molecules, cells, organs, etc.
Do not count connectors/arrows/lines.

Return format: { "count": number }`;

    const countResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: countSystemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'How many distinct elements are in this diagram?' },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 50,
      }),
    });

    let elementCount = 0;
    let useChunkedMode = false;

    if (countResponse.ok) {
      try {
        const countData = await countResponse.json();
        const content = countData.choices[0]?.message?.content || '0';
        const match = content.match(/\d+/);
        if (match) {
          elementCount = parseInt(match[0]);
          useChunkedMode = elementCount > 25;
          console.log(`📊 Detected ${elementCount} elements. Chunked mode: ${useChunkedMode}`);
        }
      } catch (e) {
        console.log('Element count check failed, proceeding with standard mode');
      }
    }

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
        model: 'gpt-4o',
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
        max_tokens: 3500,
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

    // Phase 3: Chunked mode - fetch remaining elements if needed
    if (useChunkedMode && elementAnalysis && elementAnalysis.identified_elements) {
      console.log('[PROGRESS] element_detection | 50% | Fetching remaining elements...');
      
      const batch2UserPrompt = `PASS 1 CONTINUED - Analyze REMAINING elements not yet captured. Focus on center-right to bottom-right regions. Return next 20 elements.${description ? ` Context: "${description}"` : ''}`;
      
      const batch2Response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: elementSystemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: batch2UserPrompt },
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
          max_tokens: 3500,
        }),
      });

      if (batch2Response.ok) {
        const batch2Data = await batch2Response.json();
        if (batch2Data.choices[0]?.message?.tool_calls?.[0]?.function?.arguments) {
          try {
            const args = batch2Data.choices[0].message.tool_calls[0].function.arguments;
            const parsed = typeof args === 'string' ? JSON.parse(args) : args;
            const batch2Elements = (parsed.e || []).map((el: any) => ({
              name: el.n,
              element_type: el.t,
              shape_type: el.s,
              position_x: el.x,
              position_y: el.y,
              text_content: el.txt,
              search_terms: el.st
            }));
            
            // Merge batch 2 with batch 1, removing duplicates based on position
            const existingPositions = new Set(
              elementAnalysis.identified_elements.map((e: any) => `${Math.round(e.position_x)},${Math.round(e.position_y)}`)
            );
            
            const newElements = batch2Elements.filter((el: any) => {
              const posKey = `${Math.round(el.position_x)},${Math.round(el.position_y)}`;
              return !existingPositions.has(posKey);
            });
            
            elementAnalysis.identified_elements.push(...newElements);
            console.log(`✓ Merged batch 2: added ${newElements.length} new elements (total: ${elementAnalysis.identified_elements.length})`);
          } catch (e) {
            console.log('Failed to parse batch 2, continuing with batch 1 only');
          }
        }
      }
      
      console.log('[PROGRESS] element_detection | 100% | All batches complete');
    }

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
            model: 'gpt-4o',
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
        max_tokens: 1200,
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
    
    // Extract JSON from function call arguments (priority), then content (fallback)
    let connectorAnalysis = null;
    let connectorParseFailedDueToTruncation = false;
    
    // Strategy 1: Extract from tool_calls (primary for function calling)
    if (connectorData.choices[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const args = connectorData.choices[0].message.tool_calls[0].function.arguments;
        connectorAnalysis = typeof args === 'string' ? JSON.parse(args) : args;
        console.log('✓ Extracted from tool_calls');
      } catch (e) {
        console.log('Failed to parse tool_calls arguments:', e);
        const argStr = connectorData.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
        const repaired = typeof argStr === 'string' ? tryRepairJsonString(argStr) : null;
        if (repaired) {
          connectorAnalysis = repaired;
          connectorParseFailedDueToTruncation = false;
          console.log('✓ Repaired truncated JSON from tool_calls');
        } else {
          connectorParseFailedDueToTruncation = true;
        }
      }
    }
    
    // Strategy 2: Extract from legacy function_call (secondary)
    if (!connectorAnalysis && connectorData.choices[0]?.message?.function_call?.arguments) {
      try {
        const args = connectorData.choices[0].message.function_call.arguments;
        connectorAnalysis = typeof args === 'string' ? JSON.parse(args) : args;
        console.log('✓ Extracted from function_call');
      } catch (e) {
        console.log('Failed to parse function_call arguments:', e);
        const argStr = connectorData.choices[0]?.message?.function_call?.arguments;
        const repaired = typeof argStr === 'string' ? tryRepairJsonString(argStr) : null;
        if (repaired) {
          connectorAnalysis = repaired;
          connectorParseFailedDueToTruncation = false;
          console.log('✓ Repaired truncated JSON from function_call');
        } else {
          connectorParseFailedDueToTruncation = true;
        }
      }
    }
    
    // Strategy 3: Extract from content (fallback)
    if (!connectorAnalysis && connectorData.choices[0]?.message?.content) {
      connectorAnalysis = extractJSON(connectorData.choices[0].message.content);
      if (connectorAnalysis) {
        console.log('✓ Extracted from content');
      }
    }
    
    console.log('[PROGRESS] connector_analysis | 100% | Connector analysis complete');

    // Retry logic for PASS 2 if we failed to extract valid JSON
    if (!connectorAnalysis || !connectorAnalysis.connectors) {
      const finishReason = connectorData.choices?.[0]?.finish_reason;
      
      if (finishReason === 'length' || connectorParseFailedDueToTruncation) {
        console.log('⚠ Pass 2 hit length limit or truncated JSON. Retrying with higher token limit...');
        
        const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'Return function call ONLY. No prose. Analyze connectors between elements.' 
              },
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
                  description: 'Return connector analysis',
                  parameters: {
                    type: 'object',
                    properties: {
                      connectors: { type: 'array' }
                    },
                    required: ['connectors']
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'return_connector_analysis' } },
            max_tokens: 1500,
          }),
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          if (retryData.choices[0]?.message?.tool_calls?.[0]?.function?.arguments) {
            try {
              const args = retryData.choices[0].message.tool_calls[0].function.arguments;
              connectorAnalysis = typeof args === 'string' ? JSON.parse(args) : args;
              console.log('✓ Retry successful - extracted from tool_calls');
            } catch (e) {
              console.log('Retry failed to parse tool_calls');
            }
          }
        }
      }
      
      // If still no analysis after retry
      if (!connectorAnalysis || !connectorAnalysis.connectors) {
        console.error('❌ Failed to extract connector analysis after retry.');
        console.error('📊 Finish reason:', finishReason);
        console.error('📊 Elements detected:', elementAnalysis.identified_elements?.length || 0);
        console.error('📊 Response preview:', JSON.stringify(connectorData).slice(0, 500));
        
        // Provide fallback with empty connectors rather than failing
        console.log('⚠️ Proceeding with empty connectors array as fallback');
        connectorAnalysis = { connectors: [] };
      }
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
              max_tokens: 150,
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
              max_tokens: 150,
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
            max_tokens: 600,
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
