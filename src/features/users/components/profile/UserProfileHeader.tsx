import React from 'react';
import { User, Mail, Building2, Calendar } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';
import { UserProfile } from '../../types';

interface UserProfileHeaderProps {
  user: UserProfile;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ user }) => {
  return (
    <div className="glass-panel">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 
                        flex items-center justify-center">
            <span className="text-2xl font-medium text-primary-400">
              {user.name.charAt(0)}
            </span>
          </div>
          
          <div>
            <h1 className="text-2xl font-display font-bold">
              <GradientText>{user.name}</GradientText>
            </h1>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-gray-400">
                <Mail className="h-4 w-4 mr-2" />
                {user.email}
              </div>
              <div className="flex items-center text-gray-400">
                <Building2 className="h-4 w-4 mr-2" />
                {user.organization || 'Individual User'}
              </div>
              <div className="flex items-center text-gray-400">
                <Calendar className="h-4 w-4 mr-2" />
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            user.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
            user.status === 'inactive' ? 'bg-red-500/20 text-red-300' :
            'bg-amber-500/20 text-amber-300'
          }`}>
            {user.status}
          </span>
        </div>
      </div>
    </div>
  );
};