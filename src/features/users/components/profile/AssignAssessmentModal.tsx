import React, { useState } from 'react';
import { X, Award, AlertCircle } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';

interface AssignAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Assessment {
  id: string;
  title: string;
  type: string;
  description: string;
  duration: number;
}

// Mock available assessments
const availableAssessments: Assessment[] = [
  {
    id: '1',
    title: 'AWS Solutions Architect',
    type: 'certification',
    description: 'Comprehensive assessment for AWS architecture skills',
    duration: 180
  },
  {
    id: '2',
    title: 'Docker & Kubernetes',
    type: 'skills',
    description: 'Container orchestration and deployment assessment',
    duration: 120
  },
  {
    id: '3',
    title: 'DevOps Practices',
    type: 'certification',
    description: 'Assessment of CI/CD and DevOps methodologies',
    duration: 150
  }
];

export const AssignAssessmentModal: React.FC<AssignAssessmentModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedAssessment || !dueDate) {
      setError('Please select an assessment and due date');
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onClose();
    } catch (err) {
      setError('Failed to assign assessment. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Assign Assessment</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Assessment
            </label>
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       focus:ring-2 focus:ring-primary-500/20 transition-colors"
            >
              <option value="">Select an assessment</option>
              {availableAssessments.map(assessment => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.title}
                </option>
              ))}
            </select>
          </div>

          {selectedAssessment && (
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Award className="h-5 w-5 text-primary-400" />
                <h3 className="font-medium text-gray-200">
                  {availableAssessments.find(a => a.id === selectedAssessment)?.title}
                </h3>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                {availableAssessments.find(a => a.id === selectedAssessment)?.description}
              </p>
              <div className="text-sm text-gray-400">
                Duration: {availableAssessments.find(a => a.id === selectedAssessment)?.duration} minutes
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       focus:ring-2 focus:ring-primary-500/20 transition-colors"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-200">{error}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={isAssigning}
              className="btn-primary"
            >
              {isAssigning ? 'Assigning...' : 'Assign Assessment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};