import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './routes';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';
import { useSessionExpiry } from './hooks/useSessionExpiry';
import { initSocket,getSocket } from './store/socketService';
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';

const AppContent: React.FC = () => {
  const { isSessionExpired, closeSessionExpiredModal } = useSessionExpiry();
  const { user } = useAuthStore();
  const {addNotification} = useNotificationStore();

  useEffect(() => {
    if (!user) return;
      const socket = initSocket(user.id, user.org_id);
      
      socket.on("notification", (data) => {
        console.log(data)
        addNotification(data);
      });
   
  }, [user]);

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
