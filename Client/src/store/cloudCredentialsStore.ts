import { create } from 'zustand';
import axios from 'axios';

export interface CloudCredential {
  id: string;
  provider: string;
  name: string;
  credentials: any;
  org_id?: string | null; // null = global (superadmin)
  created_at: string;
  updated_at: string;
}

interface CloudCredentialsStore {
  globalCredentials: CloudCredential[];
  orgCredentials: CloudCredential[];
  isLoading: boolean;
  error: string | null;

  fetchGlobalCredentials: () => Promise<void>;
  fetchOrgCredentials: (orgId: string) => Promise<void>;
  addCredential: (payload: any, isGlobal: boolean) => Promise<boolean>;
  updateCredential: (id: string, payload: any) => Promise<boolean>;
  deleteCredential: (id: string) => Promise<boolean>;
  clearError: () => void;
}

const BASE = import.meta.env.VITE_BACKEND_URL;

export const useCloudCredentialsStore = create<CloudCredentialsStore>((set) => ({
  globalCredentials: [],
  orgCredentials: [],
  isLoading: false,
  error: null,

  fetchGlobalCredentials: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${BASE}/api/v1/lab_ms/global-clouds`);
      if (res.data.success) {
        set({ globalCredentials: res.data.data || [] });
      }
    } catch (err) {
      set({ error: 'Failed to load global credentials' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrgCredentials: async (orgId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${BASE}/api/v1/lab_ms/organization-clouds/${orgId}`);
      if (res.data.success) {
        set({ orgCredentials: res.data.data || [] });
      }
    } catch (err) {
      set({ error: 'Failed to load org credentials' });
    } finally {
      set({ isLoading: false });
    }
  },

  addCredential: async (payload, isGlobal) => {
    try {
      const endpoint = isGlobal
        ? `${BASE}/api/v1/lab_ms/global-cloud`
        : `${BASE}/api/v1/lab_ms/add-cloud`;
      const res = await axios.post(endpoint, payload);
      return res.data.success === true;
    } catch {
      return false;
    }
  },

  updateCredential: async (id, payload) => {
    try {
      const res = await axios.put(`${BASE}/api/v1/lab_ms/editCredentials/${id}`, payload);
      return res.data.success === true;
    } catch {
      return false;
    }
  },

  deleteCredential: async (id) => {
    try {
      const res = await axios.delete(`${BASE}/api/v1/lab_ms/delete-cloud/${id}`);
      return res.data.success === true;
    } catch {
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
