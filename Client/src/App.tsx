import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './routes';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';
import { useSessionExpiry } from './hooks/useSessionExpiry';
import { initSocket,getSocket } from './store/socketService';
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';
import { useBrandingStore } from './store/brandingStore';
import axios from 'axios';

const AppContent: React.FC = () => {
  const { isSessionExpired, closeSessionExpiredModal } = useSessionExpiry();
  const { user, isAuthenticated } = useAuthStore();
  const {addNotification} = useNotificationStore();
  const { setBrandingColors } = useBrandingStore();

  useEffect(() => {
    if (!user) return;
      const socket = initSocket(user.id, user.org_id);
      
      socket.on("notification", (data) => {
        addNotification(data);
      });
   
  }, [user]);

  // Load organization branding colors
  useEffect(() => {
    const loadBrandingColors = async () => {
      if (!isAuthenticated || !user?.org_id) return;
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgDetails`, {
          org_id: user.org_id
        });
        
        if (response.data.success) {
          const orgData = response.data.data;
          setBrandingColors(
            orgData.branding_primary_color,
            orgData.branding_secondary_color
          );
        }
      } catch (error) {
        console.error('Failed to fetch organization branding:', error);
      }
    };

    loadBrandingColors();
  }, [isAuthenticated, user?.org_id, setBrandingColors]);

  return (
    <>
      {isSessionExpired && (
        <SessionExpiredModal 
          isOpen={isSessionExpired} 
          onClose={closeSessionExpiredModal} 
        />
      )}
      <AppRoutes />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
