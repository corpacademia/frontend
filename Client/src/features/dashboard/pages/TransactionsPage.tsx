
import React from 'react';
import { TransactionList } from '../../../components/transactions/TransactionList';

export const TransactionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <TransactionList title="All Transactions" />
    </div>
  );
};
