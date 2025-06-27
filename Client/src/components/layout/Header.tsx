import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { SettingsModal } from '../modals/SettingsModal';
import { 
  BeakerIcon, 
  BookOpenIcon, 
  UserIcon, 
  LayoutDashboardIcon,
  GraduationCapIcon,
  AwardIcon,
  CloudIcon,
  SettingsIcon
} from 'lucide-react';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-40 bg-dark-200 border-b border-dark-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <BeakerIcon className="h-8 w-8 text-primary-400" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                GoLabing.ai
              </span>
            </Link>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                to="/labs" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 border-b-2 border-transparent hover:border-primary-400 hover:text-primary-300"
              >
                <BookOpenIcon className="h-4 w-4 mr-1" />
                Labs
              </Link>
              <Link 
                to="/learning-paths" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-400 hover:text-primary-300 border-b-2 border-transparent hover:border-primary-400"
              >
                <GraduationCapIcon className="h-4 w-4 mr-1" />
                Learning Paths
              </Link>
              <Link 
                to="/assessments" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-400 hover:text-primary-300 border-b-2 border-transparent hover:border-primary-400"
              >
                <AwardIcon className="h-4 w-4 mr-1" />
                Assessments
              </Link>
              <Link 
                to="/cloud-labs" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-400 hover:text-primary-300 border-b-2 border-transparent hover:border-primary-400"
              >
                <CloudIcon className="h-4 w-4 mr-1" />
                Cloud Labs
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-primary-300"
                >
                  <LayoutDashboardIcon className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1 rounded-full text-gray-400 hover:text-primary-300 bg-dark-300 hover:bg-dark-100/50 transition-colors"
                  title="Settings"
                >
                  <SettingsIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => logout()}
                  className="text-sm font-medium text-gray-400 hover:text-primary-300"
                >
                  Logout
                </button>
                <Link 
                  to="/profile" 
                  className="p-1 rounded-full text-gray-400 hover:text-primary-300 bg-dark-300 hover:bg-dark-100/50 transition-colors"
                >
                  <UserIcon className="h-6 w-6" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-400 hover:text-primary-300"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </header>
  );
};