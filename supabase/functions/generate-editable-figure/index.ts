import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EditableFigureRequest {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
}

interface FigureElement {
  id: string;
  type: 'icon' | 'arrow' | 'shape' | 'text' | 'connector';
  label: string;
  svgContent: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  metadata?: Record<string, unknown>;
}

interface EditableFigureResponse {
  success: boolean;
  elements?: FigureElement[];
  error?: string;
  rawSvg?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { prompt, style } = await req.json() as EditableFigureRequest;

    console.log(`[generate-editable-figure] Prompt: ${prompt.substring(0, 100)}..., Style: ${style}`);

    const styleDescription = getStyleDescription(style);

    // Prompt AI to generate a structured SVG with semantic groups
    const systemPrompt = `You are a scientific illustration expert that creates EDITABLE scientific figures as structured SVG.

CRITICAL: Your output MUST be a single valid SVG that contains semantic groups for each element.

STRUCTURE REQUIREMENTS:
1. Each distinct element (icon, arrow, shape, label) must be wrapped in a <g> group
2. Each group MUST have these attributes:
   - id: unique identifier like "element-1", "element-2", etc.
   - data-type: one of "icon", "arrow", "shape", "text", "connector"
   - data-label: descriptive name like "cell", "mitochondria", "nucleus", etc.
3. Arrows/connectors should have:
   - data-from: id of source element
   - data-to: id of target element

VISUAL STYLE:
${styleDescription}

OUTPUT FORMAT:
Return ONLY a valid SVG document. No markdown, no explanation, just the SVG.

Example structure:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <g id="element-1" data-type="icon" data-label="cell">
    <circle cx="100" cy="100" r="50" fill="#4A90D9"/>
  </g>
  <g id="element-2" data-type="arrow" data-label="signal" data-from="element-1" data-to="element-3">
    <path d="M150 100 L250 100" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  </g>
  <g id="element-3" data-type="icon" data-label="nucleus">
    <circle cx="300" cy="100" r="40" fill="#7B68EE"/>
  </g>
</svg>`;

