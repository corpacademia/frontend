import React from 'react';
import { User, Key, Briefcase, GraduationCap } from 'lucide-react';

interface DemoUser {
  email: string;
  role: string;
  icon: React.FC<{ className?: string }>;
}

const demoUsers: DemoUser[] = [
  { email: 'superadmin@golabing.ai', role: 'Super Admin', icon: Key },
  { email: 'orgadmin@golabing.ai', role: 'Organization Admin', icon: Briefcase },
  { email: 'trainer@golabing.ai', role: 'Trainer', icon: GraduationCap },
  { email: 'demo@golabing.ai', role: 'User', icon: User },
];

export const DemoUsers: React.FC = () => {
  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Demo Accounts</h3>
      <div className="space-y-2">
        {demoUsers.map((user) => (
          <div key={user.email} className="flex items-center space-x-3 text-sm p-2 rounded-lg bg-dark-300/50">
            <user.icon className="h-4 w-4 text-primary-400" />
            <div>
              <p className="text-gray-300">{user.email}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center space-x-3 text-sm p-2 rounded-lg bg-dark-300/50">
          <Key className="h-4 w-4 text-primary-400" />
          <div>
            <p className="text-gray-300">Password for all accounts:</p>
            <p className="text-xs text-gray-500">demo</p>
          </div>
        </div>
      </div>
    </div>
  );
};