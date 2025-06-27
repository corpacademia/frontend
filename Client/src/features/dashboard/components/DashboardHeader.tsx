import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { Bell, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { OrganizationSwitcher } from './OrganizationSwitcher';

export const DashboardHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsSettingsDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setIsSettingsDropdownOpen(false);
    navigate('/profile');
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-200 border-b border-dark-300 h-16">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">
            <GradientText>Dashboard</GradientText>
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <OrganizationSwitcher />
          <button className="p-2 text-gray-400 hover:text-primary-300 rounded-lg hover:bg-dark-100/50 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
              className="p-2 text-gray-400 hover:text-primary-300 rounded-lg hover:bg-dark-100/50 transition-colors flex items-center space-x-1"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSettingsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSettingsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-200 border border-dark-300 rounded-lg shadow-xl py-1 z-[60]">
                <button
                  onClick={handleProfileClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-100/50 flex items-center space-x-2 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    // Add settings functionality here
                    setIsSettingsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-100/50 flex items-center space-x-2 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <hr className="border-dark-300 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-100/50 flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-300">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-dark-100/50 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );

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