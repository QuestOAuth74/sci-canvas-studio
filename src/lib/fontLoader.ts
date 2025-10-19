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
