
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
  userId: string;
  userName: string;
  userAvatar?: string;
  labId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface LabDetailsState {
  selectedLab: LabDetails | null;
  reviews: Review[];
  isLoadingDetails: boolean;
  isLoadingReviews: boolean;
  error: string | null;
  fetchLabDetails: (labId: string, labType: string) => Promise<void>;
  fetchReviews: (labId: string) => Promise<void>;
  addReview: (labId: string, rating: number, comment: string) => Promise<void>;
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
        case 'cloud-slice':
          response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getCloudSliceOnId`,
            { labId }
          );
          break;
        case 'cloud-vm':
        case 'catalogue':
          response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabOnId`,
            { labId }
          );
          break;
        case 'cluster':
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
      // Mock data for now - replace with actual API call
      const mockReviews: Review[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          userAvatar: '',
          labId,
          rating: 5,
          comment: 'Excellent lab! Very comprehensive and well-structured.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          userAvatar: '',
          labId,
          rating: 4,
          comment: 'Great learning experience, could use more detailed instructions.',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      
      set({ reviews: mockReviews, isLoadingReviews: false });
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error);
      set({ isLoadingReviews: false });
    }
  },

  addReview: async (labId: string, rating: number, comment: string) => {
    try {
      // Mock implementation - replace with actual API call
      const newReview: Review = {
        id: Date.now().toString(),
        userId: 'current-user',
        userName: 'Current User',
        labId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };

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
