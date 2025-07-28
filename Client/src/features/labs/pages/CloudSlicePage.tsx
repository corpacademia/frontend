import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { CloudSliceCard } from '../components/cloudslice/CloudSliceCard';
import { EditCloudSliceModal } from '../components/cloudslice/EditCloudSliceModal';
import { DeleteCloudSliceModal } from '../components/cloudslice/DeleteCloudSliceModal';
import { AssignUsersModal } from '../components/catalogue/AssignUsersModal';
import { Plus, Search, Filter, FolderX, Loader, Trash2, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { get } from 'http';

interface CloudSlice {
  id: string;
  labid: string;
  title: string;
  description: string;
  provider: 'aws' | 'azure' | 'gcp' | 'oracle' | 'ibm' | 'alibaba';
  region: string;
  services: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  startdate: string;
  enddate: string;
  cleanupPolicy: string;
  credits: number;
  modules: 'without-modules' | 'with-modules';
  createdby?: string;
}

export const CloudSlicePage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [cloudSlices, setCloudSlices] = useState<CloudSlice[]>([]);
  const [filteredSlices, setFilteredSlices] = useState<CloudSlice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    provider: '',
    status: '',
    region: ''
  });
  const [editSlice, setEditSlice] = useState<CloudSlice | null>(null);
  const [deleteSlice, setDeleteSlice] = useState<{ id: string; name: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedSlices, setSelectedSlices] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [assignSlice, setAssignSlice] = useState<CloudSlice | null>(null);
  const [orgStatus,setOrgStatus] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setUser(response.data.user);
        if(response.data.user.role === 'orgadmin'){
           const orgLabStatus = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getOrgAssignedLabs`,{
            
              orgId: response.data.user.org_id,
              admin_id: response.data.user.id
            
           })
        if(orgLabStatus.data.success){
          setOrgStatus(orgLabStatus.data.data)
        }
        }
       
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);



  const fetchCloudSlices = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      let allSlices: CloudSlice[] = [];
      if(user.role === 'superadmin' || user.role === 'orgsuperadmin') {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSlices`, {
          params: { userId: user.id }
        });
  
       
        
        if (response.data.success) {
          const userSlices = response.data.data || [];
          // Ensure each slice has an id property (use labid if id is not present)
          const processedUserSlices = userSlices.map(slice => ({
            ...slice,
            id: slice.id || slice.labid // Use existing id or fallback to labid
          }));
          
          allSlices = [...processedUserSlices];
        }
      }
      // First, get the user's own cloud slices
     
      
      // If user is an orgadmin, also fetch organization-assigned slices
      else if (user.role === 'orgadmin') {

        try {
          const getOrgAssignedSlices = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getOrgAssignedLabs`,{
            orgId: user.org_id,
            admin_id: user.id
          });

          if (getOrgAssignedSlices.data.success) {
            const orgSlices = [];
            
            for (const slice of getOrgAssignedSlices.data.data) {
              // Skip if this slice is already in the user's own slices
              if (allSlices.some(existingSlice => existingSlice.labid === slice.labid)) {
                continue;
              }
              
              try {
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/getCloudSliceDetails/${slice.labid}`);
                if (response.data.success) {
                  orgSlices.push({...response.data.data,...slice});
                }
              } catch (error) {
                console.error(`Error fetching details for slice ${slice.labid}:`, error);
              }
            }
            
            // Process org slices and add them to allSlices
            const processedOrgSlices = orgSlices.map(slice => ({
              ...slice,
              id: slice.id || slice.labid // Use existing id or fallback to labid
            }));
            
            allSlices = [...allSlices, ...processedOrgSlices];
          }
        } catch (error) {
          console.error('Error fetching organization assigned slices:', error);
        }
      }
      
      // Set the combined, deduplicated list of slices
      setCloudSlices(allSlices);
      setFilteredSlices(allSlices);
      
    } catch (error) {
      console.error('Error fetching cloud slices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchCloudSlices();
    }
  }, [user?.id]);

  useEffect(() => {
    const filtered = cloudSlices.filter(slice => {
      const matchesSearch = !filters.search || 
        slice.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        slice.description.toLowerCase().includes(filters.search.toLowerCase());

      const matchesProvider = !filters.provider || slice.provider === filters.provider;
      const matchesStatus = !filters.status || slice.status === filters.status;
      const matchesRegion = !filters.region || slice.region === filters.region;

      return matchesSearch && matchesProvider && matchesStatus && matchesRegion;
    });

    setFilteredSlices(filtered);
  }, [filters, cloudSlices]);

  const handleEditSlice = (slice: CloudSlice) => {
    // Only allow editing if the user is not an orgadmin or if they created the slice
    if (user?.role !== 'orgadmin' || slice.createdby === user.id) {
      setEditSlice(slice);
    }
  };

  const handleDeleteSlice = (sliceId: string) => {
    const slice = cloudSlices.find(s => s.labid === sliceId);
    if (slice) {
      setDeleteSlice({ id: sliceId, name: slice.title });
    }
  };

  const handleAssignUsers = (slice: CloudSlice) => {
    setAssignSlice(slice);
  };

  const handleRefresh = async () => {
    fetchCloudSlices();
  };

  const handleSelectAll = () => {
    if (selectedSlices.length === filteredSlices.length) {
      setSelectedSlices([]);
    } else {
      setSelectedSlices(filteredSlices.map(slice => slice.id));
    }
  };

  const handleSelectSlice = (sliceId: string) => {
    setSelectedSlices(prev =>
      prev.includes(sliceId) ? prev.filter(id => id !== sliceId) : [...prev, sliceId]
    );
  };

 const handleDeleteSelected = async () => {
  if (selectedSlices.length === 0) return;

  setIsDeleting(true);
  setNotification(null);

  try {
    const promises = selectedSlices.map(async id => {
      const slice = cloudSlices.find(s => s.id === id);
      if (!slice) throw new Error(`Slice with id ${id} not found`);
     

      // 2. Delete lab (cloud slice)
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/deleteCloudSlice/${slice.labid}`);
    });

    await Promise.all(promises);

    // ✅ Instantly update UI
    setCloudSlices(prev => prev.filter(slice => !selectedSlices.includes(slice.id)));
    setFilteredSlices(prev => prev.filter(slice => !selectedSlices.includes(slice.id)));

    setNotification({
      type: 'success',
      message: `Successfully deleted ${selectedSlices.length} cloud slice${selectedSlices.length > 1 ? 's' : ''}`
    });

    setSelectedSlices([]);
    handleRefresh();

    setTimeout(() => setNotification(null), 3000);
  } catch (error) {
    console.error(error);
    setNotification({
      type: 'error',
      message: 'Failed to delete selected cloud slices'
    });

    setTimeout(() => setNotification(null), 3000);
  } finally {
    setIsDeleting(false);
  }
};

  const regions = [...new Set(cloudSlices.map(slice => slice.region))];
  return (
    <div className="space-y-6">
      {!isCreating ? (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold">
                <GradientText>Cloud Slices</GradientText>
              </h1>
              <p className="mt-2 text-gray-400">
                Manage and configure cloud environment slices
              </p>
            </div>
            <div className="flex space-x-4">
              {selectedSlices.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="btn-secondary text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedSlices.length})
                </button>
              )}
              <button 
                onClick={() => navigate('/dashboard/labs/create')}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Cloud Slice
              </button>
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search cloud slices..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                             text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>

              <div className="flex flex-wrap gap-4">
                <select
                  value={filters.provider}
                  onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
                  className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="">All Providers</option>
                  <option value="aws">AWS</option>
                  <option value="azure">Azure</option>
                  <option value="gcp">GCP</option>
                  <option value="oracle">Oracle</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>

                <select
                  value={filters.region}
                  onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                  className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>

                <button
                  onClick={() => setFilters({ search: '', provider: '', status: '', region: '' })}
                  className="btn-secondary"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              </div>
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

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 text-primary-400 animate-spin" />
            </div>
          ) : (
            <>
              {filteredSlices.length === 0 ? (
                <div className="glass-panel p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 rounded-full bg-dark-300/50">
                      <FolderX className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300">
                      No Cloud Slices Found
                    </h3>
                    <p className="text-gray-400 max-w-md">
                      {filters.search || filters.provider || filters.status || filters.region
                        ? "No cloud slices match your current filters. Try adjusting your search criteria."
                        : "You haven't created any cloud slices yet. Click 'New Cloud Slice' to get started."}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center mb-4">
                    <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSlices.length === filteredSlices.length && filteredSlices.length > 0}
                        onChange={handleSelectAll}
                        className="form-checkbox h-4 w-4 text-primary-500 rounded border-gray-500/20"
                      />
                      <span>Select All</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSlices.map((slice) => (
                      <CloudSliceCard
                        key={slice.id}
                        slice={slice}
                        onEdit={handleEditSlice}
                        onDelete={handleDeleteSlice}
                        isSelected={selectedSlices.includes(slice.id)}
                        onSelect={handleSelectSlice}
                        userRole={user?.role}
                        orgStatus = {orgStatus}
                        onAssignUsers={user?.role === 'orgadmin' && slice.createdby && slice.createdby !== user.id ? handleAssignUsers : undefined}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <EditCloudSliceModal
            isOpen={!!editSlice}
            onClose={() => setEditSlice(null)}
            slice={editSlice}
            onSuccess={handleRefresh}
          />

          <DeleteCloudSliceModal
            isOpen={!!deleteSlice}
            onClose={() => setDeleteSlice(null)}
            sliceId={deleteSlice?.id || null}
            sliceName={deleteSlice?.name || null}
            cloudSlices={cloudSlices}
            onSuccess={(deletedId) => {
              setCloudSlices(prev => prev.filter(slice => slice.id !== deletedId));
              setFilteredSlices(prev => prev.filter(slice => slice.id !== deletedId));
              handleRefresh();
            }}
          />

          {assignSlice && (
            <AssignUsersModal
              isOpen={!!assignSlice}
              onClose={() => setAssignSlice(null)}
              lab={assignSlice}
              type='cloudslice'
            />
          )}
        </>
      ) : (
        <div>
          <button onClick={() => setIsCreating(false)} className="btn-secondary mb-4">
            Back to Cloud Slices
          </button>
          <div className="glass-panel p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">
              <GradientText>Create New Cloud Slice</GradientText>
            </h2>
            <p className="text-gray-400">
              This feature is currently being implemented. Please use the Lab Creation workflow to create a new Cloud Slice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};