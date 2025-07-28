
import React, { useState, useEffect } from 'react';
import { ClusterVMCard } from './ClusterVMCard';
import { Search, Filter, AlertCircle, FolderX } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import axios from 'axios';

interface ClusterVM {
  id: string;
  lab_id: string;
  title: string;
  description: string;
  platform: string;
  protocol: string;
  startdate: string;
  enddate: string;
  status: 'active' | 'inactive' | 'pending';
  users: Array<{
    id: string;
    username: string;
    vms: Array<{
      id: string;
      vmName: string;
      username: string;
      password: string;
      ip: string;
      port: string;
      protocol: string;
      disabled?: boolean;
    }>;
  }>;
  software?: string[];
  labguide?: string;
  userguide?: string;
  user_id?: string;
}

export const ClusterList: React.FC = () => {
  const [clusters, setClusters] = useState<ClusterVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [currentUser,setCurrentUser] = useState<any>([]);

  useEffect(() => {
    fetchClusters();
  }, []);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const userProfile = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      if(userProfile.data.success){
        setCurrentUser(userProfile.data.user);
      }
      let response;
      if(userProfile.data.user.role === 'superadmin' || userProfile.data.user.role === 'orgsuperadmin'){
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getClusterLabs`,{
        userId:userProfile.data.user.id
      });
      }
      else if(userProfile.data.user.role === 'orgadmin'){
         response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/getOrglabs`,{
          orgId:userProfile.data.user.org_id,
          admin_id:userProfile.data.user.id
         })
      }
       if (response?.data.success) {
        setClusters(response.data.data || []);
      } else {
        setError('Failed to fetch cluster labs');
      }
    } catch (error: any) {
      console.error('Error fetching clusters:', error);
      setError(error.response?.data?.message || 'Failed to fetch cluster labs');
    } finally {
      setLoading(false);
    }
  };

  const filteredClusters = clusters.filter(cluster => {
    const matchesSearch = cluster.lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cluster.lab.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cluster.lab.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || cluster.lab.platform.toLowerCase() === platformFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-400">Loading cluster labs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-400 text-center">{error}</p>
        <button 
          onClick={fetchClusters}
          className="mt-4 btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cluster labs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
          >
            <option value="all">All Platforms</option>
            <option value="datacenter">Datacenter</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
          </select>
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none appearance-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Cluster Grid */}
      {filteredClusters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FolderX className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            No cluster labs found
          </h3>
          <p className="text-gray-400 text-center max-w-md">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search criteria or filters.' 
              : 'Get started by creating your first cluster lab environment.'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              <GradientText>
                {filteredClusters.length} Cluster Lab{filteredClusters.length !== 1 ? 's' : ''}
              </GradientText>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClusters.map((cluster) => (
              <ClusterVMCard key={cluster.id} vm={cluster} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
