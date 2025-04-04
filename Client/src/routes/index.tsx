import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { SignupForm } from '../features/auth/components/SignupForm';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { SuperAdminDashboard } from '../features/dashboard/pages/SuperAdminDashboard';
import { Overview } from '../features/dashboard/pages/Overview';
import { Organizations } from '../features/organizations/pages/Organizations';
import { OrganizationOverview } from '../features/organizations/pages/OrganizationOverview';
import { UsersPage } from '../features/users/pages/UsersPage';
import { UserProfilePage } from '../features/users/pages/UserProfilePage';
import { LabsPage } from '../features/labs/pages/LabsPage';
import { CataloguePage } from '../features/labs/pages/CataloguePage';
import { OrgAdminCataloguePage } from '../features/labs/pages/OrgAdminCataloguePage';
import { AdminCloudVMsPage } from '../features/labs/pages/admin/CloudVMsPage';
import { OrgAdminCloudVMsPage } from '../features/labs/pages/orgadmin/CloudVMsPage';
import { CreateLabEnvironment } from '../features/labs/pages/CreateLabEnvironment';
import { CloudResources } from '../features/dashboard/pages/CloudResources';
import { Settings } from '../features/dashboard/pages/Settings';
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { MyLabs } from '../features/dashboard/pages/MyLabs';
import { Assessments } from '../features/dashboard/pages/Assessments';
import { Team } from '../features/dashboard/pages/Team';
import { WorkspacePage } from '../features/labs/pages/WorkspacePage';
import { WorkspaceViewPage } from '../features/labs/pages/WorkspaceViewPage';
import { WorkspaceEditPage } from '../features/labs/pages/WorkspaceEditPage';
import { useAuthStore } from '../store/authStore';

// Placeholder for the CreateModules component
const CreateModules = () => (
  <div className="p-6">
    <h1 className="text-3xl font-display font-bold mb-6 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
      Create Lab Modules
    </h1>
    <div className="glass-panel">
      <p className="text-gray-300 mb-4">
        This page allows you to create structured learning modules for your lab.
      </p>
      <p className="text-gray-400">
        You can define step-by-step instructions, add resources, and create assessments for each module.
      </p>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="organizations" element={<Organizations />} />
        <Route path="organizations/:orgId" element={<OrganizationOverview />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:userId" element={<UserProfilePage />} />
        <Route path="user/:userId" element={<UserProfilePage />} />
        <Route path="team" element={<Team />} />
        <Route path="team/:userId" element={<UserProfilePage />} />
        <Route path="trainer/:userId" element={<UserProfilePage />} />
        <Route path="trainers/:userId" element={<UserProfilePage />} />
        <Route path="organization-user/:userId" element={<UserProfilePage />} />
        <Route path="organization-users/:userId" element={<UserProfilePage />} />
        <Route path="labs" element={<LabsPage />} />
        <Route path="labs/workspace" element={<WorkspacePage />} />
        <Route path="labs/workspace/:workspaceId" element={<WorkspaceViewPage />} />
        <Route path="labs/workspace/:workspaceId/edit" element={<WorkspaceEditPage />} />
        <Route 
          path="labs/catalogue" 
          element={user?.role === 'orgadmin' ? <OrgAdminCataloguePage /> : <CataloguePage />} 
        />
        <Route 
          path="labs/cloud-vms" 
          element={user?.role === 'superadmin' ? <AdminCloudVMsPage /> : <OrgAdminCloudVMsPage />} 
        />
        <Route path="labs/create" element={<CreateLabEnvironment />} />
        <Route path="cloud" element={<CloudResources />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="assessments" element={<Assessments />} />
        <Route path="my-labs" element={<MyLabs />} />
        <Route path="create-modules" element={<CreateModules />} />
      </Route>

      <Route path="/" element={<LoginForm />} />
    </Routes>
  );
};