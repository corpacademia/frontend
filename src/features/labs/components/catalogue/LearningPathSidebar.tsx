import React from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Brain, BookOpen, Clock, Star } from 'lucide-react';

export const LearningPathSidebar: React.FC = () => {
  const recommendedPaths = [
    {
      id: '1',
      title: 'Cloud Architecture',
      description: 'Master cloud infrastructure and design patterns',
      duration: '12 weeks',
      level: 'Advanced',
      rating: 4.8,
      enrollments: 1250,
      labs: 8
    },
    {
      id: '2',
      title: 'DevOps Engineering',
      description: 'Learn CI/CD, containers, and automation',
      duration: '10 weeks',
      level: 'Intermediate',
      rating: 4.9,
      enrollments: 980,
      labs: 6
    }
  ];

  return (
    <div className="w-80 space-y-6">
      <div className="glass-panel">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-primary-400" />
          <h2 className="text-lg font-semibold">
            <GradientText>Recommended Paths</GradientText>
          </h2>
        </div>

        <div className="space-y-4">
          {recommendedPaths.map(path => (
            <div 
              key={path.id}
              className="p-4 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors cursor-pointer"
            >
              <h3 className="font-medium text-gray-200">{path.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{path.description}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center text-gray-400">
                  <Clock className="h-4 w-4 mr-1" />
                  {path.duration}
                </div>
                <div className="flex items-center text-gray-400">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {path.labs} Labs
                </div>
                <div className="flex items-center text-gray-400">
                  <Star className="h-4 w-4 mr-1 text-yellow-400" />
                  {path.rating}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};