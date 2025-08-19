import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { 
  CreditCard, 
  Download, 
  Eye, 
  Pencil, 
  Trash2, 
  MoreVertical,
  Check,
  X,
  Loader,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { create } from 'zustand';

// Define the structure for a transaction
interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  created: string; // Changed from 'date' to 'created' to match the user's requested format
  customer: string;
  receipt_url: string;
}

// Zustand store for managing transaction data
interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (orgId: string) => Promise<void>;
  deleteTransaction: (orgId: string, transactionId: string) => Promise<void>;
  // Add more actions as needed, e.g., for pagination, filtering
}

const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (orgId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate fetching data. In a real app, this would be an API call.
      // The API endpoint should return data in the format expected by the Transaction interface.
      const response = await axios.get<Transaction[]>(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrganizationTransactions/${orgId}`);
      
      // Map the API response to the Transaction interface if necessary
      // For now, assuming the API response matches the Transaction interface directly
      set({ transactions: response.data }); // Assuming response.data is already an array of Transaction
    } catch (err) {
      console.error("Error fetching transactions:", err);
      set({ error: 'Failed to fetch transactions. Please try again later.' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTransaction: async (orgId: string, transactionId: string) => {
    set({ isLoading: true, error: null }); // Consider a more granular loading state if needed
    try {
      // Assuming a DELETE or POST request to delete a transaction
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/deleteOrganizationTransaction/${orgId}/${transactionId}`);
      // Update state after successful deletion
      set(state => ({
        transactions: state.transactions.filter(t => t.id !== transactionId),
        isLoading: false
      }));
    } catch (err) {
      console.error("Error deleting transaction:", err);
      set({ error: 'Failed to delete transaction. Please try again.', isLoading: false });
    }
  },
}));

// Component to display the list of transactions
interface TransactionListProps {
  orgId: string;
  title: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ orgId, title }) => {
  const { transactions, isLoading, error, fetchTransactions } = useTransactionStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10); // Example: 10 transactions per page

  useEffect(() => {
    fetchTransactions(orgId);
  }, [orgId, fetchTransactions]);

  // --- Pagination Logic ---
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  // --- End Pagination Logic ---

  // Handle receipt download
  const handleDownloadReceipt = async (receiptUrl: string, transactionId: string) => {
    try {
      // Assuming receiptUrl is a direct URL to the PDF or a resource that serves the PDF
      // In a real scenario, you might need to proxy this or handle authentication
      const response = await axios.get(receiptUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Derive filename from URL or use transaction ID
      link.setAttribute('download', `transaction_${transactionId}_receipt.pdf`); 
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading receipt:", err);
      // Handle error, maybe show a toast notification
    }
  };

  // --- Status Badge Component ---
  const StatusBadge: React.FC<{ status: Transaction['status'] }> = ({ status }) => {
    let bgColor = '';
    let textColor = '';
    switch (status) {
      case 'paid':
        bgColor = 'bg-emerald-500/20';
        textColor = 'text-emerald-300';
        break;
      case 'pending':
        bgColor = 'bg-amber-500/20';
        textColor = 'text-amber-300';
        break;
      case 'failed':
        bgColor = 'bg-red-500/20';
        textColor = 'text-red-300';
        break;
      default:
        bgColor = 'bg-gray-500/20';
        textColor = 'text-gray-300';
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${bgColor} ${textColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  // --- End Status Badge Component ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg m-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-200">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          <GradientText>{title}</GradientText>
        </h2>
        {/* Actions like export could be placed here */}
      </div>

      <div className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]"> {/* Ensure minimum width for responsiveness */}
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Receipt</th>
                <th className="py-3 px-4 text-right">Actions</th> {/* Adjusted for actions */}
              </tr>
            </thead>
            <tbody>
              {currentTransactions.length > 0 ? (
                currentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors group"
                  >
                    <td className="py-4 px-4 font-mono text-sm text-gray-300">
                      {transaction.id.substring(0, 8)}... {/* Truncate long IDs */}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-gray-200">
                        <CreditCard className="h-4 w-4 mr-2 text-primary-400" />
                        {/* Assuming amount is in major unit, e.g., cents, and currency is provided */}
                        {transaction.amount.toLocaleString(undefined, { style: 'currency', currency: transaction.currency || 'USD' })}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300 uppercase">
                      {transaction.currency}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(transaction.created).toLocaleString()} {/* Use toLocaleString for date and time */}
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {transaction.customer || 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      {transaction.receipt_url ? (
                        <button
                          onClick={() => handleDownloadReceipt(transaction.receipt_url, transaction.id)}
                          className="p-2 text-secondary-400 hover:text-secondary-300 hover:bg-secondary-500/10 rounded-lg transition-colors"
                          title="Download Receipt"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => console.log('View transaction details:', transaction.id)}
                          className="p-2 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* Add Edit and Delete buttons if needed, also consider using store actions */}
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this transaction?')) {
                              // Use the delete action from the store
                              useTransactionStore.getState().deleteTransaction(orgId, transaction.id);
                            }
                          }}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => console.log('More options for:', transaction.id)}
                          className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No transactions found</h3>
                    <p className="text-gray-400">This organization has no billing transactions yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {transactions.length > transactionsPerPage && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-primary-500/10 text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-500/20"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`p-2 px-3 rounded-lg ${currentPage === i + 1 ? 'bg-primary-500 text-white' : 'bg-primary-500/10 text-primary-300 hover:bg-primary-500/20'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-primary-500/10 text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-500/20"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// The original OrgBillingTab component is now refactored to use TransactionList
export const OrgBillingTab: React.FC<OrgBillingTabProps> = ({ orgId }) => {
  return (
    <div>
      <TransactionList 
        orgId={orgId}
        title="Billing & Payments"
      />
    </div>
  );
};