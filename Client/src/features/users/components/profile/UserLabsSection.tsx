import React, { useState } from 'react';
import { useUserLabs } from '../../hooks/useUserLabs';
import { GradientText } from '../../../../components/ui/GradientText';
import { BookOpen, Plus, Trash2, Pencil, Loader, AlertCircle, Check, X } from 'lucide-react';
import { AssignLabModal } from './AssignLabModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

interface UserLabsSectionProps {
  userId: string;
}

export const UserLabsSection: React.FC<UserLabsSectionProps> = ({ userId }) => {
  const { labs, labStatus, isLoading, admin } = useUserLabs(userId);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<any>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const handleDelete = async (lab: any) => {
    setIsDeleting(lab.lab_id || lab.labid);
    setNotification(null);
    try {
      let response;
      
      if (lab.type === 'cloudslice') {
        // Delete cloud slice lab
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteUserCloudSlice`, {
          userId: userId,
          labId: lab.labid
        });
      } else if(lab.type === 'singlevm') {
        // Delete standard lab
        const instanceDetails = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/awsInstanceOfUsers`, {
          lab_id: lab.lab_id,
          user_id: userId,
        });
        
        const ami = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/amiinformation`, { 
          lab_id: lab.lab_id 
        });
        
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/aws_ms/deletevm`, {
          id: lab.lab_id,
          instance_id: instanceDetails?.data?.result?.instance_id || null,
          ami_id: ami?.data?.result?.ami_id || null,
          user_id: userId,
        });
      }
      
      if (response.data.success) {
        setNotification({ type: 'success', message: 'Lab deleted successfully' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete lab');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete lab'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsDeleting(null);
    }
  };

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

  const handleEdit = (lab: any) => {
    setEditingLab(lab);
    const labStatusDetails = labStatus.find((l) => l.labid === lab.labid);
  
    if (labStatusDetails?.start_date) {
      setStartTime(new Date(labStatusDetails.start_date));
    } else {
      setStartTime(null);
    }
  
    if (labStatusDetails?.end_date) {
      setEndTime(new Date(labStatusDetails.end_date));
    } else {
      setEndTime(null);
    }
  
    setIsEditModalOpen(true);
  };
  

  const handleSaveEdit = async () => {
    if (!editingLab || !startTime || !endTime) {
      setNotification({ type: 'error', message: 'Please select valid start and end times' });
      return;
    }

    if (endTime <= startTime) {
      setNotification({ type: 'error', message: 'End time must be after start time' });
      return;
    }

    setIsEditing(true);
    setNotification(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateUserCloudSliceTimes`, {
        userId: userId,
        labId: editingLab.labid,
        startDate: formatDate(startTime),
        endDate: formatDate(endTime)
      });

      if (response.data.success) {
        setNotification({ type: 'success', message: 'Lab times updated successfully' });
        setTimeout(() => {
          setIsEditModalOpen(false);
          // window.location.reload();
          setNotification(null)
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to update lab times');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update lab times'
      });
    } finally {
      setIsEditing(false);
    }
  };

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

      {notification && (
        <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/20 border border-emerald-500/20' 
            : 'bg-red-500/20 border border-red-500/20'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
          <span className={`text-sm ${
            notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {notification.message}
          </span>
        </div>
      )}

      <div className="space-y-4">
        {labs.map((lab, index) => (
          <div key={lab.lab_id || lab.labid} className="p-4 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-primary-400" />
                <div>
                  <h3 className="font-medium text-gray-200">{lab.title}</h3>
                  <p className="text-sm text-gray-400">{lab.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {lab.type === 'cloudslice' && (
                  <button
                    onClick={() => handleEdit(lab)}
                    className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    disabled={isDeleting === (lab.lab_id || lab.labid)}
                  >
                    <Pencil className="h-4 w-4 text-primary-400" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(lab)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  disabled={isDeleting === (lab.lab_id || lab.labid)}
                >
                  {isDeleting === (lab.lab_id || lab.labid) ? (
                    <Loader className="h-4 w-4 text-red-400 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-400" />
                  )}
                </button>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  labStatus[index]?.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                  labStatus[index]?.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-primary-500/20 text-primary-300'
                }`}>
                  {labStatus[index]?.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AssignLabModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        userId={userId}
        user={admin}
      />

      {/* Edit Modal for Cloud Slice Labs */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                <GradientText>Edit Lab Schedule</GradientText>
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Lab Title</label>
                <p className="text-gray-200 font-medium">{editingLab?.title}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <DatePicker
                    selected={startTime}
                    onChange={(date: Date | null) => {
                      if (date instanceof Date && !isNaN(date.getTime())) {
                        setStartTime(date);
                      } else {
                        setStartTime(null);
                      }
                    }}
                    
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
                    onChange={(date: Date | null) => {
                      if (date instanceof Date && !isNaN(date.getTime())) {
                        setEndTime(date);
                      } else {
                        setEndTime(null);
                      }
                    }}
                    
                    showTimeSelect
                    timeIntervals={15}
                    minDate={startTime || new Date()}
                    dateFormat="Pp"
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                              text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {notification && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                  notification.type === 'success' 
                    ? 'bg-emerald-500/20 border border-emerald-500/20' 
                    : 'bg-red-500/20 border border-red-500/20'
                }`}>
                  {notification.type === 'success' ? (
                    <Check className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  <span className={`text-sm ${
                    notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    {notification.message}
                  </span>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-secondary"
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isEditing}
                  className="btn-primary"
                >
                  {isEditing ? (
                    <span className="flex items-center">
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};