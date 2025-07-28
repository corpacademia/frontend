import React from 'react';
import { GradientText } from '../../../../../components/ui/GradientText';
import { Clock, BookOpen, FileText, Monitor, Globe } from 'lucide-react';

interface LabDetailsInputProps {
  onNext: (details: { title: string; description: string; duration: number; guacamole: { name: string; url: string } }) => void;
  type?: string; // Optional prop to handle different lab types
}

export const LabDetailsInput: React.FC<LabDetailsInputProps> = ({ onNext, type }) => {
  const [details, setDetails] = React.useState({
    title: '',
    description: '',
    duration: 60 // Default duration in minutes
  });
  const [guacamole, setGuacamole] = React.useState({
    name: '',
    url: ''
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const labDetailsWithGuacamole = { ...details, guacamole };
    const prevData = JSON.parse(localStorage.getItem('formData')) || {}
    const updatedData = {...prevData, details: labDetailsWithGuacamole};
    localStorage.setItem('formData',JSON.stringify(updatedData))
    onNext(labDetailsWithGuacamole);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-semibold">
        <GradientText>Lab Details</GradientText>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-gray-100 mb-2 font-medium">
              <FileText className="h-4 w-4 mr-2 text-primary-400" />
              Lab Title
            </label>
            <input
              type="text"
              value={details.title}
              onChange={(e) => setDetails(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter lab title..."
              className="w-full px-4 py-2 bg-dark-400/70 border border-primary-500/30 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none
                       focus:ring-2 focus:ring-primary-500/30 transition-colors"
              required
            />
          </div>

          <div>
            <label className="flex items-center text-gray-100 mb-2 font-medium">
              <BookOpen className="h-4 w-4 mr-2 text-primary-400" />
              Description
            </label>
            <textarea
              value={details.description}
              onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this lab covers..."
              rows={3}
              className="w-full px-4 py-2 bg-dark-400/70 border border-primary-500/30 rounded-lg
                       text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none
                       focus:ring-2 focus:ring-primary-500/30 transition-colors resize-none"
              required
            />
          </div>

          {/* Guacamole Configuration */}
          { type !== 'cloudslice' && (
            <div className="space-y-4 p-4 bg-dark-300/30 rounded-lg border border-primary-500/10">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center">
              <Monitor className="h-5 w-5 mr-2 text-primary-400" />
              Guacamole Configuration
            </h3>

            <div>
              <label className="flex items-center text-gray-300 mb-2">
                <Monitor className="h-4 w-4 mr-2" />
                Guacamole Name
              </label>
              <input
                type="text"
                value={guacamole.name}
                onChange={(e) => setGuacamole(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter Guacamole instance name"
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none
                         focus:ring-2 focus:ring-primary-500/20 transition-colors"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Unique name to identify this Guacamole instance
              </p>
            </div>

            <div>
              <label className="flex items-center text-gray-300 mb-2">
                <Globe className="h-4 w-4 mr-2" />
                Guacamole URL
              </label>
              <input
                type="url"
                value={guacamole.url}
                onChange={(e) => setGuacamole(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://guacamole.example.com"
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none
                         focus:ring-2 focus:ring-primary-500/20 transition-colors"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Full URL to access the Guacamole instance
              </p>
            </div>
          </div>
          )}
          

          {/* <div>
            <label className="flex items-center text-gray-300 mb-2">
              <Clock className="h-4 w-4 mr-2" />
              Duration (minutes)
            </label>
            <input
              type="number"
              min="15"
              step="15"
              value={details.duration}
              onChange={(e) => setDetails(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       focus:ring-2 focus:ring-primary-500/20 transition-colors"
              required
            />
          </div> */}
        </div>

        <button type="submit" className="btn-primary w-full">
          Continue
        </button>
      </form>
    </div>
  );
};