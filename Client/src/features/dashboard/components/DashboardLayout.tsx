
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';

export const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  
  // Check if current route is catalogue page
  const isCataloguePage = location.pathname.includes('/dashboard/labs/catalogue');

  return (
    <div className="min-h-screen neural-bg">
      <DashboardHeader />
      <div className="flex pt-16">
        <DashboardSidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
        />
        <main className={`flex-1 transition-all duration-300 ${
          isCataloguePage 
            ? isSidebarCollapsed ?' ml-16' : ' ml-64' 
            : `p-6 pt-6 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`
        }`}>
          {!isCataloguePage && (
            <div className="pb-6">
              <Outlet />
            </div>
          )}
          {isCataloguePage && <Outlet />}
        </main>
      </div>
    </div>
  );
};
