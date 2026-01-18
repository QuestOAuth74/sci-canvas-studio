/**
 * Fuzzy search utilities for icon name matching
 */

export interface TaxonomyEntry {
  originalName: string;
  alternativeNames: string[];
}

const TAXONOMY_KEY = "icon_search_taxonomy";

/**
 * Load taxonomy from localStorage
 */
export const loadTaxonomy = (): TaxonomyEntry[] => {
  try {
    const stored = localStorage.getItem(TAXONOMY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save taxonomy to localStorage
 */
export const saveTaxonomy = (taxonomy: TaxonomyEntry[]) => {
  localStorage.setItem(TAXONOMY_KEY, JSON.stringify(taxonomy));
};

/**
 * Parse CSV for taxonomy (format: OriginalName, Alt1, Alt2, Alt3, ...)
 */
export const parseTaxonomyCSV = (text: string): TaxonomyEntry[] => {
  const lines = text.split("\n").filter((line) => line.trim());
  const results: TaxonomyEntry[] = [];

  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes("original") || 
                     lines[0]?.toLowerCase().includes("name") ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Handle quoted CSV values
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        parts.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    parts.push(current.trim().replace(/^"|"$/g, ""));

    if (parts.length >= 1 && parts[0]) {
      const originalName = parts[0].trim();
      const alternativeNames = parts
        .slice(1)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (originalName) {
        results.push({ originalName, alternativeNames });
      }
    }
  }

  return results;
};

/**
 * Calculate Levenshtein distance for similarity matching
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Calculate similarity score (0-1, where 1 is exact match)
 */
export const similarityScore = (a: string, b: string): number => {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
};

/**
 * Check if string contains partial match
 */
export const partialMatch = (text: string, query: string): boolean => {
  return text.toLowerCase().includes(query.toLowerCase());
};

/**
 * Check if words match (any word in text matches any word in query)
 */
export const wordMatch = (text: string, query: string): boolean => {
  const textWords = text.toLowerCase().split(/[\s\-_]+/);
  const queryWords = query.toLowerCase().split(/[\s\-_]+/);
  
  return queryWords.some((qWord) =>
    textWords.some((tWord) => 
      tWord.includes(qWord) || qWord.includes(tWord)
    )
  );
};

export interface SearchResult<T> {
  item: T;
  score: number;
  matchType: "exact" | "partial" | "taxonomy" | "similar" | "word";
}

/**
 * Fuzzy search icons with multiple matching strategies
 */
export const fuzzySearchIcons = <T extends { name: string; altName?: string }>(
  items: T[],
  query: string,
  taxonomy: TaxonomyEntry[],
  similarityThreshold: number = 0.6
): SearchResult<T>[] => {
  if (!query.trim()) {
    return items.map((item) => ({ item, score: 1, matchType: "exact" as const }));
  }

  const queryLower = query.toLowerCase().trim();
  const results: SearchResult<T>[] = [];

  // Build taxonomy lookup map for faster searching
  const taxonomyMap = new Map<string, string[]>();
  taxonomy.forEach((entry) => {
    const key = entry.originalName.toLowerCase();
    taxonomyMap.set(key, entry.alternativeNames.map((n) => n.toLowerCase()));
    // Also map alternatives back to original
    entry.alternativeNames.forEach((alt) => {
      const existing = taxonomyMap.get(alt.toLowerCase()) || [];
      taxonomyMap.set(alt.toLowerCase(), [...existing, key]);
    });
  });

  for (const item of items) {
    const nameLower = item.name.toLowerCase();
    const altNameLower = item.altName?.toLowerCase() || "";

    // 1. Exact match (highest priority)
    if (nameLower === queryLower || altNameLower === queryLower) {
      results.push({ item, score: 1, matchType: "exact" });
      continue;
    }

    // 2. Partial/contains match
    if (partialMatch(nameLower, queryLower) || partialMatch(altNameLower, queryLower)) {
      const score = queryLower.length / Math.max(nameLower.length, 1);
      results.push({ item, score: 0.9 + score * 0.1, matchType: "partial" });
      continue;
    }

    // 3. Word match
    if (wordMatch(nameLower, queryLower) || wordMatch(altNameLower, queryLower)) {
      results.push({ item, score: 0.8, matchType: "word" });
      continue;
    }

    // 4. Taxonomy match - check if query matches any taxonomy alternative
    const itemTaxonomyAlts = taxonomyMap.get(nameLower) || [];
    const queryTaxonomyAlts = taxonomyMap.get(queryLower) || [];
    
    const hasTaxonomyMatch = 
      itemTaxonomyAlts.some((alt) => alt.includes(queryLower) || queryLower.includes(alt)) ||
      queryTaxonomyAlts.some((alt) => alt === nameLower || nameLower.includes(alt));
    
    if (hasTaxonomyMatch) {
      results.push({ item, score: 0.85, matchType: "taxonomy" });
      continue;
    }

    // 5. Similarity match (fuzzy)
    const nameSimilarity = similarityScore(nameLower, queryLower);
    const altSimilarity = altNameLower ? similarityScore(altNameLower, queryLower) : 0;
    const maxSimilarity = Math.max(nameSimilarity, altSimilarity);

    if (maxSimilarity >= similarityThreshold) {
      results.push({ item, score: maxSimilarity * 0.7, matchType: "similar" });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
};
