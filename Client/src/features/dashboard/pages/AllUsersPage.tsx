
import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { UserList } from '../../users/components/UserList';
import { AddUserModal } from '../../users/components/AddUserModal';
import { UserFilters } from '../../users/components/UserFilters';
import { UserStats } from '../../users/components/UserStats';
import { BulkUploadModal } from '../../users/components/BulkUploadModal';
import { UserPlus, Upload } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import axios from 'axios';

export const AllUsersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [allUsers, setAllUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
    const fetchAllOrgUsers = async () => {
      try {
        // Fetch all users from the organization
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user?.org_id}`
        );
        
        if (response.data.success) {
          setAllUsers(response.data.data);
          setOriginalUsers(response.data.data);
          
          const users = response.data.data;
          setStats({
            totalUsers: users.length,
            activeUsers: users.filter(u => u.status === 'active').length,
            trainers: users.filter(u => u.role === 'trainer').length,
            organizations: 1
          });
        }
      } catch (error) {
        console.error('Error fetching organization users:', error);
      }
    };

    if (user?.org_id) {
      fetchAllOrgUsers();
    }
  }, [user?.org_id]);

  const handleFilterChange = (update: { key: string; value: string }) => {
    const updatedFilters = { ...filters, [update.key]: update.value };
    setFilters(updatedFilters);
  };

  useEffect(() => {
    const filteredUsers = originalUsers.filter((orgUser) => {
      const matchesSearch = !filters.search || 
        orgUser.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        orgUser.email.toLowerCase().includes(filters.search.toLowerCase());
      const matchesRole = !filters.role || orgUser.role === filters.role;
      const matchesStatus = !filters.status || orgUser.status === filters.status;
      
      if (filters.dateRange) {
        const userDate = new Date(orgUser.created_at);
        const [start, end] = filters.dateRange.split(',').map(date => new Date(date));
        if (userDate < start || userDate > end) return false;
      }
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    setAllUsers(filteredUsers);
  }, [filters, originalUsers]);

  const handleAddUser = async (userData: any) => {
    try {
      const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/addOrgUser`, {
        formData: userData,
        organizationId: user?.organization_id,
        createdBy: user
      });

      if (result.data.success) {
        setIsAddModalOpen(false);
        // Refresh the users list
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user?.organization_id}`
        );
        if (response.data.success) {
          setAllUsers(response.data.data);
          setOriginalUsers(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleBulkUpload = async (uploadedUsers: any[]) => {
    try {
      const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/bulkUploadOrgUsers`, {
        users: uploadedUsers,
        organizationId: user?.organization_id,
        createdBy: user
      });

      if (result.data.success) {
        setIsUploadModalOpen(false);
        // Refresh the users list
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user?.organization_id}`
        );
        if (response.data.success) {
          setAllUsers(response.data.data);
          setOriginalUsers(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error bulk uploading users:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>All Organization Users</GradientText>
          </h1>
          <p className="text-gray-400 mt-2">
            Manage all users in your organization
          </p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-secondary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      <UserStats stats={stats} />
      
      <UserFilters 
        onFilterChange={handleFilterChange} 
        filters={filters} 
        setFilters={setFilters}
      />
      
      <UserList 
        users={allUsers}
        onViewDetails={(user) => {}}
        hideOrganization={true}
      />

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddUser}
      />

      <BulkUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleBulkUpload}
      />
    </div>
  );
};
