import React from 'react';
import { Lab } from '../types/assignLab';

interface LabSelectorProps {
  labs: Lab[];
  selectedLab: string;
  onChange: (labId: string) => void;
}

export const LabSelector: React.FC<LabSelectorProps> = ({
  labs,
  selectedLab,
  onChange
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Select Lab
      </label>
      <select
        value={selectedLab}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                 text-gray-300 focus:border-primary-500/40 focus:outline-none
                 focus:ring-2 focus:ring-primary-500/20 transition-colors"
      >
        <option value="">Select a lab</option>
        {labs.map(lab => (
          <option key={lab.id} value={lab.id}>
            {lab.title}
          </option>
        ))}
      </select>
    </div>
  );
};