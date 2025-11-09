// src/hooks/useAuth.js - COMPREHENSIVE DEBUG VERSION
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🎯 AuthProvider mounted - starting auth check');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('🔄 Checking auth status...');
      console.log('📦 Stored token:', token ? `Yes (${token.substring(0, 20)}...)` : 'No');
      console.log('📦 Stored user:', storedUser ? 'Yes' : 'No');
      
      if (token && storedUser) {
        const userObj = JSON.parse(storedUser);
        setUser(userObj);
        console.log('✅ User restored from localStorage:', userObj.email);
      } else {
        console.log('❌ No stored authentication found');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
      console.log('🏁 Auth check completed');
    }
  };

  const login = async (email, password) => {
    console.log('🎯 LOGIN FUNCTION CALLED with:', { email, password });
    
    try {
      setLoading(true);
      console.log('🔍 Sending login request to backend...');
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🔍 FULL Backend response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ Backend says: SUCCESS');
        
        // DEBUG: Log all possible data locations
        console.log('🔍 Searching for user data in response...');
        console.log('   data.user:', data.user);
        console.log('   data.data:', data.data);
        console.log('   data.data?.user:', data.data?.user);
        console.log('   data.data?.data:', data.data?.data);
        console.log('   data.data?.data?.user:', data.data?.data?.user);
        
        // Try every possible location for user data
        let userData = data.data?.user || 
                      data.user || 
                      data.data?.data?.user || 
                      data.data;
        
        // Try every possible location for token
        let token = data.data?.token || 
                   data.token || 
                   data.data?.data?.token;
        
        console.log('📦 Final extracted userData:', userData);
        console.log('📦 Final extracted token:', token ? `Yes (${token.substring(0, 20)}...)` : 'No');
        
        if (!userData || !token) {
          console.error('❌ CRITICAL: Missing user data or token');
          console.error('   Available keys in data:', Object.keys(data));
          if (data.data) console.error('   Available keys in data.data:', Object.keys(data.data));
          return { 
            success: false, 
            error: 'Authentication data missing in response' 
          };
        }
        
        // Store user data and token
        console.log('💾 Storing in localStorage...');
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Verify storage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        console.log('✅ Storage verification:');
        console.log('   Token stored:', storedToken ? 'Yes' : 'No');
        console.log('   User stored:', storedUser ? 'Yes' : 'No');
        
        console.log('🎉 LOGIN COMPLETED SUCCESSFULLY!');
        
        return { 
          success: true, 
          user: userData,
          message: data.message 
        };
      } else {
        console.log('❌ Backend says: FAILED -', data.message);
        return { 
          success: false, 
          error: data.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    } finally {
      setLoading(false);
      console.log('🏁 Login function completed');
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user:', user?.email);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ User logged out - storage cleared');
  };

  const refreshUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user
  };

  console.log('🔄 AuthProvider rendering with user:', user?.email || 'null');

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;