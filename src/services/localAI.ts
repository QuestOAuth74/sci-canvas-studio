/**
 * Local AI Service - Hugging Face-first approach for biomedical figure generation
 *
 * Priority: Hugging Face (BioMistral, BioGPT, SciSketch) → Gemini fallback
 *
 * Supported Hugging Face models:
 * - BioMistral/BioMistral-7B: Medical LLM trained on PubMed Central
 * - microsoft/BioGPT: GPT-2 pretrained on 15M PubMed abstracts
 * - stevensu123/FlanT5PhraseGeneration: SciSketch for biomedical phrases
 */

import { supabase } from '@/integrations/supabase/client';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const HUGGINGFACE_API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_TOKEN || '';

// Hugging Face Model Configuration (using new Inference Providers API)
const HF_MODELS = {
  // Primary: Llama 3.2 - works on free tier, good for biomedical analysis
  LLAMA: 'meta-llama/Llama-3.2-3B-Instruct',
  // Alternative: Qwen - good multilingual support
  QWEN: 'Qwen/Qwen2.5-7B-Instruct',
  // SciSketch: Specialized for scientific phrase extraction (legacy endpoint)
  SCISKETCH: 'stevensu123/FlanT5PhraseGeneration',
};

// Current model preference - Llama 3.2 works well on free tier
const PREFERRED_HF_MODEL = HF_MODELS.LLAMA;

// Legacy alias for SciSketch
const SCISKETCH_MODEL_URL = `https://api-inference.huggingface.co/models/${HF_MODELS.SCISKETCH}`;
const SCISKETCH_API_TOKEN = HUGGINGFACE_API_TOKEN;

// Check if Hugging Face is available
export const isHuggingFaceEnabled = () => !!HUGGINGFACE_API_TOKEN;
export const isSciSketchEnabled = isHuggingFaceEnabled; // Alias for compatibility

// Cache for available icons (basic list for fallback)
let cachedIcons: Array<{ id: string; name: string; category: string }> | null = null;

/**
 * Fetch available icons from the database for AI to reference
 */
async function fetchAvailableIcons(): Promise<Array<{ id: string; name: string; category: string }>> {
  if (cachedIcons) {
    console.log(`[IconCache] Using cached ${cachedIcons.length} icons`);
    return cachedIcons;
  }

  try {
    console.log('[IconCache] Fetching icons from database...');
    const { data, error } = await supabase
      .from('icons')
      .select('id, name, category')
      .order('name')
      .limit(2000); // Increased limit for better coverage

    if (error) {
      console.error('[IconCache] Failed to fetch icons:', error);
      return [];
    }

    cachedIcons = data || [];
    console.log(`[IconCache] ✓ Cached ${cachedIcons.length} icons for AI reference`);

    // Log sample icons for debugging
    if (cachedIcons.length > 0) {
      const categories = [...new Set(cachedIcons.map(i => i.category))];
      console.log(`[IconCache] Categories: ${categories.slice(0, 10).join(', ')}${categories.length > 10 ? '...' : ''}`);
      console.log(`[IconCache] Sample icons:`, cachedIcons.slice(0, 20).map(i => i.name).join(', '));
    }

    return cachedIcons;
  } catch (e) {
    console.error('[IconCache] Error fetching icons:', e);
    return [];
  }
}

/**
 * Search for an icon directly in the database by concept
 * Uses multiple strategies for better matching
 */
async function searchIconInDatabase(concept: string): Promise<{ id: string; name: string; category: string } | null> {
  if (!concept || concept.length < 2) return null;

  const conceptLower = concept.toLowerCase().trim();
  const conceptClean = conceptLower.replace(/[^a-z0-9]/g, ''); // Remove special chars

  try {
    console.log(`[IconSearch] Searching database for: "${concept}"`);

    // Strategy 1: Direct name search with ilike
    let { data, error } = await supabase
      .from('icons')
      .select('id, name, category')
      .ilike('name', `%${conceptLower}%`)
      .limit(15);

    if (error) {
      console.error(`[IconSearch] Database error for "${concept}":`, error);
      return null;
    }

    // Strategy 2: If no results, try category search
    if (!data || data.length === 0) {
      console.log(`[IconSearch] No name match, trying category search for: "${concept}"`);
      const catResult = await supabase
        .from('icons')
        .select('id, name, category')
        .ilike('category', `%${conceptLower}%`)
        .limit(10);

      if (!catResult.error && catResult.data && catResult.data.length > 0) {
        data = catResult.data;
        console.log(`[IconSearch] Found ${data.length} icons in category matching "${concept}"`);
      }
    }

    // Strategy 3: Try without hyphens/underscores (e.g., "dna-helix" vs "dnahelix")
    if (!data || data.length === 0) {
      const altResult = await supabase
        .from('icons')
        .select('id, name, category')
        .or(`name.ilike.%${conceptClean}%,name.ilike.%${conceptLower.replace(/\s+/g, '-')}%,name.ilike.%${conceptLower.replace(/\s+/g, '_')}%`)
        .limit(10);

      if (!altResult.error && altResult.data && altResult.data.length > 0) {
        data = altResult.data;
        console.log(`[IconSearch] Found ${data.length} icons with alternate pattern for "${concept}"`);
      }
    }

    if (!data || data.length === 0) {
      console.log(`[IconSearch] No icons found for: "${concept}"`);
      return null;
    }

    console.log(`[IconSearch] Found ${data.length} candidates for "${concept}":`, data.map(i => i.name).join(', '));

    // Score and rank matches
    const scored = data.map(icon => {
      const nameLower = icon.name.toLowerCase();
      let score = 0;

      // Exact match = highest score
      if (nameLower === conceptLower) score = 100;
      // Starts with concept
      else if (nameLower.startsWith(conceptLower)) score = 80;
      // Starts with concept + separator
      else if (nameLower.startsWith(conceptLower + '-') || nameLower.startsWith(conceptLower + '_')) score = 75;
      // Contains concept as word
      else if (new RegExp(`(^|[^a-z])${conceptLower}([^a-z]|$)`).test(nameLower)) score = 60;
      // Contains concept
      else if (nameLower.includes(conceptLower)) score = 40;
      // Category match
      else if (icon.category?.toLowerCase().includes(conceptLower)) score = 30;
      // Partial match
      else score = 10;

      // Bonus for shorter names (more specific)
      if (nameLower.length < 20) score += 5;

      return { ...icon, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    console.log(`[IconSearch] ✓ Best match: "${best.name}" (score: ${best.score}, id: ${best.id})`);

    return { id: best.id, name: best.name, category: best.category };

  } catch (e) {
    console.error(`[IconSearch] Error searching icon for "${concept}":`, e);
    return null;
  }
}

/**
 * Find best matching icon for a concept
 * Improved matching for biomedical terms
 */
function findMatchingIcon(
  concept: string,
  icons: Array<{ id: string; name: string; category: string }>
): { id: string; name: string; category: string } | null {
  if (!concept || !icons.length) return null;

  const conceptLower = concept.toLowerCase().trim();

  // Filter out icons with very short names (likely not useful)
  const validIcons = icons.filter(i => i.name.length >= 3);

  // 1. Try exact match first
  const exact = validIcons.find(i => i.name.toLowerCase() === conceptLower);
  if (exact) return exact;

  // 2. Try icon name starts with concept (e.g., "dna" matches "dna-double-helix")
  const startsWithConcept = validIcons.find(i =>
    i.name.toLowerCase().startsWith(conceptLower + '-') ||
    i.name.toLowerCase().startsWith(conceptLower + '_') ||
    i.name.toLowerCase().startsWith(conceptLower + ' ')
  );
  if (startsWithConcept) return startsWithConcept;

  // 3. Try icon name contains concept as whole word
  const containsWholeWord = validIcons.find(i => {
    const nameLower = i.name.toLowerCase();
    const regex = new RegExp(`(^|[^a-z])${conceptLower}([^a-z]|$)`);
    return regex.test(nameLower);
  });
  if (containsWholeWord) return containsWholeWord;

  // 4. Try icon name contains concept (partial match, but concept must be 3+ chars)
  if (conceptLower.length >= 3) {
    const containsConcept = validIcons.find(i => i.name.toLowerCase().includes(conceptLower));
    if (containsConcept) return containsConcept;
  }

  // 5. Try word-based match for multi-word concepts
  const words = conceptLower.split(/[\s-_,]+/).filter(w => w.length >= 3);
  for (const word of words) {
    // Skip very common words
    if (['the', 'and', 'for', 'with', 'from', 'into', 'that', 'this'].includes(word)) continue;

    const match = validIcons.find(i => {
      const nameLower = i.name.toLowerCase();
      // Check if icon name contains the word as a whole word or prefix
      const regex = new RegExp(`(^|[^a-z])${word}`);
      return regex.test(nameLower);
    });
    if (match) return match;
  }

  // 6. Try fuzzy match for longer words only
  for (const word of words) {
    if (word.length >= 4) {
      const startsWith = validIcons.find(i => {
        const nameLower = i.name.toLowerCase();
        const firstWord = nameLower.split(/[\s-_]/)[0];
        return firstWord.length >= 3 && (
          nameLower.startsWith(word) ||
          word.startsWith(firstWord)
        );
      });
      if (startsWith) return startsWith;
    }
  }

  // Try category-based matching
  const categoryMatch = icons.find(i =>
    i.category?.toLowerCase().includes(conceptLower) ||
    conceptLower.includes(i.category?.toLowerCase() || '')
  );
  if (categoryMatch) return categoryMatch;

  // Common scientific concept synonyms
  const synonyms: Record<string, string[]> = {
    'dna': ['dna', 'nucleic', 'genetic', 'gene', 'chromosome'],
    'rna': ['rna', 'mrna', 'transcript'],
    'protein': ['protein', 'enzyme', 'polypeptide'],
    'cell': ['cell', 'cellular'],
    'membrane': ['membrane', 'lipid', 'bilayer'],
    'nucleus': ['nucleus', 'nuclear'],
    'mitochondria': ['mitochondria', 'mitochondrion', 'energy'],
    'receptor': ['receptor', 'binding', 'ligand'],
    'antibody': ['antibody', 'immunoglobulin', 'immune'],
    'virus': ['virus', 'viral', 'pathogen'],
    'bacteria': ['bacteria', 'bacterial', 'microbe'],
  };

  for (const [iconKey, conceptWords] of Object.entries(synonyms)) {
    if (conceptWords.some(w => conceptLower.includes(w))) {
      const synonymMatch = icons.find(i => i.name.toLowerCase().includes(iconKey));
      if (synonymMatch) return synonymMatch;
    }
  }

  return null;
}

// Check if local AI mode is enabled
export const isLocalAIEnabled = () => {
  return import.meta.env.VITE_LOCAL_AUTH === 'true' && !!GEMINI_API_KEY;
};

/**
 * Diagnostic function to test icon database access
 * Call this from browser console: await window.testIconDatabase()
 */
export async function testIconDatabase(): Promise<void> {
  console.log('=== Icon Database Diagnostic ===');

  try {
    // Test 1: Count total icons
    const { count, error: countError } = await supabase
      .from('icons')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count query failed:', countError);
    } else {
      console.log(`✓ Total icons in database: ${count}`);
    }

    // Test 2: Fetch sample icons
    const { data: sampleIcons, error: sampleError } = await supabase
      .from('icons')
      .select('id, name, category')
      .limit(10);

    if (sampleError) {
      console.error('❌ Sample fetch failed:', sampleError);
    } else {
      console.log('✓ Sample icons:', sampleIcons?.map(i => `${i.name} (${i.category})`).join(', '));
    }

    // Test 3: Search for common biomedical terms
    const testTerms = ['dna', 'cell', 'protein', 'heart', 'brain', 'enzyme', 'receptor'];
    for (const term of testTerms) {
      const { data, error } = await supabase
        .from('icons')
        .select('id, name, category')
        .ilike('name', `%${term}%`)
        .limit(3);

      if (error) {
        console.error(`❌ Search "${term}" failed:`, error);
      } else if (data && data.length > 0) {
        console.log(`✓ "${term}" found ${data.length} icons:`, data.map(i => i.name).join(', '));
      } else {
        console.log(`⚠ "${term}" - no icons found`);
      }
    }

    // Test 4: Check if icon has svg_content
    const { data: withSvg, error: svgError } = await supabase
      .from('icons')
      .select('id, name, svg_content')
      .limit(1)
      .single();

    if (svgError) {
      console.error('❌ SVG content check failed:', svgError);
    } else if (withSvg?.svg_content) {
      console.log(`✓ SVG content available, length: ${withSvg.svg_content.length} chars`);
    } else {
      console.warn('⚠ Icon found but svg_content is empty/null');
    }

    console.log('=== Diagnostic Complete ===');

  } catch (e) {
    console.error('❌ Diagnostic failed with exception:', e);
  }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).testIconDatabase = testIconDatabase;
}

// List available models for debugging
export async function listAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );
    if (!response.ok) {
      console.error('Failed to list models:', await response.text());
      return [];
    }
    const data = await response.json();
    const models = data.models?.map((m: any) => m.name) || [];
    console.log('Available Gemini models:', models);
    return models;
  } catch (e) {
    console.error('Error listing models:', e);
    return [];
  }
}

// Cache for available models
let cachedModels: string[] | null = null;

