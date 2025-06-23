
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const useSessionExpiry = () => {
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const { user, logout } = useAuthStore();

  const handleSessionExpiry = useCallback(() => {
    if (user && !isSessionExpired) {
      setIsSessionExpired(true);
      logout();
    }
  }, [user, logout, isSessionExpired]);

  const checkSession = useCallback(async () => {
    if (!user) return;

    try {
      await axios.get('http://localhost:3000/api/v1/user_ms/user_profile', {
        withCredentials: true,
        timeout: 10000, // 10 second timeout
      });
    } catch (error: any) {
      console.log('Session check error:', error.response?.status);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleSessionExpiry();
      }
    }
  }, [user, handleSessionExpiry]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let interceptorId: number;

    if (user) {
      // Check session immediately when user changes
      checkSession();

      // Check session every 2 minutes instead of 5
      intervalId = setInterval(checkSession, 2 * 60 * 1000);
      
      // Add axios interceptor for immediate detection
      interceptorId = axios.interceptors.response.use(
        (response) => response,
        (error) => {
          console.log('Axios interceptor error:', error.response?.status);
          if (error.response?.status === 401 || error.response?.status === 403) {
            // Check if this is not a login attempt
            if (!error.config?.url?.includes('/login') && user) {
              handleSessionExpiry();
            }
          }
          return Promise.reject(error);
        }
      );
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (interceptorId) {
        axios.interceptors.response.eject(interceptorId);
      }
    };
  }, [user, checkSession, handleSessionExpiry]);

  const closeSessionExpiredModal = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  return {
    isSessionExpired,
    closeSessionExpiredModal
  };
};
