import React, { useState ,useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { LabSelector } from './LabSelector';
import { DurationInput } from './DurationInput';
import { LabDetails } from './LabDetails';
import { useAssignLab } from '../hooks/useAssignLab';
import axios from 'axios';
// import { availableLabs } from '../data/mockLabs';

interface AssignLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const AssignLabModal: React.FC<AssignLabModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const { assignLab, isAssigning, error } = useAssignLab(userId, onClose);
  const [availableLabs,setAvailableLabs] = useState([])

  useEffect(()=>{
    const fetch = async()=>{
        const lab = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getCatalogues`)
        setAvailableLabs(lab.data.data)
    }
    fetch();
},[])
  if (!isOpen) return null;
  const selectedLabData = availableLabs.find(lab => lab.lab_id === selectedLab);
 console.log('working')
  const handleAssign = () => {
    assignLab({ labId: selectedLab, duration });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Assign Lab</GradientText>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <LabSelector
            labs={availableLabs}
            selectedLab={selectedLab}
            onChange={setSelectedLab}
          />

          <DurationInput
            value={duration}
            onChange={setDuration}
          />

          {selectedLabData && <LabDetails lab={selectedLabData} />}

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
              {isAssigning ? 'Assigning...' : 'Assign Lab'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};