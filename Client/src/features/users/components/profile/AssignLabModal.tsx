import React, { useEffect, useState } from 'react';
import { X, BookOpen, AlertCircle, Clock } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface AssignLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  user: any;
}

export const AssignLabModal: React.FC<AssignLabModalProps> = ({
  isOpen,
  onClose,
  userId,
  user
}) => {
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [selectedLabDetails, setSelectedLabDetails] = useState<any>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [availableLabs, setAvailableLabs] = useState<any[]>([]);
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        console.log(user.role)
        if(user.role ==='superadmin'){
          const [standardResult, cloudResult] = await Promise.allSettled([
            axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabsConfigured`, {
              admin_id: user.id,
            }),
            axios.get(`http://localhost:3000/api/v1/cloud_slice_ms/getAllCloudSliceLabs`),
          ]);
          const allLabs: any[] = [];
    
          if (standardResult.status === 'fulfilled' && standardResult.value.data.success) {
            allLabs.push(
              ...standardResult.value.data.data.map((lab: any) => ({
                ...lab,
                type: 'standard',
              }))
            );
          } else {
            console.warn('Failed to fetch standard labs:', standardResult);
          }
    
          if (cloudResult.status === 'fulfilled' && cloudResult.value.data.success) {
            allLabs.push(
              ...cloudResult.value.data.data.map((lab: any) => ({
                ...lab,
                type: 'cloudslice',
              }))
            );
          } else {
            console.warn('Failed to fetch cloudslice labs:', cloudResult);
          }
          setAvailableLabs(allLabs);
        }
        else{
          const [standardResult, cloudResult] = await Promise.allSettled([
            axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabsConfigured`, {
              admin_id: user.id,
            }),
            axios.get(`http://localhost:3000/api/v1/cloud_slice_ms/getOrgAssignedLabDetails/${user.org_id}`),
          ]);
    
          const allLabs: any[] = [];
    
          if (standardResult.status === 'fulfilled' && standardResult.value.data.success) {
            allLabs.push(
              ...standardResult.value.data.data.map((lab: any) => ({
                ...lab,
                type: 'standard',
              }))
            );
          } else {
            console.warn('Failed to fetch standard labs:', standardResult);
          }
    
          if (cloudResult.status === 'fulfilled' && cloudResult.value.data.success) {
            allLabs.push(
              ...cloudResult.value.data.data.map((lab: any) => ({
                ...lab,
                type: 'cloudslice',
              }))
            );
          } else {
            console.warn('Failed to fetch cloudslice labs:', cloudResult);
          }
          setAvailableLabs(allLabs);
        }
        
      } catch (err) {
        console.error('Unexpected error in fetchLabs:', err);
      }
    };
  
    fetchLabs();
  }, []);
  

  useEffect(() => {
    const lab = availableLabs.find(l => (l.lab_id ?? l.labid) === selectedLab);
    setSelectedLabDetails(lab);
  }, [selectedLab, availableLabs]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedLab('');
      setSelectedLabDetails(null);
      setDuration(0);
      setStartTime(null);
      setEndTime(null);
      setError(null);
    }
  }, [isOpen]);

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
  
    let hours = date.getHours(); // 0–23
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    hours = hours % 12;
    if (hours === 0) hours = 12;
  
    const formattedHours = String(hours).padStart(2, '0');
  
    return `${year}/${month}/${day}, ${formattedHours}:${minutes} ${ampm}`;
  };
  
  

  const handleAssign = async () => {
    if (!selectedLabDetails) return;

    setError(null);

    if (selectedLabDetails.type === 'cloudslice') {
      if (!startTime || !endTime) {
        setError('Please select a valid start and end time');
        return;
      }
      if (endTime <= startTime) {
        setError('End time must be after start time');
        return;
      }
    }

    if (selectedLabDetails.type === 'standard') {
      if (!duration || duration <= 0) {
        setError('Please enter a valid duration');
        return;
      }
    }

    try {
      setIsAssigning(true);
      let res;
      if (selectedLabDetails.type === 'cloudslice') {
        const formattedStart = formatDate(startTime!);
        const formattedEnd = formatDate(endTime!);
        res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/assignCloudSlice`, {
          lab: selectedLabDetails.labid,
          start_date: formattedStart,
          end_date: formattedEnd,
          userId,
          assign_admin_id: user.id
        });
      } else {
        res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/assignlab`, {
          lab: selectedLabDetails,
          duration,
          userId,
          assign_admin_id: user.id
        });
      }

      if (res.data.success) {
        onClose();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to assign lab');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;
  console.log(availableLabs)
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
                <option key={lab.lab_id ?? lab.labid} value={lab.lab_id ?? lab.labid}>
                  {lab.title}
                </option>
              ))}
            </select>
          </div>

          {selectedLabDetails?.type === 'cloudslice' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                <DatePicker
                  selected={startTime}
                  onChange={(date: Date) => setStartTime(date)}
                  showTimeSelect
                  timeIntervals={15}
                  minDate={new Date()}
                  dateFormat="Pp"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                            text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                <DatePicker
                  selected={endTime}
                  onChange={(date: Date) => setEndTime(date)}
                  showTimeSelect
                  timeIntervals={15}
                  minDate={startTime || new Date()}
                  dateFormat="Pp"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                            text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          ) : (
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
                  placeholder="Enter duration"
                  className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          )}

          {selectedLab && (
            <div className="p-4 bg-dark-300/50 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <BookOpen className="h-5 w-5 text-primary-400" />
                <h3 className="font-medium text-gray-200">
                  {selectedLabDetails?.title}
                </h3>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                {selectedLabDetails?.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                  {selectedLabDetails?.provider}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Recommended duration: {selectedLabDetails?.duration} minutes
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
            <button onClick={onClose} className="btn-secondary">
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
