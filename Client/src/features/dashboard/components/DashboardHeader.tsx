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

  // Extract filename from path
  const extractFileName = (filePath: string) => {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-dark-200 border-b border-dark-300 h-16">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <h1 className="text-lg sm:text-xl font-bold">
            <GradientText>Dashboard</GradientText>
          </h1>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden sm:block">
            <OrganizationSwitcher />
          </div>
          <button className="p-2 text-gray-400 hover:text-primary-300 rounded-lg hover:bg-dark-100/50 transition-colors">
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center hover:from-primary-400 hover:to-secondary-400 transition-all duration-200 transform hover:scale-105"
              title="Profile & Settings"
            >
              {user?.profilephoto ? (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/uploads/${extractFileName(user.profilephoto)}`}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {user?.name ? `${user.name.charAt(0)}${user.name.split(' ').pop()?.charAt(0) || ''}` : 'U'}
                </span>
              )}
            </button>

            {/* Settings Dropdown */}
            {isSettingsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-dark-200 border border-dark-300 rounded-lg shadow-xl py-1 z-[60]">
                {/* Profile Info Section */}
                <div className="px-4 py-3 border-b border-dark-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user?.profilephoto ? (
                        <img
                          src={`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/uploads/${extractFileName(user.profilephoto)}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">{user?.name}</h3>
                      <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                      <p className="text-primary-400 text-xs capitalize mt-1">{user?.role}</p>
                    </div>
                  </div>
                </div>
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
        </div>
      </div>
    </header>
  );
};