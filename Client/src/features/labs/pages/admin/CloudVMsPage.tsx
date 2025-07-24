import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText } from '../../../../components/ui/GradientText';
import { CloudVMCard } from '../../components/cloudvm/CloudVMCard';
import { DatacenterVMCard } from '../../components/datacenter/DatacenterVMCard';
import { Plus, Search, Filter, AlertCircle, FolderX, Server } from 'lucide-react';
import axios from 'axios';

interface CloudVM {
  id: string;
  name: string;
  description: string;
  provider: string;
  instance: string;
  status: 'available' | 'inactive' | 'pending';
  cpu: number;
  ram: number;
  storage: number;
  os: string;
  title:string;
}

interface DatacenterVM {
  id: string;
  title: string;
  description: string;
  platform: string;
  protocol: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'pending';
  users: Array<{
    id: string;
    username: string;
    password: string;
    ip: string;
    port: string;
  }>;
}

export const AdminCloudVMsPage: React.FC = () => {
  const navigate = useNavigate();
  const [vms, setVMs] = useState<CloudVM[]>([]);
  const [datacenterVMs, setDatacenterVMs] = useState<DatacenterVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    provider: '',
    status: '',
    type: 'all' // new filter for VM type (cloud or datacenter)
  });
  const [admin,setAdmin] = useState({});

  // const admin = JSON.parse(localStorage.getItem('auth') ?? '{}').result || {};
  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);

  useEffect(() => {
  const fetchCloudVMs = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabsConfigured`, {
        admin_id: admin.id,
      });
      console.log(response.data.data)
      if (response.data.success) {
        setVMs(response.data.data);
      } else {
        setError('Failed to fetch cloud VMs');
      }
    } catch (err) {
      console.error('Error fetching cloud VMs:', err);
      setError('Failed to fetch cloud VMs');
      setTimeout(()=>
      {
        setError(null)
      },3000
      )
    }
    finally {
        setIsLoading(false);
      }
  };

  const fetchDatacenterVMs = async () => {
    try {
      const dcResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getDatacenterLabOnAdminId`, {
        adminId: admin?.id,
      });

      if (dcResponse.data.success) {
        const vmsWithCreds = await Promise.all(
          dcResponse.data.data.map(async (vm: DatacenterVM) => {
            try {
              const credsResponse = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getDatacenterLabCreds`,
                { labId: vm.lab_id }
              );

              return {
                ...vm,
                userscredentials: credsResponse.data.data || [],
              };
            } catch (err) {
              console.error(`Error fetching creds for lab_id ${vm.lab_id}:`, err);
              return { ...vm, userscredentials: [] };
            }
            finally {
        setIsLoading(false);
      }
          })
        );

        setDatacenterVMs(vmsWithCreds);
      }
    } catch (dcErr) {
      console.error('Error fetching datacenter VMs:', dcErr);
    }
  };

  if (admin.id) {
    fetchCloudVMs();
    fetchDatacenterVMs();
  }
}, [admin.id]);

 
  const filteredVMs = vms.filter(vm => {
    const matchesSearch = !filters.search || 
      vm.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      vm.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesProvider = !filters.provider || vm.provider === filters.provider;
    const matchesStatus = !filters.status || vm.status === filters.status;
    const matchesType = filters.type === 'all' || filters.type === 'cloud';
    return matchesSearch && matchesProvider && matchesStatus && matchesType;
  });

  const filteredDatacenterVMs = datacenterVMs.filter(vm => {
    const matchesSearch = !filters.search || 
      vm.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      vm.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || vm.status === filters.status;
    const matchesType = filters.type === 'all' || filters.type === 'datacenter';
    return matchesSearch && matchesStatus && matchesType;
  });

  const allFilteredVMs = [...filteredVMs, ...filteredDatacenterVMs];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Cloud Virtual Machines</GradientText>
          </h1>
          <p className="mt-2 text-gray-400">
            Manage and configure cloud-based virtual machines
          </p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/labs/create')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New VM Instance
        </button>
      </div>

      <div className="glass-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search VMs..."
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
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="available">available</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="cloud">Cloud VMs</option>
              <option value="datacenter">Datacenter VMs</option>
            </select>

            <button 
              onClick={() => setFilters({ search: '', provider: '', status: '', type: 'all' })}
              className="btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 border-red-500/20">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-[320px] bg-dark-300/50 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {allFilteredVMs.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-dark-300/50">
                  <FolderX className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300">
                  No VMs available
                </h3>
                <p className="text-gray-400 max-w-md">
                  {filters.search || filters.provider || filters.status || filters.type !== 'all'
                    ? "No VMs match your current filters. Try adjusting your search criteria."
                    : "You haven't created any virtual machines yet. Click 'New VM Instance' to get started."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Cloud VMs Section */}
              {filteredVMs.length > 0 && (filters.type === 'all' || filters.type === 'cloud') && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-400 mr-3">Cloud VMs</h2>
                    <div className="px-2 py-1 bg-primary-500/20 rounded-full text-xs text-primary-300">
                      {filteredVMs.length} VMs
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVMs.map((vm) => (
                      <CloudVMCard key={vm.id} vm={vm} />
                    ))}
                  </div>
                </div>
              )}

              {/* Datacenter VMs Section */}
              {filteredDatacenterVMs.length > 0 && (filters.type === 'all' || filters.type === 'datacenter') && (
                <div>
                  <div className="flex items-center mb-4">
                    <Server className="h-5 w-5 text-secondary-400 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-400 mr-3">Datacenter VMs</h2>
                    <div className="px-2 py-1 bg-secondary-500/20 rounded-full text-xs text-secondary-300">
                      {filteredDatacenterVMs.length} VMs
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDatacenterVMs.map((vm) => (
                      <DatacenterVMCard key={vm.id} vm={vm} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};