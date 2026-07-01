import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { OrgUsersTab } from './tabs/OrgUsersTab';
import { Organization } from '../types';

interface OrganizationsUsersTabProps {
  organizations: Organization[];
  userOrgId?: string;
  isSuperAdmin: boolean;
}

export const OrganizationsUsersTab: React.FC<OrganizationsUsersTabProps> = ({
  organizations,
  userOrgId,
  isSuperAdmin,
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    isSuperAdmin ? (organizations[0]?.id || '') : (userOrgId || '')
  );

  if (!isSuperAdmin) {
    if (!userOrgId) {
      return (
        <div className="flex items-center justify-center h-40 text-gray-400">
          No organization assigned to your account.
        </div>
      );
    }
    return <OrgUsersTab orgId={userOrgId} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex items-center gap-3 flex-shrink-0">
        <Building2 className="h-4 w-4 text-primary-400 flex-shrink-0" />
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="flex-1 max-w-xs px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-primary-500/50"
        >
          {organizations.length === 0 && (
            <option value="">No organizations available</option>
          )}
          {organizations.map((org: any) => (
            <option key={org.id || org.org_id} value={org.id || org.org_id}>
              {org.organization_name || org.name}
            </option>
          ))}
        </select>
      </div>

      {selectedOrgId ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <OrgUsersTab orgId={selectedOrgId} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-gray-400">
          Select an organization to view its users.
        </div>
      )}
    </div>
  );
};
