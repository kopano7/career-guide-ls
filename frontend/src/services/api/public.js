// File: src/services/api/public.js
import api from './auth';  //  This imports the Axios instance

export const publicAPI = {
  getCourses: async () => {
    const response = await api.get('/public/courses');
    return response.data;  //  Axios response has data property
  },

  getInstitutions: async () => {
    const response = await api.get('/public/institutions');
    return response.data;
  },

  getJobs: async () => {
    const response = await api.get('/public/jobs');
    return response.data;
  }
};
