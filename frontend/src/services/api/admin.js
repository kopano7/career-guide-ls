// src/services/api/admin.js
import api from './auth';

export const adminAPI = {
  getUsers: async (role, status) => {
    const response = await api.get('/admin/users', { 
      params: { role, status } 
    });
    return response.data;
  },

  approveUser: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/approve`);
    return response.data;
  },

  suspendUser: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/suspend`);
    return response.data;
  },

  getSystemStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Add these for your approval pages
  getPendingInstitutes: async () => {
    const response = await api.get('/admin/institutes/pending');
    return response.data;
  },

  approveInstitute: async (instituteId) => {
    const response = await api.put(`/admin/institutes/${instituteId}/approve`);
    return response.data;
  },

  getPendingCompanies: async () => {
    const response = await api.get('/admin/companies/pending');
    return response.data;
  },

  approveCompany: async (companyId) => {
    const response = await api.put(`/admin/companies/${companyId}/approve`);
    return response.data;
  }
};