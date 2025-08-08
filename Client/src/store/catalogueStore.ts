
import { create } from 'zustand';
import axios from 'axios';

interface Catalogue {
  id: string;
  name: string;
  description: string;
  level: string;
  category: string;
  provider: string;
}

interface CatalogueState {
  catalogues: Catalogue[];
  isLoading: boolean;
  error: string | null;
  fetchAllCatalogues: () => Promise<void>;
}

export const useCatalogueStore = create<CatalogueState>((set) => ({
  catalogues: [],
  isLoading: false,
  error: null,

  fetchAllCatalogues: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllLabCatalogues`
      );
      set({ catalogues: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch catalogues:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Something went wrong',
      });
    }
  },
}));
