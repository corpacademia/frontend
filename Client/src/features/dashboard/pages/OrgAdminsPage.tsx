
import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { UserList } from '../../users/components/UserList';
import { AddUserModal } from '../../users/components/AddUserModal';
import { UserFilters } from '../../users/components/UserFilters';
import { UserStats } from '../../users/components/UserStats';
import { UserPlus, Users, Shield, Building2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import axios from 'axios';

export const OrgAdminsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [orgAdmins, setOrgAdmins] = useState([]);
  const [originalOrgAdmins, setOriginalOrgAdmins] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    trainers: 0,
    organizations: 1
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    dateRange: ""
  });

  useEffect(() => {
    const fetchOrgAdmins = async () => {
      try {
        // Fetch organization admins for the current organization
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user?.org_id}`
        );
        if (response.data.success) {
          const admins = response.data.data.filter(u => u.role === 'orgadmin');
          setOrgAdmins(admins);
          setOriginalOrgAdmins(admins);
          
          setStats({
            totalUsers: admins.length,
            activeUsers: admins.filter(u => u.status === 'active').length,
            trainers: 0, // Not applicable for org admins
            organizations: 1
          });
        }
      } catch (error) {
        console.error('Error fetching organization admins:', error);
      }
    };

    if (user?.org_id) {
      fetchOrgAdmins();
    }
  }, [user?.org_id]);

  const handleFilterChange = (update: { key: string; value: string }) => {
    const updatedFilters = { ...filters, [update.key]: update.value };
    setFilters(updatedFilters);
  };

  useEffect(() => {
    const filteredAdmins = originalOrgAdmins.filter((admin) => {
      const matchesSearch = !filters.search || 
        admin.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        admin.email.toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus = !filters.status || admin.status === filters.status;
      
      if (filters.dateRange) {
        const adminDate = new Date(admin.created_at);
        const [start, end] = filters.dateRange.split(',').map(date => new Date(date));
        if (adminDate < start || adminDate > end) return false;
      }
      
      return matchesSearch && matchesStatus;
    });
    setOrgAdmins(filteredAdmins);
  }, [filters, originalOrgAdmins]);

  const handleAddOrgAdmin = async (userData: any) => {
    try {
      const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/addOrgAdmin`, {
        formData: { ...userData, role: 'orgadmin' },
        organizationId: user?.organization_id,
        createdBy: user
      });

      if (result.data.success) {
        setIsAddModalOpen(false);
        // Refresh the org admins list
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getOrgAdmins/${user?.organization_id}`
        );
        if (response.data.success) {
          const admins = response.data.data.filter(u => u.role === 'orgadmin');
          setOrgAdmins(admins);
          setOriginalOrgAdmins(admins);
        }
      }
    } catch (error) {
      console.error('Error adding organization admin:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Organization Admins</GradientText>
          </h1>
          <p className="text-gray-400 mt-2">
            Manage administrators for your organization
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Total Admins</span>
            <Shield className="h-5 w-5 text-primary-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {stats.totalUsers}
          </p>
        </div>

        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Active Admins</span>
            <Users className="h-5 w-5 text-secondary-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-200">
            {stats.activeUsers}
          </p>
        </div>

        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Organization</span>
            <Building2 className="h-5 w-5 text-accent-400" />
          </div>
          <p className="text-lg font-semibold text-gray-200">
            {user?.organization || 'N/A'}
          </p>
        </div>

        <div className="glass-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Your Role</span>
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-emerald-300">
            {user?.role === 'orgsuperadmin' ? 'Organization Super Admin' : 'Super Admin'}
          </p>
        </div>
      </div>
      
      <UserFilters 
        onFilterChange={handleFilterChange} 
        filters={filters} 
        setFilters={setFilters}
        hideRoleFilter={true}
      />
      
      <UserList 
        users={orgAdmins}
        onViewDetails={(user) => {}}
        hideOrganization={true}
      />

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddOrgAdmin}
        defaultRole="orgadmin"
        roleOptions={[
          { value: 'orgadmin', label: 'Organization Admin' },
          { value: 'orgsuperadmin', label: 'Organization Super Admin' }
        ]}
      />
    </div>
  );
};
