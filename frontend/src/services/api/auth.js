import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://career-guide-ls.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Start registration - send verification code
  startRegistration: async (userData) => {
    const response = await api.post('/auth/register/start', userData);
    return response.data;
  },

  // Complete registration - verify code
  completeRegistration: async (email, code) => {
    const response = await api.post('/auth/register/complete', { email, code });
    return response.data;
  },

  // Resend verification code
  resendVerificationCode: async (email) => {
    const response = await api.post('/auth/register/resend-code', { email });
    return response.data;
  },

  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data.user;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data.user;
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset', { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  // Set password (for existing users)
  setPassword: async (email, password) => {
    const response = await api.post('/auth/set-password', { email, password });
    return response.data;
  }
};

export default api;
