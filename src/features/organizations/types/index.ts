export interface Organization {
  id: string;
  name: string;
  type: 'training' | 'enterprise' | 'education';
  status: 'active' | 'pending' | 'suspended';
  contactEmail: string;
  usersCount: number;
  labsCount: number;
  subscriptionTier: 'basic' | 'professional' | 'enterprise';
  createdAt: Date;
  lastActive: Date;
}

export interface OrganizationFilters {
  search?: string;
  type?: Organization['type'];
  status?: Organization['status'];
  subscriptionTier?: Organization['subscriptionTier'];
  dateRange?: [Date, Date];
}