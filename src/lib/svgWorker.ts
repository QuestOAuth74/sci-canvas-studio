// Web Worker for SVG parsing to prevent main thread blocking
// Note: Fabric.js cannot run in Web Worker, so we only validate and preprocess SVG here

const MAX_SVG_SIZE = 1024 * 1024; // 1MB limit
const MAX_COMPLEXITY_SCORE = 1000;

interface SVGParseMessage {
  type: 'parse';
  svgContent: string;
  id: string;
}

interface SVGParseResult {
  type: 'success' | 'error' | 'too-complex';
  id: string;
  data?: any;
  error?: string;
  complexity?: number;
}

// Calculate SVG complexity score
function calculateComplexity(svgContent: string): number {
  let score = 0;
  
  // Count elements that add complexity
  score += (svgContent.match(/<path/g) || []).length * 5;
  score += (svgContent.match(/<polygon/g) || []).length * 3;
  score += (svgContent.match(/<circle/g) || []).length * 1;
  score += (svgContent.match(/<rect/g) || []).length * 1;
  score += (svgContent.match(/<text/g) || []).length * 2;
  score += (svgContent.match(/transform=/g) || []).length * 2;
  score += (svgContent.match(/filter=/g) || []).length * 10;
  
  return score;
}

// Simplify complex SVG by removing unnecessary attributes
function simplifySVG(svgContent: string): string {
  return svgContent
    .replace(/id="[^"]*"/g, '') // Remove IDs
    .replace(/class="[^"]*"/g, '') // Remove classes
    .replace(/style="[^"]*opacity:\s*0[^"]*"/g, 'style="display:none"') // Hide invisible elements
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

self.onmessage = async (e: MessageEvent<SVGParseMessage>) => {
  const { type, svgContent, id } = e.data;
  
  if (type !== 'parse') return;
  
  try {
    // Check size
    if (svgContent.length > MAX_SVG_SIZE) {
      const result: SVGParseResult = {
        type: 'error',
        id,
        error: `SVG too large (${(svgContent.length / 1024).toFixed(0)}KB). Maximum size is 1MB.`
      };
      self.postMessage(result);
      return;
    }
    
    // Check complexity
    const complexity = calculateComplexity(svgContent);
    if (complexity > MAX_COMPLEXITY_SCORE) {
      const result: SVGParseResult = {
        type: 'too-complex',
        id,
        error: `SVG too complex (score: ${complexity}). Try simplifying the graphic.`,
        complexity
      };
      self.postMessage(result);
      return;
    }
    
    // Simplify if moderately complex
    const processedSvg = complexity > 500 ? simplifySVG(svgContent) : svgContent;
    
    // Parse SVG (note: fabric.loadSVGFromString doesn't work in worker)
    // So we'll return the processed SVG and let main thread do final parsing
    const result: SVGParseResult = {
      type: 'success',
      id,
      data: {
        svgContent: processedSvg,
        complexity,
        simplified: complexity > 500
      }
    };
    
    self.postMessage(result);
  } catch (error) {
    const result: SVGParseResult = {
      type: 'error',
      id,
      error: error instanceof Error ? error.message : 'Failed to process SVG'
    };
    self.postMessage(result);
  }
};
