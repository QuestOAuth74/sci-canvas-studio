/**
 * Icon Resolver - Fetch and cache icons from internal library
 */

import { supabase } from '@/integrations/supabase/client';
import { iconCache } from '@/lib/iconCache';

export interface ResolvedIcon {
  id: string;
  name: string;
  svgContent: string;
  thumbnail?: string;
  category?: string;
}

// Memory cache for faster repeated access
const memoryCache = new Map<string, ResolvedIcon>();
const pendingFetches = new Map<string, Promise<ResolvedIcon | null>>();

// Batch queue for efficient fetching
let batchQueue: string[] = [];
let batchTimeout: NodeJS.Timeout | null = null;
const BATCH_DELAY = 50; // ms

/**
 * Resolve a single icon by ID
 */
export async function resolveIcon(iconId: string): Promise<ResolvedIcon | null> {
  // Check memory cache first
  if (memoryCache.has(iconId)) {
    return memoryCache.get(iconId)!;
  }

  // Check IndexedDB cache
  const cached = await iconCache.get(iconId);
  if (cached) {
    const resolved: ResolvedIcon = {
      id: iconId,
      name: cached.id,
      svgContent: cached.svgContent,
    };
    memoryCache.set(iconId, resolved);
    return resolved;
  }

  // Check if already fetching
  if (pendingFetches.has(iconId)) {
    return pendingFetches.get(iconId)!;
  }

  // Fetch from database
  const fetchPromise = fetchIconFromDb(iconId);
  pendingFetches.set(iconId, fetchPromise);

  try {
    const result = await fetchPromise;
    pendingFetches.delete(iconId);
    return result;
  } catch (error) {
    pendingFetches.delete(iconId);
    throw error;
  }
}

/**
 * Resolve multiple icons efficiently (batched)
 */
export async function resolveIcons(iconIds: string[]): Promise<Map<string, ResolvedIcon | null>> {
  const results = new Map<string, ResolvedIcon | null>();
  const uncachedIds: string[] = [];

  // Check caches first
  for (const id of iconIds) {
    if (memoryCache.has(id)) {
      results.set(id, memoryCache.get(id)!);
    } else {
      const cached = await iconCache.get(id);
      if (cached) {
        const resolved: ResolvedIcon = {
          id,
          name: cached.id,
          svgContent: cached.svgContent,
        };
        memoryCache.set(id, resolved);
        results.set(id, resolved);
      } else {
        uncachedIds.push(id);
      }
    }
  }

  // Batch fetch uncached icons
  if (uncachedIds.length > 0) {
    const fetched = await batchFetchIcons(uncachedIds);
    fetched.forEach((icon, id) => {
      results.set(id, icon);
    });
  }

  return results;
}

/**
 * Fetch icon from database
 */
async function fetchIconFromDb(iconId: string): Promise<ResolvedIcon | null> {
  try {
    const { data, error } = await supabase
      .from('icons')
      .select('id, name, svg_content, thumbnail, category')
      .eq('id', iconId)
      .single();

    if (error || !data) {
      console.warn(`Icon not found: ${iconId}`);
      return null;
    }

    const resolved: ResolvedIcon = {
      id: data.id,
      name: data.name,
      svgContent: data.svg_content,
      thumbnail: data.thumbnail || undefined,
      category: data.category,
    };

    // Cache in memory
    memoryCache.set(iconId, resolved);

    // Cache in IndexedDB
    await iconCache.set({
      id: iconId,
      svgContent: data.svg_content,
      parsedData: null,
      timestamp: Date.now(),
      complexity: 0,
    });

    return resolved;
  } catch (error) {
    console.error(`Failed to fetch icon ${iconId}:`, error);
    return null;
  }
}

/**
 * Batch fetch multiple icons
 */
