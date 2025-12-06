import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BrandingState {
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  resetColors: () => void;
  setBrandingColors: (primary: string, secondary: string) => void;
}

export const DEFAULT_PRIMARY = '#8b5cf6';
export const DEFAULT_SECONDARY = '#06b6d4';

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set) => ({
      primaryColor: DEFAULT_PRIMARY,
      secondaryColor: DEFAULT_SECONDARY,
      setPrimaryColor: (color: string) => set({ primaryColor: color }),
      setSecondaryColor: (color: string) => set({ secondaryColor: color }),
      setBrandingColors: (primary: string, secondary: string) => set({
        primaryColor: primary || DEFAULT_PRIMARY,
        secondaryColor: secondary || DEFAULT_SECONDARY
      }),
      resetColors: () => set({ 
        primaryColor: DEFAULT_PRIMARY, 
        secondaryColor: DEFAULT_SECONDARY 
      }),
    }),
    {
      name: 'branding-storage',
    }
  )
);