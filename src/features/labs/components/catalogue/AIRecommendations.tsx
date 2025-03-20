import React from 'react';
import { X, Brain, BookOpen, Target, Clock } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';

interface AIRecommendationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl w-full max-w-2xl">
        <div className="p-6 border-b border-primary-500/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary-400" />
              <h2 className="text-xl font-semibold">
                <GradientText>AI Lab Recommendations</GradientText>
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-dark-300/50 rounded-lg">
            <Target className="h-5 w-5 text-primary-400" />
            <div>
              <h3 className="font-medium text-gray-200">What's your goal?</h3>
              <p className="text-sm text-gray-400">Help us understand what you want to learn</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="I want to learn..."
                className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none"
              />
              <button className="btn-primary">
                Get Started
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Cloud Architecture', 'DevOps', 'Kubernetes', 'Machine Learning'].map(topic => (
                <button
                  key={topic}
                  className="px-3 py-1.5 text-sm bg-dark-300/50 text-gray-300 rounded-full
                           hover:bg-primary-500/10 hover:text-primary-300 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400">Popular Learning Paths</h3>
            <div className="space-y-3">
              {[
                { title: 'Cloud Architecture Mastery', duration: '12 weeks', labs: 8 },
                { title: 'DevOps Engineering', duration: '10 weeks', labs: 6 },
                { title: 'Full Stack Development', duration: '16 weeks', labs: 12 }
              ].map(path => (
                <div 
                  key={path.title}
                  className="p-4 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors cursor-pointer"
                >
                  <h4 className="font-medium text-gray-200">{path.title}</h4>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {path.duration}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {path.labs} Labs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};