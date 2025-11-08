import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from 'dompurify';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes SVG content to prevent XSS attacks
 * @param svg - The SVG content to sanitize
 * @returns Sanitized SVG content safe for rendering
 */
export function sanitizeSVG(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
  });
}

/**
 * Converts a data URL to a Blob for more reliable downloads
 * @param dataUrl - The data URL to convert
 * @returns Promise resolving to a Blob
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * Downloads a Blob as a file using Object URLs (more reliable than data URLs)
 * @param blob - The Blob to download
 * @param filename - The filename for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Safely downloads a data URL by converting to Blob first
 * @param dataUrl - The data URL to download
 * @param filename - The filename for the download
 */
export async function safeDownloadDataUrl(dataUrl: string, filename: string): Promise<void> {
  const blob = await dataUrlToBlob(dataUrl);
  downloadBlob(blob, filename);
}
