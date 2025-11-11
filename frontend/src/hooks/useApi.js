// src/hooks/useApi.js
import { useState, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

// API base URL - UPDATED to production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://career-guide-ls.onrender.com/api';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError } = useNotification();

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const request = useCallback(async (endpoint, options = {}) => {
    const token = getToken();
    const url = `${API_BASE_URL}${endpoint}`;

    // ADDED: Debug logging
    console.log('🔐 API Request Debug:');
    console.log('   URL:', url);
    console.log('   Token exists:', !!token);
    console.log('   Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // ADDED: Debug response
      console.log('📨 API Response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      // FIXED: Return the entire response data structure
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }, []);

  const callApi = useCallback(async (apiCall, successMessage = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      
      if (successMessage) {
        // showSuccess(successMessage);
      }
      
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Something went wrong';
      setError(errorMessage);
      showError('Error', errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Convenience methods - UPDATED to handle response structure
  const get = useCallback(async (endpoint) => {
    const response = await request(endpoint);
    // FIXED: Your backend returns { success: true, data: { ... } }
    return response;
  }, [request]);

  const post = useCallback(async (endpoint, body) => {
    const response = await request(endpoint, { method: 'POST', body });
    // FIXED: Your backend returns { success: true, data: { ... } }
    return response;
  }, [request]);

  const put = useCallback(async (endpoint, body) => {
    const response = await request(endpoint, { method: 'PUT', body });
    // FIXED: Your backend returns { success: true, data: { ... } }
    return response;
  }, [request]);

  const del = useCallback(async (endpoint) => {
    const response = await request(endpoint, { method: 'DELETE' });
    // FIXED: Your backend returns { success: true, data: { ... } }
    return response;
  }, [request]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    callApi,
    clearError,
    // Direct API methods
    get,
    post,
    put,
    delete: del,
    request
  };
};

export default useApi;
