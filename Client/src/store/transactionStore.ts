
import { create } from 'zustand';
import axios from 'axios';
import { Transaction, TransactionFilter, PaginationInfo } from '../types/transactions';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  filters: TransactionFilter;

  // Actions
  fetchTransactions: (orgId?: string, page?: number, limit?: number) => Promise<void>;
  fetchUserTransactions: (userId: string, page?: number, limit?: number) => Promise<void>;
  setFilters: (filters: Partial<TransactionFilter>) => void;
  downloadReceipt: (receiptUrl: string) => Promise<void>;
  exportTransactionsPDF: (orgId?: string) => Promise<void>;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [
    // Demo transactions for development
    {
      id: 'txn_1O1234567890',
      amount: 2999,
      currency: 'USD',
      status: 'paid',
      created: '1704067200',
      customer: 'John Doe',
      receipt_url: 'https://example.com/receipt1.pdf',
      description: 'Cloud Computing Lab - AWS Basics'
    },
    {
      id: 'txn_2O2345678901',
      amount: 9999,
      currency: 'USD',
      status: 'paid',
      created: '1703980800',
      customer: 'John Doe',
      receipt_url: 'https://example.com/receipt2.pdf',
      description: 'Premium Subscription - Monthly'
    },
    {
      id: 'txn_3O3456789012',
      amount: -1999,
      currency: 'USD',
      status: 'canceled',
      created: '1703894400',
      customer: 'John Doe',
      receipt_url: 'https://example.com/receipt3.pdf',
      description: 'Refund - Docker Fundamentals Lab'
    },
    {
      id: 'txn_4O4567890123',
      amount: 4999,
      currency: 'USD',
      status: 'paid',
      created: '1703808000',
      customer: 'John Doe',
      receipt_url: 'https://example.com/receipt4.pdf',
      description: 'Kubernetes Workspace - Advanced'
    },
    {
      id: 'txn_5O5678901234',
      amount: 19999,
      currency: 'USD',
      status: 'pending',
      created: '1703721600',
      customer: 'John Doe',
      receipt_url: '',
      description: 'Annual Subscription - Premium Plus'
    }
  ],
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  filters: {},

  fetchTransactions: async (orgId, page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    
    try {
      const { filters } = get();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateRange && {
          start_date: filters.dateRange.start,
          end_date: filters.dateRange.end
        })
      });

      let endpoint = '';
      if (orgId) {
        endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/v1/transaction_ms/organization/${orgId}/transactions?${queryParams}`;
      } else {
        endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/v1/transaction_ms/transactions?${queryParams}`;
      }

      const response = await axios.get(endpoint, { withCredentials: true });

      if (response.data.success) {
        set({
          transactions: response.data.data.transactions || [],
          pagination: {
            currentPage: response.data.data.currentPage || 1,
            totalPages: response.data.data.totalPages || 1,
            totalItems: response.data.data.totalItems || 0,
            itemsPerPage: limit
          },
          isLoading: false
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch transactions');
      }
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch transactions',
        isLoading: false
      });
    }
  },

  fetchUserTransactions: async (userId: string, page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    
    try {
      const { filters } = get();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateRange && {
          start_date: filters.dateRange.start,
          end_date: filters.dateRange.end
        })
      });

      const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/v1/transaction_ms/user/${userId}/transactions?${queryParams}`;
      const response = await axios.get(endpoint, { withCredentials: true });

      if (response.data.success) {
        set({
          transactions: response.data.data.transactions || [],
          pagination: {
            currentPage: response.data.data.currentPage || 1,
            totalPages: response.data.data.totalPages || 1,
            totalItems: response.data.data.totalItems || 0,
            itemsPerPage: limit
          },
          isLoading: false
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch user transactions');
      }
    } catch (error: any) {
      console.error('Failed to fetch user transactions:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch user transactions',
        isLoading: false
      });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  downloadReceipt: async (receiptUrl) => {
    try {
      window.open(receiptUrl, '_blank');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      set({ error: 'Failed to download receipt' });
    }
  },

  exportTransactionsPDF: async (orgId) => {
    try {
      let endpoint = '';
      if (orgId) {
        endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/v1/transaction_ms/organization/${orgId}/export`;
      } else {
        endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/v1/transaction_ms/export`;
      }

      const response = await axios.get(endpoint, {
        responseType: 'blob',
        withCredentials: true
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export transactions:', error);
      set({ error: 'Failed to export transactions' });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
