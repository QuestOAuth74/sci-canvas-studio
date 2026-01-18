/**
 * Figure Detection Utilities
 * Handles AI-based detection of elements in scientific figures
 */

import { supabase } from '@/integrations/supabase/client';
import {
  AnyDetectedElement,
  DetectedText,
  DetectedIcon,
  DetectedArrow,
  DetectedBox,
  SceneGraph,
} from '@/types/figureReconstruction';

interface DetectionResult {
  success: boolean;
  elements: AnyDetectedElement[];
  canvasWidth: number;
  canvasHeight: number;
  error?: string;
}

/**
 * Detect elements in an image using AI vision
 */
export async function detectFigureElements(
  imageBase64: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<DetectionResult> {
  try {
    onProgress?.('Analyzing image structure...', 10);

    const { data, error } = await supabase.functions.invoke('detect-figure-elements', {
      body: { image: imageBase64 },
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Detection failed');
    }

    onProgress?.('Processing detected elements...', 80);

    // Transform raw detection results into typed elements
    const elements: AnyDetectedElement[] = data.elements.map((el: any, index: number) => {
      const baseElement = {
        id: `elem-${Date.now()}-${index}`,
        label: el.label || `Element ${index + 1}`,
        bbox: {
          x: el.x || el.bbox?.x || 0,
          y: el.y || el.bbox?.y || 0,
          width: el.width || el.bbox?.width || 100,
          height: el.height || el.bbox?.height || 50,
        },
        status: 'pending' as const,
        confidence: el.confidence || 0.8,
        metadata: el.metadata,
      };

      switch (el.type) {
        case 'text':
          return {
            ...baseElement,
            type: 'text',
            content: el.content || el.text || el.label || '',
            fontSize: el.fontSize || 14,
            fontWeight: el.fontWeight || 'normal',
            color: el.color || '#000000',
          } as DetectedText;

        case 'icon':
          return {
            ...baseElement,
            type: 'icon',
            queryTerms: el.queryTerms || el.keywords || [el.label],
            matchedIconId: el.matchedIconId,
            matchedIconName: el.matchedIconName,
            matchScore: el.matchScore,
          } as DetectedIcon;

        case 'arrow':
          return {
            ...baseElement,
            type: 'arrow',
            startPoint: el.startPoint || { x: baseElement.bbox.x, y: baseElement.bbox.y + baseElement.bbox.height / 2 },
            endPoint: el.endPoint || { x: baseElement.bbox.x + baseElement.bbox.width, y: baseElement.bbox.y + baseElement.bbox.height / 2 },
            bendPoints: el.bendPoints || [],
            style: el.style || 'solid',
            headType: el.headType || 'arrow',
            tailType: el.tailType || 'none',
            color: el.color || '#000000',
            strokeWidth: el.strokeWidth || 2,
          } as DetectedArrow;

        case 'box':
        default:
          return {
            ...baseElement,
            type: 'box',
            fillColor: el.fillColor || 'transparent',
            strokeColor: el.strokeColor || '#000000',
            strokeWidth: el.strokeWidth || 1,
            cornerRadius: el.cornerRadius || 0,
          } as DetectedBox;
      }
    });

    onProgress?.('Detection complete', 100);

    return {
      success: true,
      elements,
      canvasWidth: data.canvasWidth || 800,
      canvasHeight: data.canvasHeight || 600,
    };
  } catch (error) {
    console.error('Detection error:', error);
    return {
      success: false,
      elements: [],
      canvasWidth: 800,
      canvasHeight: 600,
      error: error instanceof Error ? error.message : 'Detection failed',
    };
  }
}

/**
 * Create a scene graph from detected elements
 */
export function createSceneGraph(
  sourceImageUrl: string,
  elements: AnyDetectedElement[],
  canvasWidth: number,
  canvasHeight: number
): SceneGraph {
  return {
    version: '1.0',
    sourceImageUrl,
    canvasWidth,
    canvasHeight,
    elements,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update scene graph with modified elements
 */
export function updateSceneGraph(
  sceneGraph: SceneGraph,
  elements: AnyDetectedElement[]
): SceneGraph {
  return {
    ...sceneGraph,
    elements,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Search for matching icons based on query terms
 */
export async function searchIconMatches(
  queryTerms: string[],
  limit: number = 8
): Promise<Array<{ id: string; name: string; category: string; thumbnail?: string; svgContent?: string; score: number }>> {
  try {
    const query = queryTerms.join(' ');
    
    const { data, error } = await supabase
      .from('icons')
      .select('id, name, category, thumbnail, svg_content')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Icon search error:', error);
      return [];
    }

    // Score results based on match quality
    return (data || []).map((icon, index) => ({
      id: icon.id,
      name: icon.name,
      category: icon.category,
      thumbnail: icon.thumbnail,
      svgContent: icon.svg_content,
      score: 1 - (index * 0.1), // Simple scoring based on order
    }));
  } catch (error) {
    console.error('Icon search error:', error);
    return [];
  }
}

/**
 * Group elements by type for sidebar display
 */
export function groupElementsByType(elements: AnyDetectedElement[]): {
  text: DetectedText[];
  icons: DetectedIcon[];
  arrows: DetectedArrow[];
  boxes: DetectedBox[];
} {
  return {
    text: elements.filter((e): e is DetectedText => e.type === 'text'),
    icons: elements.filter((e): e is DetectedIcon => e.type === 'icon'),
    arrows: elements.filter((e): e is DetectedArrow => e.type === 'arrow'),
    boxes: elements.filter((e): e is DetectedBox => e.type === 'box'),
  };
}
