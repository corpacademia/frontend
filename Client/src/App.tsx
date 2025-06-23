
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './routes';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';
import { useSessionExpiry } from './hooks/useSessionExpiry';

const AppContent: React.FC = () => {
  const { isSessionExpired, closeSessionExpiredModal } = useSessionExpiry();

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
