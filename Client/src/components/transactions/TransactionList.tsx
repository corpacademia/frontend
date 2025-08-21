
import React, { useEffect, useState } from 'react';
import { 
  Download, 
  ExternalLink, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Receipt,
  CreditCard,
  Calendar,
  X,
  FileText,
  Loader
} from 'lucide-react';
import { useTransactionStore } from '../../store/transactionStore';
import { TransactionFilter } from '../../types/transactions';
import { GradientText } from '../ui/GradientText';

interface TransactionListProps {
  orgId?: string;
  title?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  orgId, 
  title = "Transactions" 
}) => {
  const {
    transactions,
    isLoading,
    error,
    pagination,
    filters,
    fetchTransactions,
    setFilters,
    downloadReceipt,
    exportTransactionsPDF,
    clearError
  } = useTransactionStore();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<TransactionFilter>({});


  useEffect(() => {
    fetchTransactions(orgId, 1);
  }, [orgId]);

  const handlePageChange = (page: number) => {
    fetchTransactions(orgId, page);
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    fetchTransactions(orgId, 1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    setFilters({});
    fetchTransactions(orgId, 1);
    setShowFilters(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'pending':
        return 'bg-amber-500/20 text-amber-300';
      case 'failed':
        return 'bg-red-500/20 text-red-300';
      case 'canceled':
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">
          <GradientText>{title}</GradientText>
        </h2>
        <div className="flex flex-wrap gap-3">
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary text-gray-300 flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => exportTransactionsPDF(orgId)}
            className="btn-secondary text-gray-300 flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg flex items-center justify-between">
          <span className="text-red-200">{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-panel">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={localFilters.search || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-dark-300 border border-primary-500/20 rounded-lg text-gray-200 placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={localFilters.status || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                className="w-full px-3 py-2 bg-dark-300 border border-primary-500/20 rounded-lg text-gray-200 focus:border-primary-500 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="succeeded">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Date Range
  </label>
  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
    <input
      type="date"
      value={localFilters.dateRange?.start || ''}
      onChange={(e) =>
        setLocalFilters({
          ...localFilters,
          dateRange: {
            ...localFilters.dateRange,
            start: e.target.value,
            end: localFilters.dateRange?.end || '',
          },
        })
      }
      className="flex-1 px-3 py-2 bg-dark-300 border border-primary-500/20 rounded-lg 
                 text-gray-200 focus:border-primary-500 focus:outline-none"
    />
    <input
      type="date"
      value={localFilters.dateRange?.end || ''}
      onChange={(e) =>
        setLocalFilters({
          ...localFilters,
          dateRange: {
            ...localFilters.dateRange,
            start: localFilters.dateRange?.start || '',
            end: e.target.value,
          },
        })
      }
      className="flex-1 px-3 py-2 bg-dark-300 border border-primary-500/20 rounded-lg 
                 text-gray-200 focus:border-primary-500 focus:outline-none"
    />
  </div>
</div>

          </div>

          <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-primary-500/10">
            <button
              onClick={handleClearFilters}
              className="btn-secondary text-gray-300"
            >
              Clear
            </button>
            <button
              onClick={handleApplyFilters}
              className="btn-primary text-gray-300"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="glass-panel">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 text-primary-400 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No transactions found</h3>
            <p className="text-gray-400">No transactions match your current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                    <th className="pb-4">Transaction ID</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Customer</th>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr 
                      key={transaction.id}
                      className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
                    >
                      <td className="py-4">
                        <span className="font-mono text-sm text-gray-300">
                          {transaction.id}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center text-gray-200">
                          <CreditCard className="h-4 w-4 mr-2 text-primary-400" />
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 text-gray-300">
                        {transaction?.customer_name}
                      </td>
                      <td className="py-4 text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(transaction.created)}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          {transaction.receipt_url && (
                            <button
                              onClick={() => downloadReceipt(transaction.receipt_url)}
                              className="p-2 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors"
                              title="Download Receipt"
                            >
                              <Receipt className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`https://dashboard.stripe.com/payments/${transaction.id}`, '_blank')}
                            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10 rounded-lg transition-colors"
                            title="View in Stripe"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary-500/10">
                <div className="text-sm text-gray-400">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                  {pagination.totalItems} transactions
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        page === pagination.currentPage
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-dark-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
