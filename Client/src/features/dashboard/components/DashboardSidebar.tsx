import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ChevronRight,
  CreditCard,
  ShoppingBag,
  LucideIcon,
  Package,
} from 'lucide-react';

interface DashboardSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  isMobile?: boolean;
}

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, isCollapsed }) => (
  <NavLink
    key={path}
    to={path}
    end
    className={({ isActive }) =>
      `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
        ? 'bg-primary-500/10 text-primary-400'
        : 'text-gray-400 hover:bg-dark-100/50 hover:text-primary-300'
      } ${isCollapsed ? 'justify-center' : ''}`
    }
    title={label}
  >
    <Icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
    {!isCollapsed && <span className="truncate">{label}</span>}
  </NavLink>
);


export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
  isMobile = false,
}) => {
  const { user } = useAuthStore();
  const location = useLocation();

  const menuItems = {
    superadmin: [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
      { icon: Building2, label: 'Organizations', path: '/dashboard/organizations' },
      { icon: Users, label: 'Users', path: '/dashboard/users' },
      { icon: Users, label: 'Batches', path: '/dashboard/batches' },
      { icon: BookOpen, label: 'Labs', path: '/dashboard/labs' },
      { icon: FolderOpen, label: 'Workspaces', path: '/dashboard/labs/workspace' },
      { icon: BookOpen, label: 'Lab Catalogue', path: '/dashboard/labs/catalogue' },
      { icon: ShoppingBag, label: 'Catalogue Purchases', path: '/dashboard/catalogue-purchases' },
      { icon: Package, label: 'Subscriptions', path: '/dashboard/subscriptions' },
      { icon: Cloud, label: 'Cloud Resources', path: '/dashboard/cloud' },
      { icon: Cloud, label: 'Cloud Settings', path: '/dashboard/cloud-settings' },
      { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
      { icon: Settings, label: 'Settings', path: '/dashboard/settings' }
    ],
    orgsuperadmin: [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
      { icon: Building2, label: 'My Organization', path: '/dashboard/my-organization' },
      { icon: Users, label: 'Lab Admins', path: '/dashboard/org-admins' },
      { icon: Users, label: 'All Users', path: '/dashboard/all-users' },
      { icon: Users, label: 'Batches', path: '/dashboard/batches' },
      { icon: BookOpen, label: 'Labs', path: '/dashboard/labs' },
      { icon: FolderOpen, label: 'Workspaces', path: '/dashboard/labs/workspace' },
      { icon: BookOpen, label: 'Lab Catalogue', path: '/dashboard/labs/catalogue' },
      { icon: ShoppingBag, label: 'My Purchases', path: '/dashboard/my-purchases' },
      { icon: CreditCard, label: 'Billing & Plans', path: '/dashboard/billing' },
      { icon: Award, label: 'Assessments', path: '/dashboard/assessments' },
      { icon: Brain, label: 'AI Lab Builder', path: '/dashboard/lab-builder' },
      { icon: Cloud, label: 'Cloud Settings', path: '/dashboard/cloud-settings' },
      { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
      { icon: Settings, label: 'Organization Settings', path: '/dashboard/org-settings' }
    ],
    labadmin: [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
      { icon: Users, label: 'Team', path: '/dashboard/team' },
      { icon: Users, label: 'Batches', path: '/dashboard/batches' },
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
      { icon: Users, label: 'Batches', path: '/dashboard/batches' },
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
      { icon: Cloud, label: 'Cloud Usage', path: '/dashboard/cloud-usage' },
      { icon: CreditCard, label: 'Purchase History', path: '/purchase-history' }
    ]
  };

  const currentMenuItems = menuItems[user?.role || 'user'] || menuItems.user;

  // On mobile the sidebar is always "expanded" (never icon-only)
  const collapsed = isMobile ? false : isCollapsed;

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-dark-200 border-r border-dark-300
        transition-all duration-300 z-50 flex flex-col
        ${isMobile
          ? `w-72 shadow-2xl shadow-black/50 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `${collapsed ? 'w-16' : 'w-64'} translate-x-0`
        }`}
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-300">
        {!collapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent whitespace-nowrap">
            GoLabing.ai
          </span>
        )}
        {/* Mobile: close chevron; Desktop: collapse/expand */}
        {isMobile ? (
          <button
            onClick={() => setIsMobileOpen?.(false)}
            className="p-2 bg-primary-500/20 border border-primary-400/50 rounded-lg hover:bg-primary-500/30 transition-all ml-auto"
            title="Close menu"
          >
            <ChevronLeft className="h-4 w-4 text-primary-400" />
          </button>
        ) : (
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
        )}
      </div>

      <nav className="flex-1 overflow-y-auto mt-4 px-2 pb-6 scrollbar-none scroll-fade-bottom">
        <div className="space-y-1">
          {currentMenuItems.map((item) => {
            if (item.label === 'Lab Catalogue') {
              const isLabCatalogueRoute = location.pathname.startsWith('/dashboard/labs/catalogue');
              if (['superadmin', 'orgsuperadmin', 'labadmin', 'trainer', 'user'].includes(user?.role || '')) {
                return (
                  <SidebarItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    path={item.path}
                    isActive={isLabCatalogueRoute}
                    isCollapsed={collapsed}
                  />
                );
              }
              return null;
            }
            return (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={location.pathname === item.path}
                isCollapsed={collapsed}
              />
            );
          })}
        </div>
      </nav>
    </aside>
  );
};