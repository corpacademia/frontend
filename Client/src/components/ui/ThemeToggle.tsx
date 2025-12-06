import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleMode } = useThemeStore();

  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-lg border transition-all duration-200 group
                 bg-dark-400/50 border-primary-500/20 hover:border-primary-500/40"
      aria-label="Toggle theme"
    >
      {mode === 'dark' ? (
        <Sun className="h-5 w-5 text-primary-400 group-hover:text-primary-300 transition-colors" />
      ) : (
        <Moon className="h-5 w-5 text-primary-600 group-hover:text-primary-500 transition-colors" />
      )}
    </button>
  );
};