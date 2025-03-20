import React from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Building2, MoreVertical } from 'lucide-react';

const mockOrganizations = [
  { id: 1, name: 'TechCorp Labs', users: 150, labs: 45, status: 'active' },
  { id: 2, name: 'EduTech Solutions', users: 89, labs: 32, status: 'active' },
  { id: 3, name: 'Cloud Academy', users: 234, labs: 67, status: 'active' },
  { id: 4, name: 'DevOps Institute', users: 178, labs: 54, status: 'pending' },
];

export const RecentOrganizations: React.FC = () => {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          <GradientText>Recent Organizations</GradientText>
        </h2>
        <Building2 className="h-5 w-5 text-primary-400" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400">
              <th className="pb-4">Organization</th>
              <th className="pb-4">Users</th>
              <th className="pb-4">Labs</th>
              <th className="pb-4">Status</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {mockOrganizations.map((org) => (
              <tr key={org.id} className="border-t border-primary-500/10">
                <td className="py-4">{org.name}</td>
                <td className="py-4">{org.users}</td>
                <td className="py-4">{org.labs}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    org.status === 'active' 
                      ? 'bg-primary-500/20 text-primary-300'
                      : 'bg-accent-500/20 text-accent-300'
                  }`}>
                    {org.status}
                  </span>
                </td>
                <td className="py-4">
                  <button className="p-1 hover:bg-dark-300/50 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};