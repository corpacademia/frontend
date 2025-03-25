import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Mail, ExternalLink, Pencil, Trash2, Loader, AlertCircle, Check } from 'lucide-react';
import { User } from '../types';
import { useAuthStore } from '../../../store/authStore';
import { EditUserModal } from './EditUserModal';
import axios from 'axios';

interface UserListProps {
  users: User[];
  onViewDetails: (user: User) => void;
  hideOrganization?: boolean;
}

export const UserList: React.FC<UserListProps> = ({ 
  users, 
  onViewDetails,
  hideOrganization = false 
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editModalUser, setEditModalUser] = useState<User | null>(null);

  const handleViewDetails = (user: User) => {
    const basePath = currentUser?.role === 'orgadmin' ? 'trainer' : 'user';
    navigate(`/dashboard/${basePath}/${user.id}`);
    onViewDetails(user);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedUsers(e.target.checked ? users.map(u => u.id) : []);
  };

  const handleSelectUser = (e: React.ChangeEvent<HTMLInputElement>, userId: string) => {
    e.stopPropagation();
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDelete = async (userIds: string[]) => {
    setIsDeleting(true);
    try {
      const response = await axios.post('http://localhost:3000/api/v1/user_ms/deleteUsers',{
        userIds
      });

      if (response.data.success) {
        setNotification({ type: 'success', message: 'Users deleted successfully' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete users');
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete users'
      });
    } finally {
      setIsDeleting(false);
      setActiveDropdown(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleEdit = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setEditModalUser(user);
    setActiveDropdown(null);
  };

  return (
    <div className="glass-panel">
      {notification && (
        <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/20 border border-emerald-500/20' 
            : 'bg-red-500/20 border border-red-500/20'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
          <span className={`text-sm ${
            notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {notification.message}
          </span>
        </div>
      )}

      {selectedUsers.length > 0 && (
        <div className="mb-4 p-4 bg-dark-300/50 rounded-lg flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {selectedUsers.length} user(s) selected
          </span>
          <button
            onClick={() => handleDelete(selectedUsers)}
            disabled={isDeleting}
            className="btn-secondary text-red-400 hover:text-red-300"
          >
            {isDeleting ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Deleting...
              </span>
            ) : (
              <span className="flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </span>
            )}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
              <th className="pb-4 pl-4">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                  onClick={e => e.stopPropagation()}
                />
              </th>
              <th className="pb-4">User</th>
              <th className="pb-4">Role</th>
              {!hideOrganization && <th className="pb-4">Organization</th>}
              <th className="pb-4">Status</th>
              <th className="pb-4">Last Active</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr 
                key={user.id} 
                className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors cursor-pointer"
                onClick={() => handleViewDetails(user)}
              >
                <td className="py-4 pl-4" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => handleSelectUser(e, user.id)}
                    className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                  />
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary-400">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-200 font-medium">{user.name || 'Unnamed User'}</p>
                      <div className="flex items-center text-sm text-gray-400">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'orgadmin' ? 'bg-primary-500/20 text-primary-300' :
                    user.role === 'trainer' ? 'bg-accent-500/20 text-accent-300' :
                    'bg-secondary-500/20 text-secondary-300'
                  }`}>
                    {user.role}
                  </span>
                </td>
                {!hideOrganization && (
                  <td className="py-4 text-gray-300">
                    {user.organization || '-'}
                  </td>
                )}
                <td className="py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                    user.status === 'inactive' ? 'bg-red-500/20 text-red-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 text-gray-400">
                  {user.lastactive}
                </td>
                <td className="py-4" onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                    {activeDropdown === user.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-primary-500/10 flex items-center space-x-2"
                        >
                          <ExternalLink className="h-4 w-4 text-primary-400" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={(e) => handleEdit(e, user)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-primary-500/10 flex items-center space-x-2"
                        >
                          <Pencil className="h-4 w-4 text-primary-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete([user.id]);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editModalUser && (
        <EditUserModal
          isOpen={true}
          onClose={() => setEditModalUser(null)}
          user={editModalUser}
        />
      )}
    </div>
  );
};