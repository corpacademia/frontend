import { useState, useEffect } from 'react';

interface OrgAdminStats {
  teamMembers: number;
  totalSeats: number;
  activeLabs: number;
  totalLabs: number;
  departments: number;
  monthlyUsage: number;
  usageChange: number;
}

export const useOrgAdminStats = (userId: string) => {
  const [stats, setStats] = useState<OrgAdminStats>({
    teamMembers: 0,
    totalSeats: 0,
    activeLabs: 0,
    totalLabs: 0,
    departments: 0,
    monthlyUsage: 0,
    usageChange: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API call
        // Mock data for now
        const mockStats: OrgAdminStats = {
          teamMembers: 85,
          totalSeats: 100,
          activeLabs: 156,
          totalLabs: 200,
          departments: 8,
          monthlyUsage: 12500,
          usageChange: 15
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