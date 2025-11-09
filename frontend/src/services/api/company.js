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
  }
};