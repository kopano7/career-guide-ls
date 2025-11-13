import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/common/Loading/LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, token, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute Debug:', { 
    loading, 
    token: token ? 'Exists' : 'Missing',
    user: user ? `${user.email} (${user.role})` : 'No user',
    isAuthenticated, // This might be computed incorrectly
    requiredRole,
    path: location.pathname
  });

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  // SIMPLE CHECK: If token exists, user is authenticated
  const hasValidAuth = !!token;
  
  if (!hasValidAuth) {
    console.log(' ProtectedRoute: No valid token, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log(` ProtectedRoute: Role mismatch. User: ${user?.role}, Required: ${requiredRole}`);
    
    let redirectPath = '/dashboard';
    switch (user?.role) {
      case 'admin': redirectPath = '/admin/dashboard'; break;
      case 'student': redirectPath = '/student/dashboard'; break;
      case 'institute': redirectPath = '/institute/dashboard'; break;
      case 'company': redirectPath = '/company/dashboard'; break;
      default: redirectPath = '/login';
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  console.log(' ProtectedRoute: Access granted');
  return children;
};

export default ProtectedRoute;
