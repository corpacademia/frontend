import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { Bell, Settings, LogOut } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { OrganizationSwitcher } from './OrganizationSwitcher';

export const DashboardHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-dark-200/80 backdrop-blur-sm border-b border-primary-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-display font-bold">
              <GradientText>GoLabing.ai</GradientText>
            </h1>
            <OrganizationSwitcher />
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-dark-100/50 text-gray-400 hover:text-primary-400 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-dark-100/50 text-gray-400 hover:text-primary-400 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="block text-sm font-medium text-gray-300">
                  {user?.name}
                </span>
                {user?.impersonating && (
                  <span className="text-xs text-primary-400">
                    Viewing as {user.organization}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-dark-100/50 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};