import { useState, useEffect } from 'react';
import { UserAssessment } from '../types';

export const useUserAssessments = (userId: string) => {
  const [assessments, setAssessments] = useState<UserAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        // TODO: Replace with actual API call
        // Mock data for now
        const mockAssessments: UserAssessment[] = [
          {
            id: '1',
            title: 'Cloud Architecture Assessment',
            type: 'certification',
            dueDate: new Date('2024-04-01'),
            status: 'completed',
            score: 92
          },
          {
            id: '2',
            title: 'Docker & Kubernetes Skills',
            type: 'skills',
            dueDate: new Date('2024-04-15'),
            status: 'in-progress'
          }
        ];
        
        setAssessments(mockAssessments);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, [userId]);

  return { assessments, isLoading };
};