import React, { useEffect, useState } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { CloudVMAssessmentCard } from '../components/cloudvm/assessment/CloudVMAssessmentCard';
import { Plus, Search, Filter, AlertCircle, FolderX } from 'lucide-react';
import axios from 'axios';

interface CloudVM {
  id: string;
  name: string;
  description: string;
  provider: string;
  instance: string;
  status: 'running' | 'stopped' | 'pending';
  cpu: number;
  ram: number;
  storage: number;
  os: string;
}

export const CloudVMsPage: React.FC = () => {
  const [vms, setVMs] = useState<CloudVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    provider: '',
    status: ''
  });

  const [admin,setAdmin] = useState({});
  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get('http://localhost:3000/api/v1/aws_ms/user_profile');
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);

  useEffect(() => {
    const fetchVMs = async () => {
      try {
        const response = await axios.post('http://localhost:3000/api/v1/lab_ms/getLabsConfigured', {
          admin_id: admin.id
        });

        if (response.data.success) {
          setVMs(response.data.data);
        } else {
          setError('Failed to fetch VMs');
        }
      } catch (err) {
        console.error('Error fetching VMs:', err);
        setError('Failed to fetch VMs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVMs();
  }, [admin.id]);

  const filteredVMs = vms.filter(vm => {
    const matchesSearch = !filters.search || 
      vm.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      vm.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesProvider = !filters.provider || vm.provider === filters.provider;
    const matchesStatus = !filters.status || vm.status === filters.status;
    return matchesSearch && matchesProvider && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Cloud Virtual Machines</GradientText>
          </h1>
          <p className="mt-2 text-gray-400">
            Manage and configure your cloud-based virtual machines
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New VM Instance
        </button>
      </div>

      {/* Filters */}
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
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="pending">Pending</option>
            </select>

            <button className="btn-secondary">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-panel p-4 border-red-500/20">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
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
          {/* Empty State */}
          {filteredVMs.length === 0 && (
            <div className="glass-panel p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-dark-300/50">
                  <FolderX className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300">
                  No VMs available
                </h3>
                <p className="text-gray-400 max-w-md">
                  {filters.search || filters.provider || filters.status
                    ? "No VMs match your current filters. Try adjusting your search criteria."
                    : "You haven't created any virtual machines yet. Click 'New VM Instance' to get started."}
                </p>
              </div>
            </div>
          )}

          {/* VM Grid */}
          {filteredVMs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVMs.map((vm) => (
                <CloudVMAssessmentCard key={vm.id} assessment={vm} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};