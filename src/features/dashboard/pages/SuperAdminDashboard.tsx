import React from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { MetricsGrid } from '../components/metrics/MetricsGrid';
import { RecentActivity } from '../components/activity/RecentActivity';
import { RecentOrganizations } from '../components/tables/RecentOrganizations';
import { RecentUsers } from '../components/tables/RecentUsers';

export const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">
          <GradientText>Super Admin Dashboard</GradientText>
        </h1>
      </div>

      <MetricsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <RecentOrganizations />
      </div>

      <RecentUsers />
    </div>
  );
};