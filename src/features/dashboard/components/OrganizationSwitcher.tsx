import React, { useState } from 'react';
import { Building2, ChevronDown, LogOut, Home } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

interface Organization {
  id: string;
  name: string;
  role: 'orgadmin';
}

// Mock data - Replace with API call
const mockOrganizations: Organization[] = [
  { id: '1', name: 'TechCorp Labs', role: 'orgadmin' },
  { id: '2', name: 'EduTech Solutions', role: 'orgadmin' },
  { id: '3', name: 'Cloud Academy', role: 'orgadmin' },
  { id: '4', name: 'DevOps Institute', role: 'orgadmin' },
];

export const OrganizationSwitcher: React.FC = () => {
  const { user, switchOrganization, resetRole } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleSwitchOrg = (org: Organization) => {
    switchOrganization(org);
    setIsOpen(false);
  };

  const handleResetRole = () => {
    resetRole();
    setIsOpen(false);
  };

  if (user?.role !== 'superadmin' && !user?.impersonating) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg 
                 bg-dark-400/50 border border-primary-500/20 
                 hover:bg-dark-300/50 hover:border-primary-500/30 
                 transition-all duration-200"
      >
        {user.impersonating ? (
          <Building2 className="h-4 w-4 text-primary-400" />
        ) : (
          <Home className="h-4 w-4 text-primary-400" />
        )}
        <span className="text-sm text-gray-300">
          {user.impersonating ? user.organization : 'Root Organization'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 py-2 
                      bg-dark-200 border border-primary-500/20 rounded-lg 
                      shadow-lg backdrop-blur-sm z-50">
          {user.impersonating && (
            <>
              <button
                onClick={handleResetRole}
                className="w-full px-4 py-2 text-left text-sm text-primary-400 
                         hover:bg-primary-500/10 transition-colors
                         flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Switch to Root Organization</span>
              </button>
              <div className="border-t border-primary-500/10 my-2" />
            </>
          )}
          
          <div className="max-h-64 overflow-y-auto">
            {mockOrganizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitchOrg(org)}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 
                         hover:bg-primary-500/10 transition-colors
                         flex items-center space-x-2"
              >
                <Building2 className="h-4 w-4 text-primary-400" />
                <span>{org.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};