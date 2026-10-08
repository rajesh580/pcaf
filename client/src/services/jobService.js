import api from './api';

export const jobService = {
  createJob: async (jobData) => {
    const res = await api.post('/jobs', jobData);
    return res.data;
  },

  getAllJobs: async (params) => {
    const res = await api.get('/jobs', { params });
    return res.data;
  },

  getJobById: async (id) => {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },

  evaluateStudent: async (id, studentPayload) => {
    const res = await api.post(`/jobs/${id}/evaluate-student`, { student: studentPayload });
    return res.data;
  },

  applyForJob: async (id, studentPayload, resumeType) => {
    const res = await api.post(`/jobs/${id}/apply`, { student: studentPayload, resumeType });
    return res.data;
  }
};
