import { create } from "zustand";
import axios from "axios";

/* =========================
   Types
========================= */

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "trainer" | "labadmin" | "superadmin" | "orgsuperadmin";
  organization?: string;
  phone?: string;
  location?: string;
  bio?: string;
  jobTitle?: string;
  profileImage?: string;
  impersonating?: boolean;
  originalRole?: string;
}

interface Organization {
  id: string;
  name: string;
  role?: "labadmin";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showSessionExpiryModal: boolean;

  /* 🌍 Global organizations */
  organizations: Organization[];
  isOrgLoading: boolean;

  login: (user: User) => void;
  logout: () => Promise<void>;
  switchOrganization: (org: Organization) => void;
  resetRole: () => void;

  fetchUser: () => Promise<void>;
  fetchOrganizations: () => Promise<void>;

  setSessionExpiryModal: (show: boolean) => void;
}

/* =========================
   Store
========================= */

export const useAuthStore = create<AuthState>((set, get) => {
  /* =========================
     Initial user fetch (IIFE)
  ========================= */
  (async () => {
    set({ isLoading: true });

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`,
        {
          withCredentials: true,
          timeout: 10000,
        }
      );

      const user = response.data.user;

      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        showSessionExpiryModal: false,
      });

      // ✅ Fetch organizations globally after login
      // if (user) {
        await get().fetchOrganizations();
      // }
    } catch (error: any) {
      console.error("Failed to fetch user details on initial load", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          showSessionExpiryModal: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  })();

  /* =========================
     Store state & actions
  ========================= */

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    showSessionExpiryModal: false,

    organizations: [],
    isOrgLoading: false,

    /* ---------- Auth ---------- */

    login: (user) => {
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        showSessionExpiryModal: false,
      });

      get().fetchOrganizations();
    },

    logout: async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`,
          { withCredentials: true }
        );

        if (response?.data?.user?.email) {
          await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/logout`,
            { email: response.data.user.email },
            { withCredentials: true }
          );
        }
      } catch (error) {
        console.error("Logout failed", error);
      } finally {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          organizations: [],
        });
      }
    },

    /* ---------- Organization Impersonation ---------- */

    switchOrganization: (org) => {
      const currentUser = get().user;
      if (!currentUser) return;

      set({
        user: {
          ...currentUser,
          role: org.role || "labadmin",
          organization: org.name,
          originalRole: currentUser.role,
          impersonating: true,
        },
      });
    },

    resetRole: () => {
      const currentUser = get().user;
      if (!currentUser?.impersonating) return;

      set({
        user: {
          ...currentUser,
          role: currentUser.originalRole!,
          organization: undefined,
          originalRole: undefined,
          impersonating: false,
        },
      });
    },

    /* ---------- Fetch User ---------- */

    fetchUser: async () => {
      try {
        set({ isLoading: true });

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`,
          {
            withCredentials: true,
            timeout: 10000,
          }
        );

        const user = response.data.user;

        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          showSessionExpiryModal: false,
        });

        if (user) {
          await get().fetchOrganizations();
        }
      } catch (error: any) {
        console.error("Failed to fetch user details", error);
        const state = get();

        if (error.response?.status === 401 || error.response?.status === 403) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            showSessionExpiryModal: state.isAuthenticated,
          });
        } else {
          set({ isLoading: false });
        }
      }
    },

    /* ---------- Fetch Organizations ---------- */

    fetchOrganizations: async () => {
      try {
        set({ isOrgLoading: true });

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/org_ms/getOrganizations`,
          {
            withCredentials: true,
            timeout: 10000,
          }
        );

        set({
          organizations: response.data?.data || [],
          isOrgLoading: false,
        });
      } catch (error) {
        console.error("Failed to fetch organizations", error);
        set({ isOrgLoading: false });
      }
    },

    /* ---------- UI ---------- */

    setSessionExpiryModal: (show) => {
      set({ showSessionExpiryModal: show });
    },
  };
});
