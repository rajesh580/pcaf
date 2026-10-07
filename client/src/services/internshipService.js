import api from './api';

export const internshipService = {
  createInternship: async (internshipData) => {
    const res = await api.post('/internships', internshipData);
    return res.data;
  },

  getAllInternships: async (params) => {
    const res = await api.get('/internships', { params });
    return res.data;
  },

  getInternshipById: async (id) => {
    const res = await api.get(`/internships/${id}`);
    return res.data;
  },

  evaluateStudent: async (id, studentPayload) => {
    const res = await api.post(`/internships/${id}/evaluate-student`, { student: studentPayload });
    return res.data;
  },

  applyForInternship: async (applicationPayload) => {
    const res = await api.post('/internship-applications/apply', applicationPayload);
    return res.data;
  },

  getMyApplications: async () => {
    const res = await api.get('/internship-applications/my-applications');
    return res.data;
  },

  withdrawApplication: async (applicationId) => {
    const res = await api.post(`/internship-applications/${applicationId}/withdraw`);
    return res.data;
  },

  updateApplicationStatus: async (applicationId, statusData) => {
    const res = await api.patch(`/internship-applications/${applicationId}/status`, statusData);
    return res.data;
  }
};
