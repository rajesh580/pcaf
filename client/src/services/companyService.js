import api from './api';

export const companyService = {
  getCompanyTypes: async () => {
    const res = await api.get('/companies/types');
    return res.data;
  },

  getAllCompanies: async (params) => {
    const res = await api.get('/companies', { params });
    return res.data;
  },

  registerCompany: async (companyData) => {
    const res = await api.post('/companies/register', companyData);
    return res.data;
  },

  getDashboardMetrics: async () => {
    const res = await api.get('/company-suite/metrics');
    return res.data;
  },

  scheduleInterview: async (interviewData) => {
    const res = await api.post('/company-suite/schedule-interview', interviewData);
    return res.data;
  },

  createAssessment: async (assessmentData) => {
    const res = await api.post('/company-suite/assessments', assessmentData);
    return res.data;
  },

  getCandidateResume: async (studentId) => {
    const res = await api.get(`/company-suite/candidate-resume/${studentId}`);
    return res.data;
  },

  communicateWithCandidate: async (messageData) => {
    const res = await api.post('/company-suite/communicate', messageData);
    return res.data;
  },

  getInternTracking: async () => {
    const res = await api.get('/ppo-conversion/company');
    return res.data;
  },

  extendPpoOffer: async (trackingId, offerData) => {
    const res = await api.post(`/ppo-conversion/${trackingId}/ppo-offer`, offerData);
    return res.data;
  }
};
