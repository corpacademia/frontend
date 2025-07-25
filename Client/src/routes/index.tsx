import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { SignupEmailForm } from '../features/auth/components/SignupEmailForm';
import { SignupForm } from '../features/auth/components/SignupForm';
import { EmailVerificationPage } from '../features/auth/components/EmailVerificationPage';
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
import { PublicCataloguePage } from '../features/labs/components/catalogue/PublicCataloguePage';
import { OrgAdminCataloguePage } from '../features/labs/pages/OrgAdminCataloguePage';
import { AdminCloudVMsPage } from '../features/labs/pages/admin/CloudVMsPage';
import { OrgAdminCloudVMsPage } from '../features/labs/pages/orgadmin/CloudVMsPage';
import { CloudSlicePage } from '../features/labs/pages/CloudSlicePage';
import { CloudSliceLabPage } from '../features/labs/pages/CloudSliceLabPage';
import { CloudSliceModulesPage } from '../features/labs/pages/CloudSliceModulesPage';
import { ClusterPage } from '../features/labs/pages/ClusterPage';
import { CreateLabEnvironment } from '../features/labs/pages/CreateLabEnvironment';
import { CreateModulesPage } from '../features/labs/pages/CreateModulesPage';
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
import { StandardLabPage } from '../features/labs/components/user/StandardLabPage';
import { ModularLabPage } from '../features/labs/components/user/ModularLabPage';
import { LabExercisePage } from '../features/labs/components/user/LabExercisePage';
import { QuizExercisePage } from '../features/labs/components/user/QuizExercisePage';
import { VMSessionPage } from '../features/labs/components/VMSessionPage';
import { ProfilePage } from '../pages/ProfilePage';
import { OrgAdminsPage } from '../features/dashboard/pages/OrgAdminsPage';
import { AllUsersPage } from '../features/dashboard/pages/AllUsersPage';
import { OrgSuperAdminCataloguePage } from '../features/labs/pages/OrgSuperAdminCataloguePage';
import { PrivateRoute } from '../components/auth/PrivateRoute';


export const AppRoutes: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupEmailForm />} />
      <Route path="/signupprofile" element={<SignupForm />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Super Admin Routes */}

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
          element={<PublicCataloguePage />} 
        />
        <Route path="labs/org-catalogue" element={
          <PrivateRoute allowedRoles={['orgsuperadmin']}>
            <OrgSuperAdminCataloguePage />
          </PrivateRoute>
        } />
        <Route 
          path="labs/cloud-vms" 
          element={user?.role === 'superadmin' || user?.role === 'orgsuperadmin' ? <AdminCloudVMsPage /> : <OrgAdminCloudVMsPage />} 
        />
        <Route path="labs/cloud-slices" element={<CloudSlicePage />} />
        <Route path="labs/cloud-slices/:sliceId/lab" element={<CloudSliceLabPage />} />
        <Route path="labs/cloud-slices/:sliceId/modules" element={<CloudSliceModulesPage />} />
        <Route path="labs/cluster" element={<ClusterPage />} />
        <Route path="labs/create" element={<CreateLabEnvironment />} />
        <Route path="labs/vm-session/:vmId" element={<VMSessionPage />} />
        <Route path="cloud" element={<CloudResources />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="assessments" element={<Assessments />} />
        <Route path="my-labs" element={<MyLabs />} />
        <Route path="create-modules" element={<CreateModulesPage />} />
        <Route path="org-admins" element={<OrgAdminsPage />} />
        <Route path="all-users" element={<AllUsersPage />} />
        <Route path="my-organization" element={<Organizations />} />

        {/* User Lab Routes */}
        <Route path="my-labs/:labId/standard" element={<StandardLabPage />} />
        <Route path="my-labs/:labId/modules" element={<ModularLabPage />} />
        <Route path="my-labs/:labId/exercise/:exerciseId" element={<LabExercisePage />} />
        <Route path="my-labs/:labId/quiz/:exerciseId" element={<QuizExercisePage />} />
      </Route>

      <Route path="/" element={<PublicCataloguePage />} />
    </Routes>
  );
};