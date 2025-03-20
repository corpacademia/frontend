import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Organization } from '../types';
import { Building2, MoreVertical, ExternalLink, Pencil, Trash2, AlertCircle, Check, Loader } from 'lucide-react';
import { formatDate } from '../../../utils/date';
import axios from 'axios';

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
      const response = await axios.post('http://localhost:3000/api/v1/organization_ms/deleteOrganizations', {
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
    <div className="glass-panel">
      <div className="overflow-x-auto">
        {selectedOrgs.length > 0 && (
          <div className="p-4 border-b border-primary-500/10 flex justify-between items-center">
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

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-200">{success}</span>
            </div>
          </div>
        )}

        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
              <th className="pb-4 pl-4">
                <input
                  type="checkbox"
                  checked={organizations.length > 0 && selectedOrgs.length === organizations.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                />
              </th>
              <th className="pb-4">Organization</th>
              <th className="pb-4">Type</th>
              <th className="pb-4">Users</th>
              <th className="pb-4">Labs</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Subscription</th>
              <th className="pb-4">Last Active</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr 
                key={org.id} 
                className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors cursor-pointer"
                onClick={() => handleViewDetails(org)}
              >
                <td className="py-4 pl-4">
                  <input
                    type="checkbox"
                    checked={selectedOrgs.includes(org.id)}
                    onChange={(e) => handleSelectOrg(org.id, e)}
                    className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                  />
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-primary-400" />
                    <div>
                      <p className="text-gray-200 font-medium">{org.organization_name}</p>
                      <p className="text-sm text-gray-400">{org.org_email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className="capitalize text-gray-300">{org.org_type}</span>
                </td>
                <td className="py-4 text-gray-300">{org.usersCount}</td>
                <td className="py-4 text-gray-300">{org.labsCount}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    org.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                    org.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {org.status}
                  </span>
                </td>
                <td className="py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                    {org.subscriptionTier}
                  </span>
                </td>
                <td className="py-4 text-gray-400">
                  {org.lastActive}
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(org);
                      }}
                      className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary-400" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={(e) => toggleDropdown(org.id, e)}
                        className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
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
  );
};