import React from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { ShoppingCart, CreditCard, Calendar } from 'lucide-react';
import { useUserPurchases } from '../../hooks/useUserPurchases';

interface UserPurchaseHistoryProps {
  userId: string;
}

export const UserPurchaseHistory: React.FC<UserPurchaseHistoryProps> = ({ userId }) => {
  const { purchases, isLoading } = useUserPurchases(userId);

  if (isLoading) return <div>Loading purchase history...</div>;

  return (
    <div className="glass-panel">
      <h2 className="text-xl font-semibold mb-6">
        <GradientText>Purchase History</GradientText>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
              <th className="pb-4">Item</th>
              <th className="pb-4">Type</th>
              <th className="pb-4">Date</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(purchase => (
              <tr key={purchase.id} className="border-b border-primary-500/10">
                <td className="py-4">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="h-5 w-5 text-primary-400" />
                    <span className="text-gray-300">{purchase.itemName}</span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="capitalize text-gray-400">{purchase.type}</span>
                </td>
                <td className="py-4">
                  <div className="flex items-center text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(purchase.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center text-gray-300">
                    <CreditCard className="h-4 w-4 mr-2" />
                    ${purchase.amount}
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    purchase.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                    purchase.status === 'refunded' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {purchase.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};