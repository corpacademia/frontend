import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Mail, ExternalLink } from 'lucide-react';
import { User } from '../types';
import { useAuthStore } from '../../../store/authStore';

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
  const handleViewDetails = (user: User) => {
    // Use different routes based on the context
    const basePath = currentUser?.role === 'orgadmin' ? 'trainer' : 'user';
    navigate(`/dashboard/${basePath}/${user.id}`);
    onViewDetails(user);
  };

  return (
    <div className="glass-panel">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
              <th className="pb-4 pl-4">User</th>
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
                <td className="py-4 pl-4">
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
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(user);
                      }}
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary-400" />
                    </button>
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};