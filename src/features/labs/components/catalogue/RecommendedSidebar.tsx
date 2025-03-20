import React from 'react';
import { Star, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';

const recommendedLabs = [
  {
    id: '1',
    title: 'AWS Solutions Architect',
    description: 'Master cloud architecture patterns and best practices',
    price: 199.99,
    rating: 4.8,
    duration: '8 hours'
  },
  {
    id: '2',
    title: 'Kubernetes Mastery',
    description: 'Deep dive into container orchestration',
    price: 149.99,
    rating: 4.9,
    duration: '6 hours'
  },
  {
    id: '3',
    title: 'DevOps Pipeline',
    description: 'Build robust CI/CD workflows',
    price: 129.99,
    rating: 4.7,
    duration: '5 hours'
  }
];

export const RecommendedSidebar: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass-panel">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary-400" />
          <h2 className="text-lg font-semibold">
            <GradientText>Top Rated Labs</GradientText>
          </h2>
        </div>

        <div className="space-y-4">
          {recommendedLabs.map(lab => (
            <div 
              key={lab.id}
              className="p-4 bg-dark-300/50 rounded-lg hover:bg-dark-300 
                       transition-all duration-300 cursor-pointer"
            >
              <h3 className="font-medium text-gray-200 mb-1">{lab.title}</h3>
              <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                {lab.description}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    {lab.rating}
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Clock className="h-4 w-4 mr-1" />
                    {lab.duration}
                  </div>
                </div>
                <span className="font-medium text-primary-400">
                  ${lab.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary-400" />
          <h2 className="text-lg font-semibold">
            <GradientText>Learning Paths</GradientText>
          </h2>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Cloud Architecture', count: 8 },
            { name: 'DevOps Engineering', count: 6 },
            { name: 'Security Expert', count: 7 }
          ].map(path => (
            <div 
              key={path.name}
              className="flex items-center justify-between p-3 
                       bg-dark-300/50 rounded-lg hover:bg-dark-300 
                       transition-colors cursor-pointer"
            >
              <span className="text-gray-300">{path.name}</span>
              <span className="text-sm text-gray-400">{path.count} labs</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};