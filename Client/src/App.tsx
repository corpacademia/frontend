import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginForm } from './features/auth/components/LoginForm';
import { SignupForm } from './features/auth/components/SignupForm';
import { DashboardLayout } from './features/dashboard/components/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';
import { useSessionExpiry } from './hooks/useSessionExpiry';
import { Overview } from './features/dashboard/pages/Overview';
import { Users } from './features/dashboard/pages/Users';
import { Organizations } from './features/dashboard/pages/Organizations';
import { Settings } from './features/dashboard/pages/Settings';
import { Labs } from './features/dashboard/pages/Labs';
import { MyLabs } from './features/dashboard/pages/MyLabs';
import { LabBuilder } from './features/dashboard/pages/LabBuilder';
import { CloudResources } from './features/dashboard/pages/CloudResources';
import { CloudUsage } from './features/dashboard/pages/CloudUsage';
import { LearningPath } from './features/dashboard/pages/LearningPath';
import { Progress } from './features/dashboard/pages/Progress';
import { Assessments } from './features/dashboard/pages/Assessments';
import { Students } from './features/dashboard/pages/Students';
import { Team } from './features/dashboard/pages/Team';
import { SuperAdminDashboard } from './features/dashboard/pages/SuperAdminDashboard';
import { UsersPage } from './features/users/pages/UsersPage';
import { UserProfilePage } from './features/users/pages/UserProfilePage';
import { OrganizationOverview } from './features/organizations/pages/OrganizationOverview';
import { OrganizationsPage } from './features/organizations/pages/Organizations';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import { LabsPage } from './features/labs/pages/LabsPage';
import { CataloguePage } from './features/labs/pages/CataloguePage';
import { OrgAdminCataloguePage } from './features/labs/pages/OrgAdminCataloguePage';
import { CloudVMsPage } from './features/labs/pages/CloudVMsPage';
import { WorkspacePage } from './features/labs/pages/WorkspacePage';
import { WorkspaceViewPage } from './features/labs/pages/WorkspaceViewPage';
import { WorkspaceEditPage } from './features/labs/pages/WorkspaceEditPage';
import { CloudVMPage } from './features/labs/pages/CloudVMPage';
import { CloudSlicePage } from './features/labs/pages/CloudSlicePage';
import { CloudSliceLabPage } from './features/labs/pages/CloudSliceLabPage';
import { CloudSliceModulesPage } from './features/labs/pages/CloudSliceModulesPage';
import { ClusterPage } from './features/labs/pages/ClusterPage';
import { DedicatedVMPage } from './features/labs/pages/DedicatedVMPage';
import { EmulatorPage } from './features/labs/pages/EmulatorPage';
import { CreateLabEnvironment } from './features/labs/pages/CreateLabEnvironment';
import { CreateModulesPage } from './features/labs/pages/CreateModulesPage';
import { VMSessionPage } from './features/labs/components/VMSessionPage';
import { CloudVMsPage as AdminCloudVMsPage } from './features/labs/pages/admin/CloudVMsPage';
import { CloudVMsPage as OrgAdminCloudVMsPage } from './features/labs/pages/orgadmin/CloudVMsPage';
import './styles/globals.css';

function App() {
  const { isSessionExpired, closeSessionExpiredModal } = useSessionExpiry();

  return (
    <Router>
      <div className="min-h-screen bg-dark-100">
        <SessionExpiredModal 
          isOpen={isSessionExpired} 
          onClose={closeSessionExpiredModal} 
        />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<LoginForm />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;