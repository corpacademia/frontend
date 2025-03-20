import React from 'react';
import { GradientText } from '../../../../../components/ui/GradientText';
import { Clock, BookOpen, FileText } from 'lucide-react';

interface LabDetailsInputProps {
  onNext: (details: { title: string; description: string; duration: number }) => void;
}

export const LabDetailsInput: React.FC<LabDetailsInputProps> = ({ onNext }) => {
  const [details, setDetails] = React.useState({
    title: '',
    description: '',
    duration: 60 // Default duration in minutes
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prevData = JSON.parse(localStorage.getItem('formData')) || {}
    const updatedData = {...prevData, details};
    localStorage.setItem('formData',JSON.stringify(updatedData))
    onNext(details);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-semibold">
        <GradientText>Lab Details</GradientText>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-gray-300 mb-2">
              <BookOpen className="h-4 w-4 mr-2" />
              Lab Title
            </label>
            <input
              type="text"
              value={details.title}
              onChange={(e) => setDetails(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter lab title"
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       focus:ring-2 focus:ring-primary-500/20 transition-colors"
              required
            />
          </div>

          <div>
            <label className="flex items-center text-gray-300 mb-2">
              <FileText className="h-4 w-4 mr-2" />
              Description
            </label>
            <textarea
              value={details.description}
              onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter lab description"
              className="w-full h-32 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       focus:ring-2 focus:ring-primary-500/20 transition-colors resize-none"
              required
            />
          </div>

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