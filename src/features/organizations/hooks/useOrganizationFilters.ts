import { useState, useCallback } from 'react';
import { Organization, OrganizationFilters } from '../types';

export const useOrganizationFilters = (organizations: Organization[]) => {
  const [filters, setFilters] = useState<OrganizationFilters>({});

  const filterOrganizations = useCallback((orgs: Organization[]) => {



    return orgs.filter(org => {
      // Search filter
      if (filters.search && !org.organization_name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !org.org_email.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type && org.org_type !== filters.type) {
        return false;
      }

      // Status filter
      if (filters.status && org.status !== filters.status) {
        return false;
      }

      // Subscription tier filter
      if (filters.subscriptionTier && org.subscriptionTier !== filters.subscriptionTier) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const orgDate = new Date(org.createdAt);
        if (orgDate < start || orgDate > end) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<OrganizationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    filters,
    filterOrganizations,
    handleFilterChange
  };
};