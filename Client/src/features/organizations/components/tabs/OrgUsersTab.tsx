import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { 
  UserPlus, 
  Upload, 
  Trash2, 
  MoreVertical, 
  Eye, 
  Pencil,
  Check,
  X,
  Loader,
  AlertCircle,
  Mail,
  User,
  Lock,
  Building2
} from 'lucide-react';
import axios from 'axios';
import { AddOrgUserModal } from '../../../users/components/AddOrgUserModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastactive: string;
}

interface OrgUsersTabProps {
  orgId: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userData: Partial<User>) => Promise<void>;
}

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate passwords if either field is filled
    if ((formData.password || formData.confirmPassword) && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      // Only include password in update if it was changed
      const updateData = {
        ...formData,
        password: formData.password || undefined // Only send password if it was changed
      };
      delete updateData.confirmPassword; // Remove confirmPassword before sending

      await onSave(updateData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Edit User</GradientText>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300"
            >
              <option value="user">User</option>
              <option value="trainer">Trainer</option>
              <option value="orgadmin">Organization Admin</option>
              <option value="orgsuperadmin">Organization Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password (leave blank to keep unchanged)
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300"
                placeholder="Enter new password"
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300"
                placeholder="Confirm new password"
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-200">{error}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewUserModal: React.FC<ViewUserModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>User Details</GradientText>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
              <User className="h-10 w-10 text-primary-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400">Name</label>
            <p className="text-lg text-gray-200">{user.name}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400">Email</label>
            <p className="text-lg text-gray-200">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400">Role</label>
            <span className={`px-2 py-1 text-sm font-medium rounded-full ${
              user.role === 'orgadmin' ? 'bg-primary-500/20 text-primary-300' :
              user.role === 'trainer' ? 'bg-accent-500/20 text-accent-300' :
              'bg-secondary-500/20 text-secondary-300'
            }`}>
              {user.role}
            </span>
          </div>

          <div>
            <label className="block text-sm text-gray-400">Status</label>
            <span className={`inline-block px-2 py-1 text-sm font-medium rounded-full ${
              user.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {user.status}
            </span>
          </div>

          <div>
            <label className="block text-sm text-gray-400">Last Active</label>
            <p className="text-lg text-gray-200">{new Date(user.lastactive).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const OrgUsersTab: React.FC<OrgUsersTabProps> = ({ orgId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`);
        setAdmin(response.data.user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [orgId]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getUsersFromOrganization/${orgId}`);

      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.warn("No users found. Setting users to an empty list.");
        setUsers([]);  // Set users to an empty array instead of stopping the UI
      } else {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users");
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleEditUser = async (userData: Partial<User>) => {
    if (!selectedUser) return;
    try {
      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/updateUserFromSuperadmin/${selectedUser.id}`, {
        ...userData,
        orgId
      });
      if (response.data.success) {
        setSuccess('User updated successfully');
        fetchUsers();

        setTimeout(() => setSuccess(null), 3000);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');

      setTimeout(() => setError(null), 3000);
      throw err;
    }
  };

  const handleViewUser = async (user: User) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/getuserdata/${user.id}`);
      if (response.data.success) {
        setSelectedUser({
          ...user,
          ...response.data.data
        });
        setIsViewModalOpen(true);
      } else {
        throw new Error(response.data.message || 'Failed to fetch user details');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user details');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedUsers.length) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/deleteOrganizationUsers`, {
        orgId:orgId,
        userIds: selectedUsers 
      });

      if (response.data.success) {
        setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
        setSelectedUsers([]);
        setSuccess('Selected users deleted successfully');

        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to delete users');
      }
    } catch (err) {
      setError('Failed to delete selected users');

      setTimeout(() => setError(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportUsers = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orgId', orgId);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization/${orgId}/users/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Users imported successfully');
        fetchUsers();

        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to import users');
      }
    } catch (err) {
      setError('Failed to import users');

      setTimeout(() => setError(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            <GradientText>My Organization</GradientText>
          </h3>
          <Building2 className="h-6 w-6 text-primary-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">{users.length}</div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {users.filter(u => u.status === 'active').length}
            </div>
            <div className="text-sm text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-400">
              {users.filter(u => u.role === 'orgadmin' || u.role === 'orgsuperadmin').length}
            </div>
            <div className="text-sm text-gray-400">Administrators</div>
          </div>
        </div>
        {admin && (
          <div className="mt-4 pt-4 border-t border-primary-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Organization Name</p>
                <p className="font-medium text-gray-200">{admin.organization || 'Not Set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Your Role</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  admin.role === 'orgsuperadmin' ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-primary-300 border border-primary-500/30' :
                  admin.role === 'orgadmin' ? 'bg-primary-500/20 text-primary-300' :
                  'bg-secondary-500/20 text-secondary-300'
                }`}>
                  {admin.role === 'orgsuperadmin' ? 'Organization Super Admin' : 
                   admin.role === 'orgadmin' ? 'Organization Admin' :
                   admin.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          <GradientText>Users & Admins</GradientText>
        </h2>
        <div className="flex space-x-4">
          {selectedUsers.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="btn-secondary text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </button>
          )}
          <label className="btn-secondary cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleImportUsers(e.target.files[0])}
            />
            <Upload className="h-4 w-4 mr-2" />
            Import Users
          </label>
          <button 
            className="btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-200">{success}</span>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                <th className="pb-4 pl-4">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                  />
                </th>
                <th className="pb-4">Name</th>
                <th className="pb-4">Role</th>
                <th className="pb-4">Email</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Last Active</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id}
                  className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
                >
                  <td className="py-4 pl-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-400">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-200">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'orgsuperadmin' ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-primary-300 border border-primary-500/30' :
                      user.role === 'orgadmin' ? 'bg-primary-500/20 text-primary-300' :
                      user.role === 'trainer' ? 'bg-accent-500/20 text-accent-300' :
                      'bg-secondary-500/20 text-secondary-300'
                    }`}>
                      {user.role === 'orgsuperadmin' ? 'Org Super Admin' : 
                       user.role === 'orgadmin' ? 'Admin' :
                       user.role === 'trainer' ? 'Trainer' : 'User'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center text-gray-300">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-400">
                    {new Date(user.lastactive).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                        title="View User Details"
                      >
                        <Eye className="h-4 w-4 text-primary-400" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                        title="Edit User Profile & Role"
                      >
                        <Pencil className="h-4 w-4 text-primary-400" />
                      </button>
                      <button
                        onClick={() => handleSelectUser(user.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Select for Deletion"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleEditUser}
      />

      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <AddOrgUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchUsers}
        adminDetails={admin}
        orgId={orgId}
      />
    </div>
  );
};