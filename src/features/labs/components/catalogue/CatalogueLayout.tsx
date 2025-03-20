import React from 'react';
import { Brain } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { AIRecommendations } from './AIRecommendations';
import { RecommendedSidebar } from './RecommendedSidebar';

interface CatalogueLayoutProps {
  children: React.ReactNode;
}

export const CatalogueLayout: React.FC<CatalogueLayoutProps> = ({ children }) => {
  const [showRecommendations, setShowRecommendations] = React.useState(false);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold">
                <GradientText>Lab Catalogue</GradientText>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-400">
                Browse our collection of hands-on labs and learning paths
              </p>
            </div>
            <button 
              onClick={() => setShowRecommendations(true)}
              className="btn-primary whitespace-nowrap"
            >
              <Brain className="h-4 w-4 mr-2" />
              Get AI Recommendations
            </button>
          </div>
          {children}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="sticky top-6">
            <RecommendedSidebar />
          </div>
        </div>
      </div>

      <AIRecommendations 
        isOpen={showRecommendations} 
        onClose={() => setShowRecommendations(false)} 
      />
    </div>
  );
};