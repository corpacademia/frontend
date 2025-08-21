
import React from 'react';
import { Users, GraduationCap, Award } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

export const Students: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <GradientText>Students</GradientText>
        </h1>
        <p className="text-gray-400">Manage and track your students' progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Users className="h-12 w-12 text-primary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Student Management</h3>
          <p className="text-gray-400">Add, organize, and manage your students</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <GraduationCap className="h-12 w-12 text-secondary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Performance Tracking</h3>
          <p className="text-gray-400">Monitor student progress and performance</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Award className="h-12 w-12 text-accent-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Assessments</h3>
          <p className="text-gray-400">Create and manage student assessments</p>
        </div>
      </div>
    </div>
  );
};
