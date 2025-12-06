
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      setMode: (mode) => {
        set({ mode });
        document.documentElement.classList.toggle('dark', mode === 'dark');
        document.documentElement.classList.toggle('light', mode === 'light');
      },
      toggleMode: () => set((state) => {
        const newMode = state.mode === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', newMode === 'dark');
        document.documentElement.classList.toggle('light', newMode === 'light');
        return { mode: newMode };
      }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
