import React, { useState } from 'react';
import { useUserLabs } from '../../hooks/useUserLabs';
import { GradientText } from '../../../../components/ui/GradientText';
import { BookOpen, Plus, Trash2, Pencil, Loader, AlertCircle, Check, X, Clock } from 'lucide-react';
import { AssignLabModal } from './AssignLabModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface UserLabsSectionProps {
  userId: string;
  user:any;
}

export const UserLabsSection: React.FC<UserLabsSectionProps> = ({ userId ,user}) => {
  const { labs, labStatus, isLoading, admin } = useUserLabs(userId,user);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isDeleting,setIsDeleting]=useState(false);

  const handleDelete = async (lab: any) => {
    setIsDeleting(lab.lab_id || lab.labid);
    setNotification(null);
    //if its organization admin
   if(user?.user?.role === 'orgadmin' ){
      try {
        let response;
        if(lab.type === 'singlevm'){
          response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/deleteAssessment`,{
          lab_id:lab?.lab_id,
          admin_id:user?.user?.id,
      });
        }
        else if(lab.type === 'singlevm-datacenter'){
          response =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteAssignedSingleVMDatacenterLab`,{
             labId:lab?.labid,
             orgId:user?.user?.org_id
          })
        }
        else if(lab.type === 'vmcluster-datacenter'){
           response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteFromOrganization`,{
            labId:lab?.labid,
            orgId:user?.user?.org_id,
            adminId:user?.user?.id
           })
        }
        else{
          response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/orgAdminDeleteCloudSlice/${lab?.labid}`,{
            orgId:user?.user?.org_id
          })
        }

        if (response?.data?.success) {
        setNotification({ type: 'success', message: 'Lab deleted successfully' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
   }
   else{
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
      else if(lab.type === 'singlevm-datacenter'){
            response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteSingleVmDatacenterUserAssignment`,{
                 labId:lab.labid,
                 userId:userId
                })
      }
      else if(lab.type === 'vmcluster-datacenter'){
         response =  await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteClusterLab`,{
          labId:lab.labid,
          orgId:user.org_id,
          userId:userId
         })
      }

      if (response?.data.success) {
        setNotification({ type: 'success', message: 'Lab deleted successfully' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response?.data.message || 'Failed to delete lab');
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
  // Find matching lab status entry
  const labStatusDetails = labStatus.find((l) => l.labid === lab.labid);

  // Parse start time if available
  const startDateStr = labStatusDetails?.start_date || labStatusDetails?.startdate;
  setStartTime(startDateStr ? new Date(startDateStr) : null);

  // Parse end time if available
  const endDateStr = labStatusDetails?.end_date || labStatusDetails?.enddate || labStatusDetails?.completion_date;
  setEndTime(endDateStr ? new Date(endDateStr) : null);

  // Open modal
  setIsEditModalOpen(true);
};



  const handleSaveEdit = async () => {
    if (!editingLab || !startTime || !endTime) {
      setNotification({ type: 'error', message: 'Please select valid start and end times' });
       setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (endTime <= startTime) {
      setNotification({ type: 'error', message: 'End time must be after start time' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsEditing(true);
    setNotification(null);

    if(user?.user?.role === 'orgadmin'){
       try {
      let response;

      if(editingLab.type === 'cloudslice'){
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateUserCloudSliceTimes`, {
        identifier: user?.user?.org_id,
        labId: editingLab.labid,
        startDate: formatDate(startTime),
        endDate: formatDate(endTime),
        type:'org'
      });
      }
      else if(editingLab.type === 'singlevm-datacenter'){
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVMDatacenterLabTime`, {
        identifier: user?.user?.org_id,
        labId: editingLab.labid,
        startTime: formatDate(startTime),
        endTime: formatDate(endTime),
        type:'org'
      });
      }
      else if(editingLab.type === 'vmcluster-datacenter' ){
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateUserLabTimingsOfVMClusterDatacenter`, {
        identifier: user?.user?.org_id,
        labId: editingLab.labid,
        startTime: formatDate(startTime),
        endTime: formatDate(endTime),
        type:'org'
        });
      }
      else{
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateUserLabTimingsOfAwsSingleVMDatacenter`, {
        identifier: user?.user?.org_id,
        labId: editingLab.lab_id,
        startTime: formatDate(startTime),
        endTime: formatDate(endTime),
        type:'org'
      });
      }

      if (response?.data.success) {
        setNotification({ type: 'success', message: 'Lab times updated successfully' });
        setTimeout(() => {
          setIsEditModalOpen(false);
          // window.location.reload();
          setNotification(null)
        }, 1500);
      } else {
        throw new Error(response?.data.message || 'Failed to update lab times');
      }
    } catch (error: any) {
      setTimeout(() => {
          setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update lab times'
      });
        }, 1500);

    } finally {
      setIsEditing(false);
    }
    }
    
    else{
      try {
      let response;

      if(editingLab.type === 'cloudslice'){
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/updateUserCloudSliceTimes`, {
        identifier: userId,
        labId: editingLab.labid,
        startDate: formatDate(startTime),
        endDate: formatDate(endTime),
        type:'user'
      });
      }
      else if(editingLab.type === 'singlevm-datacenter'){
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateSingleVMDatacenterLabTime`, {
        identifier: userId,
        labId: editingLab.labid,
        startTime: formatDate(startTime),
        endTime: formatDate(endTime),
        type:'user'
      });
      }
      else if(editingLab.type === 'vmcluster-datacenter' ){
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateUserLabTimingsOfVMClusterDatacenter`, {
        identifier: userId,
        labId: editingLab.labid,
        startTime: formatDate(startTime),
        endTime: formatDate(endTime),
        type:'user'
        });
      }
      else{
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateUserLabTimingsOfAwsSingleVMDatacenter`, {
        identifier: userId,
        labId: editingLab.lab_id,
        startTime: formatDate(startTime),
        endTime: formatDate(endTime),
        type:'user'
      });
      }

      if (response?.data.success) {
        setNotification({ type: 'success', message: 'Lab times updated successfully' });
        setTimeout(() => {
          setIsEditModalOpen(false);
          // window.location.reload();
          setNotification(null)
        }, 1500);
      } else {
        throw new Error(response?.data.message || 'Failed to update lab times');
      }
    } catch (error: any) {
      setTimeout(() => {
          setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update lab times'
      });
        }, 1500);

    } finally {
      setIsEditing(false);
    }
    }
    
  };
  // Pagination logic
  const indexOfLastLab = currentPage * itemsPerPage;
  const indexOfFirstLab = indexOfLastLab - itemsPerPage;
  const currentLabs = labs.slice(indexOfFirstLab, indexOfLastLab);

  const totalPages = Math.ceil(labs.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, labs.length);

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

      {labs.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">No labs assigned yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentLabs.map((lab, index) => (
    <div
      key={lab.lab_id || lab.labid}
      className="p-4 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors relative"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-primary-400" />
          <div>
            <h3 className="font-medium text-gray-100">{lab.title}</h3>
            <p className="text-sm text-gray-400">{lab.description}</p>
            {lab.enddate && (
          <div className="flex items-center space-x-1 mt-1 text-xs text-gray-600">
            <Clock className="h-4 w-4 text-gray-600" />
            <span>Due : {new Date(lab.enddate || lab.end_date).toLocaleString()}</span>
          </div>
        )}

          </div>
        </div>
        <div className="flex items-center space-x-2">
          {lab && (
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
            disabled={isDeleting === (lab?.lab_id || lab?.labid)}
          >
            {isDeleting === (lab?.lab_id || lab?.labid) ? (
              <Loader className="h-4 w-4 text-red-400 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-red-400" />
            )}
          </button>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              labStatus[indexOfFirstLab + index]?.status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300'
                : labStatus[indexOfFirstLab + index]?.status === 'in_progress'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-primary-500/20 text-primary-300'
            }`}
          >
            {labStatus[indexOfFirstLab + index]?.status}
          </span>
        </div>
      </div>
    </div>
  ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-primary-500/10">
              <div className="text-sm text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, labs.length)} of {labs.length} labs
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


      <AssignLabModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        userId={userId}
        user={admin}
        userDetails={user}
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
                    minDate={startTime}
                    maxDate={endTime}
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
                    maxDate={endTime}
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
                  <GradientText>Cancel</GradientText>

                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isEditing}
                  className="btn-primary"
                >
                  <GradientText>
                    {isEditing ? (

                    <span className="flex items-center">
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                  </GradientText>

                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};