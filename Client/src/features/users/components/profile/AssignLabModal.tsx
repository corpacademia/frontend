import React, { useEffect, useState } from 'react';
import { X, BookOpen, AlertCircle, ChevronDown } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface AssignLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  user: any;
  userDetails?: any; // Optional prop for user details
}

export const AssignLabModal: React.FC<AssignLabModalProps> = ({
  isOpen,
  onClose,
  userId,
  user,
  userDetails,
}) => {
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [selectedLabDetails, setSelectedLabDetails] = useState<any>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [availableLabs, setAvailableLabs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredLabs, setFilteredLabs] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
 
  // Filter labs based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLabs(availableLabs);
    } else {
      const filtered = availableLabs.filter(lab => 
        lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLabs(filtered);
    }
  }, [searchTerm, availableLabs]);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        if(user.role ==='superadmin'){
          const [standardResult, cloudResult,singleVMDatacenter,vmclusterDatacenter] = await Promise.allSettled([
            axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabsConfigured`, {
              admin_id: user.id,
            }),
            axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getAllCloudSliceLabs`),
            axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVmDatacenterLabs`,{
              userId: user.id,
            }),
            axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getClusterLabDetails`,{
              userId: user.id,
            }),
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
          if (singleVMDatacenter.status === 'fulfilled' && singleVMDatacenter.value.data.success) {
            allLabs.push(
              ...singleVMDatacenter.value.data.data.map((lab: any) => ({
                ...lab,
                type: 'singlevm',
              }))
            );
          } else {
            console.warn('Failed to fetch single VM datacenter labs:', singleVMDatacenter);
          }
          if (vmclusterDatacenter.status === 'fulfilled' && vmclusterDatacenter.value.data.success) {
            allLabs.push(
              ...vmclusterDatacenter.value.data.data.map((lab: any) => ({
                ...lab,
                type: 'vmcluster',
              }))
            );
          } else {
            console.warn('Failed to fetch VM cluster labs:', vmclusterDatacenter);
          }
          setAvailableLabs(allLabs);
          setFilteredLabs(allLabs);
        }
        else{
          const [standardResult, cloudResult] = await Promise.allSettled([
            axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabsConfigured`, {
              admin_id: user.id,
            }),
            axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getOrgAssignedLabDetails/${user.org_id}`),
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
          setFilteredLabs(allLabs);
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
      setStartTime(lab?.startdate);
      setEndTime(lab?.enddate);

  }, [selectedLab, availableLabs]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedLab('');
      setSelectedLabDetails(null);
      setStartTime(null);
      setEndTime(null);
      setError(null);
      setSearchTerm('');
      setIsDropdownOpen(false);
    } else {

      // Set default start time to current time and end time to 2 hours later
      const now = new Date();
      const defaultEndTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      setStartTime(now);
      setEndTime(defaultEndTime);
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

    // Always validate start and end time for all lab types
    if (!startTime || !endTime) {
      setError('Please select a valid start and end time');
      return;
    }
    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }

    

    try {
      setIsAssigning(true);
      let res;
      if (selectedLabDetails.type === 'cloudslice') {
        const formattedStart = startTime;
        const formattedEnd = endTime;
        res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/assignCloudSlice`, {
          lab: selectedLabDetails.labid,
          start_date: formattedStart,
          end_date: formattedEnd,
          userId,
          assign_admin_id: user.id
        });
      } 
      else if(selectedLabDetails.type === 'singlevm') {
        res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/assignSingleVmDatacenterLabToUser`, {
          labId: selectedLabDetails.lab_id,
          orgId: userDetails?.user?.org_id,
          userId:userId,
          assignedBy: user.id,
          startDate: startTime,
          endDate: endTime
        })
      }
      else if(selectedLabDetails.type === 'vmcluster'){
            res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/assignCluster`,{
              labId:selectedLabDetails.labid,
              userId,
              assignedBy:user.id,
              startDate:startTime,
              endDate:endTime,
              orgId:userDetails?.user?.org_id
            })
      }

      else {
        res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/assignlab`, {
          lab: selectedLabDetails.lab_id,
          userId,
          assign_admin_id: user.id
        });
      }

      if (res?.data.success) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error assigning lab:', error);
      setError(error.response?.data?.error || 'Failed to assign lab');
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
            <label className="block text-sm font-medium text-white mb-2">
              Search and Select Lab
            </label>
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search labs by title or description..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full px-4 py-2 pr-10 bg-dark-400/70 border border-primary-500/30 rounded-lg
                           text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none
                           focus:ring-2 focus:ring-primary-500/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-dark-200 border border-primary-500/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredLabs.length > 0 ? (
                    filteredLabs.map(lab => (
                      <button
                        key={lab.lab_id ?? lab.labid}
                        type="button"
                        onClick={() => {
                          setSelectedLab(lab.lab_id ?? lab.labid);
                          setIsDropdownOpen(false);
                          setSearchTerm(lab.title);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-dark-300/50 transition-colors text-white border-b border-primary-500/10 last:border-b-0"
                      >
                        <div className="font-medium">{lab.title}</div>
                        {lab.description && (
                          <div className="text-sm text-gray-400 truncate">{lab.description}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-400">No labs found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Start Time</label>
              <DatePicker
                selected={startTime}
                onChange={(date: Date) => setStartTime(date)}
                showTimeSelect
                timeIntervals={15}
                minDate={new Date()}
                dateFormat="Pp"
                className="w-full px-4 py-2 bg-dark-400/70 border border-primary-500/30 rounded-lg
                          text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">End Time</label>
              <DatePicker
                selected={endTime}
                onChange={(date: Date) => setEndTime(date)}
                showTimeSelect
                timeIntervals={15}
                minDate={startTime || new Date()}
                dateFormat="Pp"
                className="w-full px-4 py-2 bg-dark-400/70 border border-primary-500/30 rounded-lg
                          text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>

          

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
              <GradientText>Cancel</GradientText>
              
            </button>
            <button
              onClick={handleAssign}
              disabled={isAssigning}
              className="btn-primary"
            >
              <GradientText>{isAssigning ? 'Assigning...' : 'Assign Lab'}</GradientText>
              
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
