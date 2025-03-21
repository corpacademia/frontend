import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GradientText } from '../../../components/ui/GradientText';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  CreditCard, 
  Activity,
  Shield,
  FileText,
  Pencil,
  Trash2,
  UserPlus,
  AlertTriangle,
  FolderOpen,
  Clock,
  Loader,
  Check,
  X
} from 'lucide-react';
import axios from 'axios';

// Components for each tab
import { OrgUsersTab } from '../components/tabs/OrgUsersTab';
import { OrgBillingTab } from '../components/tabs/OrgBillingTab';
import { OrgWorkspacesTab } from '../components/tabs/OrgWorkspacesTab';
import { OrgActivityTab } from '../components/tabs/OrgActivityTab';
import { OrgDocumentsTab } from '../components/tabs/OrgDocumentsTab';
import { EditOrganizationModal } from '../components/EditOrganizationModal';

interface OrganizationDetails {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  logo?: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  subscription: {
    plan: string;
    billingCycle: string;
    nextBilling: string;
    usage: {
      storage: number;
      workspaces: number;
    };
  };
  stats: {
    users: number;
    admins: number;
    activeWorkspaces: number;
    monthlyUsage: number;
  };
}

const defaultOrganization: OrganizationDetails = {
  id: '',
  name: '',
  description: '',
  createdAt: new Date().toISOString(),
  status: 'pending',
  contact: {
    name: '',
    email: '',
    phone: '',
    address: ''
  },
  subscription: {
    plan: 'Basic',
    billingCycle: 'Monthly',
    nextBilling: new Date().toISOString(),
    usage: {
      storage: 0,
      workspaces: 0
    }
  },
  stats: {
    users: 0,
    admins: 0,
    activeWorkspaces: 0,
    monthlyUsage: 0
  }
};

export const OrganizationOverview: React.FC = () => {
  const { orgId } = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'billing' | 'workspaces' | 'activity' | 'documents'>('overview');
  const [organization, setOrganization] = useState<OrganizationDetails>(defaultOrganization);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [orgUserCount, setOrgUserCount] = useState<number>(0);
  const [worspacecount, setWorkspaceCount] = useState<number>(0);

  //to extract the file path of logo
  const getUploadedFilePath = (fullPath: string) => {
    const normalizedPath = fullPath.replace(/\\/g, "/"); // Convert \ to /
    const uploadIndex = normalizedPath.indexOf("uploads/");
    
    if (uploadIndex === -1) return null; // If "uploads/" not found, return null
  
    return normalizedPath.substring(uploadIndex + 8); // Extract everything after "uploads/"
  };

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.post(`http://localhost:3000/api/v1/organization_ms/getOrgDetails`, {
          org_id: orgId
        });
        const orgUsersCount = await axios.get(`http://localhost:3000/api/v1/organization_ms/getOrgUsersCount/${orgId}`); 
        const workspaceCount = await axios.get(`http://localhost:3000/api/v1/workspace_ms/workspaceCount/${response.data.data.id}`);
        
        if (response.data.success) {
          setOrganization({
            ...defaultOrganization,
            ...response.data.data
          });
       
        if(workspaceCount.data.success){
          setWorkspaceCount(workspaceCount.data.data.count)
        }
        
        if(orgUsersCount.data.success){
          setOrgUserCount(orgUsersCount.data.data)
        }
        } else {
          throw new Error('Failed to fetch organization data');
        }
      } catch (err) {
        console.error('Failed to fetch organization data:', err);
        setError('Failed to load organization data');
      } finally {
        setIsLoading(false);
      }
    };

    if (orgId) {
      fetchOrganizationData();
    }
  }, [orgId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.post(`http://localhost:3000/api/v1/organization_ms/deleteOrganizations`,{
        orgIds:[orgId]
      });
      if (response.data.success) {
        setSuccess('Organization deleted successfully');
        setTimeout(() => {
          window.location.href = '/dashboard/organizations';
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete organization');
      }
    } catch (err) {
      setError('Failed to delete organization');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleEditSuccess = async () => {
    try {
      const response = await axios.post(`http://localhost:3000/api/v1/organization_ms/getOrgDetails`, {
        org_id: orgId
      });
      if (response.data.success) {
        setOrganization({
          ...defaultOrganization,
          ...response.data.data
        });
      }
    } catch (err) {
      console.error('Failed to refresh organization data:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          {error}
        </h2>
        <p className="text-gray-400">
          Please try again later or contact support if the problem persists.
        </p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <OrgUsersTab orgId={orgId!} />;
      case 'billing':
        return <OrgBillingTab orgId={orgId!} />;
      case 'workspaces':
        return <OrgWorkspacesTab orgId={orgId!} />;
      case 'activity':
        return <OrgActivityTab orgId={orgId!} />;
      case 'documents':
        return <OrgDocumentsTab orgId={orgId!} />;
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Total Users</span>
            <Users className="h-5 w-5 text-primary-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {orgUserCount.users}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {orgUserCount.admins} admins
          </p>
        </div>

        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Active Workspaces</span>
            <Activity className="h-5 w-5 text-secondary-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {worspacecount}
          </p>
        </div>

        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Monthly Usage</span>
            <CreditCard className="h-5 w-5 text-accent-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            ${organization.stats.monthlyUsage.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Subscription</span>
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {organization.subscription.plan}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Next billing: {new Date(organization.subscription.nextBilling).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="glass-panel">
        <h2 className="text-lg font-semibold mb-6">
          <GradientText>Contact Information</GradientText>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Mail className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-gray-200">{organization.org_email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-secondary-500/10">
              <Phone className="h-5 w-5 text-secondary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Phone</p>
              <p className="text-gray-200">{organization.phone_number}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 md:col-span-2">
            <div className="p-2 rounded-lg bg-accent-500/10">
              <MapPin className="h-5 w-5 text-accent-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Address</p>
              <p className="text-gray-200">{organization.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            {organization.logo ? (
              <img 
                src={`http://localhost:3004/uploads/${getUploadedFilePath(organization.logo)}`} 
                alt={organization.organization_name} 
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-display font-bold">
                <GradientText>{organization.organization_name}</GradientText>
              </h1>
              <div className="flex items-center mt-2 space-x-4">
                <span className="text-sm text-gray-400">ID: {organization.org_id}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  organization.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                  organization.status === 'suspended' ? 'bg-red-500/20 text-red-300' :
                  organization.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-secondary"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn-secondary text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary-500/10">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'users', label: 'Users & Admins', icon: Users },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'workspaces', label: 'Workspaces', icon: Activity },
            { id: 'activity', label: 'Activity', icon: Clock },
            { id: 'documents', label: 'Documents', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-primary-500/50'
                }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Edit Modal */}
      <EditOrganizationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        organization={organization}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              <GradientText>Confirm Deletion</GradientText>
            </h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this organization? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-primary bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Deleting...
                  </span>
                ) : (
                  'Delete Organization'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-200">{success}</span>
          </div>
        </div>
      )}
    </div>
  );
};