// Helper to call Gemini API with dynamic model discovery
async function callGeminiAPI(requestBody: any, requiresVision: boolean = false): Promise<Response> {
  // First, discover available models if not cached
  if (!cachedModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        cachedModels = data.models
          ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          ?.map((m: any) => m.name.replace('models/', '')) || [];
        console.log('Discovered models:', cachedModels);
      } else {
        const errText = await response.text();
        console.error('Failed to discover models:', errText);
        throw new Error(`API Key error: ${errText}`);
      }
    } catch (e: any) {
      console.error('Model discovery failed:', e);
      throw new Error(`Cannot connect to Gemini API: ${e.message}`);
    }
  }

  if (!cachedModels || cachedModels.length === 0) {
    throw new Error('No Gemini models available. Please check your API key.');
  }

  // Prefer models that support vision if needed
  const preferredModels = requiresVision
    ? cachedModels.filter(m => m.includes('flash') || m.includes('pro') || m.includes('vision'))
    : cachedModels;

  const modelsToTry = preferredModels.length > 0 ? preferredModels : cachedModels;
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        console.log(`Success with model: ${model}`);
        return response;
      }

      const errorData = await response.json();
      console.log(`Model ${model} failed:`, errorData.error?.message?.substring(0, 100));
      lastError = errorData;
    } catch (e: any) {
      console.log(`Error with ${model}:`, e.message);
      lastError = e;
    }
  }

  throw new Error(lastError?.error?.message || 'All Gemini models failed.');
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    message: string;
    code?: number;
    status?: string;
  };
}

/**
 * Generate an image using Gemini's image generation capabilities
 * Falls back to SVG generation if image generation is not available
 */
