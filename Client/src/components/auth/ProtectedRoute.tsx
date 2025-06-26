import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';
import { useEffect } from 'react';
import { get } from 'http';
import axios from 'axios';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
}) => {
  const { isAuthenticated, user, fetchUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Try to fetch user details if not authenticated
    if (!isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};