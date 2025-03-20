import React from 'react';
import { Lab } from '../../../types';
import { LabCard } from './LabCard';

interface LabListProps {
  labs: Lab[];
  onSelectLab: (lab: Lab) => void;
}

export const LabList: React.FC<LabListProps> = ({ labs, onSelectLab }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {labs.map((lab) => (
        <LabCard key={lab.id} lab={lab} onSelect={onSelectLab} />
      ))}
    </div>
  );
}