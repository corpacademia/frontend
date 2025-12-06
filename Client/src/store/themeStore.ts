
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const applyTheme = (mode: ThemeMode) => {
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(mode);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      setMode: (mode) => {
        set({ mode });
        applyTheme(mode);
      },
      toggleMode: () => set((state) => {
        const newMode = state.mode === 'dark' ? 'light' : 'dark';
        applyTheme(newMode);
        return { mode: newMode };
      }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.mode);
        }
      },
    }
  )
);
