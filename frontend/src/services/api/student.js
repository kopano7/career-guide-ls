// src/services/api/student.js
import api from './auth';

export const studentAPI = {
  // Profile Management - Updated to use student routes
  getProfile: async () => {
    const response = await api.get('/student/profile');
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/student/profile', data);
    return response.data;
  },
  
  // Course Applications
  getApplications: async () => {
    try {
      const response = await api.get('/student/applications');
      return response.data;
    } catch (error) {
      console.error('Get applications error:', error);
      throw error;
    }
  },
  
  applyForCourse: async (courseId, grades, transcriptFile) => {
    const response = await api.post('/student/applications', { 
      courseId, 
      grades, 
      transcriptFile 
    });
    return response.data;
  },
  
  // Transcript Management
  getTranscript: async () => {
    const response = await api.get('/student/transcript');
    return response.data;
  },
  
  uploadTranscript: async (data) => {
    const response = await api.post('/student/transcript', data);
    return response.data;
  },
  
  // Jobs
  getJobs: async () => {
    const response = await api.get('/student/jobs');
    return response.data;
  },
  
  getDashboardData: async () => {
    const response = await api.get('/student/dashboard');
    return response.data;
  },
  
  // Admission Management
  acceptAdmission: async (applicationId) => {
    const response = await api.post('/student/admissions/accept', { applicationId });
    return response.data;
  }
};