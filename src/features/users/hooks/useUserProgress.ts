import { useState, useEffect } from 'react';

interface Progress {
  completedLabs: number;
  totalLabs: number;
  passedAssessments: number;
  totalAssessments: number;
  masteredSkills: number;
  totalSkills: number;
  learningHours: number;
}

export const useUserProgress = (userId: string) => {
  const [progress, setProgress] = useState<Progress>({
    completedLabs: 0,
    totalLabs: 0,
    passedAssessments: 0,
    totalAssessments: 0,
    masteredSkills: 0,
    totalSkills: 0,
    learningHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // TODO: Replace with actual API call
        // Mock data for now
        const mockProgress: Progress = {
          completedLabs: 12,
          totalLabs: 15,
          passedAssessments: 8,
          totalAssessments: 10,
          masteredSkills: 24,
          totalSkills: 30,
          learningHours: 45
        };
        
        setProgress(mockProgress);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);

  return { progress, isLoading };
};