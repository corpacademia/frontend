
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';

export const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen neural-bg">
      <DashboardHeader />
      <div className="flex pt-16">
        <DashboardSidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
        />
        <main className={`flex-1 p-6 pt-6 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="pb-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
