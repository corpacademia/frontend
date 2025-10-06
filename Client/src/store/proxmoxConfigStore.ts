
import { create } from 'zustand';
import axios from 'axios';

interface Storage {
  id: string;
  name: string;
  type: string;
}

interface ISO {
  content: string;
  volid: string;
  size: string;
  format?: string;
  version?: string;
}

interface NetworkBridge {
  id: string;
  name: string;
  type: string;
}

interface NICModel {
  id: string;
  name: string;
}

interface ProxmoxConfigState {
  storages: Storage[];
  isos: ISO[];
  networkBridges: NetworkBridge[];
  nicModels: NICModel[];
  isLoading: boolean;
  error: string | null;
  fetchStorages: (node: string) => Promise<void>;
  fetchISOs: (node: string, storage: string) => Promise<void>;
  fetchNetworkBridges: (node: string) => Promise<void>;
  fetchNICModels: () => Promise<void>;
  clearData: () => void;
}

export const useProxmoxConfigStore = create<ProxmoxConfigState>((set) => ({
  storages: [],
  isos: [],
  networkBridges: [],
  nicModels: [
    { id: 'e1000', name: 'Intel E1000' },
    { id: 'virtio', name: 'VirtIO (paravirtualized)' },
    { id: 'rtl8139', name: 'Realtek RTL8139' },
    { id: 'vmxnet3', name: 'VMware vmxnet3' },
  ],
  isLoading: false,
  error: null,

  fetchStorages: async (node: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/storages`,
        { NODE: node }
      );
      set({ storages: response.data.data || [], isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch storages:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch storages',
      });
    }
  },

  fetchISOs: async (node: string, storage: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/isos`,
        { NODE: node, storage: storage }
      );
      set({ isos: response.data.isos || [], isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch ISOs:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch ISOs',
      });
    }
  },

  fetchNetworkBridges: async (node: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/network-bridges`,
        { NODE: node }
      );
      set({ networkBridges: response.data.networkBridges || [], isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch network bridges:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch network bridges',
      });
    }
  },

  fetchNICModels: async () => {
    // NIC models are already defined statically
    set({ isLoading: false });
  },

  clearData: () => {
    set({
      storages: [],
      isos: [],
      networkBridges: [],
      nicModels: [
        { id: 'e1000', name: 'Intel E1000' },
        { id: 'virtio', name: 'VirtIO (paravirtualized)' },
        { id: 'rtl8139', name: 'Realtek RTL8139' },
        { id: 'vmxnet3', name: 'VMware vmxnet3' },
      ],
      error: null,
    });
  },
}));
