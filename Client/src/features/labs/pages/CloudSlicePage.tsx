import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { Plus, Search, Filter, FolderX, Loader, MapPin, Calendar, Trash2, Check } from 'lucide-react';
import { CloudSliceCard } from '../components/cloudslice/CloudSliceCard';
import { EditCloudSliceModal } from '../components/cloudslice/EditCloudSliceModal';
import { DeleteCloudSliceModal } from '../components/cloudslice/DeleteCloudSliceModal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface CloudSlice {
  id: string;
  name: string;
  description: string;
  provider: 'aws' | 'azure' | 'gcp' | 'oracle' | 'ibm' | 'alibaba';
  region: string;
  services: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  startDate: string;
  endDate: string;
  cleanupPolicy: string;
  credits: number;
  labType: 'without-modules' | 'with-modules';
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

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
        setUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchCloudSlices = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/v1/cloud_slice_ms/getCloudSlices', {
          params: { userId: user.id }
        });
        
        if (response.data.success) {
          const slices = response.data.data || [];
          setCloudSlices(slices);
          setFilteredSlices(slices);
        } else {
          console.error('Failed to fetch cloud slices:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching cloud slices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCloudSlices();
  }, [user]);

  useEffect(() => {
    // Apply filters
    const filtered = cloudSlices.filter(slice => {
      const matchesSearch = !filters.search || 
        slice.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        slice.description.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesProvider = !filters.provider || slice.provider === filters.provider;
      const matchesStatus = !filters.status || slice.status === filters.status;
      const matchesRegion = !filters.region || slice.region === filters.region;
      
      return matchesSearch && matchesProvider && matchesStatus && matchesRegion;
    });
    
    setFilteredSlices(filtered);
  }, [filters, cloudSlices]);

  const handleEditSlice = (slice: CloudSlice) => {
    setEditSlice(slice);
  };

  const handleDeleteSlice = (sliceId: string) => {
    const slice = cloudSlices.find(s => s.id === sliceId);
    if (slice) {
      setDeleteSlice({ id: sliceId, name: slice.name });
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/v1/cloud_slice_ms/getCloudSlices', {
        params: { userId: user.id }
      });
      
      if (response.data.success) {
        const slices = response.data.data || [];
        setCloudSlices(slices);
        setFilteredSlices(slices);
      }
    } catch (error) {
      console.error('Error refreshing cloud slices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedSlices.length === filteredSlices.length) {
      // If all are selected, deselect all
      setSelectedSlices([]);
    } else {
      // Otherwise, select all
      setSelectedSlices(filteredSlices.map(slice => slice.id));
    }
  };

  const handleSelectSlice = (sliceId: string) => {
    setSelectedSlices(prev => 
      prev.includes(sliceId)
        ? prev.filter(id => id !== sliceId)
        : [...prev, sliceId]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedSlices.length === 0) return;
    
    setIsDeleting(true);
    setNotification(null);
    
    try {
      // Delete each selected slice
      const promises = selectedSlices.map(sliceId => 
        axios.delete(`http://localhost:3000/api/v1/cloud_slice_ms/deleteCloudSlice/${sliceId}`)
      );
      
      await Promise.all(promises);
      
      setNotification({ 
        type: 'success', 
        message: `Successfully deleted ${selectedSlices.length} cloud slice${selectedSlices.length > 1 ? 's' : ''}` 
      });
      
      // Clear selection and refresh the list
      setSelectedSlices([]);
      handleRefresh();
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: 'Failed to delete selected cloud slices' 
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get unique regions and providers for filter dropdowns
  const regions = [...new Set(cloudSlices.map(slice => slice.region))];
  const providers = [...new Set(cloudSlices.map(slice => slice.provider))];

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
                  {/* {providers.map(provider => (
                    <option key={provider} value={provider}>
                      {provider.toUpperCase()}
                    </option>
                  ))} */}
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
                <Trash2 className="h-5 w-5 text-red-400" />
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSlices.map((slice) => (
                      <div key={slice.id} className="relative">
                        <div className="absolute top-4 left-4 z-10">
                          <input
                            type="checkbox"
                            checked={selectedSlices.includes(slice.id)}
                            onChange={() => handleSelectSlice(slice.id)}
                            className="form-checkbox h-5 w-5 text-primary-500 rounded border-gray-500/20"
                          />
                        </div>
                        <CloudSliceCard
                          slice={slice}
                          onEdit={handleEditSlice}
                          onDelete={handleDeleteSlice}
                        />
                      </div>
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
            onSuccess={handleRefresh}
          />
        </>
      ) : (
        // This would be replaced with the actual cloud slice creation form
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