import React from 'react';
import { FileText, Calendar, Users, Pencil, Trash2, MoreVertical } from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed';
  assignedUsers: number;
  passingMarks: number;
}

interface AssessmentListProps {
  assessments: Assessment[];
  isLoading?: boolean;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({ 
  assessments,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="glass-panel animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border-b border-primary-500/10">
            <div className="h-6 bg-dark-300/50 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-dark-300/50 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
              <th className="pb-4 pl-4">Assessment</th>
              <th className="pb-4">Date Range</th>
              <th className="pb-4">Assigned Users</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Passing Marks</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((assessment) => (
              <tr 
                key={assessment.id}
                className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
              >
                <td className="py-4 pl-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary-400" />
                    <div>
                      <p className="font-medium text-gray-200">{assessment.title}</p>
                      <p className="text-sm text-gray-400">{assessment.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <div>
                      <p>Start: {new Date(assessment.startDate).toLocaleDateString()}</p>
                      <p>End: {new Date(assessment.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <Users className="h-4 w-4 mr-2" />
                    {assessment.assignedUsers}
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    assessment.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                    assessment.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-primary-500/20 text-primary-300'
                  }`}>
                    {assessment.status}
                  </span>
                </td>
                <td className="py-4 text-gray-300">
                  {assessment.passingMarks}%
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-primary-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};