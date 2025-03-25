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

export const UsersPage: React.FC = () => {
  const [originalUsers, setOriginalUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [admin,setAdmin] = useState({});  
  const [mockStats, setMockStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    trainers: 0,
    organizations: 0
  });
  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      setAdmin(response.data.user);
    };
    getUserDetails();
  }, []);
  useEffect(() => {
    const getUsers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/user_ms/allUsers');
        setOriginalUsers(response.data.data);
        setUsers(response.data.data);
        let totalUsers = response.data.data.length;
        let activeUsers = response.data.data.filter((u) => u.status === 'active').length;
        let trainers = response.data.data.filter((u) => u.role === 'trainer').length;
        const distinctOrganizations = new Set(
          response.data.data
            .map(org => org.organization)
            .filter(name => name !== null && name !== undefined)
        );
        let organizations = distinctOrganizations.size;
        
        setMockStats({
          totalUsers,
          activeUsers,
          trainers,
          organizations
        });
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    getUsers();
  }, []);

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
      const result = await axios.post('http://localhost:3000/api/v1/user_ms/addUser', {
        formData: userData,
        user: admin
      });

      if (result.data.success) {
        setIsAddModalOpen(false);
        // Refresh the user list
        const response = await axios.get('http://localhost:3000/api/v1/user_ms/allUsers');
        setOriginalUsers(response.data.data);
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleBulkUpload = async (uploadedUsers: any[]) => {
    try {
      const result = await axios.post('http://localhost:3000/api/v1/user_ms/bulkUploadUsers', {
        users: uploadedUsers,
        admin: admin
      });

      if (result.data.success) {
        setIsUploadModalOpen(false);
        // Refresh the user list
        const response = await axios.get('http://localhost:3000/api/v1/user_ms/allUsers');
        setOriginalUsers(response.data.data);
        setUsers(response.data.data);
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
      />
    </div>
  );
};