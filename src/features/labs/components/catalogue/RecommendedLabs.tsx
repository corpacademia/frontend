import React from 'react';
import { Sparkles } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { CatalogueCard } from './CatalogueCard';
import { Lab } from '../../types';

interface RecommendedLabsProps {
  labs: Lab[];
}

export const RecommendedLabs: React.FC<RecommendedLabsProps> = ({ labs }) => {
  return (
    <div className="mb-8">
      {/* <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary-400" />
        <div>
          <h2 className="text-xl font-semibold">
            <GradientText>Recommended for You</GradientText>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Personalized lab recommendations based on your interests and skill level
          </p>
        </div>
      </div> */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {labs.slice(0, 2).map(lab => (
          <CatalogueCard key={lab.id} lab={lab} />
        ))}
      </div>
    </div>
  );
};