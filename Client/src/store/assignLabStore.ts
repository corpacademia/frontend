
import { create } from 'zustand';
import axios from 'axios';

interface Lab {
  lab_id?: string;
  labid?: string;
  title: string;
  description?: string;
  type: 'standard' | 'cloudslice' | 'singlevm' | 'vmcluster';
  duration?: number;
  provider?: string;
  startdate?: string;
  enddate?: string;
  [key: string]: any;
}

interface AssignLabStore {
  availableLabs: Lab[];
  filteredLabs: Lab[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  
  // Actions
  fetchLabs: (user: any) => Promise<void>;
  setSearchTerm: (term: string) => void;
  clearLabs: () => void;
}

export const useAssignLabStore = create<AssignLabStore>((set, get) => ({
  availableLabs: [],
  filteredLabs: [],
  isLoading: false,
  error: null,
  searchTerm: '',

  fetchLabs: async (user: any) => {
    set({ isLoading: true, error: null });
    
    try {
      if (user.role === 'superadmin' || user.role === 'orgsuperadmin') {
        const [standardResult, cloudResult, singleVMDatacenter, vmclusterDatacenter] = await Promise.allSettled([
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabsConfigured`, {
            admin_id: user.id,
          }),
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getAllCloudSliceLabs`, {
            userId: user.id,
          }),
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVmDatacenterLabs`, {
            userId: user.id,
          }),
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getClusterLabDetails`, {
            userId: user.id,
          }),
        ]);

        const allLabs: Lab[] = [];

        if (standardResult.status === 'fulfilled' && standardResult.value.data.success) {
          allLabs.push(
            ...standardResult.value.data.data.map((lab: any) => ({
              ...lab,
              type: 'standard',
            }))
          );
        }

        if (cloudResult.status === 'fulfilled' && cloudResult.value.data.success) {
          allLabs.push(
            ...cloudResult.value.data.data.map((lab: any) => ({
              ...lab,
              type: 'cloudslice',
            }))
          );
        }

        if (singleVMDatacenter.status === 'fulfilled' && singleVMDatacenter.value.data.success) {
          allLabs.push(
            ...singleVMDatacenter.value.data.data.map((lab: any) => ({
              ...lab,
              type: 'singlevm',
            }))
          );
        }

        if (vmclusterDatacenter.status === 'fulfilled' && vmclusterDatacenter.value.data.success) {
          allLabs.push(
            ...vmclusterDatacenter.value.data.data.map((lab: any) => ({
              ...lab,
              type: 'vmcluster',
            }))
          );
        }

        set({ availableLabs: allLabs, filteredLabs: allLabs, isLoading: false });
      } else {
        const [standardResult, cloudResult, singleVMDatacenter, vmClusterDatacenter] = await Promise.allSettled([
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabsConfigured`, {
            admin_id: user.id,
          }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getOrgAssignedLabDetails/${user.org_id}`),
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgAssignedSingleVMDatacenterLab`, {
            orgId: user?.org_id,
            created_by: user?.id
          }),
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getOrglabs`, {
            orgId: user?.org_id,
            admin_id: user?.id
          })
        ]);

        const allLabs: Lab[] = [];

        if (standardResult.status === 'fulfilled' && standardResult.value.data.success) {
          allLabs.push(
            ...standardResult.value.data.data.map((lab: any) => ({
              ...lab,
              type: 'standard',
            }))
          );
        }

        if (cloudResult.status === 'fulfilled' && cloudResult.value.data.success) {
          allLabs.push(
            ...cloudResult.value.data.data.map((lab: any) => ({
              ...lab,
              type: 'cloudslice',
            }))
          );
        }

        if (singleVMDatacenter.status === 'fulfilled' && singleVMDatacenter.value.data.success) {
          const detailFetches = singleVMDatacenter.value.data.data.map((lab: any) =>
            axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVmDatacenterLabOnId`, {
              labId: lab?.labid,
            })
          );

          const detailResults = await Promise.allSettled(detailFetches);
          detailResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.data.success) {
              allLabs.push({
                ...result.value.data.data,
                ...singleVMDatacenter.value.data.data[index],
                type: 'singlevm',
              });
            }
          });
        }

        if (vmClusterDatacenter?.status === 'fulfilled' && vmClusterDatacenter?.value.data.success) {
          vmClusterDatacenter.value.data.data.forEach((lab: any) => {
            allLabs.push({
              ...lab.lab,
              ...lab.org,
              type: 'vmcluster'
            });
          });
        }

        set({ availableLabs: allLabs, filteredLabs: allLabs, isLoading: false });
      }
    } catch (err) {
      console.error('Error fetching labs:', err);
      set({ error: 'Failed to fetch labs', isLoading: false });
    }
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
    const { availableLabs } = get();
    
    if (!term) {
      set({ filteredLabs: availableLabs });
    } else {
      const filtered = availableLabs.filter(lab => 
        lab.title.toLowerCase().includes(term.toLowerCase()) ||
        lab.description?.toLowerCase().includes(term.toLowerCase())
      );
      set({ filteredLabs: filtered });
    }
  },

  clearLabs: () => {
    set({
      availableLabs: [],
      filteredLabs: [],
      searchTerm: '',
      error: null,
    });
  },
}));
