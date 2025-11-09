import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api/auth';

const AuthContext = createContext();

// Named export for useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export for AuthProvider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // SIMPLE AUTH CHECK - NO PROFILE DEPENDENCY
  useEffect(() => {
    console.log('🔄 AuthContext: Checking authentication...');
    console.log('🔑 Token from localStorage:', token);
    
    if (token) {
      console.log('✅ Token found - user is authenticated');
      // User is authenticated if token exists
      // Don't fetch profile - it's not required for authentication
    } else {
      console.log('❌ No token found');
      setUser(null);
    }
    
    setLoading(false);
  }, [token]);

  // Login function - SIMPLIFIED & BULLETPROOF
  const login = async (email, password) => {
    try {
      console.log('🔐 AuthContext: Making API call...', { email });
      const response = await authAPI.login(email, password);
      console.log('📨 AuthContext: Full API response:', response);

      // Handle the nested response structure
      let userData, authToken;

      if (response.data) {
        userData = response.data.user || response.data.data?.user;
        authToken = response.data.token || response.data.data?.token;
      } else {
        userData = response.user;
        authToken = response.token;
      }

      console.log('👤 Extracted user data:', userData);
      console.log('🔑 Extracted token:', authToken);

      if (!authToken) {
        console.error('❌ Missing token in response');
        throw new Error('Invalid response from server');
      }

      // STORE TOKEN - THIS IS WHAT MATTERS
      localStorage.setItem('token', authToken);
      setToken(authToken);
      
      // Set user data from login response (don't wait for profile)
      if (userData) {
        setUser(userData);
        console.log('✅ User data set from login response');
      } else {
        // Create basic user object from login info
        const basicUser = { email: email };
        setUser(basicUser);
        console.log('✅ Basic user data set with email');
      }
      
      console.log('✅ AuthContext: Login COMPLETELY successful');
      
      return { success: true, user: userData || { email: email } };
      
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Login failed' 
      };
    }
  };

  // Start registration (send verification code)
  const startRegistration = async (userData) => {
    try {
      const response = await authAPI.startRegistration(userData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  // Complete registration (verify code)
  const completeRegistration = async (email, code) => {
    try {
      const response = await authAPI.completeRegistration(email, code);
      console.log('📨 Complete registration response:', response);
      
      let userData, authToken;

      if (response.data) {
        userData = response.data.user || response.data.data?.user;
        authToken = response.data.token || response.data.data?.token;
      } else {
        userData = response.user;
        authToken = response.token;
      }
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      
      if (userData) {
        setUser(userData);
      } else {
        setUser({ email: email });
      }
      
      return { success: true, user: userData || { email: email } };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Verification failed'
      };
    }
  };

  // Resend verification code
  const resendVerificationCode = async (email) => {
    try {
      const response = await authAPI.resendVerificationCode(email);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to resend code'
      };
    }
  };

  // Logout function
  const logout = () => {
    console.log('🚪 Logging out user...');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Update user profile - OPTIONAL
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authAPI.updateProfile(profileData);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.log('⚠️ Profile update failed, but user remains logged in');
      return {
        success: false,
        error: error.response?.data?.error || 'Profile update failed'
      };
    }
  };

  // Password reset
  const requestPasswordReset = async (email) => {
    try {
      const response = await authAPI.requestPasswordReset(email);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Password reset request failed'
      };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Password reset failed'
      };
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    logout,
    startRegistration,
    completeRegistration,
    resendVerificationCode,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    // AUTHENTICATION IS BASED SOLELY ON TOKEN EXISTENCE
    isAuthenticated: !!token && !loading,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    isInstitute: user?.role === 'institute',
    isCompany: user?.role === 'company',
    requiresApproval: user?.requiresApproval || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Named export for AuthProvider as well
export { AuthProvider };
// Default export for better HMR compatibility
export default AuthProvider;