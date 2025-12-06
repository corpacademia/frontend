
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(mode);
  
  // Also set as data attribute for additional compatibility
  root.setAttribute('data-theme', mode);
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
        } else {
          // Apply default theme if no stored state
          applyTheme('dark');
        }
      },
    }
  )
);

// Apply theme immediately on module load
const initialState = useThemeStore.getState();
applyTheme(initialState.mode);