    const userPrompt = `Create an editable scientific figure for: ${prompt}

Requirements:
- Include all relevant biological/scientific elements
- Use clear semantic grouping for each component
- Add arrows/connectors between related elements
- Position elements logically with proper spacing
- Make each element separately selectable and editable`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-editable-figure] API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Rate limits exceeded, please try again later." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Payment required, please add funds to your workspace." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    console.log('[generate-editable-figure] Raw response length:', content.length);

    // Extract SVG from response
    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) {
      console.error('[generate-editable-figure] No SVG found in response:', content.substring(0, 500));
      throw new Error('No valid SVG found in AI response');
    }

    const rawSvg = svgMatch[0];

    // Parse the SVG to extract elements
    const elements = parseStructuredSVG(rawSvg);

    console.log(`[generate-editable-figure] Parsed ${elements.length} elements from SVG`);

    return new Response(
      JSON.stringify({
        success: true,
        elements,
        rawSvg,
      } as EditableFigureResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[generate-editable-figure] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getStyleDescription(style: 'flat' | '3d' | 'sketch'): string {
  switch (style) {
    case 'flat':
      return 'Flat vector style: Use solid, uniform colors without gradients. Clean geometric shapes with sharp edges. Distinct color blocks (#4A90D9 blues, #7B68EE purples, #50C878 greens, #FF6B6B reds). No shadows or textures.';
    case '3d':
      return '3D rendered style: Use gradients and subtle shadows for depth. Include highlights and shading. Rich color palette with depth variation.';
    case 'sketch':
      return 'Hand-drawn sketch style: Use stroke-based rendering with visible lines. Hatching for shading. Pencil-like aesthetic with mostly grayscale or muted colors.';
    default:
      return 'Clean, professional scientific illustration style.';
  }
}

function parseStructuredSVG(svgContent: string): FigureElement[] {
  const elements: FigureElement[] = [];
  
  // Match all group elements with data attributes
  const groupRegex = /<g\s+([^>]*?)>([\s\S]*?)<\/g>/gi;
  let match;
  
  while ((match = groupRegex.exec(svgContent)) !== null) {
    const attributes = match[1];
    const content = match[2];
    
    // Extract attributes
    const id = extractAttribute(attributes, 'id');
    const dataType = extractAttribute(attributes, 'data-type');
    const dataLabel = extractAttribute(attributes, 'data-label');
    const dataFrom = extractAttribute(attributes, 'data-from');
    const dataTo = extractAttribute(attributes, 'data-to');
    
    if (!id) continue;
    
    // Calculate bounding box from content
    const bbox = estimateBoundingBox(content);
    
    const element: FigureElement = {
      id,
      type: (dataType as FigureElement['type']) || 'shape',
      label: dataLabel || id,
      svgContent: content.trim(),
      position: { x: bbox.x, y: bbox.y },
      size: { width: bbox.width, height: bbox.height },
      metadata: {},
    };
    
    if (dataFrom) element.metadata!.from = dataFrom;
    if (dataTo) element.metadata!.to = dataTo;
    
    elements.push(element);
  }
  
  return elements;
}

function extractAttribute(attributeString: string, name: string): string | null {
  const regex = new RegExp(`${name}=["']([^"']*)["']`, 'i');
  const match = attributeString.match(regex);
  return match ? match[1] : null;
}

function estimateBoundingBox(svgContent: string): { x: number; y: number; width: number; height: number } {
  // Try to extract position from common attributes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  // Match common positioning attributes
  const cxMatch = svgContent.match(/cx=["']?(\d+(?:\.\d+)?)/);
  const cyMatch = svgContent.match(/cy=["']?(\d+(?:\.\d+)?)/);
  const rMatch = svgContent.match(/\br=["']?(\d+(?:\.\d+)?)/);
  const xMatch = svgContent.match(/\bx=["']?(\d+(?:\.\d+)?)/);
  const yMatch = svgContent.match(/\by=["']?(\d+(?:\.\d+)?)/);
  const widthMatch = svgContent.match(/width=["']?(\d+(?:\.\d+)?)/);
  const heightMatch = svgContent.match(/height=["']?(\d+(?:\.\d+)?)/);
  
  // Handle circles
  if (cxMatch && cyMatch) {
    const cx = parseFloat(cxMatch[1]);
    const cy = parseFloat(cyMatch[1]);
    const r = rMatch ? parseFloat(rMatch[1]) : 20;
    
    minX = Math.min(minX, cx - r);
    minY = Math.min(minY, cy - r);
    maxX = Math.max(maxX, cx + r);
    maxY = Math.max(maxY, cy + r);
  }
  
  // Handle rects and other shapes
  if (xMatch && yMatch) {
    const x = parseFloat(xMatch[1]);
    const y = parseFloat(yMatch[1]);
    const w = widthMatch ? parseFloat(widthMatch[1]) : 50;
    const h = heightMatch ? parseFloat(heightMatch[1]) : 50;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }
  
  // Handle paths - extract from d attribute
  const pathMatch = svgContent.match(/d=["']([^"']*)/);
  if (pathMatch) {
    const pathData = pathMatch[1];
    const numberRegex = /[-]?\d+(?:\.\d+)?/g;
    const numbers = pathData.match(numberRegex);
    if (numbers && numbers.length >= 2) {
      for (let i = 0; i < numbers.length; i += 2) {
        const x = parseFloat(numbers[i]);
        const y = i + 1 < numbers.length ? parseFloat(numbers[i + 1]) : 0;
        if (!isNaN(x) && !isNaN(y)) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
  }
  
  // Default fallback
  if (!isFinite(minX)) minX = 0;
  if (!isFinite(minY)) minY = 0;
  if (!isFinite(maxX)) maxX = 100;
  if (!isFinite(maxY)) maxY = 100;
  
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 20),
    height: Math.max(maxY - minY, 20),
  };
}
