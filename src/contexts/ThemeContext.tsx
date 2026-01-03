import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  canvasMode: boolean;
  setCanvasMode: (mode: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [canvasMode, setCanvasModeState] = useState<boolean>(false);

  const setCanvasMode = (mode: boolean) => {
    setCanvasModeState(mode);
    const root = document.documentElement;
    if (mode) {
      root.classList.add('canvas-workspace');
    } else {
      root.classList.remove('canvas-workspace');
    }
  };

  return (
    <ThemeContext.Provider value={{ canvasMode, setCanvasMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
