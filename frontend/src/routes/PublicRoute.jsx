import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/Loading/LoadingSpinner';

const PublicRoute = ({ children, restricted = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If route is restricted (like login/register) and user is authenticated, redirect to dashboard
  if (restricted && isAuthenticated) {
    // Redirect to appropriate dashboard based on user role
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user?.role === 'institute') return <Navigate to="/institute/dashboard" replace />;
    if (user?.role === 'company') return <Navigate to="/company/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;