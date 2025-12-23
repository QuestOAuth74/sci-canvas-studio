/**
 * Color conversion utilities
 * Supports RGB, CMYK, and hex color conversions
 */

export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface CMYKColor {
  c: number; // 0-100
  m: number; // 0-100
  y: number; // 0-100
  k: number; // 0-100
}

/**
 * Convert RGB color to CMYK
 * @param rgb RGB color object
 * @returns CMYK color object
 */
export function rgbToCMYK(rgb: RGBColor): CMYKColor {
  // TODO: Implement RGB to CMYK conversion
  // Formula: https://www.rapidtables.com/convert/color/rgb-to-cmyk.html
  throw new Error('rgbToCMYK not yet implemented');
}

/**
 * Convert hex color string to RGB
 * @param hex Hex color string (e.g., "#FF0000" or "FF0000" or "#F00")
 * @returns RGB color object
 */
export function hexToRGB(hex: string): RGBColor {
  // TODO: Implement hex to RGB conversion
  // Should handle both 3-digit and 6-digit hex codes, with or without #
  throw new Error('hexToRGB not yet implemented');
}

/**
 * Convert CMYK color to RGB
 * @param cmyk CMYK color object
 * @returns RGB color object
 */
export function cmykToRGB(cmyk: CMYKColor): RGBColor {
  // TODO: Implement CMYK to RGB conversion
  // Formula: https://www.rapidtables.com/convert/color/cmyk-to-rgb.html
  throw new Error('cmykToRGB not yet implemented');
}
