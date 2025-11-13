
import React, { useState } from 'react';
import { Organization } from '../types';
import { MoreVertical, Pencil, Trash2, ExternalLink, AlertCircle, Check, Loader, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import axios from 'axios';
import { Building2 } from 'lucide-react';
import { formatDate } from '../../../utils/date';
import { GradientText } from '../../../components/ui/GradientText';

interface OrganizationListProps {
  organizations: Organization[];
  onViewDetails: (org: Organization) => void;
  onOrganizationUpdate?: () => void;
}

interface ApproveRejectModalProps {
  isOpen: boolean;
  organization: Organization | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ApproveRejectModal: React.FC<ApproveRejectModalProps> = ({ isOpen, organization, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!organization) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/approve`, {
        orgId: organization.id,
        action
      });

      if (response.data.success) {
        setSuccess(`Organization ${action}d successfully`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || `Failed to ${action} organization`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} organization`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !organization) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-lg w-full max-w-md">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Approve or Reject Organization
          </h3>

          <div className="mb-6 p-3 sm:p-4 bg-dark-400/50 rounded-lg border border-primary-500/20">
            <div className="flex items-center space-x-3 mb-2">
              <Building2 className="h-5 w-5 text-primary-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-gray-200 font-medium text-sm sm:text-base truncate">{organization.organization_name}</p>
                <p className="text-xs sm:text-sm text-gray-400 truncate">{organization.org_email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="text-gray-300 capitalize">{organization.org_type}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="text-amber-300">Pending</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm flex items-start">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                <span className="text-emerald-200 text-xs sm:text-sm">{success}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleAction('approve')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Approve</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <>
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Reject</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-dark-400/50 hover:bg-dark-300 text-gray-300 rounded-lg transition-colors text-sm sm:text-base disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OrganizationList: React.FC<OrganizationListProps> = ({
  organizations,
  onViewDetails,
  onOrganizationUpdate,
}) => {
  const navigate = useNavigate();
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [approveRejectModal, setApproveRejectModal] = useState<{ isOpen: boolean; organization: Organization | null }>({
    isOpen: false,
    organization: null,
  });
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

  const isLastRow = (orgId: string) => {
    const index = organizations.findIndex(org => org.id === orgId);
    return index >= organizations.length - 2;
  };

  const handleEdit = (org: Organization, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/organizations/${org.id}`);
    setActiveDropdown(null);
  };

  const handleApproveReject = (org: Organization, e: React.MouseEvent) => {
    e.stopPropagation();
    setApproveRejectModal({ isOpen: true, organization: org });
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
      setTimeout(() => {
         setError(null);
        }, 1500);
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
    <>
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

        {/* Mobile Card View */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary-500/20 scrollbar-track-dark-300 block lg:hidden">
          <div className="p-3 sm:p-4 space-y-3 pb-24">
            {organizations.map((org) => (
              <div 
                key={org.id}
                className="bg-dark-400/50 rounded-lg p-3 sm:p-4 border border-primary-500/20 hover:border-primary-500/40 transition-colors cursor-pointer"
                onClick={() => handleViewDetails(org)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {!isOrgSuperAdmin && (
                      <input
                        type="checkbox"
                        checked={selectedOrgs.includes(org.id)}
                        onChange={(e) => handleSelectOrg(org.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-400 text-primary-500 focus:ring-primary-500 flex-shrink-0"
                      />
                    )}
                    <Building2 className="h-5 w-5 text-primary-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-200 font-medium text-sm truncate">{org.organization_name}</p>
                      <p className="text-xs text-gray-400 truncate">{org.org_email}</p>
                    </div>
                  </div>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => toggleDropdown(org.id, e)}
                      className="p-1.5 hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                    {activeDropdown === org.id && (
                      <div className={`absolute right-0 w-40 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50 ${isLastRow(org.id) ? 'bottom-full mb-2' : 'mt-2'}`}>
                        {org.status === 'pending' && (
                          <button
                            onClick={(e) => handleApproveReject(org, e)}
                            className="w-full px-3 py-2 text-left text-xs text-primary-400 hover:bg-primary-500/10 flex items-center space-x-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve/Reject</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleEdit(org, e)}
                          className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-primary-500/10 flex items-center space-x-2"
                        >
                          <Pencil className="h-4 w-4 text-primary-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete([org.id]);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Type</span>
                    <p className="text-gray-300 capitalize mt-0.5">{org.org_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status</span>
                    <div className="mt-0.5">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-block ${
                        org.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                        org.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {org.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Users</span>
                    <p className="text-gray-300 mt-0.5">{org.usersCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Labs</span>
                    <p className="text-gray-300 mt-0.5">{org.labsCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Subscription</span>
                    <div className="mt-0.5">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300 inline-block">
                        {org.subscriptionTier}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Active</span>
                    <p className="text-gray-300 mt-0.5">{org.lastActive}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(org);
                  }}
                  className="mt-3 w-full btn-secondary text-xs flex items-center justify-center text-gray-200"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-primary-500/20 scrollbar-track-dark-300 hidden lg:block">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden pb-32">
              <table className="w-full">
                <thead className="bg-dark-400/50 sticky top-0 z-10">
                  <tr className="text-left text-sm text-gray-400 border-b border-primary-500/20">
                    {!isOrgSuperAdmin && (
                      <th className="py-3 px-3 w-12">
                        <input
                          type="checkbox"
                          checked={organizations.length > 0 && selectedOrgs.length === organizations.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                        />
                      </th>
                    )}
                    <th className="py-3 px-3 whitespace-nowrap font-medium">Organization</th>
                    <th className="py-3 px-3 whitespace-nowrap font-medium">Type</th>
                    <th className="py-3 px-3 whitespace-nowrap font-medium">Users</th>
                    <th className="py-3 px-3 whitespace-nowrap font-medium">Labs</th>
                    <th className="py-3 px-3 whitespace-nowrap font-medium">Status</th>
                    <th className="py-3 px-3 whitespace-nowrap font-medium">Subscription</th>
                    <th className="py-3 px-3 whitespace-nowrap font-medium">Last Active</th>
                    <th className="py-3 px-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-primary-500/5">
                  {organizations.map((org) => (
                    <tr 
                      key={org.id} 
                      className="hover:bg-dark-400/30 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(org)}
                    >
                      {!isOrgSuperAdmin && (
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOrgs.includes(org.id)}
                            onChange={(e) => handleSelectOrg(org.id, e)}
                            className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                          />
                        </td>
                      )}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <Building2 className="h-5 w-5 text-primary-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-200 font-medium truncate">{org.organization_name}</p>
                            <p className="text-xs text-gray-400 truncate">{org.org_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize text-gray-300 whitespace-nowrap">{org.org_type}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-300">{org.usersCount}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-300">{org.labsCount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap inline-block ${
                          org.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                          org.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300 whitespace-nowrap inline-block">
                          {org.subscriptionTier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                        {org.lastActive}
                      </td>
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center space-x-1 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(org);
                            }}
                            className="p-1.5 hover:bg-primary-500/10 rounded-lg transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 text-primary-400" />
                          </button>
                          <div className="relative">
                            <button 
                              onClick={(e) => toggleDropdown(org.id, e)}
                              className="p-1.5 hover:bg-primary-500/10 rounded-lg transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </button>
                            {activeDropdown === org.id && (
                              <div className={`absolute right-0 w-48 bg-dark-200 rounded-lg shadow-lg border border-primary-500/20 z-50 ${isLastRow(org.id) ? 'bottom-full mb-2' : 'mt-2'}`}>
                                {org.status === 'pending' && (
                                  <button
                                    onClick={(e) => handleApproveReject(org, e)}
                                    className="w-full px-4 py-2 text-left text-sm text-primary-400 hover:bg-primary-500/10 flex items-center space-x-2"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Approve/Reject</span>
                                  </button>
                                )}
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
            <div className="p-4 border-t border-primary-500/10 flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0 bg-dark-400/50">
              <span className="text-sm text-gray-400">
                {selectedOrgs.length} organization(s) selected
              </span>
              <button
                onClick={() => handleDelete(selectedOrgs)}
                disabled={isDeleting}
                className="btn-secondary text-red-400 hover:text-red-300 text-sm w-full sm:w-auto"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Deleting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </span>
                )}
              </button>
            </div>
          )}
      </div>

      <ApproveRejectModal
        isOpen={approveRejectModal.isOpen}
        organization={approveRejectModal.organization}
        onClose={() => setApproveRejectModal({ isOpen: false, organization: null })}
        onSuccess={() => {
          onOrganizationUpdate?.();
          setApproveRejectModal({ isOpen: false, organization: null });
        }}
      />
    </>
  );
};
