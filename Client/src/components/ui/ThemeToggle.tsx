import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleMode } = useThemeStore();

  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-lg border transition-all duration-200 group
                 dark:bg-dark-400/50 dark:border-primary-500/20 dark:hover:border-primary-500/40
                 light:bg-white light:border-gray-300 light:hover:border-gray-400
                 bg-white border-gray-300"
      aria-label="Toggle theme"
    >
      {mode === 'dark' ? (
        <Sun className="h-5 w-5 dark:text-primary-400 dark:group-hover:text-primary-300 light:text-gray-600 light:group-hover:text-gray-800 transition-colors" />
      ) : (
        <Moon className="h-5 w-5 dark:text-primary-600 dark:group-hover:text-primary-500 light:text-gray-700 light:group-hover:text-gray-900 transition-colors" />
      )}
    </button>
  );
};