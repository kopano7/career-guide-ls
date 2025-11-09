import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [step, setStep] = useState(token ? 2 : 1); // 1: Request, 2: Reset
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { requestPasswordReset, resetPassword } = useAuth();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();

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

  const validateRequestForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateRequestForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await requestPasswordReset(formData.email);
      
      if (result.success) {
        setStep(3); // Success step for request
        showSuccess(
          'Reset Link Sent', 
          'If an account with that email exists, a password reset link has been sent. Check your email.'
        );
      } else {
        // Still show success for security (don't reveal if email exists)
        setStep(3);
        showInfo(
          'Reset Link Sent', 
          'If an account with that email exists, a password reset link has been sent.'
        );
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      showError('Request Failed', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateResetForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await resetPassword(token, formData.newPassword);
      
      if (result.success) {
        setStep(4); // Success step for reset
        showSuccess('Password Reset', 'Your password has been reset successfully. You can now login with your new password.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setErrors({ submit: result.error });
        showError('Reset Failed', result.error);
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      showError('Reset Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Password Reset
  const renderRequestForm = () => (
    <>
      <div className="auth-header">
        <h1>Reset Your Password</h1>
        <p>Enter your email address and we'll send you a reset link</p>
      </div>

      <form onSubmit={handleRequestSubmit} className="auth-form">
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
            placeholder="Enter your email address"
            disabled={loading}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
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
          {loading ? <LoadingSpinner size="small" text="" /> : 'Send Reset Link'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Remember your password?{' '}
          <Link to="/login" className="auth-link">
            Back to Login
          </Link>
        </p>
      </div>
    </>
  );

  // Step 2: Reset Password Form
  const renderResetForm = () => (
    <>
      <div className="auth-header">
        <h1>Create New Password</h1>
        <p>Enter your new password below</p>
      </div>

      <form onSubmit={handleResetSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="newPassword" className="form-label">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className={`form-control ${errors.newPassword ? 'error' : ''}`}
            placeholder="Enter new password"
            disabled={loading}
          />
          {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="Confirm new password"
            disabled={loading}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
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
          {loading ? <LoadingSpinner size="small" text="" /> : 'Reset Password'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          <Link to="/login" className="auth-link">
            Back to Login
          </Link>
        </p>
      </div>
    </>
  );

  // Step 3: Request Success
  const renderRequestSuccess = () => (
    <div className="success-container">
      <div className="success-icon">📧</div>
      <div className="auth-header">
        <h1>Check Your Email</h1>
        <p>
          We've sent a password reset link to <strong>{formData.email}</strong>. 
          The link will expire in 1 hour.
        </p>
        <p className="success-note">
          Didn't receive the email? Check your spam folder or try again.
        </p>
      </div>

      <div className="success-actions">
        <button
          onClick={() => setStep(1)}
          className="btn btn-outline"
        >
          Try Different Email
        </button>
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  // Step 4: Reset Success
  const renderResetSuccess = () => (
    <div className="success-container">
      <div className="success-icon">✅</div>
      <div className="auth-header">
        <h1>Password Reset Successfully!</h1>
        <p>
          Your password has been updated. You will be redirected to the login page shortly.
        </p>
      </div>

      <div className="success-actions">
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary"
        >
          Go to Login Now
        </button>
      </div>
    </div>
  );

  // Invalid Token
  const renderInvalidToken = () => (
    <div className="error-container">
      <div className="error-icon">❌</div>
      <div className="auth-header">
        <h1>Invalid Reset Link</h1>
        <p>
          This password reset link is invalid or has expired. 
          Please request a new reset link.
        </p>
      </div>

      <div className="success-actions">
        <button
          onClick={() => {
            setStep(1);
            setFormData({ email: '', newPassword: '', confirmPassword: '' });
          }}
          className="btn btn-primary"
        >
          Request New Reset Link
        </button>
        <button
          onClick={() => navigate('/login')}
          className="btn btn-outline"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        {step === 1 && renderRequestForm()}
        {step === 2 && renderResetForm()}
        {step === 3 && renderRequestSuccess()}
        {step === 4 && renderResetSuccess()}
        {step === 5 && renderInvalidToken()}
      </div>
    </div>
  );
};

export default ResetPassword;