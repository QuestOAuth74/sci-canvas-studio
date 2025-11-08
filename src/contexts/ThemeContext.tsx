import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'purple' | 'blue';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme-color-scheme');
    return (stored === 'blue' || stored === 'purple') ? stored : 'purple';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove both theme classes first
    root.classList.remove('theme-purple', 'theme-blue');
    
    // Add the selected theme class
    root.classList.add(`theme-${theme}`);
    
    // Store preference
    localStorage.setItem('theme-color-scheme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
