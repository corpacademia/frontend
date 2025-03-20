import { useState, useEffect } from 'react';

interface TrainerStats {
  activeStudents: number;
  totalStudents: number;
  labsCreated: number;
  totalLabs: number;
  assessmentsCreated: number;
  totalAssessments: number;
  trainingHours: number;
}

export const useTrainerStats = (userId: string) => {
  const [stats, setStats] = useState<TrainerStats>({
    activeStudents: 0,
    totalStudents: 0,
    labsCreated: 0,
    totalLabs: 0,
    assessmentsCreated: 0,
    totalAssessments: 0,
    trainingHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API call
        // Mock data for now
        const mockStats: TrainerStats = {
          activeStudents: 45,
          totalStudents: 60,
          labsCreated: 12,
          totalLabs: 15,
          assessmentsCreated: 8,
          totalAssessments: 10,
          trainingHours: 120
        };
        
        setStats(mockStats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, isLoading };
};