async function batchFetchIcons(iconIds: string[]): Promise<Map<string, ResolvedIcon | null>> {
  const results = new Map<string, ResolvedIcon | null>();

  if (iconIds.length === 0) {
    return results;
  }

  try {
    const { data, error } = await supabase
      .from('icons')
      .select('id, name, svg_content, thumbnail, category')
      .in('id', iconIds);

    if (error) {
      console.error('Batch icon fetch failed:', error);
      iconIds.forEach(id => results.set(id, null));
      return results;
    }

    // Process fetched icons
    const fetchedIds = new Set<string>();
    
    for (const row of data || []) {
      const resolved: ResolvedIcon = {
        id: row.id,
        name: row.name,
        svgContent: row.svg_content,
        thumbnail: row.thumbnail || undefined,
        category: row.category,
      };

      results.set(row.id, resolved);
      memoryCache.set(row.id, resolved);
      fetchedIds.add(row.id);

      // Cache in IndexedDB (non-blocking)
      iconCache.set({
        id: row.id,
        svgContent: row.svg_content,
        parsedData: null,
        timestamp: Date.now(),
        complexity: 0,
      }).catch(console.error);
    }

    // Mark unfound icons as null
    iconIds.forEach(id => {
      if (!fetchedIds.has(id)) {
        results.set(id, null);
      }
    });

    return results;
  } catch (error) {
    console.error('Batch icon fetch error:', error);
    iconIds.forEach(id => results.set(id, null));
    return results;
  }
}

/**
 * Preload icons for faster access later
 */
export async function preloadIcons(iconIds: string[]): Promise<void> {
  const uncachedIds: string[] = [];

  for (const id of iconIds) {
    if (!memoryCache.has(id)) {
      const cached = await iconCache.get(id);
      if (!cached) {
        uncachedIds.push(id);
      }
    }
  }

  if (uncachedIds.length > 0) {
    await batchFetchIcons(uncachedIds);
  }
}

/**
 * Clear icon cache
 */
export function clearIconCache(): void {
  memoryCache.clear();
}

/**
 * Get icon cache stats
 */
export function getIconCacheStats(): {
  memorySize: number;
  pendingFetches: number;
} {
  return {
    memorySize: memoryCache.size,
    pendingFetches: pendingFetches.size,
  };
}

/**
 * Search for icons by name (for icon picker)
 */
export async function searchIcons(
  query: string,
  options: {
    category?: string;
    limit?: number;
  } = {}
): Promise<ResolvedIcon[]> {
  const { category, limit = 50 } = options;

  try {
    let queryBuilder = supabase
      .from('icons')
      .select('id, name, svg_content, thumbnail, category')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Icon search failed:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      svgContent: row.svg_content,
      thumbnail: row.thumbnail || undefined,
      category: row.category,
    }));
  } catch (error) {
    console.error('Icon search error:', error);
    return [];
  }
}

/**
 * Create a renderable SVG element from icon content
 */
export function createIconElement(
  svgContent: string,
  options: {
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
  } = {}
): SVGElement {
  const { width = 80, height = 80, fill, stroke } = options;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svg = doc.querySelector('svg');

  if (!svg) {
    throw new Error('Invalid SVG content');
  }

  // Set dimensions
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));

  // Apply colors if specified
  if (fill) {
    svg.querySelectorAll('[fill]').forEach(el => {
      const currentFill = el.getAttribute('fill');
      if (currentFill && currentFill !== 'none') {
        el.setAttribute('fill', fill);
      }
    });
  }

  if (stroke) {
    svg.querySelectorAll('[stroke]').forEach(el => {
      const currentStroke = el.getAttribute('stroke');
      if (currentStroke && currentStroke !== 'none') {
        el.setAttribute('stroke', stroke);
      }
    });
  }

  return svg;
}

/**
 * Convert SVG content to data URL for Fabric.js
 */
export function svgToDataUrl(svgContent: string): string {
  const encoded = encodeURIComponent(svgContent);
  return `data:image/svg+xml,${encoded}`;
}
