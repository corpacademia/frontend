import React, { useState } from 'react';
import { Organization } from '../types';
import { MoreVertical, Pencil, Trash2, ExternalLink, AlertCircle, Check, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import axios from 'axios';
import { Building2 } from 'lucide-react';
import { formatDate } from '../../../utils/date';

interface OrganizationListProps {
  organizations: Organization[];
  onViewDetails: (org: Organization) => void;
}

export const OrganizationList: React.FC<OrganizationListProps> = ({
  organizations,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user } = useAuthStore();
  const isOrgSuperAdmin = user?.role === 'orgsuperadmin';

  const handleViewDetails = (org: Organization) => {
    navigate(`/dashboard/organizations/${org.id}`);
    onViewDetails(org);
  };

  const toggleDropdown = (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === orgId ? null : orgId);
  };

  const handleEdit = (org: Organization, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/organizations/${org.id}`);
    setActiveDropdown(null);
  };

  const handleDelete = async (orgIds: string[]) => {
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/deleteOrganizations`, {
        orgIds
      });

      if (response.data.success) {
        setSuccess('Organizations deleted successfully');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete organizations');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete organizations');
    } finally {
      setIsDeleting(false);
      setActiveDropdown(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrgs(checked ? organizations.map(org => org.id) : []);
  };

  const handleSelectOrg = (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrgs(prev => 
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-dark-300/30 backdrop-blur-sm border border-primary-500/10 rounded-lg">
      {error && (
        <div className="m-3 sm:m-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm flex-shrink-0">
          {error}
        </div>
      )}

      {success && (
        <div className="m-3 sm:m-4 p-3 sm:p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
              <span className="text-emerald-200 text-xs sm:text-sm">{success}</span>
            </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-primary-500/20 scrollbar-track-dark-300">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <table className="w-full min-w-[800px]">
              <thead className="bg-dark-400/50 sticky top-0 z-10">
                <tr className="text-left text-xs text-gray-400 border-b border-primary-500/20">
                  {!isOrgSuperAdmin && (
                    <th className="py-3 px-3 sm:px-4 w-12">
                      <input
                        type="checkbox"
                        checked={organizations.length > 0 && selectedOrgs.length === organizations.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                      />
                    </th>
                  )}
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium">Organization</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium">Type</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium">Users</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium">Labs</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium">Status</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium">Subscription</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium">Last Active</th>
                  <th className="py-3 px-3 sm:px-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-primary-500/5">
                {organizations.map((org) => (
                  <tr 
                    key={org.id} 
                    className="hover:bg-dark-400/30 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(org)}
                  >
                    {!isOrgSuperAdmin && (
                      <td className="py-3 px-3 sm:px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedOrgs.includes(org.id)}
                          onChange={(e) => handleSelectOrg(org.id, e)}
                          className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-gray-200 font-medium truncate max-w-[150px] sm:max-w-none">{org.organization_name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[150px] sm:max-w-none">{org.org_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <span className="capitalize text-gray-300 text-xs sm:text-sm whitespace-nowrap">{org.org_type}</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-gray-300 text-xs sm:text-sm">{org.usersCount}</td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-gray-300 text-xs sm:text-sm">{org.labsCount}</td>
                    <td className="py-3 px-3 sm:px-4">
                      <span className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap ${
                        org.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                        org.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <span className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-primary-500/20 text-primary-300 whitespace-nowrap">
                        {org.subscriptionTier}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                      {org.lastActive}
                    </td>
                    <td className="py-3 px-3 sm:px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(org);
                          }}
                          className="p-1.5 sm:p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-400" />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={(e) => toggleDropdown(org.id, e)}
                            className="p-1.5 sm:p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                          </button>
                          {activeDropdown === org.id && (
                            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50">
                              <button
                                onClick={(e) => handleEdit(org, e)}
                                className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-300 hover:bg-primary-500/10 flex items-center space-x-2"
                              >
                                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-400" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete([org.id]);
                                }}
                                className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedOrgs.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-primary-500/10 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 flex-shrink-0 bg-dark-400/50">
            <span className="text-xs sm:text-sm text-gray-400">
              {selectedOrgs.length} organization(s) selected
            </span>
            <button
              onClick={() => handleDelete(selectedOrgs)}
              disabled={isDeleting}
              className="btn-secondary text-red-400 hover:text-red-300 text-xs sm:text-sm w-full sm:w-auto"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Deleting...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Delete Selected
                </span>
              )}
            </button>
          </div>
        )}
    </div>
  );
};