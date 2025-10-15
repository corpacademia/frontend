
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-primary-500/20 via-primary-500/5 to-transparent blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-secondary-500/20 via-secondary-500/5 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-accent-500/15 via-accent-500/5 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <DashboardHeader />
      <div className="flex pt-16 relative z-10">
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
