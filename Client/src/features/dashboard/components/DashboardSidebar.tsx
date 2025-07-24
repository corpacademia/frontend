import React, { useState } from 'react';
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
  FolderOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DashboardSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
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
    orgsuperadmin: [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
      { icon: Building2, label: 'My Organization', path: '/dashboard/my-organization' },
      { icon: Users, label: 'Organization Admins', path: '/dashboard/org-admins' },
      { icon: Users, label: 'All Users', path: '/dashboard/all-users' },
      { icon: BookOpen, label: 'Labs', path: '/dashboard/labs' },
      { icon: FolderOpen, label: 'Workspaces', path: '/dashboard/labs/workspace' },
      { icon: BookOpen, label: 'Lab Catalogue', path: '/dashboard/labs/org-catalogue' },
      { icon: Award, label: 'Assessments', path: '/dashboard/assessments' },
      { icon: Brain, label: 'AI Lab Builder', path: '/dashboard/lab-builder' },
      { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
      { icon: Settings, label: 'Organization Settings', path: '/dashboard/org-settings' }
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
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-dark-200 border-r border-dark-300 transition-all duration-300 z-30 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Toggle button - positioned at the top of sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-dark-300">
        {!isCollapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            GoLabing.ai
          </span>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 bg-primary-500/20 border border-primary-400/50 rounded-lg shadow-md hover:bg-primary-500/30 hover:scale-105 transition-all duration-200"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-primary-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-primary-400" />
          )}
        </button>
      </div>

      <nav className="mt-5 px-2 overflow-y-auto h-full">
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
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
};