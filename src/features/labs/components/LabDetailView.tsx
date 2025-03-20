import React from 'react';
import { Lab } from '../types';
import { GradientText } from '../../../components/ui/GradientText';
import { 
  Clock, 
  Tag, 
  Users,
  Star,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface LabDetailViewProps {
  lab: Lab;
  onStart: () => void;
}

export const LabDetailView: React.FC<LabDetailViewProps> = ({
  lab,
  onStart
}) => {
  return (
    <div className="space-y-6">
      <div className="glass-panel">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">
              <GradientText>{lab.title}</GradientText>
            </h1>
            <p className="mt-2 text-gray-400">{lab.description}</p>
          </div>
          <button onClick={onStart} className="btn-primary">
            Start Lab
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="flex items-center space-x-2 text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{lab.duration} minutes</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Tag className="h-4 w-4" />
            <span>{lab.difficulty}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Users className="h-4 w-4" />
            <span>{lab.totalEnrollments} enrolled</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Star className="h-4 w-4" />
            <span>{lab.rating} rating</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="glass-panel">
          <h2 className="text-lg font-semibold mb-4">
            <GradientText>Technologies</GradientText>
          </h2>
          <div className="flex flex-wrap gap-2">
            {lab.technologies.map(tech => (
              <span 
                key={tech}
                className="px-3 py-1 text-sm bg-primary-500/10 text-primary-400 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="text-lg font-semibold mb-4">
            <GradientText>Prerequisites</GradientText>
          </h2>
          <ul className="space-y-2">
            {lab.prerequisites?.map(prereq => (
              <li key={prereq} className="flex items-center text-gray-400">
                <ChevronRight className="h-4 w-4 mr-2" />
                {prereq}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel">
          <h2 className="text-lg font-semibold mb-4">
            <GradientText>Learning Objectives</GradientText>
          </h2>
          <div className="flex items-center justify-center h-full text-gray-400">
            <BookOpen className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
};