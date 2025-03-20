import React from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Award, Plus, Clock } from 'lucide-react';
import { useUserAssessments } from '../../hooks/useUserAssessments';
import { AssignAssessmentModal } from './AssignAssessmentModal';

interface UserAssessmentsSectionProps {
  userId: string;
}

export const UserAssessmentsSection: React.FC<UserAssessmentsSectionProps> = ({ userId }) => {
  const { assessments, isLoading } = useUserAssessments(userId);
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);

  if (isLoading) return <div>Loading assessments...</div>;

  return (
    <div className="glass-panel">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          <GradientText>Assessments</GradientText>
        </h2>
        <button 
          onClick={() => setIsAssignModalOpen(true)}
          className="btn-secondary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign Assessment
        </button>
      </div>

      <div className="space-y-4">
        {assessments.map(assessment => (
          <div key={assessment.id} className="p-4 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-primary-400" />
                <div>
                  <h3 className="font-medium text-gray-200">{assessment.title}</h3>
                  <div className="flex items-center mt-1 text-sm text-gray-400">
                    <Clock className="h-4 w-4 mr-1" />
                    Due: {new Date(assessment.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {assessment.score && (
                  <span className="text-sm font-medium text-primary-400">
                    Score: {assessment.score}%
                  </span>
                )}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  assessment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                  assessment.status === 'in-progress' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-primary-500/20 text-primary-300'
                }`}>
                  {assessment.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AssignAssessmentModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        userId={userId}
      />
    </div>
  );
};