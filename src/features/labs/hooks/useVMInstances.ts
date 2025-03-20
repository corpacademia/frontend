import { useState, useEffect } from 'react';
import { VMInstance } from '../types/vm';

// Mock data - Replace with API call
const mockInstances: VMInstance[] = [
  {
    id: '1',
    name: 'dev-workspace-1',
    status: 'running',
    provider: 'aws',
    type: 't3.large',
    ip: '10.0.1.100',
    uptime: '2h 15m',
    cost: 0.45,
    specs: {
      cpu: 2,
      ram: 8,
      storage: 100
    }
  },
  // Add more mock instances...
];

export const useVMInstances = () => {
  const [instances, setInstances] = useState<VMInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setInstances(mockInstances);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstances();
  }, []);

  return { instances, isLoading };
};