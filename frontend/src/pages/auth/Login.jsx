import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, user } = useAuth(); // Added user here for debug
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Add this function to determine where to redirect based on role
  const getRoleBasedRedirect = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'student':
        return '/student/dashboard';
      case 'institute':
        return '/institute/dashboard';
      case 'company':
        return '/company/dashboard';
      default:
        return '/dashboard';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      
      console.log('📥 Login result:', result);
      
      if (result.success) {
        console.log('Login successful, user role:', result.user.role);
        
        // Get role-based redirect path
        const redirectPath = getRoleBasedRedirect(result.user.role);
        console.log('Redirecting to:', redirectPath);
        
        showSuccess('Login Successful', `Welcome back, ${result.user.name || result.user.email}!`);
        navigate(redirectPath, { replace: true });
      } else {
        setErrors({ submit: result.error });
        showError('Login Failed', result.error);
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      showError('Login Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {/* DEBUG COMPONENT - ADDED HERE */}
        {user && (
          <div style={{ 
            background: '#e8f5e8', 
            padding: '15px', 
            margin: '15px 0', 
            borderRadius: '8px',
            border: '2px solid #10b981'
          }}>
            <strong style={{ color: '#065f46', fontSize: '16px' }}>DEBUG: User is logged in!</strong>
            <div style={{ marginTop: '8px', fontSize: '14px' }}>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> {user.role}</div>
              <div><strong>Collection:</strong> {user.collection}</div>
              <div><strong>Name:</strong> {user.name || 'N/A'}</div>
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Status:</strong> {user.status}</div>
            </div>
          </div>
        )}

        {/* MANUAL TEST BUTTON - ADDED HERE */}
        <button 
          type="button"
          onClick={() => {
            console.log(' MANUAL LOGIN TEST STARTED');
            login('kopanolejone7@gmail.com', 'xlxu erob upbn gcti')
              .then(result => {
                console.log(' Manual login result:', result);
                if (result.success) {
                  const redirectPath = getRoleBasedRedirect(result.user.role);
                  showSuccess('Manual Login Successful', `Welcome ${result.user.email}!`);
                  navigate(redirectPath, { replace: true });
                } else {
                  showError('Manual Login Failed', result.error);
                }
              })
              .catch(error => {
                console.error('🧪 Manual login error:', error);
                showError('Manual Login Error', error.message);
              });
          }}
          style={{
            background: '#ff6b6b',
            color: 'white',
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            margin: '15px 0',
            cursor: 'pointer',
            width: '100%',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
        <p>Follow that course you have been interested in.</p>
        <strong>Good Luck!</strong>
        </button>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              disabled={loading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              disabled={loading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-options">
            <Link to="/reset-password" className="forgot-password">
              Forgot your password?
            </Link>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" text="" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up here
            </Link>
          </p>
        </div>

        <div className="demo-accounts">
          <details>
            <summary>Before you start, click here and check.</summary>
            <div className="demo-accounts-content">
              <p>Rules for this platform must be followed</p>
              <p>Failure to that will lead the admin to suspend your account.</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default Login;