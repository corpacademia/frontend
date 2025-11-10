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
    <div className="glass-panel overflow-hidden">
      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm sm:text-base">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 sm:p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-200">{success}</span>
            </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full w-full">
              <thead>
                <tr className="text-left text-xs sm:text-sm text-gray-400 border-b border-primary-500/10">
                  {!isOrgSuperAdmin && (
                    <th className="pb-3 sm:pb-4 px-2 sm:px-4">
                      <input
                        type="checkbox"
                        checked={organizations.length > 0 && selectedOrgs.length === organizations.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                      />
                    </th>
                  )}
                  <th className="pb-3 sm:pb-4 px-2 sm:px-4 whitespace-nowrap">Organization</th>
                  <th className="pb-3 sm:pb-4 px-2 sm:px-4 whitespace-nowrap">Type</th>
                  <th className="pb-3 sm:pb-4 px-2 sm:px-4 whitespace-nowrap">Users</th>
                  <th className="pb-3 sm:pb-4 px-2 sm:px-4 whitespace-nowrap">Labs</th>
                  <th className="pb-3 sm:pb-4 px-2 sm:px-4 whitespace-nowrap">Status</th>
                  <th className="pb-3 sm:pb-4 px-2 sm:px-4 whitespace-nowrap">Subscription</th>
                  <th className="pb-3 sm:pb-4 px-2 sm:px-4 whitespace-nowrap">Last Active</th>
                  <th className="pb-3 sm:pb-4 px-2 sm:px-4 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {organizations.map((org) => (
                  <tr 
                    key={org.id} 
                    className="border-b border-primary-500/5 hover:bg-dark-300/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(org)}
                  >
                    {!isOrgSuperAdmin && (
                      <td className="py-3 sm:py-4 px-2 sm:px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedOrgs.includes(org.id)}
                          onChange={(e) => handleSelectOrg(org.id, e)}
                          className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    <td className="py-3 sm:py-4 px-2 sm:px-4">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-primary-400" />
                        <div>
                          <p className="text-gray-200 font-medium whitespace-nowrap">{org.organization_name}</p>
                          <p className="text-sm text-gray-400 whitespace-nowrap">{org.org_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4">
                      <span className="capitalize text-gray-300 whitespace-nowrap">{org.org_type}</span>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 whitespace-nowrap text-gray-300">{org.usersCount}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 whitespace-nowrap text-gray-300">{org.labsCount}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        org.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                        org.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300 whitespace-nowrap">
                        {org.subscriptionTier}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-400 whitespace-nowrap">
                      {org.lastActive}
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(org);
                          }}
                          className="p-1 sm:p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 text-primary-400" />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={(e) => toggleDropdown(org.id, e)}
                            className="p-1 sm:p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                          {activeDropdown === org.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50">
                              <button
                                onClick={(e) => handleEdit(org, e)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-primary-500/10 flex items-center space-x-2"
                              >
                                <Pencil className="h-4 w-4 text-primary-400" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete([org.id]);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                              >
                                <Trash2 className="h-4 w-4" />
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
          <div className="p-4 border-t border-primary-500/10 flex justify-between items-center">
            <span className="text-sm text-gray-400">
              {selectedOrgs.length} organization(s) selected
            </span>
            <button
              onClick={() => handleDelete(selectedOrgs)}
              disabled={isDeleting}
              className="btn-secondary text-red-400 hover:text-red-300"
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </span>
              ) : (
                <span className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </span>
              )}
            </button>
          </div>
        )}
    </div>
  );
};