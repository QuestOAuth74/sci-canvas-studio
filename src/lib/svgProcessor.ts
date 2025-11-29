/**
 * SVG Processing Utilities
 * Validates, cleans, and optimizes SVG content for icon usage
 */

export interface SVGValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates SVG content for icon usage
 * Checks for embedded rasters, basic structure, and XML validity
 */
export function validateSVG(svgContent: string): SVGValidationResult {
  const errors: string[] = [];
  
  // Check for embedded raster images (not true vector)
  if (svgContent.includes('<image')) {
    errors.push('Contains embedded raster image - not pure vector');
  }
  
  // Check for basic SVG structure
  if (!svgContent.includes('<svg')) {
    errors.push('Missing SVG root element');
  }
  
  // Check for closing tag
  if (!svgContent.includes('</svg>')) {
    errors.push('Missing SVG closing tag');
  }
  
  // Parse and validate XML
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      errors.push('Invalid SVG syntax - XML parse error');
    }
  } catch (e) {
    errors.push('Failed to parse SVG as XML');
  }
  
  // Check for minimum content (should have paths, shapes, or text)
  const hasContent = svgContent.match(/<(path|rect|circle|ellipse|polygon|polyline|line|text|g)\s/);
  if (!hasContent) {
    errors.push('SVG appears empty - no drawable elements found');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Cleans up SVG content by removing unnecessary attributes and normalizing structure
 */
export function cleanupSVG(svgContent: string): string {
  let cleaned = svgContent.trim();
  
  // Ensure viewBox exists (standardize to 512x512 for icons)
  if (!cleaned.includes('viewBox')) {
    cleaned = cleaned.replace(
      /<svg([^>]*)>/,
      '<svg$1 viewBox="0 0 512 512">'
    );
  }
  
  // Remove markdown code fences if present
  cleaned = cleaned.replace(/```svg?\n?/g, '').replace(/```\n?/g, '');
  
  // Remove unnecessary id attributes (can cause conflicts)
  cleaned = cleaned.replace(/\sid="[^"]*"/g, '');
  
  // Remove empty class attributes
  cleaned = cleaned.replace(/\sclass=""/g, '');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Optimizes SVG for icon usage by ensuring proper dimensions and structure
 */
export function optimizeSVGForIcon(svgContent: string): string {
  let optimized = svgContent;
  
  // Add xmlns if missing (required for standalone SVG)
  if (!optimized.includes('xmlns=')) {
    optimized = optimized.replace(
      /<svg/,
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }
  
  // Ensure consistent dimensions (512x512 for icon library)
  optimized = optimized
    .replace(/width="[^"]*"/g, 'width="512"')
    .replace(/height="[^"]*"/g, 'height="512"');
  
  // If no width/height attributes, add them
  if (!optimized.includes('width=')) {
    optimized = optimized.replace(
      /<svg([^>]*)/,
      '<svg$1 width="512" height="512"'
    );
  }
  
  return optimized;
}

/**
 * Extracts SVG content from AI response that might include markdown or extra text
 */
export function extractSVG(content: string): string | null {
  // Try to match SVG tags
  const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    return svgMatch[0];
  }
  
  // No SVG found
  return null;
}

/**
 * Complete SVG processing pipeline: extract, clean, validate, and optimize
 */
export function processSVG(rawContent: string): { success: boolean; svg?: string; error?: string } {
  // Extract SVG from potential markdown/text wrapper
  const extracted = extractSVG(rawContent);
  if (!extracted) {
    return { success: false, error: 'No SVG content found in response' };
  }
  
  // Clean up the SVG
  const cleaned = cleanupSVG(extracted);
  
  // Validate
  const validation = validateSVG(cleaned);
  if (!validation.valid) {
    return { 
      success: false, 
      error: `SVG validation failed: ${validation.errors.join(', ')}` 
    };
  }
  
  // Optimize for icon usage
  const optimized = optimizeSVGForIcon(cleaned);
  
  return { success: true, svg: optimized };
}
