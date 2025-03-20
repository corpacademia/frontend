import React, { useEffect, useState } from 'react';
import { X, BookOpen, AlertCircle, Clock } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface AssignLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

// Mock available labs - Replace with API call
// const availableLabs = [
//   {
//     id: '1',
//     title: 'Advanced Cloud Architecture',
//     description: 'Design and implement scalable cloud solutions',
//     duration: 180,
//     technologies: ['AWS', 'Azure', 'GCP']
//   },
//   {
//     id: '2',
//     title: 'Kubernetes in Production',
//     description: 'Deploy and manage production-grade Kubernetes clusters',
//     duration: 240,
//     technologies: ['Kubernetes', 'Docker', 'Helm']
//   },
//   {
//     id: '3',
//     title: 'CI/CD Pipeline Implementation',
//     description: 'Build automated deployment pipelines',
//     duration: 120,
//     technologies: ['Jenkins', 'GitLab', 'GitHub Actions']
//   }
// ];

export const AssignLabModal: React.FC<AssignLabModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [availableLabs , setAvailableLabs] = useState([]);
  const [selectedLabDetails , setSelectedLabDetails] = useState();

  const [admin,setAdmin] = useState({});

  // const admin = JSON.parse(localStorage.getItem('auth') ?? '{}').result || {};
  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);
  useEffect(()=>{
       const fetch = async()=>{
        try {
          const data = await axios.post('http://localhost:3000/api/v1/lab_ms/getLabsConfigured',{
            admin_id : admin.id
        })
        console.log(data.data.data)
        setAvailableLabs(data.data.data)
        } catch (error) {
          console.log('Error')
        }
        
       }
       fetch();
  },[])

  const handleAssign = async () => {
    if (!selectedLab) {
      setError('Please select a lab');
      return;
    }

    if (!duration || duration <= 0) {
      setError('Please specify a valid duration');
      return;
    }
    const lab = availableLabs.filter((lab)=>{
      return lab.lab_id.includes(selectedLab)
    })
    setSelectedLabDetails(lab)
    try {
      const assign = await axios.post('http://localhost:3000/api/v1/lab_ms/assignlab',{
        lab:lab[0],
        duration:duration,
        userId:userId,
        assign_admin_id:admin.id
      })
     if(assign.data.success){
      // onSuccess()
      setIsAssigning(true);  
     }
     
    } catch (error) {
      setIsAssigning(false);
      setError(error.response.data.message);
    }
    
    finally {
      setIsAssigning(false);
    }
    // try {
      // TODO: Implement API call
      // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    //   onClose();
    // } catch (err) {
    //   setError('Failed to assign lab. Please try again.');
    // } 
    
  };

  if (!isOpen) return null;

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
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Lab
            </label>
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       focus:ring-2 focus:ring-primary-500/20 transition-colors"
            >
              <option value="">Select a lab</option>
              {availableLabs.map(lab => (
                <option key={lab.lab_id} value={lab.lab_id}>
                  {lab.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary-400" />
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                placeholder="Enter duration in minutes"
                className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none
                         focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            </div>
          </div>

          {selectedLab && (
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <BookOpen className="h-5 w-5 text-primary-400" />
                <h3 className="font-medium text-gray-200">
                  {availableLabs.find(l => l.lab_id === selectedLab)?.title}
                </h3>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                {availableLabs.find(l => l.lab_id === selectedLab)?.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {/* {availableLabs.find(l => l.lab_id === selectedLab)?.technologies.map(tech => (
                  <span 
                    key={tech}
                    className="px-2 py-1 text-xs font-medium rounded-full
                             bg-primary-500/20 text-primary-300"
                  >
                    {tech}
                  </span>
                ))} */}
                 
                  <span 
                    className="px-2 py-1 text-xs font-medium rounded-full
                             bg-primary-500/20 text-primary-300"
                  >
                    {availableLabs.find(l => l.lab_id === selectedLab)?.provider}
                  </span>
                
              </div>
              <div className="text-sm text-gray-400">
                Recommended duration: {availableLabs.find(l => l.lab_id === selectedLab)?.duration} minutes
              </div>
            </div>
          )}

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