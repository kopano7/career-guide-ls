import api from './auth';

export const instituteAPI = {
  addCourse: async (courseData) => {
    const response = await api.post('/institute/courses', courseData);
    return response.data;
  },

  getCourses: async () => {
    const response = await api.get('/institute/courses');
    return response.data;
  },

  updateCourse: async (courseId, updateData) => {
    const response = await api.patch(`/institute/courses/${courseId}`, updateData);
    return response.data;
  },

  deleteCourse: async (courseId) => {
    const response = await api.delete(`/institute/courses/${courseId}`);
    return response.data;
  },

  getApplications: async (courseId, status) => {
    const response = await api.get('/institute/applications', { 
      params: { courseId, status } 
    });
    return response.data;
  },

  updateApplicationStatus: async (applicationId, status, notes) => {
    const response = await api.patch(`/institute/applications/${applicationId}`, {
      status,
      notes
    });
    return response.data;
  },

  getApplicationStats: async () => {
    const response = await api.get('/institute/stats/applications');
    return response.data;
  },

  getDashboardData: async () => {
    const response = await api.get('/institute/dashboard');
    return response.data;
  }
};