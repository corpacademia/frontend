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
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
useEffect(() => {
  const getUserDetails = async () => {
    const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile', {
      withCredentials: true,
    });
  if (!response.data.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length < 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

    }
    getUserDetails();
}, []);

  // const location = useLocation();

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  // if (allowedRoles.length < 0 && user && !allowedRoles.includes(user.role)) {
  //   return <Navigate to="/unauthorized" replace />;
  // }

  return <>{children}</>;
};