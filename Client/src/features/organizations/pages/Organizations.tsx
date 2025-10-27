import React, { useEffect, useState } from 'react';
import { Building2, Plus, Search, Filter, CreditCard, Users, BarChart3 } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { OrganizationList } from '../components/OrganizationList';
import { OrganizationFilters } from '../components/OrganizationFilters';
import { OrganizationStats } from '../components/OrganizationStats';
import { Organization } from '../types';
import { useOrganizationFilters } from '../hooks/useOrganizationFilters';
import { AddOrganizationModal } from '../components/AddOrganizationModal';
import axios from 'axios';
import { TransactionList } from '../../../components/transactions/TransactionList';
import { useAuthStore } from '../../../store/authStore';

export const Organizations: React.FC = () => {
  const { user } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    subscriptionTier: ''
  });

  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeUsers: 0,
    totalLabs: 0,
    monthlyRevenue: 0
  });

  const [admin,setAdmin] = useState({});
  const [activeTab, setActiveTab] = useState('overview');


  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`);
      if (response.data.success) {
        let orgData = response.data.data || [];
        // Filter organizations based on user role
        if (admin.role === 'orgsuperadmin') {
          // Show only the organization the orgsuperadmin belongs to
          orgData = orgData.filter((org: any) => 
            org.organization_name === admin.organization_name || 
            org.id === admin.org_id
          );
        }

        setOrganizations(orgData);
        setFilteredOrganizations(orgData);

        setStats({
          totalOrganizations: orgData.length,
          activeUsers: orgData.reduce((acc: number, org: any) => acc + (org.usersCount || 0), 0),
          totalLabs: orgData.reduce((acc: number, org: any) => acc + (org.labsCount || 0), 0),
          monthlyRevenue: orgData.reduce((acc: number, org: any) => acc + (org.revenue || 0), 0)
        });
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [admin.id]);

  useEffect(() => {
    const filtered = organizations.filter(org => {
      const matchesSearch = !filters.search || 
        org.organization_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        org.org_email?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesType = !filters.type || 
        org.org_type?.toLowerCase() === filters.type.toLowerCase();

      const matchesStatus = !filters.status || 
        org.status?.toLowerCase() === filters.status.toLowerCase();

      const matchesSubscriptionTier = !filters.subscriptionTier || 
        org.subscriptionTier?.toLowerCase() === filters.subscriptionTier.toLowerCase();

      return matchesSearch && matchesType && matchesStatus && matchesSubscriptionTier;
    });

    setFilteredOrganizations(filtered);
  }, [filters, organizations]);

  const handleFilterChange = (update: { key: string; value: string }) => {
    setFilters(prev => ({
      ...prev,
      [update.key]: update.value
    }));
  };

  const handleViewDetails = (org: Organization) => {
    // Navigate to organization details page
    console.log('Viewing details for:', org);
  };

  const isOrgRole = user?.role === 'labadmin' || user?.role === 'orgsuperadmin';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ...(isOrgRole ? [{ id: 'transactions', label: 'Transactions', icon: CreditCard }] : [])
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            <GradientText>
              {user?.role === 'labadmin' ? 'My Organization' : 
               user?.role === 'orgsuperadmin' ? 'Organization Settings' : 
               'Organizations'}
            </GradientText>
          </h1>
          <p className="text-gray-400 mt-1">
            {user?.role === 'labadmin' ? 'Manage your organization settings and data' :
             user?.role === 'orgsuperadmin' ? 'Configure organization settings and preferences' :
             'Manage and monitor all organizations'}
          </p>
        </div>
        {user?.role === 'superadmin' && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center text-gray-200"
          >
            <Plus className="h-4 w-4 mr-2 text-gray-200" />
            Add Organization
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 bg-dark-200 rounded-lg p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-dark-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-dark-200 rounded-lg p-6">
          {activeTab === 'overview' && (
            <div>
              {user?.role === 'superadmin' ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search organizations..."
                        className="input pl-10"
                        value={filters.search}
                        onChange={(e) => handleFilterChange({ key: 'search', value: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn-secondary flex items-center"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </button>
                  </div>

                  {/* This is where the filter modal should be rendered based on state */}
                  {/* Assuming there's a FilterModal component that takes filters and onFilterChange/onReset */}
                  {/* For now, showing the filter inputs directly or a placeholder */}
                  <div className="mb-6">
                    {/* Placeholder for filter UI if not using a modal */}
                    <OrganizationFilters
                      filters={filters}
                      onFilterChange={handleFilterChange}
                    />
                  </div>

                  <OrganizationList
                    organizations={filteredOrganizations}
                    onViewDetails={handleViewDetails}
                  />
                </>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Organization Overview</h2>
                  <p className="text-gray-400">View organization details and statistics</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Users Management</h2>
              <p className="text-gray-400">Manage organization users and permissions</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Analytics</h2>
              <p className="text-gray-400">View organization performance and usage analytics</p>
            </div>
          )}

          {activeTab === 'transactions' && isOrgRole && (
            <div>
              <TransactionList 
                orgId={user?.org_id} 
                title="Organization Transactions"
              />
            </div>
          )}
        </div>
      </div>

      <AddOrganizationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchOrganizations}
      />
    </div>
  );
};