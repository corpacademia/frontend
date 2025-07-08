import React from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { Users, MoreVertical } from 'lucide-react';

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'orgadmin', organization: 'TechCorp Labs' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'trainer', organization: 'EduTech Solutions' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'user', organization: 'Cloud Academy' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'trainer', organization: 'DevOps Institute' },
];

export const RecentUsers: React.FC = () => {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          <GradientText>Recent Users</GradientText>
        </h2>
        <Users className="h-5 w-5 text-primary-400" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400">
              <th className="pb-4">Name</th>
              <th className="pb-4">Email</th>
              <th className="pb-4">Role</th>
              <th className="pb-4">Organization</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {mockUsers.map((user) => (
              <tr key={user.id} className="border-t border-primary-500/10">
                <td className="py-4">{user.name}</td>
                <td className="py-4">{user.email}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'orgadmin' ? 'bg-primary-500/20 text-primary-300' :
                    user.role === 'trainer' ? 'bg-accent-500/20 text-accent-300' :
                    'bg-secondary-500/20 text-secondary-300'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4">{user.organization}</td>
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