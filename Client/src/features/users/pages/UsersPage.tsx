import React, { useEffect, useState } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { UserFilters } from '../components/UserFilters';
import { UserStats } from '../components/UserStats';
import { UserList } from '../components/UserList';
import { BulkUploadModal } from '../components/BulkUploadModal';
import { AddUserModal } from '../components/AddUserModal';
import { User } from '../types';
import { Upload, UserPlus } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../../store/authStore';
import { ROLE_TO_FEATURE,useSubscription } from '../../labs/hooks/useSubscription';

export const UsersPage: React.FC = () => {
  const {canUse,updateUsage,license} = useSubscription();
  const [originalUsers, setOriginalUsers] = useState<any[]>([]);
  const [users, setUsers] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const {user} = useAuthStore(); 
  const [mockStats, setMockStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    trainers: 0,
    organizations: 0
  });
  
  const fetchUsers = async () => {
    try {
      let allData: any[] = [];
      if (user?.role === 'superadmin') {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/allUsers`);
        allData = response.data.data || [];
      } else if (user?.org_id) {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${user.org_id}`);
        allData = response.data.data || [];
        if (user?.role === 'trainer') {
          allData = allData.filter((u: any) => u.role === 'user');
        }
      }

      setOriginalUsers(allData);
      setUsers(allData);

      const totalUsers = allData.length;
      const activeUsers = allData.filter((u: any) => u.status === 'active').length;
      const trainers = allData.filter((u: any) => u.role === 'trainer').length;
      const distinctOrganizations = new Set(
        allData.map((u: any) => u.organization).filter(Boolean)
      );

      setMockStats({
        totalUsers,
        activeUsers,
        trainers,
        organizations: distinctOrganizations.size,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user?.role, user?.org_id]);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    dateRange: ""
  });

  const handleFilterChange = (update: { key: string; value: string }) => {
    const updatedFilters = { ...filters, [update.key]: update.value };
    setFilters(updatedFilters);
  };

  useEffect(() => {
    const filteredUsers = originalUsers.filter((user) => {
      const matchesSearch = !filters.search || 
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase());
      const matchesRole = !filters.role || user.role === filters.role;
      const matchesStatus = !filters.status || user.status === filters.status;
      
      // Handle date range filtering
      if (filters.dateRange) {
        const userDate = new Date(user.created_at);
        const [start, end] = filters.dateRange.split(',').map(date => new Date(date));
        if (userDate < start || userDate > end) return false;
      }
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    setUsers(filteredUsers);
  }, [filters, originalUsers]);

  const handleViewDetails = (user: User) => {
    // Navigation is handled by the UserList component
  };
  const handleAddUser = async (userData: Omit<User, 'id' | 'lastActive' | 'createdAt'>) => {
    try {
      const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/addUser`, {
        formData: userData,
        user: user
      });

      if (result.data.success) {
        setIsAddModalOpen(false);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleBulkUpload = async (uploadedUsers: any[]) => {
    try {
      const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/bulkUploadOrgUsers`, {
        users: uploadedUsers,
        organizationId: user?.org_id,
        createdBy: user?.impersonating ? user?.impersonatedUserId : user?.id,
        orgName:user?.organization,
        orgType:user?.org_type,
        role:'user'
      });

      if (result.data.success) {
        setIsUploadModalOpen(false);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error bulk uploading users:', error);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">
          <GradientText>Users</GradientText>
        </h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-secondary text-gray-200"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary text-gray-200"
          >
            <UserPlus className="h-4 w-4 mr-2 text-gray-200" />
            Add User
          </button>
        </div>
      </div>

      <UserStats stats={mockStats} />
      
      <UserFilters 
        onFilterChange={handleFilterChange} 
        filters={filters} 
        setFilters={setFilters}
      />
      
      <UserList 
        users={users}
        onViewDetails={handleViewDetails}
        hideOrganization={false}
        onUsersDeleted={(deletedIds) => {
          setUsers((prev) =>
           prev.filter((user) => !deletedIds.includes(user?.id))
           );
           setOriginalUsers((prev) =>
           prev.filter((user) => !deletedIds.includes(user?.id))
           );
         }}
      />


      <BulkUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleBulkUpload}
      />

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddUser}
        user={user}
      />
    </div>
  );
};