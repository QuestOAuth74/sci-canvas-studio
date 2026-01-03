import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  toggleDarkMode: () => void;
  canvasMode: boolean;
  setCanvasMode: (mode: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme-dark-mode');
    return stored === 'true';
  });

  const [canvasMode, setCanvasModeState] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    
    // Toggle dark mode class
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Store preference
    localStorage.setItem('theme-dark-mode', darkMode.toString());
  }, [darkMode]);

  const setDarkMode = (newDarkMode: boolean) => {
    setDarkModeState(newDarkMode);
  };

  const toggleDarkMode = () => {
    setDarkModeState(prev => !prev);
  };

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
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode, canvasMode, setCanvasMode }}>
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
