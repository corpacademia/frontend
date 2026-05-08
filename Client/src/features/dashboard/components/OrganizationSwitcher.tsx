import React, { useState } from 'react';
import { Building2, ChevronDown, Home, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';

export const OrganizationSwitcher: React.FC = () => {
  const { user, organizations, switchOrganization, resetRole } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Only visible to superadmin (and while impersonating)
  if (user?.role !== 'superadmin' && !user?.impersonating) return null;

  const handleSwitchOrg = (org: any) => {
    switchOrganization({
      id: org.id,
      name: org.organization_name,
      role: 'orgsuperadmin',
      org_admin:org.org_admin
    });
    setIsOpen(false);
    navigate('/dashboard');
  };

  const handleResetRole = () => {
    resetRole();
    setIsOpen(false);
    navigate('/dashboard');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200
          ${user?.impersonating
            ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
            : 'bg-dark-400/50 border-primary-500/20 hover:bg-dark-300/50 hover:border-primary-500/30'
          }`}
      >
        {user?.impersonating ? (
          <Building2 className="h-4 w-4 text-amber-400 flex-shrink-0" />
        ) : (
          <Home className="h-4 w-4 text-primary-400 flex-shrink-0" />
        )}
        <span className={`text-sm truncate max-w-[140px] ${user?.impersonating ? 'text-amber-300' : 'text-gray-300'}`}>
          {user?.impersonating ? user.organization : 'Switch Organization'}
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 ${user?.impersonating ? 'text-amber-400' : 'text-gray-400'}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full right-0 mt-2 w-72 py-2
                          bg-dark-200 border border-primary-500/20 rounded-xl
                          shadow-xl shadow-black/40 backdrop-blur-sm z-50">

            {/* Currently impersonating banner */}
            {user?.impersonating && (
              <>
                <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 rounded-t-xl">
                  <p className="text-xs text-amber-400 font-medium">
                    Viewing as OrgSuperAdmin
                  </p>
                  <p className="text-xs text-amber-300 font-semibold truncate mt-0.5">
                    {user.organization}
                  </p>
                </div>
                <button
                  onClick={handleResetRole}
                  className="w-full px-4 py-2.5 text-left text-sm text-primary-400
                             hover:bg-primary-500/10 transition-colors
                             flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to SuperAdmin View</span>
                </button>
                <div className="border-t border-primary-500/10 my-1" />
              </>
            )}

            <p className="px-4 py-1.5 text-[11px] text-gray-500 uppercase tracking-wider font-medium">
              Switch to Organization
            </p>

            <div className="max-h-56 overflow-y-auto">
              {organizations.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">No organizations found</p>
              ) : (
                organizations.map((org: any) => (
                  <button
                    key={org.id}
                    onClick={() => handleSwitchOrg(org)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors
                      flex items-center space-x-3
                      ${user?.org_id === org.id && user?.impersonating
                        ? 'bg-primary-500/15 text-primary-300'
                        : 'text-gray-300 hover:bg-primary-500/10'
                      }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary-500/20 border border-primary-500/20
                                    flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{org.organization_name}</p>
                      <p className="text-[11px] text-gray-500 truncate">View as OrgSuperAdmin</p>
                    </div>
                    {user?.org_id === org.id && user?.impersonating && (
                      <span className="ml-auto text-[10px] bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Active
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};