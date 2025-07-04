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

interface Transaction {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  paymentMethod: string;
}

interface OrgBillingTabProps {
  orgId: string;
}

export const OrgBillingTab: React.FC<OrgBillingTabProps> = ({ orgId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrganizationTransactions/${orgId}`);
        if (response.data.success) {
          setTransactions(response.data.data);
        } else {
          throw new Error('Failed to fetch transactions');
        }
      } catch (err) {
        setError('Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [orgId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(transactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedTransactions.length) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/deleteOrganizationTransactions`, {
        orgId,
        transactionIds: selectedTransactions
      });

      if (response.data.success) {
        setTransactions(prev => prev.filter(t => !selectedTransactions.includes(t.id)));
        setSelectedTransactions([]);
        setSuccess('Selected transactions deleted successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete transactions');
      }
    } catch (err) {
      setError('Failed to delete selected transactions');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportBilling = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/exportBilling/${orgId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `billing_export_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export billing data');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          <GradientText>Billing & Payments</GradientText>
        </h2>
        <div className="flex space-x-4">
          {selectedTransactions.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="btn-secondary text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </button>
          )}
          <button 
            onClick={handleExportBilling}
            className="btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-200">{success}</span>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                <th className="pb-4 pl-4">
                  <input
                    type="checkbox"
                    checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                  />
                </th>
                <th className="pb-4">Transaction ID</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Payment Method</th>
                <th className="pb-4">Date</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
                >
                  <td className="py-4 pl-4">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                      className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-4">
                    <span className="font-mono text-sm text-gray-300">
                      {transaction.id}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center text-gray-200">
                      <CreditCard className="h-4 w-4 mr-2 text-primary-400" />
                      ${transaction.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' :
                      transaction.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-300">
                    {transaction.paymentMethod}
                  </td>
                  <td className="py-4 text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <Eye className="h-4 w-4 text-primary-400" />
                      </button>
                      <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <Pencil className="h-4 w-4 text-primary-400" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                      <button className="p 2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};