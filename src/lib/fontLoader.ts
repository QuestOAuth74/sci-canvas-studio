export const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Ubuntu",
  "Playfair Display",
  "Merriweather",
  "Crimson Text",
  "Source Sans 3",
  "Oswald",
];

// Canvas font stacks with fallbacks for special character support
export const CANVAS_FONT_STACKS: Record<string, string> = {
  Inter: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Roboto: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "Open Sans": "'Open Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Lato: "Lato, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Montserrat: "Montserrat, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Poppins: "Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Raleway: "Raleway, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Ubuntu: "Ubuntu, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "Playfair Display": "'Playfair Display', Georgia, 'Times New Roman', serif",
  Merriweather: "Merriweather, Georgia, 'Times New Roman', serif",
  "Crimson Text": "'Crimson Text', Georgia, 'Times New Roman', serif",
  "Source Sans 3": "'Source Sans 3', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Oswald: "Oswald, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// Get the full font stack for canvas text objects
export const getCanvasFontFamily = (font: string): string => {
  return CANVAS_FONT_STACKS[font] || `${font}, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
};

// Extract base font name from a font family string (with fallbacks)
export const getBaseFontName = (fontFamily: string | undefined): string => {
  if (!fontFamily) return "Inter";
  return fontFamily.split(",")[0].replace(/['"]/g, "").trim() || "Inter";
};

export const loadFont = async (fontFamily: string, weight = 400): Promise<void> => {
  try {
    await document.fonts.load(`${weight} 16px "${fontFamily}"`);
  } catch (error) {
    console.warn(`Failed to load font: ${fontFamily}`, error);
  }
};

export const loadAllFonts = async (): Promise<void> => {
  const loadPromises = GOOGLE_FONTS.flatMap(font => [
    loadFont(font, 400),
    loadFont(font, 700),
  ]);
  await Promise.all(loadPromises);
};

export const ensureFontLoaded = async (fontFamily: string): Promise<boolean> => {
  try {
    await loadFont(fontFamily, 400);
    await loadFont(fontFamily, 700);
    return true;
  } catch {
    return false;
  }
};
