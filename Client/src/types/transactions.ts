
export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'canceled';
  created: string;
  customer: string;
  receipt_url: string;
  description?: string;
  payment_method?: string;
}

export interface TransactionFilter {
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
