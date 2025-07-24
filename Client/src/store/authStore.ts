import { create } from 'zustand';
import axios from 'axios';
import { User } from '../types/auth';

interface AuthState {
  user: (User & { impersonating?: boolean; originalRole?: string; organization?: string }) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showSessionExpiryModal: boolean;
  login: (user: User) => void;
  logout: () => void;
  switchOrganization: (org: { id: string; name: string; role: 'orgadmin' }) => void;
  resetRole: () => void;
  fetchUser: () => Promise<void>;
  setSessionExpiryModal: (show: boolean) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'trainer' | 'orgadmin' | 'superadmin' | 'orgsuperadmin';
  organization?: string;
  phone?: string;
  location?: string;
  bio?: string;
  jobTitle?: string;
  profileImage?: string;
}

export const useAuthStore = create<AuthState>((set, get) => {
  
  // This IIFE runs immediately when the module is loaded.
  (async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`, {
        withCredentials: true,
        timeout: 10000, // 10 second timeout
      });
      const user = response.data.user;
      set({ 
        user, 
        isAuthenticated: !!user, 
        isLoading: false,
        showSessionExpiryModal: false 
      });
    } catch (error: any) {
      console.error('Failed to fetch user details on initial load', error);
      // On initial load, don't show session expiry modal
      // Only set as unauthenticated if it's a clear 401/403 error
      if (error.response?.status === 401 || error.response?.status === 403) {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false, 
          showSessionExpiryModal: false 
        });
      } else {
        // For network errors or other issues, don't change auth state abruptly
        set({ isLoading: false });
      }
    }
  })();

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    showSessionExpiryModal: false,
    login: (user) => { 
      set({ user, isAuthenticated: true, isLoading: false, showSessionExpiryModal: false });
    },
    logout: async () => {
      try {
        let response
        try {
           response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`, {
            withCredentials: true, // include credentials if needed
          });
        } catch (error) {
          console.error('Logout failed', error);
          // set({ user: null, isAuthenticated: false });
        }
        if (response?.data?.user?.email) {
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/logout`, {
            email: response.data.user.email,
          }, {
            withCredentials: true,
          });
          set({ user: null, isAuthenticated: false, isLoading:false });
        } else {
          console.error("User email not found!");
        }

      } catch (error) {
        console.error('Logout failed', error);
        // set({ user: null, isAuthenticated: false }); // Ensure state is reset even if API call fails
      }
    },

    switchOrganization: (org) => {
      const currentUser = get().user;
      if (!currentUser) return;
      const impersonatedUser = {
        ...currentUser,
        role: org.role,
        organization: org.name,
        originalRole: currentUser.role,
        impersonating: true,
      };
      set({ user: impersonatedUser });
    },
    resetRole: () => {
      const currentUser = get().user;
      if (!currentUser?.impersonating) return;
      const originalUser = {
        ...currentUser,
        role: currentUser.originalRole,
        organization: undefined,
        originalRole: undefined,
        impersonating: false,
      };
      set({ user: originalUser });
    },
    // Expose fetchUser so it can be manually invoked later if needed.
    fetchUser: async () => {
      try {
        set({ isLoading: true });
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`, {
          withCredentials: true,
          timeout: 10000,
        });
        const user = response.data.user;
        set({ 
          user, 
          isAuthenticated: !!user, 
          isLoading: false,
          showSessionExpiryModal: false 
        });
      } catch (error: any) {
        console.error('Failed to fetch user details', error);
        const currentState = get();

        if (error.response?.status === 401 || error.response?.status === 403) {
          // Only show modal if user was previously authenticated (session expired)
          if (currentState.isAuthenticated) {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false, 
              showSessionExpiryModal: true 
            });
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } else {
          // For network errors, don't immediately set as unauthenticated
          // Just stop loading and keep current auth state
          set({ isLoading: false });
        }
      }
    },
    setSessionExpiryModal: (show: boolean) => {
      set({ showSessionExpiryModal: show });
    },
  };
});