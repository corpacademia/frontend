import React from 'react';
import { useVMInstances } from '../../hooks/useVMInstances';
import { VMInstanceCard } from './VMInstanceCard';

export const VMInstanceList: React.FC = () => {
  const { instances, isLoading } = useVMInstances();

  if (isLoading) {
    return <div>Loading instances...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {instances.map(instance => (
        <VMInstanceCard key={instance.id} instance={instance} />
      ))}
    </div>
  );
};