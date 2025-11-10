import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/Loading/LoadingSpinner';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1); // 1: User info, 2: Verification, 3: Success
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    name: '',
    institutionName: '',
    companyName: '',
    phone: '',
    address: ''
  });
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [pendingEmail, setPendingEmail] = useState('');

  const { startRegistration, completeRegistration, resendVerificationCode } = useAuth();
  const { showError, showSuccess, showInfo } = useNotification();
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

  const handleVerificationCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      // Auto-focus next input
      if (value && index < 4) {
        const nextInput = document.getElementById(`verification-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validation
    if (formData.role === 'student' && !formData.name.trim()) {
      newErrors.name = 'Name is required for students';
    }

    if (formData.role === 'institute' && !formData.institutionName.trim()) {
      newErrors.institutionName = 'Institution name is required';
    }

    if (formData.role === 'company' && !formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const code = verificationCode.join('');
    if (code.length !== 5) {
      setErrors({ verification: 'Please enter the complete 5-digit code' });
      return false;
    }
    return true;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) return;

    setLoading(true);
    setErrors({});

    try {
      // Prepare registration data based on role
      const registrationData = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'student' && { name: formData.name }),
        ...(formData.role === 'institute' && { 
          institutionName: formData.institutionName,
          phone: formData.phone,
          address: formData.address
        }),
        ...(formData.role === 'company' && { 
          companyName: formData.companyName,
          phone: formData.phone,
          address: formData.address
        })
      };

      const result = await startRegistration(registrationData);
      
      if (result.success) {
        setPendingEmail(formData.email);
        setStep(2);
        showInfo('Verification Code Sent', 'Check your email for the 5-digit verification code');
      } else {
        setErrors({ submit: result.error });
        showError('Registration Failed', result.error);
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
      showError('Registration Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setLoading(true);
    setErrors({});

    try {
      const code = verificationCode.join('');
      const result = await completeRegistration(pendingEmail, code);
      
      if (result.success) {
        setStep(3);
        showSuccess(
          'Registration Successful!', 
          result.user.requiresApproval 
            ? 'Your account has been created and is pending admin approval.'
            : 'Your account has been created successfully!'
        );
      } else {
        setErrors({ verification: result.error });
        showError('Verification Failed', result.error);
      }
    } catch (error) {
      setErrors({ verification: 'An unexpected error occurred' });
      showError('Verification Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const result = await resendVerificationCode(pendingEmail);
      if (result.success) {
        showInfo('Code Resent', 'A new verification code has been sent to your email');
      } else {
        showError('Resend Failed', result.error);
      }
    } catch (error) {
      showError('Resend Error', 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      student: 'Student',
      institute: 'Higher Learning Institution',
      company: 'Company'
    };
    return roleNames[role] || role;
  };

  // Step 1: User Information
  const renderStep1 = () => (
    <>
      <div className="auth-header">
        <h1>Create Your Account</h1>
        <p>Join CareerGuide LS and start your journey</p>
      </div>

      <form onSubmit={handleStep1Submit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Account Type</label>
          <div className="role-selection">
            {['student', 'institute', 'company'].map(role => (
              <label key={role} className="role-option">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={formData.role === role}
                  onChange={handleChange}
                  className="role-radio"
                />
                <div className="role-card">
                  <div className="role-icon">
                    {role === 'student'}
                    {role === 'institute'}
                    {role === 'company'}
                  </div>
                  <div className="role-info">
                    <div className="role-name">{getRoleDisplayName(role)}</div>
                    <div className="role-description">
                      {role === 'student' && 'Apply for courses and find jobs'}
                      {role === 'institute' && 'Offer courses and manage admissions'}
                      {role === 'company' && 'Post jobs and find qualified candidates'}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
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

        {/* Role-specific fields */}
        {formData.role === 'student' && (
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-control ${errors.name ? 'error' : ''}`}
              placeholder="Enter your full name"
              disabled={loading}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
        )}

        {formData.role === 'institute' && (
          <>
            <div className="form-group">
              <label htmlFor="institutionName" className="form-label">Institution Name</label>
              <input
                type="text"
                id="institutionName"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                className={`form-control ${errors.institutionName ? 'error' : ''}`}
                placeholder="Enter institution name"
                disabled={loading}
              />
              {errors.institutionName && <span className="error-message">{errors.institutionName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter phone number"
                disabled={loading}
              />
            </div>
          </>
        )}

        {formData.role === 'company' && (
          <>
            <div className="form-group">
              <label htmlFor="companyName" className="form-label">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`form-control ${errors.companyName ? 'error' : ''}`}
                placeholder="Enter company name"
                disabled={loading}
              />
              {errors.companyName && <span className="error-message">{errors.companyName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter phone number"
                disabled={loading}
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-control ${errors.password ? 'error' : ''}`}
            placeholder="Create a password"
            disabled={loading}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="Confirm your password"
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
          {loading ? <LoadingSpinner size="small" text="" /> : 'Continue to Verification'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in here
          </Link>
        </p>
      </div>
    </>
  );

  // Step 2: Email Verification
  const renderStep2 = () => (
    <>
      <div className="auth-header">
        <h1>Verify Your Email</h1>
        <p>We sent a 5-digit code to <strong>{pendingEmail}</strong></p>
      </div>

      <form onSubmit={handleStep2Submit} className="auth-form">
        <div className="verification-container">
          <div className="verification-inputs">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                id={`verification-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                className={`verification-digit ${errors.verification ? 'error' : ''}`}
                disabled={loading}
              />
            ))}
          </div>
          {errors.verification && (
            <div className="error-message text-center">
              {errors.verification}
            </div>
          )}
        </div>

        <div className="verification-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleResendCode}
            disabled={loading}
          >
            Resend Code
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" text="" /> : 'Verify & Create Account'}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            className="back-button"
            onClick={() => setStep(1)}
            disabled={loading}
          >
            ← Back to registration
          </button>
        </div>
      </form>
    </>
  );

  // Step 3: Success
  const renderStep3 = () => (
    <div className="success-container">
      <div className="success-icon">✅</div>
      <div className="auth-header">
        <h1>Account Created Successfully!</h1>
        <p>
          {formData.role === 'student' 
            ? 'Your student account has been created. You can now explore courses and apply for admission.'
            : 'Your account has been created and is pending admin approval. You will be notified once approved.'
          }
        </p>
      </div>

      <div className="success-actions">
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary"
        >
          Go to Login
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn btn-outline"
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default Register;