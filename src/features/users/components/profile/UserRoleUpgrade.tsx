import React, { useState } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Shield, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types';
import axios from 'axios';

interface UserRoleUpgradeProps {
  userId: string;
  currentRole: UserRole;
}

export const UserRoleUpgrade: React.FC<UserRoleUpgradeProps> = ({ userId, currentRole }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles: { value: UserRole; label: string; description: string }[] = [
    {
      value: 'trainer',
      label: 'Trainer',
      description: 'Can create and manage labs, assess students, and track progress'
    },
    {
      value: 'orgadmin',
      label: 'Organization Admin',
      description: 'Full access to organization resources, user management, and billing'
    }
  ];

  const handleUpgrade = async (newRole: UserRole) => {
    setIsUpdating(true);
    setError(null);

    try {
      //update user role api endpoint
      const update = await axios.put('http://localhost:3000/api/v1/user_ms/updateUserRole',{
             userId:userId,
             role:newRole,
      })
      if(!update.data.success){
        setError('Failed to upgrade role. Please try again.');
      }
      location.reload(true)
      // Refresh page or update state
    } catch (err) {
      setError('Failed to upgrade role. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="glass-panel">
      <h2 className="text-xl font-semibold mb-6">
        <GradientText>Role Management</GradientText>
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {roles.map(role => (
          <div 
            key={role.value}
            className="p-6 bg-dark-300/50 rounded-lg border border-primary-500/20
                     hover:border-primary-500/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-primary-400" />
                <h3 className="text-lg font-medium text-gray-200">
                  {role.label}
                </h3>
              </div>
              {currentRole === role.value ? (
                <span className="px-3 py-1 text-xs font-medium rounded-full 
                               bg-primary-500/20 text-primary-300">
                  Current Role
                </span>
              ) : (
                <button
                  onClick={() => handleUpgrade(role.value)}
                  disabled={isUpdating}
                  className="btn-secondary text-sm"
                >
                  {isUpdating ? 'Upgrading...' : 'Upgrade'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {role.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};