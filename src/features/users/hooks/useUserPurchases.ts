import { useState, useEffect } from 'react';
import { PurchaseHistory } from '../types';

export const useUserPurchases = (userId: string) => {
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        // TODO: Replace with actual API call
        // Mock data for now
        const mockPurchases: PurchaseHistory[] = [
          {
            id: '1',
            type: 'lab',
            itemName: 'Cloud Architecture Masterclass',
            amount: 199.99,
            date: new Date('2024-03-01'),
            status: 'completed'
          },
          {
            id: '2',
            type: 'assessment',
            itemName: 'AWS Certification Practice Exam',
            amount: 49.99,
            date: new Date('2024-02-15'),
            status: 'completed'
          },
          {
            id: '3',
            type: 'subscription',
            itemName: 'Pro Monthly Plan',
            amount: 29.99,
            date: new Date('2024-03-10'),
            status: 'completed'
          }
        ];
        
        setPurchases(mockPurchases);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchases();
  }, [userId]);

  return { purchases, isLoading };
};