import React, { useState } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Award, Plus, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserAssessments } from '../../hooks/useUserAssessments';
import { AssignAssessmentModal } from './AssignAssessmentModal';

interface UserAssessmentsSectionProps {
  userId: string;
}

export const UserAssessmentsSection: React.FC<UserAssessmentsSectionProps> = ({ userId }) => {
  const { assessments, isLoading } = useUserAssessments(userId);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (isLoading) return <div className="text-white">Loading assessments...</div>;

  // Pagination logic
  const totalPages = Math.ceil(assessments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssessments = assessments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

      {assessments.length === 0 ? (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">No assessments assigned yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentAssessments.map((assessment) => (
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-primary-500/10">
              <div className="text-sm text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, assessments.length)} of {assessments.length} assessments
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-dark-400/50 border border-primary-500/20 text-gray-300 
                           hover:bg-dark-400 hover:border-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                        : 'bg-dark-400/50 text-gray-300 border border-primary-500/20 hover:bg-dark-400 hover:border-primary-500/40'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-dark-400/50 border border-primary-500/20 text-gray-300 
                           hover:bg-dark-400 hover:border-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AssignAssessmentModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        userId={userId}
      />
    </div>
  );
};