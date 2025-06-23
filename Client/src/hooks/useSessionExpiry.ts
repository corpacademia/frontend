import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

export const useSessionExpiry = () => {
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const location = useLocation();

  const handleSessionExpiry = useCallback(() => {
    // Don't show modal if user is already on login or signup page
    const isOnAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';
    if (!isOnAuthPage) {
      setIsSessionExpired(true);
    }
    setIsSessionExpired(true);
  }, [location.pathname]);

  useEffect(() => {
    // Add axios interceptor for immediate detection of token expiry
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Check if this is a 401/403 error indicating session expiry
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Only show modal if it's not already shown
          if (!isSessionExpired) {
            handleSessionExpiry();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [handleSessionExpiry, isSessionExpired]);

  const closeSessionExpiredModal = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  return {
    isSessionExpired,
    closeSessionExpiredModal,
  };
};