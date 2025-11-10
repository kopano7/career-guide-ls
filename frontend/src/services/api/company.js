import api from './auth';

export const companyAPI = {
  postJob: async (jobData) => {
    const response = await api.post('/company/jobs', jobData);
    return response.data;
  },

  getJobs: async () => {
    const response = await api.get('/company/jobs');
    return response.data;
  },

  updateJob: async (jobId, updateData) => {
    const response = await api.patch(`/company/jobs/${jobId}`, updateData);
    return response.data;
  },

  closeJob: async (jobId) => {
    const response = await api.patch(`/company/jobs/${jobId}/close`);
    return response.data;
  },

  getQualifiedApplicants: async (jobId) => {
    const response = await api.get(`/company/jobs/${jobId}/applicants`);
    return response.data;
  },

  getJobApplicationStats: async () => {
    const response = await api.get('/company/stats/applications');
    return response.data;
  },

  getDashboardData: async () => {
    const response = await api.get('/company/dashboard');
    return response.data;
  },

  // Profile Management Methods
  getCompanyProfile: async (companyId) => {
    const response = await api.get(`/company/profile/${companyId}`);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/company/profile', profileData);
    return response.data;
  },

  getCompanyStats: async () => {
    const response = await api.get('/company/stats');
    return response.data;
  },

  // Applicant Management Methods
  updateApplicantStatus: async (applicantId, statusData) => {
    const response = await api.patch(`/company/applicants/${applicantId}/status`, statusData);
    return response.data;
  },

  getAllApplicants: async () => {
    const response = await api.get('/company/applicants');
    return response.data;
  },

  // Additional Company Methods
  uploadCompanyLogo: async (formData) => {
    const response = await api.post('/company/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/company/change-password', passwordData);
    return response.data;
  },

  resendVerification: async () => {
    const response = await api.post('/company/resend-verification');
    return response.data;
  }
};

export default api;