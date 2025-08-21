
import React from 'react';
import { Brain, Zap, Code, Database } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';

export const LabBuilder: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <GradientText>AI Lab Builder</GradientText>
        </h1>
        <p className="text-gray-400">Create and customize labs using AI assistance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Brain className="h-12 w-12 text-primary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Creation</h3>
          <p className="text-gray-400">Generate lab content automatically using AI</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Zap className="h-12 w-12 text-secondary-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Quick Setup</h3>
          <p className="text-gray-400">Deploy labs in minutes with smart templates</p>
        </div>

        <div className="bg-dark-200 border border-primary-500/20 rounded-lg p-6">
          <Code className="h-12 w-12 text-accent-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Code Generation</h3>
          <p className="text-gray-400">Auto-generate code examples and exercises</p>
        </div>
      </div>
    </div>
  );
};
