import { create } from "zustand";
import axios from "axios";
import { useBatchStore } from "./batchStore";

/* =========================
   Types
========================= */

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "trainer" | "labadmin" | "superadmin" | "orgsuperadmin";
  organization?: string;
  org_id?: string;
  phone?: string;
  location?: string;
  bio?: string;
  jobTitle?: string;
  profileImage?: string;
  impersonating?: boolean;
  originalRole?: string;
  originalOrgId?: string;
  impersonatedUserId?: string;
}

interface Organization {
  id: string;
  name: string;
  role?: "labadmin" | "orgsuperadmin";
  impersonatedUserId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showSessionExpiryModal: boolean;
  orgUsers: User | null;

  /* Global organizations */
  organizations: Organization[];
  isOrgLoading: boolean;

  login: (user: User) => void;
  logout: () => Promise<void>;
  switchOrganization: (org: Organization) => void;
  resetRole: () => void;

  fetchUser: () => Promise<void>;
  fetchOrganizations: () => Promise<void>;
  fetchOrganizationsUsers: (orgId: string) => Promise<void>;

  setSessionExpiryModal: (show: boolean) => void;
  updateOrganization: (org: Organization) => void;
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

      //  Fetch organizations globally after login
       await get().fetchOrganizations(); 
      if (user && user?.org_id) {
        await get().fetchOrganizationsUsers(user?.org_id);
         
      }
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
    orgUsers: [],

   updateOrganization: (updatedOrg) =>
  set((state) => ({
    organizations: state.organizations.map((org) =>
      org.id === updatedOrg.id ? { ...org, ...updatedOrg } : org
    ),
  })),

    /* ---------- Auth ---------- */

    login: (user) => {
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        showSessionExpiryModal: false,
      });

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
        useBatchStore.getState().resetBatchStore();
      }
    },

    /* ---------- Organization Impersonation ---------- */

    switchOrganization: (org) => {
      const currentUser = get().user;
      if (!currentUser) return;
      set({
        user: {
          ...currentUser,
          role: org.role || "orgsuperadmin",
          organization: org.name,
          org_type:org?.org_type,
          org_id: org.id,
          originalRole: currentUser.originalRole || currentUser.role,
          originalOrgId: currentUser.originalOrgId || currentUser.org_id,
          impersonatedUserId: org?.org_admin,
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
          role: currentUser.originalRole as User['role'],
          organization: undefined,
          org_id: currentUser.originalOrgId,
          originalRole: undefined,
          originalOrgId: undefined,
          impersonatedUserId: undefined,
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
          await get().fetchOrganizationsUsers(user?.org_id);
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
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`,
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

    fetchOrganizationsUsers: async (orgId: string) => {
      try {
        set({ isLoading: true });

        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${orgId}`)

        set({
          orgUsers: response.data?.data || [],
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to fetch organizations", error);
        set({ isLoading: false });
      }
    },

    /* ---------- UI ---------- */

    setSessionExpiryModal: (show) => {
      set({ showSessionExpiryModal: show });
    },
  };
});
