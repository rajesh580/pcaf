import api from './api';

export const trainingService = {
  list: async (filters = {}) => (await api.get('/skill-enhancement', { params: filters })).data,
  enrollments: async () => (await api.get('/skill-enhancement/enrollments/mine')).data,
  providerEnrollments: async () => (await api.get('/skill-enhancement/provider/enrollments')).data,
  publish: async (program) => (await api.post('/skill-enhancement/publish', program)).data,
  enroll: async (programId) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/enroll`)).data,
  complete: async (programId, score) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/complete`, { score })).data,
};
