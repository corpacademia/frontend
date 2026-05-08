
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';

export const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const isCataloguePage = location.pathname.includes('/dashboard/labs/catalogue');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
        setIsMobileOpen(false);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    if (isMobile) setIsMobileOpen(false);
  }, [location.pathname, isMobile]);

  // Desktop only: main content offset matches sidebar width; mobile: no offset (drawer overlays)
  const mainMargin = isMobile
    ? ''
    : isSidebarCollapsed
      ? 'lg:ml-16'
      : 'lg:ml-64';

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Neural Pattern Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="absolute inset-0 bg-neural-pattern"></div>
      </div>

      {/* Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-primary-500/20 via-primary-500/5 to-transparent blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-secondary-500/20 via-secondary-500/5 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-accent-500/15 via-accent-500/5 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <DashboardHeader onMenuClick={() => setIsMobileOpen(true)} />

      {/* Mobile backdrop — closes drawer on tap */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar — z-50, always renders on top when open */}
      <DashboardSidebar
        isCollapsed={isMobile ? false : isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isMobile={isMobile}
      />

      {/* Main content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${isCataloguePage
            ? mainMargin
            : `p-4 sm:p-6 pt-20 sm:pt-24 ${mainMargin}`
          }`}
      >
        {!isCataloguePage && (
          <div className="pb-6">
            <Outlet />
          </div>
        )}
        {isCataloguePage && <Outlet />}
      </main>
    </div>
  );
};
