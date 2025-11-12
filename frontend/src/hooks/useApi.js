// src/hooks/useApi.js
import { useState, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

// API base URL - UPDATED to port 5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError } = useNotification();

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const request = useCallback(async (endpoint, options = {}) => {
    const token = getToken();
    
    // FIX: Ensure endpoint starts with /api
    let cleanEndpoint = endpoint;
    if (!endpoint.startsWith('/api/')) {
      cleanEndpoint = `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    }
    
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    // Debug logging
    console.log('🔐 API Request Debug:');
    console.log('   Final URL:', url);
    console.log('   Endpoint:', endpoint);
    console.log('   Clean Endpoint:', cleanEndpoint);
    console.log('   Token exists:', !!token);

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
      setLoading(true);
      const response = await fetch(url, config);
      
      console.log('📨 API Response Status:', response.status);
      
      const data = await response.json();
      console.log('📨 API Response Data:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ... rest of your useApi code remains the same
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
      const errorMessage = err.message || 'Something went wrong';
      setError(errorMessage);
      showError('Error', errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const get = useCallback(async (endpoint) => {
    return await request(endpoint);
  }, [request]);

  const post = useCallback(async (endpoint, body) => {
    return await request(endpoint, { method: 'POST', body });
  }, [request]);

  const put = useCallback(async (endpoint, body) => {
    return await request(endpoint, { method: 'PUT', body });
  }, [request]);

  const del = useCallback(async (endpoint) => {
    return await request(endpoint, { method: 'DELETE' });
  }, [request]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    callApi,
    clearError,
    get,
    post,
    put,
    delete: del,
    request
  };
};

export default useApi;
