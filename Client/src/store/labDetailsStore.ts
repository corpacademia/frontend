
import { create } from 'zustand';
import axios from 'axios';

interface LabDetails {
  id: string;
  title: string;
  description: string;
  type: string;
  provider?: string;
  region?: string;
  platform?: string;
  os?: string;
  os_version?: string;
  instance?: string;
  cpu?: number;
  ram?: number;
  storage?: number;
  duration?: number;
  difficulty?: string;
  category?: string;
  learningObjectives?: string;
  prerequisites?: string;
  targetAudience?: string;
  estimatedDuration?: number;
  services?: string[];
  software?: string[];
  modules?: any[];
  exercises?: any[];
  startDate?: string;
  endDate?: string;
  price?: number;
  rating?: number;
  totalEnrollments?: number;
  createdBy?: string;
  technologies?: string[];
  labGuide?: string;
  userGuide?: string;
  instructor?: string;
  language?: string;
  certificate?: boolean;
  lastUpdated?: string;
}

interface Review {
  id: string;
  user_id: string;
  username: string;
  userAvatar?: string;
  lab_id: string;
  rating: number;
  review_text: string;
  createdat: string;
}

interface LabDetailsState {
  selectedLab: LabDetails | null;
  reviews: Review[];
  isLoadingDetails: boolean;
  isLoadingReviews: boolean;
  error: string | null;
  fetchLabDetails: (labId: string, labType: string) => Promise<void>;
  fetchReviews: (labId: string) => Promise<void>;
  addReview: (labId: string,userId:string, rating: number, comment: string) => Promise<void>;
  clearSelectedLab: () => void;
}

export const useLabDetailsStore = create<LabDetailsState>((set, get) => ({
  selectedLab: null,
  reviews: [],
  isLoadingDetails: false,
  isLoadingReviews: false,
  error: null,

  fetchLabDetails: async (labId: string, labType: string) => {
    set({ isLoadingDetails: true, error: null });
    
    try {
      let response;
      
      switch (labType) {
        case 'cloudslice':
          response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetailsForCatalogue`,
            { labId }
          );
          break;
        case 'singlevm-aws':
          response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabOnId`,
            { labId }
          );
          break;
        case  'singlevmdatacenter':
          response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVmDatacenterLabOnId`,
            { labId }
          );
          break;
        case 'vmclusterdatacenter':
          response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getClusterOnId`,
            { labId }
          );
          break;
        default:
          throw new Error(`Unsupported lab type: ${labType}`);
      }

      if (response.data.success) {
        set({ selectedLab: response.data.data, isLoadingDetails: false });
      } else {
        throw new Error(response.data.message || 'Failed to fetch lab details');
      }
    } catch (error: any) {
      console.error('Failed to fetch lab details:', error);
      set({
        isLoadingDetails: false,
        error: error.response?.data?.message || 'Failed to fetch lab details',
      });
    }
  },

  fetchReviews: async (labId: string) => {
    set({ isLoadingReviews: true });
    
    try {
      const reviewData:Review =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getReviews`,{
        labId:labId
      })
      set({ reviews: reviewData.data.data, isLoadingReviews: false });
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error);
      set({ isLoadingReviews: false });
    }
  },

  addReview: async (labId: string,userId:string, rating: number, comment: string) => {
    try {
      // Mock implementation - replace with actual API call
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/insertReview`,{
        labId,
        userId,
        rating,
        comment,
      })
      const newReview:Review = response.data.data;
      const currentReviews = get().reviews;
      set({ reviews: [newReview, ...currentReviews] });
    } catch (error: any) {
      console.error('Failed to add review:', error);
      throw error;
    }
  },

  clearSelectedLab: () => {
    set({ selectedLab: null, reviews: [], error: null });
  },
}));
