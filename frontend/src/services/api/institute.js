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
  },

  // Faculty Management
  addFaculty: async (facultyData) => {
    const response = await api.post('/institute/faculties', facultyData);
    return response.data;
  },

  getFaculties: async () => {
    const response = await api.get('/institute/faculties');
    return response.data;
  },

  // Admission Publishing
  publishAdmissions: async (admissionData) => {
    const response = await api.post('/institute/admissions/publish', admissionData);
    return response.data;
  },

  // Enhanced Application Management
  getQualifiedApplications: async (courseId) => {
    const response = await api.get(`/institute/applications/qualified?courseId=${courseId}`);
    return response.data;
  }
};
