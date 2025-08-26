
export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'canceled'|'refunded';
  created: string;
  customer: string;
  receipt_url: string;
  description?: string;
  payment_method?: string;
  products: { id: string; name: string; price: number; quantity: number }[];
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
