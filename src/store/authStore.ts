import { create } from 'zustand';
import axios from 'axios';
import { User } from '../types/auth';

interface AuthState {
  user: (User & { impersonating?: boolean; originalRole?: string; organization?: string }) | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  switchOrganization: (org: { id: string; name: string; role: 'orgadmin' }) => void;
  resetRole: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // This IIFE runs immediately when the module is loaded.
  (async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile', {
        withCredentials: true, // include credentials if needed
      });
      const user = response.data.user;
      set({ user, isAuthenticated: !!user });
    } catch (error) {
      console.error('Failed to fetch user details', error);
      set({ user: null, isAuthenticated: false });
    }
  })();

  return {
    user: null,
    isAuthenticated: false,
    login: (user) => { 
      set({ user, isAuthenticated: true });
    },
    logout: async () => {
      try {
        await axios.get('http://localhost:3000/api/v1/user_ms/logout', {
          withCredentials: true,
        });
        set({ user: null, isAuthenticated: false });
      } catch (error) {
        console.error('Logout failed', error);
        set({ user: null, isAuthenticated: false }); // Ensure state is reset even if API call fails
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
        const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile', {
          withCredentials: true,
        });
        const user = response.data.user;
        set({ user, isAuthenticated: !!user });
      } catch (error) {
        console.error('Failed to fetch user details', error);
        set({ user: null, isAuthenticated: false });
      }
    }
  };
});
