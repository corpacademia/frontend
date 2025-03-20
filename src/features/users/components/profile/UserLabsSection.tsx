import React from 'react';
import { useUserLabs } from '../../hooks/useUserLabs';
import { GradientText } from '../../../../components/ui/GradientText';
import { BookOpen, Plus } from 'lucide-react';
import { AssignLabModal } from './AssignLabModal';

interface UserLabsSectionProps {
  userId: string;
}

export const UserLabsSection: React.FC<UserLabsSectionProps> = ({ userId }) => {
  const { labs , labStatus , isLoading } = useUserLabs(userId);
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  if (isLoading) return <div>Loading labs...</div>;
  return (
    <div className="glass-panel">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          <GradientText>Assigned Labs</GradientText>
        </h2> 
        <button 
          onClick={() => setIsAssignModalOpen(true)}
          className="btn-secondary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign Lab
        </button>
      </div>

      <div className="space-y-4">
        {labs.map((lab,index) => (
          <div key={lab.lab_id} className="p-4 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-primary-400" />
                <div>
                  <h3 className="font-medium text-gray-200">{lab.title}</h3>
                  <p className="text-sm text-gray-400">{lab.description}</p>
                </div>
              </div>
              {/* {labStatus.map((lab)=>( */}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  lab.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                  lab.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-primary-500/20 text-primary-300'
                }`}>
                  {labStatus[index].status}
                </span>
              {/* ))} */}
              
            </div>
          </div>
        ))}
      </div>

      <AssignLabModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        userId={userId}
      />
    </div>
  );
};