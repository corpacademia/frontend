
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  BookOpen, 
  CreditCard, 
  RefreshCw, 
  Download, 
  Calendar, 
  Filter,
  Search,
  Loader,
  AlertCircle,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { GradientText } from '../components/ui/GradientText';
import { useTransactionStore } from '../store/transactionStore';
import { useAuthStore } from '../store/authStore';
import { Transaction } from '../types/transactions';

type PurchaseCategory = 'labs' | 'subscription' | 'refund';

export const PurchaseHistoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    transactions,
    isLoading,
    error,
    pagination,
    fetchTransactions,
    fetchUserTransactions,
    downloadReceipt,
    exportTransactionsPDF,
    clearError
  } = useTransactionStore();

  const [activeCategory, setActiveCategory] = useState<PurchaseCategory>('labs');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserTransactions(user.id, 1); // Fetch user-specific transactions
    }
  }, [user?.id, fetchUserTransactions]);

  const categorizeTransactions = (transactions: Transaction[]): Record<PurchaseCategory, Transaction[]> => {
    return {
      labs: transactions.filter(t => 
        t.description?.toLowerCase().includes('lab') && t.status !== 'refunded'|| 
        t.description?.toLowerCase().includes('course')  && t.status !== 'refunded'
      ),
      subscription: transactions.filter(t => 
        t.description?.toLowerCase().includes('subscription') || 
        t.description?.toLowerCase().includes('monthly') ||
        t.description?.toLowerCase().includes('annual') ||
        t.description?.toLowerCase().includes('premium')
      ),
      refund: transactions.filter(t => 
        t.status === 'refunded' || 
        t.description?.toLowerCase().includes('refund') ||
        t.amount < 0
      )
    };
  };

  const categorizedTransactions = categorizeTransactions(transactions);
  const currentTransactions = categorizedTransactions[activeCategory];

  const filteredTransactions = currentTransactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(parseInt(transaction.created) * 1000);
      const now = new Date();
      
      switch (dateFilter) {
        case 'week':
          matchesDate = transactionDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          matchesDate = transactionDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          matchesDate = transactionDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    return matchesSearch && matchesDate;
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(Math.abs(amount) / 100);
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

  const getCategoryIcon = (category: PurchaseCategory) => {
    switch (category) {
      case 'labs':
        return <BookOpen className="h-5 w-5" />;
      case 'subscription':
        return <CreditCard className="h-5 w-5" />;
      case 'refund':
        return <RefreshCw className="h-5 w-5" />;
    }
  };

  const getCategoryStats = (category: PurchaseCategory) => {
    const categoryTransactions = categorizedTransactions[category];
    const total = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const count = categoryTransactions.length;
    
    return { total, count };
  };
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-400 via-dark-300 to-dark-200 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-400 via-dark-300 to-dark-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                <GradientText>Purchase History</GradientText>
              </h1>
              <p className="text-gray-400">Track your transactions, subscriptions, and refunds</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary text-gray-400 flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button
                onClick={() => exportTransactionsPDF()}
                className="btn-secondary text-gray-400 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {(['labs', 'subscription', 'refund'] as PurchaseCategory[]).map((category) => {
              const stats = getCategoryStats(category);
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                    activeCategory === category
                      ? 'bg-primary-500/20 border border-primary-400/50 text-primary-300'
                      : 'bg-dark-200/50 border border-primary-500/20 text-gray-400 hover:bg-primary-500/10'
                  }`}
                >
                  {getCategoryIcon(category)}
                  <span className="capitalize font-medium">{category}</span>
                  <span className="text-xs px-2 py-1 bg-dark-400/50 rounded-full">
                    {stats.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(['labs', 'subscription', 'refund'] as PurchaseCategory[]).map((category) => {
              const stats = getCategoryStats(category);
              const isActive = activeCategory === category;
              
              return (
                <div
                  key={category}
                  className={`bg-dark-200/80 backdrop-blur-sm border rounded-xl p-4 ${
                    isActive ? 'border-primary-400/50' : 'border-primary-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <span className="text-sm font-medium text-gray-300 capitalize">{category}</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(stats.total, 'INR')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {stats.count} transaction{stats.count !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-dark-200/80 backdrop-blur-sm border border-primary-500/20 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-400 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-400 focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-dark-200/80 backdrop-blur-sm border border-primary-500/20 rounded-xl">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 text-primary-400 animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No {activeCategory} transactions found
              </h3>
              <p className="text-gray-400">
                {searchTerm || dateFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : `You haven't made any ${activeCategory} purchases yet.`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                    <th className="pb-4 pl-6">Transaction</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Date</th>
                    <th className="pb-4 pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className={`border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors ${
                        index === filteredTransactions.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="py-4 pl-6">
                        <div>
                          <div className="font-medium text-white">
                            {transaction.products[0].name || `Transaction ${transaction.id.substring(0, 8)}`}
                          </div>
                          <div className="text-sm text-gray-400 font-mono">
                            ID: {transaction.id.substring(0, 12)}...
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-primary-400" />
                          <span className={`font-medium ${
                            transaction.amount < 0 ? 'text-red-300' : 'text-emerald-300'
                          }`}>
                            {transaction.amount < 0 ? '-' : ''}{formatCurrency(transaction.amount, transaction.currency)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(transaction.created)}
                        </div>
                      </td>
                      <td className="py-4 pr-6">
                        <div className="flex items-center space-x-2">
                          {transaction.receipt_url && (
                            <button
                              onClick={() => downloadReceipt(transaction.receipt_url)}
                              className="p-2 bg-primary-500/20 hover:bg-primary-500/30 rounded-lg transition-colors"
                              title="Download Receipt"
                            >
                              <Receipt className="h-4 w-4 text-primary-400" />
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/transaction/${transaction.id}`, '_blank')}
                            className="p-2 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
