import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Check } from 'lucide-react';

export const ThemeSwitcher = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <>
      <DropdownMenuLabel className="flex items-center">
        {darkMode ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
        Appearance
      </DropdownMenuLabel>
      <DropdownMenuItem onClick={toggleDarkMode}>
        <div className="flex items-center gap-2 w-full">
          <Sun className="h-4 w-4" />
          <span className="flex-1">Light Mode</span>
          {!darkMode && <Check className="h-4 w-4" />}
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={toggleDarkMode}>
        <div className="flex items-center gap-2 w-full">
          <Moon className="h-4 w-4" />
          <span className="flex-1">Dark Mode</span>
          {darkMode && <Check className="h-4 w-4" />}
        </div>
      </DropdownMenuItem>
    </>
  );
};