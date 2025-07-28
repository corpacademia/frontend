import React, { useEffect, useState } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { CloudVMAssessmentCard } from '../../components/cloudvm/assessment/CloudVMAssessmentCard';
import { DatacenterVMCard } from '../../components/datacenter/DatacenterVMCard';
import { Plus, Search, Filter, AlertCircle, FolderX, Server } from 'lucide-react';
import axios from 'axios';

interface CloudVM {
  lab_id?: string;
  assessment_id?: string;
  title: string;
  description: string;
  provider: string;
  instance: string;
  instance_id?: string;
  status: 'active' | 'inactive' | 'pending';
  cpu: number;
  ram: number;
  storage: number;
  os: string;
  software: string[];
  config_details?: any;
}

interface DatacenterVM {
  id: string;
  lab_id: string;
  title: string;
  description: string;
  platform: string;
  protocol: string;
  startdate: string;
  enddate: string;
  status: 'active' | 'inactive' | 'pending';
  userscredentials?: Array<{
    id: string;
    username: string;
    password: string;
    ip: string;
    port: string;
    protocol?: string;
    disabled?: boolean;
  }>;
}

interface User{
  id:string;
  name:string;
  email:string;
  password:string;
  role:string;
  created_at:string;
  lastactive:string;
  organization:string;
  created_by:string;
  status:string;
}

export const OrgAdminCloudVMsPage: React.FC = () => {
  const [vms, setVMs] = useState<CloudVM[]>([]);
  const [datacenterVMs, setDatacenterVMs] = useState<DatacenterVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const[admin , setAdmin] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    provider: '',
    status: '',
    type: 'all' // Filter for VM type (assessment, datacenter, or all)
  });
  
  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);

 useEffect(() => {
  const fetchAssessmentVMs = async (adminId: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAssessments`, {
        admin_id: adminId,
      });

      if (response.data.success) {
        const updatedData = await Promise.all(
  response.data.data.map(async (lab: any) => {
    try {
      const data = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getLabOnId`, {
        labId: lab.lab_id,
      });

      if (data.data.success) {
        return {
          ...data.data.data,
          ...lab
        };
      } else {
        return lab;
      }
    } catch (err) {
      console.error('Failed to fetch lab details for', lab.lab_id, err);
      return lab; 
    }
  })
);

        setVMs(updatedData);
      } else {
        setError('Failed to fetch assessment VMs');
      }
    } catch (err) {
      console.error('Error fetching assessment VMs:', err);
      setError('Failed to fetch assessment VMs');
      setTimeout(()=>{
        setError(null)
      },2000)
    }
    finally {
        setIsLoading(false);
      }
  };

  const fetchDatacenterVMs = async (orgId: string, createdBy: string) => {
    try {
      const datacenterResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getOrgAssignedSingleVMDatacenterLab`,
        { orgId, created_by: createdBy }
      );
      if (datacenterResponse.data.success) {
        const vmDetails = await Promise.all(
          datacenterResponse.data.data.map(async (assignment: any) => {
            try {
              const vmResponse = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getSingleVmDatacenterLabOnId`,
                { labId: assignment.labid }
              );

              if (vmResponse.data.success) {
                const credsResponse = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getDatacenterLabCreds`,
                  { labId: assignment.labid }
                );
                return {
                  ...vmResponse.data.data,
                  ...assignment,
                  userscredentials: credsResponse.data.success ? credsResponse.data.data : [],
                };
              }

              return null;
            } catch (err) {
              console.error(`Error fetching details for lab ${assignment.labid}:`, err);
              return null;
            }
          })
        );
        setDatacenterVMs(vmDetails.filter(Boolean));
      }
    } catch (dcErr) {
      console.error('Error fetching datacenter VMs:', dcErr);
      setError('Failed to fetch datacenter VMs');
      setTimeout(()=>{
        setError(null)
      },2000)
    }
    finally {
        setIsLoading(false);
      }
  };

  const fetchAllVMs = async () => {
    try {
      const admin = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      const user = admin.data?.user;

      if (user?.id && user?.org_id) {
        fetchAssessmentVMs(user.id);
        fetchDatacenterVMs(user.org_id,user?.id);
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError('Failed to fetch user profile');
      setTimeout(()=>{
        setError(null)
      },2000)
    } finally {
      setIsLoading(false);
    }
  };

  fetchAllVMs();
}, []);


  const filteredVMs = vms.filter(vm => {
    const matchesSearch = !filters.search || 
      vm.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      vm.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesProvider = !filters.provider || vm.provider === filters.provider;
    const matchesStatus = !filters.status || vm.status === filters.status;
    const matchesType = filters.type === 'all' || filters.type === 'assessment';
    return matchesSearch && matchesProvider && matchesStatus && matchesType;
  });

  const filteredDatacenterVMs = datacenterVMs.filter(vm => {
    const matchesSearch = !filters.search || 
      vm.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      vm.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || vm.status === filters.status;
    const matchesType = filters.type === 'all' || filters.type === 'datacenter';
    return matchesSearch && matchesStatus && matchesType;
  });
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Cloud Virtual Machines</GradientText>
          </h1>
          <p className="mt-2 text-gray-400">
            Manage and configure assessment environments
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Assessment
        </button>
      </div>

      <div className="glass-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search assessments..."
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
              <option value="active">Active</option>
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
              <option value="assessment">Assessments</option>
              <option value="datacenter">Datacenter VMs</option>
            </select>

            <button className="btn-secondary">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
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
          {filteredVMs.length === 0 && filteredDatacenterVMs.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-dark-300/50">
                  <FolderX className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300">
                  No VMs Available
                </h3>
                <p className="text-gray-400 max-w-md">
                  {filters.search || filters.provider || filters.status || filters.type !== 'all'
                    ? "No VMs match your current filters. Try adjusting your search criteria."
                    : "You don't have any VMs yet. Click 'New Assessment' to get started."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Assessment VMs Section */}
              {filteredVMs.length > 0 && (filters.type === 'all' || filters.type === 'assessment') && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-400 mr-3">Assessments</h2>
                    <div className="px-2 py-1 bg-primary-500/20 rounded-full text-xs text-primary-300">
                      {filteredVMs.length} VMs
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVMs.map((vm) => (
                      <CloudVMAssessmentCard key={vm.lab_id || vm.assessment_id} assessment={vm} />
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