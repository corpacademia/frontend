
import { create } from 'zustand';
import axios from 'axios';

interface Batch {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  user_count: number;
  lab_count: number;
  trainer_count?: number;
  start_date?: string;
  end_date?: string;
}

interface BatchDetails {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  trainer_id?: string;
  trainer_name?: string;
}

interface BatchUser {
  id: string;
  name: string;
  email: string;
  labs_started: number;
  labs_completed: number;
  total_labs: number;
}

interface BatchLab {
  id: string;
  lab_id: string;
  lab_name: string;
  start_date: string;
  end_date: string;
  users_started: number;
  users_completed: number;
  total_users: number;
  remaining_days: number;
  is_purchased: boolean;
  quantity?: number;
}

interface Lab {
  lab_id: string;
  title: string;
  is_purchased: boolean;
  quantity?: number;
}

interface Trainer {
  id: string;
  name: string;
  email: string;
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BatchState {
  batches: Batch[];
  currentBatch: BatchDetails | null;
  batchUsers: BatchUser[];
  batchLabs: BatchLab[];
  availableLabs: Lab[];
  availableTrainers: Trainer[];
  availableUsers: AvailableUser[];
  selectedBatchIds: string[];
  isLoading: boolean;
  isLoadingDetails: boolean;
  isLoadingLabs: boolean;
  isLoadingTrainers: boolean;
  isLoadingUsers: boolean;
  error: string | null;

  // Batch CRUD operations
  fetchBatches: (orgId: string) => Promise<void>;
  fetchBatchDetails: (batchId: string) => Promise<void>;
  createBatch: (data: {
    batchName: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    org_id: string;
    created_by: string;
  }) => Promise<{ success: boolean; message?: string }>;
  updateBatch: (batchId: string, data: {
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  deleteBatch: (batchId: string) => Promise<{ success: boolean; message?: string }>;

  // Lab assignment operations
  fetchAvailableLabs: (userId: string,orgId: string) => Promise<void>;
  fetchAvailableTrainers: (orgId: string) => Promise<void>;
  assignLabToBatch: (data: {
    batch_id: string;
    lab_id: string;
    trainer_id?: string;
    start_date: string;
    end_date: string;
    assigned_by: string;
    org_id:string
  }) => Promise<{ success: boolean; message?: string }>;
  updateBatchLab: (data: {
    batch_id: string;
    lab_id: string;
    trainer_id?: string;
    start_date: string;
    end_date: string;
  }) => Promise<{ success: boolean; message?: string }>;
  removeLabFromBatch: (batchId: string, labId: string) => Promise<{ success: boolean; message?: string }>;

  // User management operations
  fetchAvailableUsers: (batchId: string, orgId: string) => Promise<void>;
  addUsersToBatch: (batchId: string, userIds: string[],assignedBy: string) => Promise<{ success: boolean; message?: string }>;
  removeUserFromBatch: (batchId: string,labId:string[], userId: string) => Promise<{ success: boolean; message?: string }>;

  // Selection operations
  toggleBatchSelection: (batchId: string) => void;
  selectAllBatches: () => void;
  clearSelection: () => void;
  deleteSelectedBatches: () => Promise<{ success: boolean; message?: string }>;

  // Utility functions
  clearCurrentBatch: () => void;
  clearError: () => void;
}

export const useBatchStore = create<BatchState>((set, get) => ({
  batches: [],
  currentBatch: null,
  batchUsers: [],
  batchLabs: [],
  availableLabs: [],
  availableTrainers: [],
  availableUsers: [],
  selectedBatchIds: [],
  isLoading: false,
  isLoadingDetails: false,
  isLoadingLabs: false,
  isLoadingTrainers: false,
  isLoadingUsers: false,
  error: null,

  fetchBatches: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getBatches/${userId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        set({ batches: response.data.data, isLoading: false });
      } else {
        throw new Error(response.data.message || 'Failed to fetch batches');
      }
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch batches'
      });
    }
  },

  fetchBatchDetails: async (batchId: string) => {
    set({ isLoadingDetails: true, error: null });
    try {
      const [detailsRes, usersRes, labsRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getBatch/${batchId}`,
          { withCredentials: true }
        ),
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getBatchUsers/${batchId}`,
          { withCredentials: true }
        ),
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getBatchLabs/${batchId}`,
          { withCredentials: true }
        )
      ]);

      if (detailsRes.data.success) {
        set({ currentBatch: detailsRes.data.data });
      }
      if (usersRes.data.success) {
        set({ batchUsers: usersRes.data.data });
      }
      if (labsRes.data.success) {
        set({ batchLabs: labsRes.data.data });
      }

      set({ isLoadingDetails: false });
    } catch (error: any) {
      console.error('Error fetching batch details:', error);
      set({
        isLoadingDetails: false,
        error: error.response?.data?.message || 'Failed to fetch batch details'
      });
    }
  },

  createBatch: async (data) => {
    set({ error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/createBatch`,
        data,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh batches list
        if (data.org_id) {
          get().fetchBatches(data.org_id);
        }
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to create batch');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create batch';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  updateBatch: async (batchId, data) => {
    set({ error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateBatch`,
        { batchId: batchId, ...data },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh batch details
        get().fetchBatchDetails(batchId);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to update batch');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update batch';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  deleteBatch: async (batchId) => {
    set({ error: null });
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteBatch/${batchId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Remove from local state
        set((state) => ({
          batches: state.batches.filter((b) => b.id !== batchId)
        }));
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to delete batch');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete batch';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  fetchAvailableLabs: async (userId,orgId) => {
    set({ isLoadingLabs: true, error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabs`,
        {userId,orgId},
        { withCredentials: true }
      );

      if (response.data.success) {
        set({ availableLabs: response.data.data, isLoadingLabs: false });
      } else {
        throw new Error(response.data.message || 'Failed to fetch labs');
      }
    } catch (error: any) {
      console.error('Error fetching labs:', error);
      set({
        isLoadingLabs: false,
        error: error.response?.data?.message || 'Failed to fetch labs'
      });
    }
  },

  fetchAvailableTrainers: async (orgId: string) => {
    set({ isLoadingTrainers: true, error: null });
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getTrainers/${orgId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        set({ availableTrainers: response.data.data, isLoadingTrainers: false });
      } else {
        throw new Error(response.data.message || 'Failed to fetch trainers');
      }
    } catch (error: any) {
      console.error('Error fetching trainers:', error);
      set({
        isLoadingTrainers: false,
        error: error.response?.data?.message || 'Failed to fetch trainers'
      });
    }
  },

  assignLabToBatch: async (data) => {
    set({ error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/assignLabToBatch`,
        data,
        { withCredentials: true }
      );
      if (response.data.success) {
        // Refresh batch details
        get().fetchBatchDetails(data.batch_id);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to assign lab');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to assign lab';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  updateBatchLab: async (data) => {
    set({ error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateBatchLab`,
        data,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh batch details
        get().fetchBatchDetails(data.batch_id);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to update lab');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update lab';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  removeLabFromBatch: async (batchId, labId) => {
    set({ error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/removeLabFromBatch`,
        { batchId,labId },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh batch details
        get().fetchBatchDetails(batchId);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to remove lab');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove lab';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  fetchAvailableUsers: async (batchId: string, orgId: string) => {
    set({ isLoadingUsers: true, error: null });
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${orgId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        set({ availableUsers: response.data.data, isLoadingUsers: false });
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      set({
        isLoadingUsers: false,
        error: error.response?.data?.message || 'Failed to fetch users'
      });
    }
  },

  addUsersToBatch: async (batchId, userIds,assignedBy) => {
    set({ error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/addUsersToBatch`,
        { batchId: batchId, userIds: userIds,assignedBy },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh batch details
        get().fetchBatchDetails(batchId);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to add users');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add users';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  removeUserFromBatch: async (batchId,labIds, userId) => {
    set({ error: null });
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/removeUserFromBatch`,
        { batchId,labIds, userId },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh batch details
        get().fetchBatchDetails(batchId);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to remove user');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove user';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  toggleBatchSelection: (batchId: string) => {
    set((state) => {
      const isSelected = state.selectedBatchIds.includes(batchId);
      return {
        selectedBatchIds: isSelected
          ? state.selectedBatchIds.filter(id => id !== batchId)
          : [...state.selectedBatchIds, batchId]
      };
    });
  },

  selectAllBatches: () => {
    set((state) => ({
      selectedBatchIds: state.batches.map(b => b.id)
    }));
  },

  clearSelection: () => {
    set({ selectedBatchIds: [] });
  },

  deleteSelectedBatches: async () => {
    const { selectedBatchIds } = get();
    if (selectedBatchIds.length === 0) {
      return { success: false, message: 'No batches selected' };
    }

    set({ error: null });
    try {
      const deletePromises = selectedBatchIds.map(batchId =>
        axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteBatch/${batchId}`,
          { withCredentials: true }
        )
      );

      const results = await Promise.allSettled(deletePromises);
      const failedDeletes = results.filter(r => r.status === 'rejected');

      if (failedDeletes.length > 0) {
        const errorMessage = `Failed to delete ${failedDeletes.length} batch(es)`;
        set({ error: errorMessage });
        return { success: false, message: errorMessage };
      }

      // Remove deleted batches from local state
      set((state) => ({
        batches: state.batches.filter(b => !selectedBatchIds.includes(b.id)),
        selectedBatchIds: []
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete batches';
      set({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  clearCurrentBatch: () => {
    set({
      currentBatch: null,
      batchUsers: [],
      batchLabs: [],
      error: null
    });
  },

  clearError: () => {
    set({ error: null });
  }
}));
