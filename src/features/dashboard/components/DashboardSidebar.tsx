import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Award,
  Cloud,
  Settings,
  Building2,
  GraduationCap,
  Brain,
  FileText,
  FolderOpen
} from 'lucide-react';

export const DashboardSidebar: React.FC = () => {
  const { user } = useAuthStore();

  const menuItems = {
    superadmin: [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
      { icon: Building2, label: 'Organizations', path: '/dashboard/organizations' },
      { icon: Users, label: 'Users', path: '/dashboard/users' },
      { icon: BookOpen, label: 'Labs', path: '/dashboard/labs' },
      { icon: FolderOpen, label: 'Workspaces', path: '/dashboard/labs/workspace' },
      { icon: BookOpen, label: 'Lab Catalogue', path: '/dashboard/labs/catalogue' },
      { icon: Cloud, label: 'Cloud Resources', path: '/dashboard/cloud' },
      { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
      { icon: Settings, label: 'Settings', path: '/dashboard/settings' }
    ],
    orgadmin: [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
      { icon: Users, label: 'Team', path: '/dashboard/team' },
      { icon: BookOpen, label: 'Labs', path: '/dashboard/labs' },
      { icon: FolderOpen, label: 'Workspaces', path: '/dashboard/labs/workspace' },
      { icon: BookOpen, label: 'Lab Catalogue', path: '/dashboard/labs/catalogue' },
      { icon: Award, label: 'Assessments', path: '/dashboard/assessments' },
      { icon: Brain, label: 'AI Lab Builder', path: '/dashboard/lab-builder' },
      { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
      { icon: Settings, label: 'Organization', path: '/dashboard/organization' }
    ],
    trainer: [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
      { icon: Users, label: 'Students', path: '/dashboard/students' },
      { icon: BookOpen, label: 'Labs', path: '/dashboard/labs' },
      { icon: BookOpen, label: 'Lab Catalogue', path: '/dashboard/labs/catalogue' },
      { icon: Award, label: 'Assessments', path: '/dashboard/assessments' },
      { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
      { icon: GraduationCap, label: 'Progress', path: '/dashboard/progress' }
    ],
    user: [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
      { icon: BookOpen, label: 'My Labs', path: '/dashboard/my-labs' },
      { icon: BookOpen, label: 'Lab Catalogue', path: '/dashboard/labs/catalogue' },
      { icon: Brain, label: 'Learning Path', path: '/dashboard/learning-path' },
      { icon: Award, label: 'Assessments', path: '/dashboard/assessments' },
      { icon: Cloud, label: 'Cloud Usage', path: '/dashboard/cloud-usage' }
    ]
  };

  const currentMenuItems = menuItems[user?.role || 'user'];

  return (
    <div className="w-64 bg-dark-200/80 backdrop-blur-sm border-r border-primary-500/10 h-[calc(100vh-4rem)]">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {currentMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-gray-400 hover:bg-dark-100/50 hover:text-primary-300'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};