export async function generateFigureLocal(params: {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
  mode: 'prompt_to_visual' | 'sketch_transform' | 'image_enhancer' | 'style_match';
  referenceImage?: string;
  referenceContext?: string;
}): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.' };
  }

  try {
    const styleGuide = {
      flat: 'Use flat design with solid colors (#4A90A4 for primary, #2D5A6B for secondary, #E8F4F8 for background accents), clean geometric shapes, minimal gradients. Modern infographic style.',
      '3d': 'Create depth with gradients and subtle shadows. Use layered elements with drop shadows for dimension.',
      sketch: 'Use thin strokes, hand-drawn appearance with slightly imperfect lines, hatching patterns for shading.',
    };

    // Generate SVG instead of raster image for reliable output
    const systemPrompt = `You are a scientific SVG illustration expert. Create a professional, publication-quality scientific figure as SVG.

Style: ${styleGuide[params.style]}

Requirements:
- Output ONLY valid SVG code, nothing else
- Use viewBox="0 0 800 600"
- Include proper scientific elements with clear shapes
- Use semantic grouping with <g> elements and id attributes
- Add text labels where appropriate using <text> elements
- Use arrows (<line> or <path> with markers) for flow/connections
- Colors should be professional and suitable for publications
- Include a white background rectangle

Do NOT include any markdown formatting, code blocks, or explanations. Output pure SVG only.`;

    let userPrompt = params.prompt;

    if (params.mode === 'sketch_transform' && params.referenceImage) {
      userPrompt = `Transform this sketch concept into a professional SVG scientific figure: ${params.prompt}`;
    } else if (params.mode === 'image_enhancer' && params.referenceImage) {
      userPrompt = `Recreate and enhance this scientific image as a clean SVG: ${params.prompt}`;
    } else if (params.mode === 'style_match' && params.referenceImage) {
      userPrompt = `Create a new SVG figure inspired by the reference style: ${params.prompt}`;
    }

    if (params.referenceContext) {
      userPrompt += `\n\nAdditional context: ${params.referenceContext}`;
    }

    const requestBody: any = {
      contents: [{
        parts: [
          { text: `${systemPrompt}\n\nCreate SVG for: ${userPrompt}` }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    // Add reference image for context if provided
    if (params.referenceImage) {
      const base64Data = params.referenceImage.replace(/^data:image\/\w+;base64,/, '');
      requestBody.contents[0].parts.unshift({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }

    // Use helper to try multiple models
    const response = await callGeminiAPI(requestBody, !!params.referenceImage);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    // Get text response and extract SVG
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find(p => p.text);

    if (textPart?.text) {
      // Extract SVG from response
      const svgMatch = textPart.text.match(/<svg[\s\S]*?<\/svg>/i);
      if (svgMatch) {
        // Convert SVG to data URL for image display
        const svgContent = svgMatch[0];
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        const imageUrl = URL.createObjectURL(svgBlob);

        // Convert to base64 data URL for consistency
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onloadend = () => {
            resolve({ success: true, imageUrl: reader.result as string });
          };
          reader.readAsDataURL(svgBlob);
        });
      }

      return {
        success: false,
        error: `Could not generate SVG. AI response: ${textPart.text.substring(0, 200)}...`
      };
    }

    return { success: false, error: 'No response from API' };
  } catch (error: any) {
    console.error('Local AI error:', error);
    return { success: false, error: error.message || 'Failed to generate figure' };
  }
}

/**
 * Generate a BioRender-style flat scientific illustration
 * Creates publication-quality SVG images similar to BioRender.com
 *
 * This is an alternative to the JSON workflow - generates a complete image
 * rather than editable canvas elements.
 */
export async function generateBioRenderStyleImage(params: {
  prompt: string;
  style?: 'flat' | 'gradient' | 'outline';
  size?: 'small' | 'medium' | 'large';
  colorScheme?: 'scientific' | 'vibrant' | 'monochrome' | 'pastel';
}): Promise<{ success: boolean; imageUrl?: string; svgContent?: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.' };
  }

  const style = params.style || 'flat';
  const size = params.size || 'medium';
  const colorScheme = params.colorScheme || 'scientific';

  // Size configurations
  const sizeConfig = {
    small: { width: 600, height: 400 },
    medium: { width: 900, height: 600 },
    large: { width: 1200, height: 800 },
  };
  const { width, height } = sizeConfig[size];

  // Color palettes similar to BioRender
  const colorPalettes = {
    scientific: {
      primary: ['#4A90A4', '#2D5A6B', '#7CB342', '#FF7043', '#5C6BC0'],
      secondary: ['#81D4FA', '#A5D6A7', '#FFCC80', '#CE93D8', '#90CAF9'],
      background: '#FFFFFF',
      text: '#1a1a1a',
      membrane: '#F5E6D3',
      organelle: '#E8F4E8',
    },
    vibrant: {
      primary: ['#E91E63', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'],
      secondary: ['#F48FB1', '#90CAF9', '#A5D6A7', '#FFCC80', '#CE93D8'],
      background: '#FAFAFA',
      text: '#212121',
      membrane: '#FFF3E0',
      organelle: '#E3F2FD',
    },
    monochrome: {
      primary: ['#37474F', '#546E7A', '#78909C', '#90A4AE', '#607D8B'],
      secondary: ['#B0BEC5', '#CFD8DC', '#ECEFF1', '#E0E0E0', '#BDBDBD'],
      background: '#FFFFFF',
      text: '#263238',
      membrane: '#ECEFF1',
      organelle: '#CFD8DC',
    },
    pastel: {
      primary: ['#B39DDB', '#90CAF9', '#A5D6A7', '#FFE082', '#F48FB1'],
      secondary: ['#D1C4E9', '#BBDEFB', '#C8E6C9', '#FFF9C4', '#F8BBD0'],
      background: '#FEFEFE',
      text: '#424242',
      membrane: '#FFF8E1',
      organelle: '#E8F5E9',
    },
  };
  const palette = colorPalettes[colorScheme];

  // Style-specific rendering hints
  const styleHints = {
    flat: `
- Use SOLID FILL colors only, NO gradients
- Clean geometric shapes with uniform colors
- Sharp edges, no blur or shadows
- Simple iconic representations
- 2px stroke outlines in darker shade`,
    gradient: `
- Use subtle LINEAR GRADIENTS for depth (lighter to darker from top-left)
- Soft drop shadows (2-3px offset, 10% opacity)
- Rounded corners where appropriate
- Smooth color transitions
- Professional 3D-like appearance`,
    outline: `
- Primarily LINE ART style with thin strokes (1-2px)
- Minimal fills, mostly transparent or very light
- Emphasis on contours and structural details
- Clean, technical illustration style
- Suitable for publications and presentations`,
  };

  try {
    console.log(`[BioRender] Generating ${style} illustration for: "${params.prompt.substring(0, 50)}..."`);

    const systemPrompt = `You are a professional scientific illustrator specializing in biomedical SVG graphics similar to BioRender.com.

CREATE a publication-quality SVG illustration for: "${params.prompt}"

OUTPUT REQUIREMENTS:
- Return ONLY valid SVG code, no markdown, no explanation
- viewBox="0 0 ${width} ${height}"
- Include xmlns="http://www.w3.org/2000/svg"

STYLE: ${style.toUpperCase()}
${styleHints[style]}

COLOR PALETTE:
- Primary colors: ${palette.primary.join(', ')}
- Secondary colors: ${palette.secondary.join(', ')}
- Background: ${palette.background}
- Text: ${palette.text}
- Cell membrane tint: ${palette.membrane}
- Organelle backgrounds: ${palette.organelle}

COMPOSITION GUIDELINES:
- Center the main subject(s) in the viewBox
- Use professional scientific visual language
- Include clear labels using <text> elements (font-family: Arial, sans-serif)
- Add arrows (<path> with markers) for processes/flows
- Use <defs> for reusable elements and gradients
- Group related elements with <g> and descriptive id attributes
- Maintain visual hierarchy: larger elements = more important
- White or light background with clear foreground elements

BIOMEDICAL ILLUSTRATION ELEMENTS:
- Cells: rounded shapes with membrane, nucleus, organelles
- Molecules: simplified iconic representations (DNA helix, proteins as blobs)
- Arrows: directional flow indicators with proper arrowheads
- Labels: clear text positioned near elements (12-16px font)
- Pathways: connected elements showing biological processes

Generate the complete SVG now:`;

    const requestBody = {
      contents: [{
        parts: [{ text: systemPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384, // Large for detailed SVG
      }
    };

    const response = await callGeminiAPI(requestBody, false);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      console.error('[BioRender] API error:', data.error.message);
      return { success: false, error: data.error.message };
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (!textPart?.text) {
      return { success: false, error: 'No response from API' };
    }

    // Extract SVG from response
    const svgMatch = textPart.text.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) {
      console.error('[BioRender] No valid SVG in response');
      console.log('[BioRender] Response preview:', textPart.text.substring(0, 500));
      return { success: false, error: 'Could not generate valid SVG illustration' };
    }

    let svgContent = svgMatch[0];

    // Ensure proper SVG attributes
    if (!svgContent.includes('xmlns=')) {
      svgContent = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!svgContent.includes('viewBox=')) {
      svgContent = svgContent.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
    }

    // Security: Remove scripts and event handlers
    svgContent = svgContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');

    // Convert to data URL
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const imageUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(svgBlob);
    });

    console.log(`[BioRender] ✓ Generated ${style} illustration (${svgContent.length} bytes)`);

    return {
      success: true,
      imageUrl,
      svgContent,
    };

  } catch (error: any) {
    console.error('[BioRender] Error:', error);
    return { success: false, error: error.message || 'Failed to generate BioRender-style illustration' };
  }
}

/**
 * Create a simple fallback SVG icon when AI generation fails
 */
function createFallbackIcon(concept: string, style: 'flat' | '3d' | 'sketch' = 'flat'): { svgContent: string; dataUrl: string } {
  const colors = {
    flat: { primary: '#4A90A4', secondary: '#2D5A6B' },
    '3d': { primary: '#3B82F6', secondary: '#1D4ED8' },
    sketch: { primary: '#6B7280', secondary: '#4B5563' },
  };

  const c = colors[style];
  const initial = concept.charAt(0).toUpperCase();

  // Create a simple circular icon with the first letter
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="28" fill="${c.primary}" stroke="${c.secondary}" stroke-width="2"/>
    <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${initial}</text>
  </svg>`;

  const dataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;

  return { svgContent, dataUrl };
}

/**
 * Generate an SVG icon from a text prompt (no reference image needed)
 * Used when no matching icon exists in the database
 */
export async function generateIconFromPrompt(params: {
  concept: string;
  style?: 'flat' | '3d' | 'sketch';
}): Promise<{ success: boolean; svgContent?: string; dataUrl?: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    // Return fallback icon instead of failing
    console.log('[generateIconFromPrompt] No API key, using fallback icon');
    const fallback = createFallbackIcon(params.concept, params.style);
    return { success: true, ...fallback };
  }

  try {
    const styleGuides = {
      flat: 'Use flat design with solid fill colors (#4A90A4, #2D5A6B, #7CB342, #FF7043), clean geometric shapes, minimal gradients, no shadows.',
      '3d': 'Use subtle gradients and soft shadows to create depth, rounded shapes, professional medical illustration style.',
      sketch: 'Use thin stroke lines (1-2px), minimal fills, hand-drawn appearance with slightly organic curves.',
    };

    const style = params.style || 'flat';

    const systemPrompt = `You are a scientific/biomedical icon designer. Create a simple, clear SVG icon for the concept: "${params.concept}"

Style: ${styleGuides[style]}

CRITICAL Requirements:
- Output ONLY valid SVG code, no markdown, no explanation, no code blocks
- Use viewBox="0 0 64 64"
- Create a SIMPLE icon with 3-8 shapes maximum
- Center the icon in the viewBox
- NO text elements
- NO background rectangle
- Use only: <path>, <circle>, <ellipse>, <rect>, <polygon>, <line>
- Colors: Use 2-3 colors maximum from the style palette
- Make it recognizable and symbolic, not detailed

Example output format:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="#4A90A4"/></svg>

Output the SVG now:`;

    const requestBody = {
      contents: [{
        parts: [{ text: systemPrompt }]
      }],
      generationConfig: {
        temperature: 0.5,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const response = await callGeminiAPI(requestBody, false);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (!textPart?.text) {
      return { success: false, error: 'No response from API' };
    }

    // Extract SVG from response
    const svgMatch = textPart.text.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) {
      console.warn('[generateIconFromPrompt] No SVG found in response, using fallback');
      const fallback = createFallbackIcon(params.concept, params.style);
      return { success: true, ...fallback };
    }

    let svgContent = svgMatch[0];

    // Clean up SVG - ensure it has proper xmlns and viewBox
    if (!svgContent.includes('xmlns=')) {
      svgContent = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!svgContent.includes('viewBox=')) {
      svgContent = svgContent.replace('<svg', '<svg viewBox="0 0 64 64"');
    }

    // Remove any script tags or event handlers for safety
    svgContent = svgContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');

    // Validate SVG has content - use fallback if too short
    if (svgContent.length < 50) {
      console.warn('[generateIconFromPrompt] SVG too short, using fallback');
      const fallback = createFallbackIcon(params.concept, params.style);
      return { success: true, ...fallback };
    }

    // Convert to data URL
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(svgBlob);
    });

    console.log(`[generateIconFromPrompt] Generated icon for "${params.concept}" (${svgContent.length} bytes)`);
    return { success: true, svgContent, dataUrl };

  } catch (error: any) {
    console.error('[generateIconFromPrompt] Error:', error);
    // Use fallback icon instead of failing
    console.log('[generateIconFromPrompt] Using fallback icon due to error');
    const fallback = createFallbackIcon(params.concept, params.style);
    return { success: true, ...fallback };
  }
}

/**
 * Generate an icon from a reference image
 * Uses SVG generation for reliable output
 */
export async function generateIconLocal(params: {
  prompt: string;
  referenceImage: string;
  style: 'pencil' | 'biomedical' | 'oil';
  creativityLevel: 'faithful' | 'balanced' | 'creative';
  backgroundColor: 'transparent' | 'white';
}): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    const stylePrompts = {
      pencil: 'Use thin stroke lines (stroke-width: 1-2), gray tones (#333, #666, #999), slight variations in line thickness to simulate hand-drawn appearance.',
      biomedical: 'Use solid fill colors (#4A90A4, #2D5A6B, #7CB342, #FF7043), clean geometric paths, no strokes or thin strokes only, flat design.',
      oil: 'Use rich warm colors (#8B4513, #D4A574, #CD853F), multiple overlapping shapes with slight opacity variations to simulate texture.'
    };

    const creativityPrompts = {
      faithful: 'Closely replicate the reference image structure and proportions.',
      balanced: 'Maintain the core concept while simplifying for icon use.',
      creative: 'Create an artistic interpretation focusing on the essential concept.'
    };

    const bgColor = params.backgroundColor === 'white' ? '#FFFFFF' : 'none';

    const systemPrompt = `You are a scientific icon designer. Analyze the reference image and create an SVG icon based on it.

Style: ${stylePrompts[params.style]}
Creativity: ${creativityPrompts[params.creativityLevel]}

Requirements:
- Output ONLY valid SVG code, no markdown or explanations
- Use viewBox="0 0 256 256"
- Single, centered icon filling most of the viewBox
- Background: ${params.backgroundColor === 'white' ? '<rect width="256" height="256" fill="#FFFFFF"/>' : 'no background rectangle (transparent)'}
- NO text elements
- Use <path>, <circle>, <ellipse>, <rect>, <polygon> elements
- Clean, publication-ready design

Output pure SVG only.`;

    const base64Data = params.referenceImage.replace(/^data:image\/\w+;base64,/, '');

    const requestBody = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          },
          { text: `${systemPrompt}\n\nCreate an SVG icon based on this reference: ${params.prompt}` }
        ]
      }],
      generationConfig: {
        temperature: params.creativityLevel === 'creative' ? 0.9 : params.creativityLevel === 'balanced' ? 0.7 : 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    // Use helper to try multiple models (requires vision for reference image)
    const response = await callGeminiAPI(requestBody, true);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    // Get text response and extract SVG
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find(p => p.text);

    if (textPart?.text) {
      // Extract SVG from response
      const svgMatch = textPart.text.match(/<svg[\s\S]*?<\/svg>/i);
      if (svgMatch) {
        const svgContent = svgMatch[0];
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });

        // Convert to base64 data URL
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onloadend = () => {
            resolve({ success: true, imageUrl: reader.result as string });
          };
          reader.readAsDataURL(svgBlob);
        });
      }

      return {
        success: false,
        error: `Could not generate icon SVG. Please try a different prompt.`
      };
    }

    return { success: false, error: 'No response from API' };
  } catch (error: any) {
    console.error('Local AI error:', error);
    return { success: false, error: error.message || 'Failed to generate icon' };
  }
}

/**
 * Analyze a figure/diagram to extract elements
 */
export async function analyzeFigureLocal(params: {
  image: string;
  prompt?: string;
}): Promise<{
  success: boolean;
  elements?: Array<{
    type: string;
    name: string;
    description: string;
    position?: { x: number; y: number };
  }>;
  description?: string;
  error?: string;
}> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    const systemPrompt = `You are a scientific diagram analyzer. Analyze the provided image and identify all elements.

For each element, provide:
1. Type (icon, shape, text, arrow, connector, label)
2. Name (what it represents, e.g., "mitochondria", "nucleus", "cell membrane")
3. Description (brief description of what it is)
4. Approximate position (as percentage from top-left, 0-100)

Output as JSON array:
{
  "description": "Brief overall description of the diagram",
  "elements": [
    {"type": "icon", "name": "mitochondria", "description": "Powerhouse of the cell", "position": {"x": 25, "y": 30}},
    ...
  ]
}`;

    const base64Data = params.image.replace(/^data:image\/\w+;base64,/, '');

    const requestBody = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          },
          { text: `${systemPrompt}\n\n${params.prompt || 'Analyze this scientific diagram and identify all elements.'}` }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    // Use helper to try multiple models (requires vision for image analysis)
    const response = await callGeminiAPI(requestBody, true);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (!textPart?.text) {
      return { success: false, error: 'No analysis returned' };
    }

    try {
      // Extract JSON from response
      const jsonMatch = textPart.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          description: parsed.description,
          elements: parsed.elements || []
        };
      }
    } catch (parseError) {
      console.error('Failed to parse analysis:', parseError);
    }

    return {
      success: true,
      description: textPart.text,
      elements: []
    };
  } catch (error: any) {
    console.error('Local AI error:', error);
    return { success: false, error: error.message || 'Failed to analyze figure' };
  }
}

/**
 * Generate editable SVG elements from a prompt
 */
export async function generateEditableElementsLocal(params: {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
}): Promise<{ success: boolean; svg?: string; elements?: any[]; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    const systemPrompt = `You are an SVG generator for scientific diagrams. Create a complete SVG with multiple grouped elements.

Requirements:
- Output valid SVG code
- Use semantic grouping with <g> elements
- Include id and data-type attributes for each element group
- Use appropriate colors and styles for scientific illustrations
- Size: 800x600 viewBox
- Include: shapes, icons (as simple paths), text labels, arrows/connectors

Style: ${params.style}

Output ONLY the SVG code, no explanations.`;

    const requestBody = {
      contents: [{
        parts: [
          { text: `${systemPrompt}\n\nCreate an SVG diagram for: ${params.prompt}` }
        ]
      }],
      generationConfig: {
        temperature: 0.5,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    // Use helper to try multiple models
    const response = await callGeminiAPI(requestBody, false);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (!textPart?.text) {
      return { success: false, error: 'No SVG generated' };
    }

    // Extract SVG from response
    const svgMatch = textPart.text.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      return { success: true, svg: svgMatch[0] };
    }

    return { success: false, error: 'No valid SVG in response' };
  } catch (error: any) {
    console.error('Local AI error:', error);
    return { success: false, error: error.message || 'Failed to generate elements' };
  }
}

/**
 * DiagramScene type for JSON-based figure generation
 */
export interface DiagramSceneOutput {
  version: string;
  canvas?: {
    width?: number;
    height?: number;
    background?: string;
  };
  nodes: Array<{
    id: string;
    kind: 'icon' | 'shape' | 'group';
    iconId?: string; // Reference to icon in library
    generatedIconUrl?: string; // AI-generated SVG icon as data URL (when no icon in library)
    shapeType?: 'rect' | 'ellipse' | 'diamond' | 'hexagon' | 'triangle';
    x: number;
    y: number;
    w?: number;
    h?: number;
    rotation?: number;
    label?: {
      text: string;
      placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'inside';
      fontSize?: number;
      color?: string;
    };
    style?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    };
  }>;
  connectors: Array<{
    id: string;
    from: { nodeId: string; portId?: string };
    to: { nodeId: string; portId?: string };
    router?: 'straight' | 'orthogonal' | 'curved';
    style?: {
      stroke?: string;
      width?: number;
      dash?: number[];
      arrowStart?: string;
      arrowEnd?: string;
    };
    label?: {
      text: string;
      position?: number;
      fontSize?: number;
      color?: string;
    };
  }>;
  texts: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
  }>;
  metadata?: {
    name?: string;
    description?: string;
  };
}

/**
 * Call SciSketch Hugging Face model to generate scientific phrases from text
 * Uses the FlanT5PhraseGeneration model trained on BioIllustra dataset
 */
async function callSciSketchModel(prompt: string): Promise<{ success: boolean; phrases?: string[]; error?: string }> {
  // Check if API token is configured
  if (!SCISKETCH_API_TOKEN) {
    console.log('[SciSketch] No Hugging Face API token configured, skipping SciSketch');
    return { success: false, error: 'Hugging Face API token not configured. Add VITE_HUGGINGFACE_API_TOKEN to .env' };
  }

  try {
    console.log('[SciSketch] Calling Hugging Face model with prompt:', prompt.substring(0, 100));

    const response = await fetch(SCISKETCH_MODEL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SCISKETCH_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 512,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SciSketch] API error:', response.status, errorText);

      // Handle model loading state
      if (response.status === 503) {
        return { success: false, error: 'SciSketch model is loading. Please try again in a moment.' };
      }

      return { success: false, error: `SciSketch API error: ${response.status}` };
    }

    const data = await response.json();
    console.log('[SciSketch] Raw response:', data);

    // Parse the response - can be object with generated_text or array
    let generatedText = '';
    if (Array.isArray(data) && data.length > 0) {
      generatedText = data[0].generated_text || '';
    } else if (data.generated_text) {
      generatedText = data.generated_text;
    }

    if (!generatedText) {
      return { success: false, error: 'No text generated from SciSketch model' };
    }

    // Parse comma-separated phrases
    const phrases = generatedText
      .split(',')
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0 && p.length < 100); // Filter out empty or too long phrases

    console.log('[SciSketch] Generated phrases:', phrases);

    if (phrases.length === 0) {
      return { success: false, error: 'No valid phrases generated' };
    }

    return { success: true, phrases };
  } catch (error: any) {
    console.error('[SciSketch] Error:', error);
    return { success: false, error: error.message || 'Failed to call SciSketch model' };
  }
}

/**
 * Call Hugging Face Chat Completions API (new Inference Providers)
 * Uses OpenAI-compatible endpoint: https://router.huggingface.co/v1/chat/completions
 */
async function callHuggingFaceTextGeneration(
  prompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<{ success: boolean; text?: string; error?: string }> {
  if (!HUGGINGFACE_API_TOKEN) {
    return { success: false, error: 'Hugging Face API token not configured' };
  }

  const model = options.model || PREFERRED_HF_MODEL;
  const maxTokens = options.maxTokens || 500;
  const temperature = options.temperature || 0.7;

  // New HuggingFace Inference Providers API (OpenAI-compatible)
  const apiUrl = 'https://router.huggingface.co/v1/chat/completions';

  try {
    console.log(`[HuggingFace] Calling ${model}...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
      console.error(`[HuggingFace] ${model} error:`, errorMsg);

      if (response.status === 401) {
        return { success: false, error: 'Invalid Hugging Face API token' };
      }
      if (response.status === 402) {
        return { success: false, error: 'HuggingFace free tier credits exceeded' };
      }

      return { success: false, error: `HuggingFace API error: ${errorMsg}` };
    }

    const data = await response.json();

    // Parse OpenAI-compatible response
    const generatedText = data.choices?.[0]?.message?.content || '';

    if (!generatedText) {
      console.warn('[HuggingFace] Empty response from model');
      return { success: false, error: 'No text generated' };
    }

    console.log(`[HuggingFace] ✓ Generated ${generatedText.length} chars with ${model}`);
    return { success: true, text: generatedText };

  } catch (error: any) {
    console.error('[HuggingFace] Error:', error);
    return { success: false, error: error.message || 'HuggingFace API call failed' };
  }
}

/**
 * Biomedical term to icon keyword mapping
 * Maps common scientific terms to searchable icon names
 */
const BIOMEDICAL_ICON_MAPPING: Record<string, string[]> = {
  // DNA/RNA related
  'dna': ['dna', 'double-helix', 'genetic', 'chromosome', 'nucleic'],
  'rna': ['rna', 'mrna', 'transcript', 'nucleic'],
  'gene': ['gene', 'dna', 'genetic', 'chromosome'],
  'chromosome': ['chromosome', 'dna', 'genetic'],
  'helicase': ['helicase', 'enzyme', 'unwind', 'dna'],
  'primase': ['primase', 'enzyme', 'primer', 'rna'],
  'polymerase': ['polymerase', 'enzyme', 'replication', 'transcription'],
  'ligase': ['ligase', 'enzyme', 'join', 'dna'],
  'topoisomerase': ['topoisomerase', 'enzyme', 'coil', 'dna'],

  // Proteins and enzymes
  'protein': ['protein', 'polypeptide', 'molecule', 'structure'],
  'enzyme': ['enzyme', 'catalyst', 'protein', 'reaction'],
  'receptor': ['receptor', 'membrane', 'signal', 'binding'],
  'antibody': ['antibody', 'immunoglobulin', 'immune', 'y-shape'],
  'kinase': ['kinase', 'phosphorylation', 'enzyme', 'atp'],
  'phosphatase': ['phosphatase', 'enzyme', 'dephosphorylation'],

  // Cell structures
  'cell': ['cell', 'cellular', 'membrane', 'cytoplasm'],
  'nucleus': ['nucleus', 'nuclear', 'cell', 'dna'],
  'mitochondria': ['mitochondria', 'energy', 'atp', 'powerhouse'],
  'ribosome': ['ribosome', 'translation', 'protein', 'rna'],
  'membrane': ['membrane', 'lipid', 'bilayer', 'cell'],
  'cytoplasm': ['cytoplasm', 'cell', 'fluid', 'organelle'],
  'golgi': ['golgi', 'apparatus', 'vesicle', 'secretion'],
  'endoplasmic': ['endoplasmic', 'reticulum', 'er', 'membrane'],
  'lysosome': ['lysosome', 'digestion', 'enzyme', 'vesicle'],
  'vesicle': ['vesicle', 'transport', 'membrane', 'bubble'],

  // Organs
  'heart': ['heart', 'cardiac', 'cardiovascular', 'organ'],
  'brain': ['brain', 'neuron', 'cerebral', 'nervous'],
  'liver': ['liver', 'hepatic', 'organ', 'metabolism'],
  'kidney': ['kidney', 'renal', 'organ', 'filtration'],
  'lung': ['lung', 'pulmonary', 'respiratory', 'breathing'],

  // Signaling
  'signal': ['signal', 'pathway', 'cascade', 'transduction'],
  'pathway': ['pathway', 'cascade', 'signaling', 'route'],
  'cascade': ['cascade', 'pathway', 'sequential', 'amplification'],
  'ligand': ['ligand', 'binding', 'receptor', 'molecule'],

  // Other biological entities
  'virus': ['virus', 'viral', 'pathogen', 'infection'],
  'bacteria': ['bacteria', 'bacterial', 'microbe', 'prokaryote'],
  'neuron': ['neuron', 'nerve', 'synapse', 'axon'],
  'blood': ['blood', 'vessel', 'circulation', 'erythrocyte'],
  'muscle': ['muscle', 'fiber', 'contraction', 'myosin'],
};

/**
 * Get best icon search terms for a biomedical concept
 */
function getIconSearchTerms(concept: string): string[] {
  const lower = concept.toLowerCase().trim();
  const terms: string[] = [lower];

  // Check direct mapping
  for (const [key, values] of Object.entries(BIOMEDICAL_ICON_MAPPING)) {
    if (lower.includes(key) || key.includes(lower)) {
      terms.push(...values);
    }
  }

  // Add word variants
  const words = lower.split(/[\s\-_]+/);
  terms.push(...words.filter(w => w.length > 2));

  // Remove duplicates and return
  return [...new Set(terms)];
}

/**
 * Infer connection type between two biological components
 */
function inferConnectionType(
  fromComponent: string,
  toComponent: string,
  fromType: string,
  toType: string
): { type: 'activates' | 'inhibits' | 'produces' | 'converts' | 'leads_to' | 'regulates' | 'binds' | 'catalyzes'; label?: string } {
  const from = fromComponent.toLowerCase();
  const to = toComponent.toLowerCase();

  // Enzyme → Product: catalyzes
  if (fromType === 'molecule' && /enzyme|ase$|kinase|polymerase|ligase/.test(from)) {
    if (toType === 'molecule') {
      return { type: 'catalyzes', label: 'catalyzes' };
    }
  }

  // Kinase → Target: phosphorylates (activates with phosphorylation)
  if (/kinase/.test(from)) {
    return { type: 'activates', label: 'phosphorylates' };
  }

  // Phosphatase → Target: dephosphorylates (inhibits)
  if (/phosphatase/.test(from)) {
    return { type: 'inhibits', label: 'dephosphorylates' };
  }

  // Inhibitor patterns
  if (/inhibit|block|suppress|antagonist/.test(from) || /inhibit|block/.test(to)) {
    return { type: 'inhibits' };
  }

  // Receptor → Signal cascade: activates
  if (/receptor/.test(from) && (toType === 'process' || /signal|pathway|cascade/.test(to))) {
    return { type: 'activates' };
  }

  // Ligand → Receptor: binds
  if (/ligand|hormone|growth.factor/.test(from) && /receptor/.test(to)) {
    return { type: 'binds', label: 'binds' };
  }

  // DNA → RNA: transcription
  if (/dna|gene/.test(from) && /rna|mrna|transcript/.test(to)) {
    return { type: 'produces', label: 'transcription' };
  }

  // RNA → Protein: translation
  if (/rna|mrna/.test(from) && /protein|polypeptide/.test(to)) {
    return { type: 'produces', label: 'translation' };
  }

  // Enzyme → Substrate: converts
  if (fromType === 'molecule' && toType === 'molecule') {
    return { type: 'converts' };
  }

  // Signal → Outcome: activates or regulates
  if (fromType === 'process' && toType === 'outcome') {
    return { type: 'activates' };
  }

  // Process to process: regulates
  if (fromType === 'process' && toType === 'process') {
    return { type: 'regulates' };
  }

  // Default
  return { type: 'leads_to' };
}

/**
 * Analyze scientific process using Hugging Face models
 * Returns structured workflow for diagram generation with intelligent connection types
 */
async function analyzeScientificProcessWithHuggingFace(prompt: string): Promise<{
  success: boolean;
  workflow?: {
    title: string;
    steps: Array<{
      id: string;
      name: string;
      description: string;
      iconConcept: string;
      iconSearchTerms: string[];
      type: 'process' | 'molecule' | 'cell' | 'organ' | 'concept' | 'outcome';
    }>;
    connections: Array<{
      from: string;
      to: string;
      type: 'activates' | 'inhibits' | 'produces' | 'converts' | 'leads_to' | 'regulates' | 'binds' | 'catalyzes';
      label?: string;
    }>;
  };
  error?: string;
}> {
  if (!HUGGINGFACE_API_TOKEN) {
    return { success: false, error: 'Hugging Face API token not configured' };
  }

  try {
    console.log('[HuggingFace] Analyzing scientific process...');

    // Enhanced prompt that asks for components AND relationships
    const structuredPrompt = `You are a biomedical expert. Analyze this scientific concept and describe the process.

Scientific concept: "${prompt}"

List 4-6 key biological components involved, using specific scientific terms like:
- Molecules: DNA, mRNA, protein, ATP, enzyme, receptor, antibody, kinase, ligand
- Cellular: cell, nucleus, mitochondria, ribosome, membrane, vesicle
- Organs: heart, brain, liver, kidney, neuron, blood vessel
- Processes: transcription, translation, phosphorylation, signaling cascade

For each component, specify what it does (activates, inhibits, produces, binds, converts, regulates).

Output format - ONLY a list like this:
DNA (gene) -> transcribes -> mRNA
mRNA -> translates -> protein
kinase -> phosphorylates -> receptor
receptor -> activates -> signaling cascade`;

    const result = await callHuggingFaceTextGeneration(structuredPrompt, {
      maxTokens: 400,
      temperature: 0.5,
    });

    if (!result.success || !result.text) {
      return { success: false, error: result.error || 'Failed to analyze with HuggingFace' };
    }

    const rawText = result.text.trim();
    console.log('[HuggingFace] Raw analysis:', rawText);

    // Parse the response - try to extract components and relationships
    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    const components: string[] = [];
    const relationships: Array<{ from: string; action: string; to: string }> = [];

    for (const line of lines) {
      // Try to parse "A -> action -> B" format
      const arrowMatch = line.match(/^(.+?)\s*(?:->|→|-->)\s*(.+?)\s*(?:->|→|-->)\s*(.+)$/i);
      if (arrowMatch) {
        const [, from, action, to] = arrowMatch;
        const fromClean = from.replace(/[()]/g, '').trim();
        const toClean = to.replace(/[()]/g, '').trim();
        if (!components.includes(fromClean)) components.push(fromClean);
        if (!components.includes(toClean)) components.push(toClean);
        relationships.push({ from: fromClean, action: action.trim().toLowerCase(), to: toClean });
        continue;
      }

      // Try to parse "A action B" or simple comma list
      const simpleMatch = line.match(/^([^,]+?)(?:\s*,\s*|\s+(?:to|and)\s+)(.+)$/i);
      if (simpleMatch) {
        const parts = line.split(/[,\n]+/).map(s => s.trim()).filter(s => s.length > 1);
        components.push(...parts);
      } else if (line.length > 2 && line.length < 50) {
        // Single component
        components.push(line.trim());
      }
    }

    // If no components extracted, fallback to simple comma split
    if (components.length < 2) {
      const fallbackComponents = rawText
        .split(/[,\n→\->]+/)
        .map(s => s.trim().replace(/[()]/g, ''))
        .filter(s => s.length > 1 && s.length < 50 && !/^(and|or|the|to|from|into|with)$/i.test(s))
        .slice(0, 8);
      components.push(...fallbackComponents);
    }

    // Deduplicate and limit
    const uniqueComponents = [...new Set(components)].slice(0, 8);
    console.log('[HuggingFace] Extracted components:', uniqueComponents);
    console.log('[HuggingFace] Extracted relationships:', relationships);

    // Build workflow with intelligent connections
    const steps = uniqueComponents.map((component, i) => {
      const type = guessComponentType(component);
      return {
        id: `s${i + 1}`,
        name: component.charAt(0).toUpperCase() + component.slice(1),
        description: component,
        iconConcept: component.toLowerCase().split(/\s+/)[0],
        iconSearchTerms: getIconSearchTerms(component),
        type,
      };
    });

    // Build connections with proper types
    const connections: Array<{
      from: string;
      to: string;
      type: 'activates' | 'inhibits' | 'produces' | 'converts' | 'leads_to' | 'regulates' | 'binds' | 'catalyzes';
      label?: string;
    }> = [];

    // First, use explicit relationships from the AI response
    for (const rel of relationships) {
      const fromStep = steps.find(s => s.name.toLowerCase() === rel.from.toLowerCase());
      const toStep = steps.find(s => s.name.toLowerCase() === rel.to.toLowerCase());
      if (fromStep && toStep) {
        const connType = mapActionToConnectionType(rel.action);
        connections.push({
          from: fromStep.id,
          to: toStep.id,
          type: connType.type,
          label: connType.label,
        });
      }
    }

    // Fill in missing sequential connections with inferred types
    for (let i = 0; i < steps.length - 1; i++) {
      const existingConn = connections.find(c => c.from === steps[i].id);
      if (!existingConn) {
        const inferred = inferConnectionType(
          steps[i].name,
          steps[i + 1].name,
          steps[i].type,
          steps[i + 1].type
        );
        connections.push({
          from: steps[i].id,
          to: steps[i + 1].id,
          type: inferred.type,
          label: inferred.label,
        });
      }
    }

    const workflow = {
      title: prompt.substring(0, 60),
      steps,
      connections,
    };

    return { success: true, workflow };

  } catch (error: any) {
    console.error('[HuggingFace] Analysis error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Map action verb to connection type
 */
function mapActionToConnectionType(action: string): { type: 'activates' | 'inhibits' | 'produces' | 'converts' | 'leads_to' | 'regulates' | 'binds' | 'catalyzes'; label?: string } {
  const a = action.toLowerCase();

  if (/activat|stimulat|promot|enhanc|upregulat/.test(a)) {
    return { type: 'activates' };
  }
  if (/inhibit|block|suppress|downregulat|repress|antagoni/.test(a)) {
    return { type: 'inhibits' };
  }
  if (/produc|creat|generat|synthesi|transcrib|translat|express/.test(a)) {
    return { type: 'produces', label: a.includes('transcrib') ? 'transcription' : a.includes('translat') ? 'translation' : undefined };
  }
  if (/convert|transform|metaboli|break|degrad/.test(a)) {
    return { type: 'converts' };
  }
  if (/regulat|modulat|control/.test(a)) {
    return { type: 'regulates' };
  }
  if (/bind|attach|dock|interact/.test(a)) {
    return { type: 'binds', label: 'binds' };
  }
  if (/catalyz|phosphorylat|dephosphorylat/.test(a)) {
    return { type: 'catalyzes', label: a.includes('phosphorylat') ? 'phosphorylation' : undefined };
  }

  return { type: 'leads_to' };
}

/**
 * Guess the type of a biomedical component based on keywords
 */
function guessComponentType(component: string): 'process' | 'molecule' | 'cell' | 'organ' | 'concept' | 'outcome' {
  const lower = component.toLowerCase();

  // Molecules
  if (/dna|rna|protein|enzyme|receptor|antibody|hormone|lipid|atp|glucose/i.test(lower)) {
    return 'molecule';
  }
  // Cells and cellular components
  if (/cell|nucleus|mitochondria|membrane|ribosome|golgi|lysosome/i.test(lower)) {
    return 'cell';
  }
  // Organs
  if (/heart|brain|liver|kidney|lung|muscle|bone|skin|blood/i.test(lower)) {
    return 'organ';
  }
  // Processes
  if (/transcription|translation|replication|signaling|pathway|synthesis|degradation/i.test(lower)) {
    return 'process';
  }
  // Outcomes
  if (/death|growth|division|response|activation|inhibition/i.test(lower)) {
    return 'outcome';
  }

  return 'concept';
}

/**
 * Step 1: Use Gemini to analyze scientific process and generate structured workflow
 */
async function analyzeScientificProcess(prompt: string): Promise<{
  success: boolean;
  workflow?: {
    title: string;
    steps: Array<{
      id: string;
      name: string;
      description: string;
      iconConcept: string;
      type: 'process' | 'molecule' | 'cell' | 'organ' | 'concept' | 'outcome';
    }>;
    connections: Array<{
      from: string;
      to: string;
      type: 'activates' | 'inhibits' | 'produces' | 'converts' | 'leads_to' | 'regulates';
      label?: string;
    }>;
  };
  error?: string;
}> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    console.log('[Gemini] Analyzing scientific process...');

    const systemPrompt = `Analyze this scientific concept and create a diagram structure.

INPUT: "${prompt}"

Return JSON with exactly this format:
{"title":"Title Here","steps":[{"id":"s1","name":"Step Name","iconConcept":"keyword","type":"molecule"},{"id":"s2","name":"Step 2","iconConcept":"keyword2","type":"process"}],"connections":[{"from":"s1","to":"s2","type":"leads_to"}]}

RULES:
- Create 4-6 steps maximum
- iconConcept must be ONE word (dna, cell, protein, enzyme, receptor, nucleus, mitochondria, heart, brain, liver, antibody, virus, bacteria, gene, rna, membrane, etc.)
- type must be: molecule, cell, organ, process, concept, or outcome
- connection type must be: activates, inhibits, produces, converts, leads_to, or regulates

Return ONLY the JSON, nothing else.`;

    const requestBody = {
      contents: [{
        parts: [{ text: systemPrompt }]
      }],
      generationConfig: {
        temperature: 0.2, // Lower for more consistent JSON
        topK: 20,
        topP: 0.9,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      }
    };

    const response = await callGeminiAPI(requestBody, false);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (!textPart?.text) {
      return { success: false, error: 'No response from API' };
    }

    // Parse JSON response
    let jsonText = textPart.text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/gi, '')
      .trim();

    try {
      const workflow = JSON.parse(jsonText);

      // Validate workflow structure
      if (!workflow.steps || !Array.isArray(workflow.steps) || workflow.steps.length === 0) {
        throw new Error('Invalid workflow: missing steps');
      }

      console.log('[Gemini] Analyzed workflow:', workflow.title, `(${workflow.steps.length} steps)`);
      return { success: true, workflow };

    } catch (parseError) {
      console.error('[Gemini] JSON parse error, creating fallback workflow');

      // Create a simple fallback workflow from the prompt
      const words = prompt.toLowerCase()
        .split(/[\s,\-\/]+/)
        .filter(w => w.length > 3)
        .slice(0, 5);

      const fallbackWorkflow = {
        title: prompt.substring(0, 50),
        steps: words.map((word, i) => ({
          id: `s${i + 1}`,
          name: word.charAt(0).toUpperCase() + word.slice(1),
          description: word,
          iconConcept: word,
          type: 'concept' as const,
        })),
        connections: words.slice(1).map((_, i) => ({
          from: `s${i + 1}`,
          to: `s${i + 2}`,
          type: 'leads_to' as const,
        })),
      };

      return { success: true, workflow: fallbackWorkflow };
    }
  } catch (error: any) {
    console.error('[Gemini] Analysis error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Advanced multi-step diagram generation using Gemini
 * 1. Analyze scientific process → structured workflow
 * 2. Match/generate icons for each step
 * 3. Create proper layout with connectors
 * 4. Generate missing icons with AI
 */
async function generateScientificDiagramWithGemini(params: {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
}): Promise<{ success: boolean; scene?: DiagramSceneOutput; error?: string }> {
  const styleColors = {
    flat: {
      primary: '#4A90A4',
      secondary: '#2D5A6B',
      accent: '#7CB342',
      highlight: '#FF7043',
      text: '#1a1a1a',
      connector: '#374151',
      activates: '#22C55E',
      inhibits: '#EF4444',
      produces: '#3B82F6',
      converts: '#8B5CF6',
      leads_to: '#6B7280',
      regulates: '#F59E0B',
    },
    '3d': {
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      accent: '#10B981',
      highlight: '#F59E0B',
      text: '#111827',
      connector: '#4B5563',
      activates: '#10B981',
      inhibits: '#DC2626',
      produces: '#2563EB',
      converts: '#7C3AED',
      leads_to: '#4B5563',
      regulates: '#D97706',
    },
    sketch: {
      primary: '#6B7280',
      secondary: '#4B5563',
      accent: '#9CA3AF',
      highlight: '#374151',
      text: '#1F2937',
      connector: '#6B7280',
      activates: '#059669',
      inhibits: '#B91C1C',
      produces: '#1D4ED8',
      converts: '#6D28D9',
      leads_to: '#6B7280',
      regulates: '#B45309',
    }
  };

  const colors = styleColors[params.style];

  try {
    // Step 1: Analyze the scientific process
    const analysisResult = await analyzeScientificProcess(params.prompt);

    if (!analysisResult.success || !analysisResult.workflow) {
      console.error('[Gemini] Failed to analyze process:', analysisResult.error);
      return { success: false, error: analysisResult.error || 'Failed to analyze scientific process' };
    }

    const workflow = analysisResult.workflow;
    console.log(`[Gemini] Step 2: Processing ${workflow.steps.length} steps...`);

    // Step 2: Fetch available icons
    const availableIcons = await fetchAvailableIcons();

    // Step 3: Create nodes with smart layout
    const nodes: DiagramSceneOutput['nodes'] = [];
    const nodeIdMap = new Map<string, string>(); // Map workflow step IDs to node IDs

    // Calculate layout based on number of steps
    const stepCount = workflow.steps.length;
    const cols = stepCount <= 4 ? stepCount : Math.min(4, Math.ceil(Math.sqrt(stepCount)));
    const rows = Math.ceil(stepCount / cols);
    const spacingX = 200;
    const spacingY = 180;
    const startX = 100;
    const startY = 120;
    const nodeSize = 70;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      const nodeId = `node_${i + 1}`;

      nodeIdMap.set(step.id, nodeId);

      // Try to find matching icon in database
      const matchedIcon = findMatchingIcon(step.iconConcept, availableIcons);

      if (matchedIcon) {
        console.log(`[Gemini] ✓ Found icon for "${step.iconConcept}" → "${matchedIcon.name}"`);
        nodes.push({
          id: nodeId,
          kind: 'icon',
          iconId: matchedIcon.id,
          x,
          y,
          w: nodeSize,
          h: nodeSize,
          label: {
            text: step.name,
            placement: 'bottom',
            fontSize: 11,
            color: colors.text,
          },
        });
      } else {
        // Generate icon with AI
        console.log(`[Gemini] Generating icon for "${step.iconConcept}"...`);
        const generatedIcon = await generateIconFromPrompt({
          concept: step.iconConcept,
          style: params.style,
        });

        if (generatedIcon.success && generatedIcon.dataUrl) {
          console.log(`[Gemini] ✓ Generated AI icon for "${step.iconConcept}"`);
          nodes.push({
            id: nodeId,
            kind: 'icon',
            generatedIconUrl: generatedIcon.dataUrl,
            x,
            y,
            w: 64,
            h: 64,
            label: {
              text: step.name,
              placement: 'bottom',
              fontSize: 11,
              color: colors.text,
            },
          });
        } else {
          // Fall back to shape with type-based coloring
          console.log(`[Gemini] Using shape for "${step.name}"`);
          const shapeColor = step.type === 'outcome' ? colors.accent :
                           step.type === 'molecule' ? colors.primary :
                           step.type === 'process' ? colors.secondary :
                           colors.primary;

          nodes.push({
            id: nodeId,
            kind: 'shape',
            shapeType: step.type === 'process' ? 'rect' : 'ellipse',
            x,
            y,
            w: 100,
            h: 70,
            label: {
              text: step.name,
              placement: 'center',
              fontSize: 11,
              color: '#ffffff',
            },
            style: {
              fill: shapeColor,
              stroke: colors.secondary,
              strokeWidth: 2,
            },
          });
        }
      }
    }

    // Step 4: Create connectors with proper styling based on relationship type
    console.log(`[Gemini] Step 3: Creating ${workflow.connections.length} connectors...`);
    const connectors: DiagramSceneOutput['connectors'] = [];

    for (let i = 0; i < workflow.connections.length; i++) {
      const conn = workflow.connections[i];
      const fromNodeId = nodeIdMap.get(conn.from);
      const toNodeId = nodeIdMap.get(conn.to);

      if (!fromNodeId || !toNodeId) {
        console.warn(`[Gemini] Skipping connection: ${conn.from} → ${conn.to} (node not found)`);
        continue;
      }

      // Style based on connection type
      const connectorColor = colors[conn.type as keyof typeof colors] || colors.connector;
      const isDashed = conn.type === 'inhibits' || conn.type === 'regulates';
      const arrowType = conn.type === 'inhibits' ? 'tee' : 'arrow';

      connectors.push({
        id: `conn_${i + 1}`,
        from: { nodeId: fromNodeId },
        to: { nodeId: toNodeId },
        router: 'straight',
        style: {
          stroke: connectorColor as string,
          width: 2,
          dash: isDashed ? [5, 5] : undefined,
          arrowEnd: arrowType,
        },
        label: conn.label ? {
          text: conn.label,
          fontSize: 10,
          color: colors.text,
        } : undefined,
      });
    }

    // Step 5: Add title
    const texts: DiagramSceneOutput['texts'] = [{
      id: 'title',
      x: 50,
      y: 40,
      text: workflow.title || params.prompt.substring(0, 60),
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    }];

    const scene: DiagramSceneOutput = {
      version: '1.0.0',
      nodes,
      connectors,
      texts,
      metadata: {
        name: workflow.title,
        description: params.prompt,
      },
    };

    console.log(`[Gemini] ✓ Generated diagram: ${nodes.length} nodes, ${connectors.length} connectors`);
    return { success: true, scene };

  } catch (error: any) {
    console.error('[Gemini] Error generating diagram:', error);
    return { success: false, error: error.message || 'Failed to generate diagram' };
  }
}

/**
 * Image-First Diagram Generation
 * 1. Generate a visual SVG diagram using Gemini
 * 2. Analyze the generated image to extract elements
 * 3. Convert to DiagramScene JSON with proper icons
 */
async function generateDiagramFromVisual(params: {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
}): Promise<{ success: boolean; scene?: DiagramSceneOutput; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  const styleColors = {
    flat: { primary: '#4A90A4', secondary: '#2D5A6B', text: '#1a1a1a', connector: '#374151' },
    '3d': { primary: '#3B82F6', secondary: '#1D4ED8', text: '#111827', connector: '#4B5563' },
    sketch: { primary: '#6B7280', secondary: '#4B5563', text: '#1F2937', connector: '#6B7280' },
  };
  const colors = styleColors[params.style];

  try {
    console.log('[ImageGen] Step 1: Generating visual diagram...');

    // Step 1: Generate a visual SVG diagram
    const svgPrompt = `Create a scientific diagram SVG for: "${params.prompt}"

OUTPUT FORMAT - Return ONLY this JSON (no other text):
{"svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 800 600\\">...</svg>","elements":[{"name":"Element Name","type":"icon|shape","x":100,"y":150,"concept":"keyword"},{"name":"Element 2","type":"shape","x":300,"y":150,"concept":"keyword2"}],"connections":[{"from":0,"to":1,"label":"activates"}]}

RULES:
- SVG must be valid with viewBox="0 0 800 600"
- Include 4-8 elements representing key components
- Each element needs: name, type (icon or shape), x/y position, concept (single word for icon matching)
- Connections link elements by their index (0-based)
- Use colors: ${colors.primary}, ${colors.secondary}
- Position elements with good spacing (150px+ apart)

Return the JSON now:`;

    const requestBody = {
      contents: [{
        parts: [{ text: svgPrompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      }
    };

    const response = await callGeminiAPI(requestBody, false);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (!textPart?.text) {
      throw new Error('No response from API');
    }

    // Parse response
    let jsonText = textPart.text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/gi, '')
      .trim();

    let diagramData: { svg?: string; elements: Array<{ name: string; type: string; x: number; y: number; concept: string }>; connections: Array<{ from: number; to: number; label?: string }> };

    try {
      diagramData = JSON.parse(jsonText);
    } catch (e) {
      console.error('[ImageGen] Failed to parse diagram JSON, using fallback');
      throw new Error('Failed to parse diagram data');
    }

    console.log(`[ImageGen] Step 2: Processing ${diagramData.elements?.length || 0} elements...`);

    // Step 2: Fetch icons and create nodes
    const availableIcons = await fetchAvailableIcons();
    const nodes: DiagramSceneOutput['nodes'] = [];

    for (let i = 0; i < (diagramData.elements || []).length; i++) {
      const elem = diagramData.elements[i];
      const nodeId = `node_${i + 1}`;

      // Try to match icon from database
      const matchedIcon = findMatchingIcon(elem.concept || elem.name, availableIcons);

      if (matchedIcon) {
        console.log(`[ImageGen] ✓ Found icon for "${elem.concept}" → "${matchedIcon.name}"`);
        nodes.push({
          id: nodeId,
          kind: 'icon',
          iconId: matchedIcon.id,
          x: elem.x || 100 + (i % 4) * 180,
          y: elem.y || 100 + Math.floor(i / 4) * 160,
          w: 70,
          h: 70,
          label: {
            text: elem.name,
            placement: 'bottom',
            fontSize: 11,
            color: colors.text,
          },
        });
      } else {
        // Generate icon with AI
        console.log(`[ImageGen] Generating icon for "${elem.concept}"...`);
        const generatedIcon = await generateIconFromPrompt({
          concept: elem.concept || elem.name,
          style: params.style,
        });

        if (generatedIcon.success && generatedIcon.dataUrl) {
          nodes.push({
            id: nodeId,
            kind: 'icon',
            generatedIconUrl: generatedIcon.dataUrl,
            x: elem.x || 100 + (i % 4) * 180,
            y: elem.y || 100 + Math.floor(i / 4) * 160,
            w: 64,
            h: 64,
            label: {
              text: elem.name,
              placement: 'bottom',
              fontSize: 11,
              color: colors.text,
            },
          });
        } else {
          // Fallback to shape
          nodes.push({
            id: nodeId,
            kind: 'shape',
            shapeType: 'ellipse',
            x: elem.x || 100 + (i % 4) * 180,
            y: elem.y || 100 + Math.floor(i / 4) * 160,
            w: 100,
            h: 70,
            label: {
              text: elem.name,
              placement: 'center',
              fontSize: 12,
              color: '#ffffff',
            },
            style: {
              fill: colors.primary,
              stroke: colors.secondary,
              strokeWidth: 2,
            },
          });
        }
      }
    }

    // Step 3: Create connectors
    console.log(`[ImageGen] Step 3: Creating ${diagramData.connections?.length || 0} connectors...`);
    const connectors: DiagramSceneOutput['connectors'] = [];

    for (let i = 0; i < (diagramData.connections || []).length; i++) {
      const conn = diagramData.connections[i];
      const fromIdx = conn.from;
      const toIdx = conn.to;

      if (fromIdx >= 0 && fromIdx < nodes.length && toIdx >= 0 && toIdx < nodes.length) {
        connectors.push({
          id: `conn_${i + 1}`,
          from: { nodeId: nodes[fromIdx].id },
          to: { nodeId: nodes[toIdx].id },
          router: 'straight',
          style: {
            stroke: colors.connector,
            width: 2,
            arrowEnd: 'arrow',
          },
          label: conn.label ? {
            text: conn.label,
            fontSize: 10,
            color: colors.text,
          } : undefined,
        });
      }
    }

    // Step 4: Add title
    const texts: DiagramSceneOutput['texts'] = [{
      id: 'title',
      x: 50,
      y: 40,
      text: params.prompt.substring(0, 60),
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    }];

    const scene: DiagramSceneOutput = {
      version: '1.0.0',
      nodes,
      connectors,
      texts,
      metadata: {
        name: 'Generated Diagram',
        description: params.prompt,
      },
    };

    console.log(`[ImageGen] ✓ Generated diagram: ${nodes.length} nodes, ${connectors.length} connectors`);
    return { success: true, scene };

  } catch (error: any) {
    console.error('[ImageGen] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main diagram generation function
 * Priority order:
 * 1. SciSketch model (when VITE_HUGGINGFACE_API_TOKEN is configured) - trained on 30K+ biomedical abstracts
 * 2. Image-first Gemini approach
 * 3. Workflow analysis with Gemini
 * 4. Simple fallback
 */
export async function generateDiagramSceneWithSciSketch(params: {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
}): Promise<{ success: boolean; scene?: DiagramSceneOutput; error?: string; usedFallback?: boolean; modelUsed?: string }> {

  // Check if Hugging Face is configured
  if (isHuggingFaceEnabled()) {
    console.log('[DiagramGen] ✓ Hugging Face API token found');

    // Step 1: Try SciSketch model first (specialized for biomedical phrases)
    console.log('[DiagramGen] Step 1: Trying SciSketch model...');
    const sciSketchResult = await generateWithSciSketchModel(params);
    if (sciSketchResult.success && sciSketchResult.scene) {
      console.log('[DiagramGen] ✓ SciSketch generation successful');
      return { ...sciSketchResult, usedFallback: false, modelUsed: 'SciSketch (HuggingFace)' };
    }
    console.log('[DiagramGen] SciSketch failed:', sciSketchResult.error);

    // Step 2: Try general HuggingFace text analysis (Mistral/BioMistral)
    console.log('[DiagramGen] Step 2: Trying HuggingFace text analysis...');
    const hfResult = await generateWithHuggingFaceAnalysis(params);
    if (hfResult.success && hfResult.scene) {
      console.log('[DiagramGen] ✓ HuggingFace analysis successful');
      return { ...hfResult, usedFallback: false, modelUsed: `HuggingFace (${PREFERRED_HF_MODEL})` };
    }
    console.log('[DiagramGen] HuggingFace analysis failed:', hfResult.error);
  } else {
    console.log('[DiagramGen] No VITE_HUGGINGFACE_API_TOKEN configured');
  }

  // Step 3: Fallback to Gemini (if configured)
  if (GEMINI_API_KEY) {
    console.log('[DiagramGen] Step 3: Trying Gemini...');
    const imageResult = await generateDiagramFromVisual(params);
    if (imageResult.success && imageResult.scene) {
      console.log('[DiagramGen] ✓ Gemini image-first generation successful');
      return { ...imageResult, usedFallback: true, modelUsed: 'Gemini' };
    }

    const workflowResult = await generateScientificDiagramWithGemini(params);
    if (workflowResult.success && workflowResult.scene) {
      console.log('[DiagramGen] ✓ Gemini workflow analysis successful');
      return { ...workflowResult, usedFallback: true, modelUsed: 'Gemini' };
    }
  }

  // Step 4: Ultimate fallback (no AI, just parse prompt)
  console.warn('[DiagramGen] All AI methods failed, using simple fallback');
  return { ...await generateDiagramSceneLocal(params), usedFallback: true, modelUsed: 'Fallback (no AI)' };
}

/**
 * Connection type to visual style mapping
 * Maps biological relationship types to arrow styles
 */
const CONNECTION_STYLES: Record<string, {
  color: string;
  arrowEnd: string;
  dash?: number[];
  label?: string;
}> = {
  activates: { color: '#22C55E', arrowEnd: 'arrow', label: '→' },           // Green arrow
  inhibits: { color: '#EF4444', arrowEnd: 'tee', dash: [5, 3] },             // Red T-bar, dashed
  produces: { color: '#3B82F6', arrowEnd: 'arrow' },                          // Blue arrow
  converts: { color: '#8B5CF6', arrowEnd: 'open-arrow' },                     // Purple open arrow
  leads_to: { color: '#6B7280', arrowEnd: 'arrow' },                          // Gray arrow (default)
  regulates: { color: '#F59E0B', arrowEnd: 'diamond', dash: [8, 4] },        // Amber diamond, dashed
  binds: { color: '#EC4899', arrowEnd: 'circle' },                            // Pink circle (binding)
  catalyzes: { color: '#14B8A6', arrowEnd: 'arrow' },                         // Teal arrow (enzymatic)
};

/**
 * Generate diagram using HuggingFace text analysis
 * Uses Mistral or BioMistral to analyze scientific concepts
 * Features: Enhanced icon search, varied arrow types based on biological relationships
 */
async function generateWithHuggingFaceAnalysis(params: {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
}): Promise<{ success: boolean; scene?: DiagramSceneOutput; error?: string }> {
  const styleColors = {
    flat: { primary: '#4A90A4', secondary: '#2D5A6B', text: '#1a1a1a', connector: '#374151' },
    '3d': { primary: '#3B82F6', secondary: '#1D4ED8', text: '#111827', connector: '#4B5563' },
    sketch: { primary: '#6B7280', secondary: '#4B5563', text: '#1F2937', connector: '#6B7280' },
  };
  const colors = styleColors[params.style];

  try {
    // Step 1: Analyze scientific process with HuggingFace
    const analysisResult = await analyzeScientificProcessWithHuggingFace(params.prompt);

    if (!analysisResult.success || !analysisResult.workflow) {
      return { success: false, error: analysisResult.error || 'HuggingFace analysis failed' };
    }

    const workflow = analysisResult.workflow;
    console.log(`[HuggingFace] Workflow: ${workflow.steps.length} steps, ${workflow.connections.length} connections`);

    // Step 2: Fetch available icons
    const availableIcons = await fetchAvailableIcons();

    // Step 3: Build nodes with layout
    const nodes: DiagramSceneOutput['nodes'] = [];
    const nodeIdMap = new Map<string, string>();

    const cols = Math.min(4, Math.ceil(Math.sqrt(workflow.steps.length)));
    const spacingX = 200;
    const spacingY = 160;
    const startX = 100;
    const startY = 100;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      const nodeId = `node_${i + 1}`;

      nodeIdMap.set(step.id, nodeId);

      // Enhanced icon search using multiple search terms
      let matchedIcon: { id: string; name: string; category: string } | null = null;
      const searchTerms = step.iconSearchTerms || [step.iconConcept];

      // Try each search term until we find a match
      for (const term of searchTerms) {
        if (matchedIcon) break;

        // Database search first (most accurate)
        matchedIcon = await searchIconInDatabase(term);

        // Then try cached list
        if (!matchedIcon) {
          matchedIcon = findMatchingIcon(term, availableIcons);
        }
      }

      // Also try the full step name as last resort
      if (!matchedIcon && step.name.toLowerCase() !== step.iconConcept) {
        matchedIcon = await searchIconInDatabase(step.name);
        if (!matchedIcon) {
          matchedIcon = findMatchingIcon(step.name, availableIcons);
        }
      }

      if (matchedIcon) {
        console.log(`[HuggingFace] ✓ Icon found: "${step.iconConcept}" → "${matchedIcon.name}" [${matchedIcon.id.substring(0, 8)}...]`);
        nodes.push({
          id: nodeId,
          kind: 'icon',
          iconId: matchedIcon.id,
          x, y,
          w: 70, h: 70,
          label: { text: step.name, placement: 'bottom', fontSize: 11, color: colors.text },
        });
      } else {
        // No icon in database - generate with AI or use shape
        console.log(`[HuggingFace] No icon for "${step.iconConcept}" (tried: ${searchTerms.slice(0, 3).join(', ')}), generating...`);
        const generatedIcon = await generateIconFromPrompt({ concept: step.iconConcept, style: params.style });

        if (generatedIcon.success && generatedIcon.dataUrl) {
          console.log(`[HuggingFace] ✓ Generated AI icon for "${step.iconConcept}"`);
          nodes.push({
            id: nodeId,
            kind: 'icon',
            generatedIconUrl: generatedIcon.dataUrl,
            x, y,
            w: 64, h: 64,
            label: { text: step.name, placement: 'bottom', fontSize: 11, color: colors.text },
          });
        } else {
          // Use shape with type-specific styling
          console.log(`[HuggingFace] Using shape for "${step.name}" (type: ${step.type})`);
          const shapeType = step.type === 'process' ? 'rect' :
                          step.type === 'outcome' ? 'hexagon' :
                          step.type === 'concept' ? 'diamond' : 'ellipse';
          const fillColor = step.type === 'outcome' ? '#7CB342' :
                           step.type === 'process' ? colors.secondary :
                           colors.primary;

          nodes.push({
            id: nodeId,
            kind: 'shape',
            shapeType,
            x, y,
            w: 100, h: 70,
            label: { text: step.name, placement: 'center', fontSize: 12, color: '#ffffff' },
            style: { fill: fillColor, stroke: colors.secondary, strokeWidth: 2 },
          });
        }
      }
    }

    // Step 4: Create connectors with varied arrow types based on relationship
    console.log(`[HuggingFace] Creating ${workflow.connections.length} connectors with varied arrow types...`);
    const connectors: DiagramSceneOutput['connectors'] = [];

    for (let i = 0; i < workflow.connections.length; i++) {
      const conn = workflow.connections[i];
      const fromId = nodeIdMap.get(conn.from);
      const toId = nodeIdMap.get(conn.to);

      if (fromId && toId) {
        // Get style based on connection type
        const connStyle = CONNECTION_STYLES[conn.type] || CONNECTION_STYLES.leads_to;

        console.log(`[HuggingFace] Connector ${conn.from}→${conn.to}: type=${conn.type}, arrow=${connStyle.arrowEnd}, color=${connStyle.color}`);

        connectors.push({
          id: `conn_${i + 1}`,
          from: { nodeId: fromId },
          to: { nodeId: toId },
          router: 'straight',
          style: {
            stroke: connStyle.color,
            width: 2,
            dash: connStyle.dash,
            arrowEnd: connStyle.arrowEnd,
          },
          // Add label if connection has one or if it's a specific relationship type
          label: conn.label ? {
            text: conn.label,
            fontSize: 10,
            color: colors.text,
            backgroundColor: '#ffffff',
          } : undefined,
        });
      }
    }

    // Step 5: Add title and legend
    const texts: DiagramSceneOutput['texts'] = [{
      id: 'title',
      x: 50, y: 40,
      text: workflow.title,
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    }];

    // Add connection type indicators if we have varied types
    const usedTypes = [...new Set(workflow.connections.map(c => c.type))];
    if (usedTypes.length > 1 && usedTypes.some(t => t !== 'leads_to')) {
      // Add subtle legend
      const legendY = startY + Math.ceil(workflow.steps.length / cols) * spacingY + 40;
      texts.push({
        id: 'legend',
        x: 50, y: legendY,
        text: `Legend: ${usedTypes.map(t => {
          const s = CONNECTION_STYLES[t];
          return `${t} (${s?.arrowEnd || 'arrow'})`;
        }).join(' • ')}`,
        fontSize: 10,
        color: '#9CA3AF',
      });
    }

    const scene: DiagramSceneOutput = {
      version: '1.0.0',
      nodes,
      connectors,
      texts,
      metadata: { name: 'HuggingFace Generated Diagram', description: params.prompt },
    };

    console.log(`[HuggingFace] ✓ Generated: ${nodes.length} nodes, ${connectors.length} connectors (types: ${usedTypes.join(', ')})`);
    return { success: true, scene };

  } catch (error: any) {
    console.error('[HuggingFace] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate diagram using SciSketch Hugging Face model
 * Uses stevensu123/FlanT5PhraseGeneration trained on BioIllustra dataset (30K+ biomedical abstracts)
 */
async function generateWithSciSketchModel(params: {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
}): Promise<{ success: boolean; scene?: DiagramSceneOutput; error?: string }> {
  const styleColors = {
    flat: {
      primary: '#4A90A4',
      secondary: '#2D5A6B',
      accent: '#7CB342',
      highlight: '#FF7043',
      text: '#1a1a1a',
      connector: '#374151'
    },
    '3d': {
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      accent: '#10B981',
      highlight: '#F59E0B',
      text: '#111827',
      connector: '#4B5563'
    },
    sketch: {
      primary: '#6B7280',
      secondary: '#4B5563',
      accent: '#9CA3AF',
      highlight: '#374151',
      text: '#1F2937',
      connector: '#6B7280'
    }
  };

  const colors = styleColors[params.style];

  try {
    // Step 1: Call SciSketch model to generate biomedical phrases
    console.log('[SciSketch] Calling Hugging Face model...');
    const sciSketchResult = await callSciSketchModel(params.prompt);

    if (!sciSketchResult.success || !sciSketchResult.phrases || sciSketchResult.phrases.length === 0) {
      return { success: false, error: sciSketchResult.error || 'No phrases generated from SciSketch model' };
    }

    const phrases = sciSketchResult.phrases;
    console.log(`[SciSketch] Got ${phrases.length} phrases: ${phrases.join(', ')}`);

    // Step 2: Fetch available icons from database
    const availableIcons = await fetchAvailableIcons();
    console.log(`[SciSketch] Matching against ${availableIcons.length} icons in library`);

    // Step 3: Build nodes from phrases with smart layout
    const nodes: DiagramSceneOutput['nodes'] = [];
    const cols = Math.min(3, Math.ceil(Math.sqrt(phrases.length)));
    const spacingX = 180;
    const spacingY = 150;
    const startX = 120;
    const startY = 100;

    for (let i = 0; i < phrases.length && i < 12; i++) {
      const phrase = phrases[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      // Get enhanced search terms for better icon matching
      const searchTerms = getIconSearchTerms(phrase);

      // Try each search term until we find a match
      let matchedIcon: { id: string; name: string; category: string } | null = null;

      for (const term of searchTerms) {
        if (matchedIcon) break;

        // Database search first (most accurate)
        matchedIcon = await searchIconInDatabase(term);

        // Then try cached list
        if (!matchedIcon) {
          matchedIcon = findMatchingIcon(term, availableIcons);
        }
      }

      if (matchedIcon) {
        console.log(`[SciSketch] ✓ Icon found: "${phrase}" → "${matchedIcon.name}" [${matchedIcon.id.substring(0, 8)}...]`);
        nodes.push({
          id: `node_${i + 1}`,
          kind: 'icon',
          iconId: matchedIcon.id,
          x,
          y,
          w: 80,
          h: 80,
          label: {
            text: phrase,
            placement: 'bottom',
            fontSize: 11,
            color: colors.text,
          },
        });
      } else {
        // No matching icon - try to generate one with AI
        console.log(`[SciSketch] No icon for "${phrase}", generating with AI...`);
        const generatedIcon = await generateIconFromPrompt({
          concept: phrase,
          style: params.style,
        });

        if (generatedIcon.success && generatedIcon.dataUrl) {
          console.log(`[SciSketch] ✓ Generated AI icon for "${phrase}"`);
          nodes.push({
            id: `node_${i + 1}`,
            kind: 'icon',
            generatedIconUrl: generatedIcon.dataUrl,
            x,
            y,
            w: 64,
            h: 64,
            label: {
              text: phrase,
              placement: 'bottom',
              fontSize: 11,
              color: colors.text,
            },
          });
        } else {
          // Fall back to shape
          console.log(`[SciSketch] Using shape for "${phrase}"`);
          nodes.push({
            id: `node_${i + 1}`,
            kind: 'shape',
            shapeType: i % 2 === 0 ? 'ellipse' : 'rect',
            x,
            y,
            w: 100,
            h: 80,
            label: {
              text: phrase,
              placement: 'center',
              fontSize: 12,
              color: '#ffffff',
            },
            style: {
              fill: i % 2 === 0 ? colors.primary : colors.secondary,
              stroke: colors.secondary,
              strokeWidth: 2,
            },
          });
        }
      }
    }

    // Step 4: Create connectors between sequential nodes with inferred connection types
    const connectors: DiagramSceneOutput['connectors'] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const fromPhrase = phrases[i] || '';
      const toPhrase = phrases[i + 1] || '';
      const fromType = guessComponentType(fromPhrase);
      const toType = guessComponentType(toPhrase);

      // Infer connection type based on the phrases
      const inferredConn = inferConnectionType(fromPhrase, toPhrase, fromType, toType);
      const connStyle = CONNECTION_STYLES[inferredConn.type] || CONNECTION_STYLES.leads_to;

      console.log(`[SciSketch] Connector "${fromPhrase}" → "${toPhrase}": ${inferredConn.type} (${connStyle.arrowEnd})`);

      connectors.push({
        id: `conn_${i + 1}`,
        from: { nodeId: nodes[i].id },
        to: { nodeId: nodes[i + 1].id },
        router: 'straight',
        style: {
          stroke: connStyle.color,
          width: 2,
          dash: connStyle.dash,
          arrowEnd: connStyle.arrowEnd,
        },
        label: inferredConn.label ? {
          text: inferredConn.label,
          fontSize: 9,
          color: colors.text,
          backgroundColor: '#ffffff',
        } : undefined,
      });
    }

    // Step 5: Add title
    const texts: DiagramSceneOutput['texts'] = [{
      id: 'title',
      x: 50,
      y: 40,
      text: params.prompt.length > 70 ? params.prompt.substring(0, 67) + '...' : params.prompt,
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    }];

    const scene: DiagramSceneOutput = {
      version: '1.0.0',
      nodes,
      connectors,
      texts,
      metadata: {
        name: 'SciSketch Generated Diagram',
        description: params.prompt,
      },
    };

    console.log(`[SciSketch] ✓ Generated diagram: ${nodes.length} nodes, ${connectors.length} connectors`);
    return { success: true, scene };

  } catch (error: any) {
    console.error('[SciSketch] Error:', error);
    return { success: false, error: error.message || 'SciSketch generation failed' };
  }
}

/**
 * Legacy function - kept for compatibility
 * @deprecated Use generateDiagramSceneWithSciSketch instead
 */
async function legacySciSketchGeneration(params: {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
}): Promise<{ success: boolean; scene?: DiagramSceneOutput; error?: string; usedFallback?: boolean }> {
  const styleColors = {
    flat: {
      primary: '#4A90A4',
      secondary: '#2D5A6B',
      accent: '#7CB342',
      highlight: '#FF7043',
      background: '#E8F4F8',
      text: '#1a1a1a',
      connector: '#374151'
    },
    '3d': {
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      accent: '#10B981',
      highlight: '#F59E0B',
      background: '#F3F4F6',
      text: '#111827',
      connector: '#4B5563'
    },
    sketch: {
      primary: '#6B7280',
      secondary: '#4B5563',
      accent: '#9CA3AF',
      highlight: '#374151',
      background: '#F9FAFB',
      text: '#1F2937',
      connector: '#6B7280'
    }
  };

  const colors = styleColors[params.style];

  try {
    // Step 1: Call SciSketch model to generate phrases
    console.log('[SciSketch] Starting diagram generation...');
    const sciSketchResult = await callSciSketchModel(params.prompt);

    if (!sciSketchResult.success || !sciSketchResult.phrases) {
      console.warn('[SciSketch] Model failed, falling back to advanced Gemini generation:', sciSketchResult.error);
      // Fall back to advanced multi-step Gemini generation
      console.log('[Gemini] Using advanced scientific diagram generation...');
      const geminiResult = await generateScientificDiagramWithGemini(params);
      if (geminiResult.success) {
        return { ...geminiResult, usedFallback: true };
      }
      // If advanced generation fails, use simple fallback
      console.warn('[Gemini] Advanced generation failed, using simple fallback');
      return { ...await generateDiagramSceneLocal(params), usedFallback: true };
    }

    const phrases = sciSketchResult.phrases;
    console.log(`[SciSketch] Got ${phrases.length} phrases, matching icons...`);

    // Step 2: Fetch icons and match phrases to icons
    const availableIcons = await fetchAvailableIcons();

    // Step 3: Build nodes from phrases with smart layout
    const nodes: DiagramSceneOutput['nodes'] = [];
    const cols = Math.min(3, Math.ceil(Math.sqrt(phrases.length)));
    const nodeWidth = 100;
    const nodeHeight = 80;
    const spacingX = 180;
    const spacingY = 150;
    const startX = 120;
    const startY = 100;

    for (let i = 0; i < phrases.length && i < 12; i++) {
      const phrase = phrases[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      // Try to find matching icon
      const matchedIcon = findMatchingIcon(phrase, availableIcons);

      if (matchedIcon) {
        console.log(`[SciSketch] ✓ Matched "${phrase}" → icon "${matchedIcon.name}"`);
        nodes.push({
          id: `node_${i + 1}`,
          kind: 'icon',
          iconId: matchedIcon.id,
          x,
          y,
          w: 80,
          h: 80,
          label: {
            text: phrase,
            placement: 'bottom',
            fontSize: 11,
            color: colors.text,
          },
        });
      } else {
        // No matching icon in database - try to generate one with AI
        console.log(`[SciSketch] ✗ No icon for "${phrase}", attempting AI generation...`);

        const generatedIcon = await generateIconFromPrompt({
          concept: phrase,
          style: params.style,
        });

        if (generatedIcon.success && generatedIcon.dataUrl) {
          console.log(`[SciSketch] ✓ Generated AI icon for "${phrase}"`);
          nodes.push({
            id: `node_${i + 1}`,
            kind: 'icon',
            generatedIconUrl: generatedIcon.dataUrl,
            x,
            y,
            w: 64,
            h: 64,
            label: {
              text: phrase,
              placement: 'bottom',
              fontSize: 11,
              color: colors.text,
            },
          });
        } else {
          // AI generation failed, fall back to shape
          console.log(`[SciSketch] ✗ AI icon generation failed for "${phrase}", using shape`);
          nodes.push({
            id: `node_${i + 1}`,
            kind: 'shape',
            shapeType: i % 2 === 0 ? 'ellipse' : 'rect',
            x,
            y,
            w: nodeWidth,
            h: nodeHeight,
            label: {
              text: phrase,
              placement: 'center',
              fontSize: 12,
              color: '#ffffff',
            },
            style: {
              fill: i % 2 === 0 ? colors.primary : colors.secondary,
              stroke: colors.secondary,
              strokeWidth: 2,
            },
          });
        }
      }
    }

    // Step 4: Create connectors between sequential nodes (linear flow)
    const connectors: DiagramSceneOutput['connectors'] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      // Connect nodes in reading order, with some branching for larger diagrams
      const fromNode = nodes[i];
      const toNode = nodes[i + 1];

      connectors.push({
        id: `conn_${i + 1}`,
        from: { nodeId: fromNode.id },
        to: { nodeId: toNode.id },
        router: 'straight',
        style: {
          stroke: colors.connector,
          width: 2,
          arrowEnd: 'arrow',
        },
      });
    }

    // Step 5: Add title text
    const texts: DiagramSceneOutput['texts'] = [{
      id: 'title',
      x: 50,
      y: 40,
      text: params.prompt.length > 70 ? params.prompt.substring(0, 67) + '...' : params.prompt,
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    }];

    const scene: DiagramSceneOutput = {
      version: '1.0.0',
      nodes,
      connectors,
      texts,
      metadata: {
        name: 'SciSketch Generated Diagram',
        description: params.prompt,
      },
    };

    console.log(`[SciSketch] Generated diagram with ${nodes.length} nodes, ${connectors.length} connectors`);
    return { success: true, scene, usedFallback: false };

  } catch (error: any) {
    console.error('[SciSketch] Error generating diagram:', error);
    // Fall back to advanced Gemini generation
    console.log('[Gemini] Using advanced scientific diagram generation as fallback...');
    try {
      const geminiResult = await generateScientificDiagramWithGemini(params);
      if (geminiResult.success) {
        return { ...geminiResult, usedFallback: true };
      }
    } catch (geminiError) {
      console.error('[Gemini] Advanced generation also failed:', geminiError);
    }
    // Ultimate fallback to simple generation
    return { ...await generateDiagramSceneLocal(params), usedFallback: true };
  }
}

/**
 * Generate a fallback diagram when JSON parsing fails
 */
function generateFallbackDiagram(
  prompt: string,
  colors: { primary: string; secondary: string; connector: string; text: string }
): { success: boolean; scene: DiagramSceneOutput } {
  console.log('Using fallback diagram generation for:', prompt);

  // Extract meaningful words from the prompt
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her', 'who', 'what', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once', 'show', 'showing', 'create', 'make', 'diagram', 'figure', 'illustration', 'display', 'visualize']);

  const words = prompt.toLowerCase()
    .split(/[\s,\-\/]+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, 6);

  // If we got no words, create a simple diagram
  const concepts = words.length > 0 ? words : ['Concept 1', 'Concept 2', 'Concept 3'];

  const fallbackScene: DiagramSceneOutput = {
    version: '1.0.0',
    nodes: concepts.map((word, i) => ({
      id: `node_${i + 1}`,
      kind: 'shape' as const,
      shapeType: (i % 2 === 0 ? 'ellipse' : 'rect') as 'ellipse' | 'rect',
      x: 120 + (i % 3) * 220,
      y: 120 + Math.floor(i / 3) * 160,
      w: 130,
      h: 85,
      label: {
        text: word.charAt(0).toUpperCase() + word.slice(1),
        placement: 'center' as const,
        fontSize: 14,
        color: '#ffffff',
      },
      style: {
        fill: i % 2 === 0 ? colors.primary : colors.secondary,
        stroke: colors.secondary,
        strokeWidth: 2,
      },
    })),
    connectors: concepts.length > 1 ? concepts.slice(1).map((_, i) => ({
      id: `conn_${i + 1}`,
      from: { nodeId: `node_${i + 1}` },
      to: { nodeId: `node_${i + 2}` },
      router: 'straight' as const,
      style: {
        stroke: colors.connector,
        width: 2,
        arrowEnd: 'arrow',
      },
    })) : [],
    texts: [{
      id: 'title',
      x: 50,
      y: 40,
      text: prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt,
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: colors.text,
    }],
    metadata: {
      name: 'Generated Diagram',
      description: prompt,
    },
  };

  console.log('Fallback diagram generated with', fallbackScene.nodes.length, 'nodes');
  return { success: true, scene: fallbackScene };
}

/**
 * Generate a DiagramScene JSON from a text prompt
 * This produces editable nodes, connectors, and text elements for the canvas
 */
export async function generateDiagramSceneLocal(params: {
  prompt: string;
  style: 'flat' | '3d' | 'sketch';
  complexity?: 'simple' | 'medium' | 'detailed';
}): Promise<{ success: boolean; scene?: DiagramSceneOutput; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.' };
  }

  try {
    // Fetch available icons from library
    const availableIcons = await fetchAvailableIcons();
    console.log(`Found ${availableIcons.length} icons in database`);
    if (availableIcons.length > 0) {
      console.log('Sample icons:', availableIcons.slice(0, 10).map(i => `${i.name} (${i.category})`));
    }
    const iconCategories = [...new Set(availableIcons.map(i => i.category))];

    // Create a summary of available icons for the AI
    const iconSummary = iconCategories.map(cat => {
      const catIcons = availableIcons.filter(i => i.category === cat).slice(0, 20);
      return `${cat}: ${catIcons.map(i => i.name).join(', ')}`;
    }).join('\n');

    const styleColors = {
      flat: {
        primary: '#4A90A4',
        secondary: '#2D5A6B',
        accent: '#7CB342',
        highlight: '#FF7043',
        background: '#E8F4F8',
        text: '#1a1a1a',
        connector: '#374151'
      },
      '3d': {
        primary: '#3B82F6',
        secondary: '#1D4ED8',
        accent: '#10B981',
        highlight: '#F59E0B',
        background: '#F3F4F6',
        text: '#111827',
        connector: '#4B5563'
      },
      sketch: {
        primary: '#6B7280',
        secondary: '#4B5563',
        accent: '#9CA3AF',
        highlight: '#374151',
        background: '#F9FAFB',
        text: '#1F2937',
        connector: '#6B7280'
      }
    };

    const colors = styleColors[params.style];
    const complexity = params.complexity || 'medium';

    // Build prompt with icon information
    const nodeCount = complexity === 'simple' ? '3-4' : complexity === 'detailed' ? '8-12' : '5-7';

    // Group icons by category for better AI understanding
    const iconsByCategory: Record<string, string[]> = {};
    for (const icon of availableIcons.slice(0, 100)) {
      const cat = icon.category || 'other';
      if (!iconsByCategory[cat]) iconsByCategory[cat] = [];
      if (iconsByCategory[cat].length < 15) {
        iconsByCategory[cat].push(icon.name);
      }
    }

    const iconList = Object.entries(iconsByCategory)
      .map(([cat, names]) => `  ${cat}: ${names.join(', ')}`)
      .join('\n');

    const systemPrompt = `Generate a JSON diagram for: "${params.prompt}"

Return ONLY valid JSON:
{
  "version": "1.0.0",
  "nodes": [
    {"id": "n1", "kind": "icon", "iconName": "heart", "x": 100, "y": 150, "w": 80, "h": 80, "label": {"text": "Heart", "placement": "bottom", "fontSize": 12}},
    {"id": "n2", "kind": "shape", "shapeType": "rect", "x": 300, "y": 150, "w": 120, "h": 70, "label": {"text": "Process", "placement": "center"}, "style": {"fill": "${colors.primary}", "stroke": "${colors.secondary}", "strokeWidth": 2}}
  ],
  "connectors": [
    {"id": "c1", "from": {"nodeId": "n1"}, "to": {"nodeId": "n2"}, "router": "straight", "style": {"stroke": "${colors.connector}", "width": 2, "arrowEnd": "arrow"}}
  ],
  "texts": [
    {"id": "t1", "x": 50, "y": 30, "text": "Title", "fontSize": 20, "fontWeight": "bold", "color": "${colors.text}"}
  ]
}

AVAILABLE ICONS (use kind="icon" with iconName matching these):
${iconList || 'No icons available - use shapes'}

RULES:
- Create ${nodeCount} nodes for the main concepts
- PREFER using kind="icon" with iconName when an icon matches the concept (organs, cells, molecules, etc.)
- Use kind="shape" only when no matching icon exists (shapeType: ellipse, rect, diamond, hexagon)
- ALL connectors must have "arrowEnd": "arrow" to show direction
- Position: x from 80-720, y from 100-500, spacing 150px+
- Icon nodes: w=70-90, h=70-90, label placement="bottom"
- Shape nodes: w=100-140, h=60-80, label placement="center"

Output ONLY the JSON.`;

    const requestBody = {
      contents: [{
        parts: [
          { text: systemPrompt }
        ]
      }],
      generationConfig: {
        temperature: 0.4, // Lower temperature for more consistent JSON
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        // Try to get JSON output
        responseMimeType: 'application/json',
      }
    };

    const response = await callGeminiAPI(requestBody, false);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (!textPart?.text) {
      return { success: false, error: 'No response from API' };
    }

    console.log('Raw AI response:', textPart.text.substring(0, 1000));

    // Try multiple strategies to extract valid JSON
    let jsonString: string | null = null;

    // Strategy 1: Clean the response and extract JSON
    const extractJson = (text: string): string | null => {
      // Remove markdown code blocks
      let cleaned = text.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/gi, '')
        .trim();

      // Find opening brace
      const startIndex = cleaned.indexOf('{');
      if (startIndex === -1) return null;

      // Find matching closing brace using brace counting
      let braceCount = 0;
      let endIndex = -1;
      let inString = false;
      let escapeNext = false;

      for (let i = startIndex; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\' && inString) {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }

      if (endIndex === -1) {
        // Try to fix by adding missing closing braces
        const missingBraces = braceCount;
        if (missingBraces > 0 && missingBraces <= 3) {
          console.log(`Attempting to fix JSON by adding ${missingBraces} closing braces`);
          return cleaned.substring(startIndex) + '}'.repeat(missingBraces);
        }
        return null;
      }

      return cleaned.substring(startIndex, endIndex);
    };

    // Strategy 2: Clean common JSON issues
    const cleanJson = (json: string): string => {
      return json
        // Remove trailing commas before } or ]
        .replace(/,(\s*[}\]])/g, '$1')
        // Remove comments
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Fix unquoted property names (basic)
        .replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Remove control characters that break JSON
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        // Fix single quotes to double quotes (outside of strings)
        .replace(/'/g, '"');
    };

    // Try Strategy 1: Extract and clean
    const extracted = extractJson(textPart.text);
    if (extracted) {
      jsonString = cleanJson(extracted);
      console.log('Extracted JSON (first 500 chars):', jsonString.substring(0, 500));
    }

    // Strategy 3: If extraction failed, try parsing the whole response as JSON
    if (!jsonString) {
      const wholeCleaned = cleanJson(textPart.text.trim());
      if (wholeCleaned.startsWith('{')) {
        jsonString = wholeCleaned;
        console.log('Using whole response as JSON');
      }
    }

    // Strategy 4: Look for JSON in response using regex patterns
    if (!jsonString) {
      // Try to find a JSON object pattern
      const jsonPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      const matches = textPart.text.match(jsonPattern);
      if (matches && matches.length > 0) {
        // Find the largest match (most complete JSON)
        jsonString = matches.reduce((a, b) => a.length > b.length ? a : b);
        jsonString = cleanJson(jsonString);
        console.log('Found JSON via regex pattern');
      }
    }

    // If no valid JSON was extracted, use fallback
    if (!jsonString) {
      console.warn('Could not extract valid JSON from AI response, using fallback');
      return generateFallbackDiagram(params.prompt, colors);
    }

    try {
      const rawScene = JSON.parse(jsonString);

      // Post-process: match iconName to actual icon IDs
      console.log('Processing nodes:', rawScene.nodes?.length || 0, 'nodes');

      const scene: DiagramSceneOutput = {
        ...rawScene,
        nodes: (rawScene.nodes || []).map((node: any, i: number) => {
          // If this is an icon node with iconName, try to find matching icon
          if (node.kind === 'icon' && node.iconName) {
            console.log(`Looking for icon: "${node.iconName}"`);
            const matchedIcon = findMatchingIcon(node.iconName, availableIcons);
            if (matchedIcon) {
              console.log(`  ✓ Matched "${node.iconName}" → "${matchedIcon.name}" (${matchedIcon.id})`);
              return {
                id: node.id || `node_${i + 1}`,
                kind: 'icon' as const,
                iconId: matchedIcon.id,
                x: node.x ?? 100 + (i * 150),
                y: node.y ?? 100 + (i * 100),
                w: node.w ?? 80,
                h: node.h ?? 80,
                rotation: node.rotation,
                label: node.label ? {
                  ...node.label,
                  placement: node.label.placement || 'bottom',
                } : {
                  text: node.iconName,
                  placement: 'bottom' as const,
                  fontSize: 12,
                },
              };
            } else {
              // No matching icon found, convert to shape
              console.log(`  ✗ No icon found for "${node.iconName}", using shape`);
              return {
                id: node.id || `node_${i + 1}`,
                kind: 'shape' as const,
                shapeType: 'ellipse' as const,
                x: node.x ?? 100 + (i * 150),
                y: node.y ?? 100 + (i * 100),
                w: node.w ?? 100,
                h: node.h ?? 80,
                rotation: node.rotation,
                label: node.label ? {
                  ...node.label,
                  text: node.label.text || node.iconName,
                  placement: 'center',
                } : { text: node.iconName, placement: 'center' as const },
                style: node.style || {
                  fill: colors.primary,
                  stroke: colors.secondary,
                  strokeWidth: 2,
                },
              };
            }
          }

          // For shape nodes, ensure proper structure
          return {
            id: node.id || `node_${i + 1}`,
            kind: node.kind || 'shape',
            shapeType: node.shapeType || 'rect',
            x: node.x ?? 100 + (i * 150),
            y: node.y ?? 100 + (i * 100),
            w: node.w ?? 100,
            h: node.h ?? 80,
            rotation: node.rotation,
            label: node.label,
            style: node.style || {
              fill: colors.primary,
              stroke: colors.secondary,
              strokeWidth: 2,
            },
          };
        }),
      };

      // Ensure other arrays exist
      if (!scene.connectors) scene.connectors = [];
      if (!scene.texts) scene.texts = [];
      if (!scene.version) scene.version = '1.0.0';

      // Ensure all connectors have required fields
      scene.connectors = (rawScene.connectors || []).map((conn: any, i: number) => ({
        id: conn.id || `conn_${i + 1}`,
        from: conn.from || { nodeId: scene.nodes[0]?.id || '' },
        to: conn.to || { nodeId: scene.nodes[1]?.id || '' },
        router: conn.router || 'straight',
        style: conn.style || {
          stroke: colors.connector,
          width: 2,
          arrowEnd: 'arrow',
        },
        label: conn.label,
      }));

      // Ensure all texts have required fields
      scene.texts = (rawScene.texts || []).map((text: any, i: number) => ({
        id: text.id || `text_${i + 1}`,
        x: text.x ?? 50,
        y: text.y ?? 30 + (i * 30),
        text: text.text || '',
        fontSize: text.fontSize || 16,
        fontFamily: text.fontFamily || 'Inter',
        fontWeight: text.fontWeight || 'normal',
        color: text.color || colors.text,
        textAlign: text.textAlign || 'left',
      }));

      console.log('Generated DiagramScene:', scene);
      console.log(`Nodes: ${scene.nodes.length}, Connectors: ${scene.connectors.length}, Texts: ${scene.texts.length}`);
      return { success: true, scene };
    } catch (parseErr: any) {
      console.error('JSON parse error:', parseErr);
      console.error('Attempted to parse:', jsonString?.substring(0, 1000));
      return generateFallbackDiagram(params.prompt, colors);
    }
  } catch (error: any) {
    console.error('Local AI error:', error);
    return { success: false, error: error.message || 'Failed to generate diagram' };
  }
}

/**
 * Chat with AI about scientific concepts
 */
export async function chatWithAI(params: {
  message: string;
  context?: string;
  image?: string;
}): Promise<{ success: boolean; response?: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured' };
  }

  try {
    const systemPrompt = `You are a helpful scientific illustration assistant. Help users with:
- Creating scientific diagrams and figures
- Understanding biological/scientific concepts
- Suggesting improvements to their illustrations
- Explaining scientific processes that could be visualized

Be concise and helpful.`;

    const parts: any[] = [];

    if (params.image) {
      const base64Data = params.image.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }

    parts.push({
      text: `${systemPrompt}\n\n${params.context ? `Context: ${params.context}\n\n` : ''}User: ${params.message}`
    });

    const requestBody = {
      contents: [{
        parts
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    // Use helper to try multiple models
    const response = await callGeminiAPI(requestBody, !!params.image);
    const data: GeminiResponse = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart?.text) {
      return { success: true, response: textPart.text };
    }

    return { success: false, error: 'No response from AI' };
  } catch (error: any) {
    console.error('Local AI error:', error);
    return { success: false, error: error.message || 'Failed to get response' };
  }
}
