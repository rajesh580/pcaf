import api from './api';

export const trainingService = {
  list: async (filters = {}) => (await api.get('/skill-enhancement', { params: filters })).data,
  details: async (programId) => (await api.get(`/skill-enhancement/${encodeURIComponent(programId)}/details`)).data,
  enrollments: async () => (await api.get('/skill-enhancement/enrollments/mine')).data,
  providerEnrollments: async () => (await api.get('/skill-enhancement/provider/enrollments')).data,
  publish: async (program) => (await api.post('/skill-enhancement/publish', program)).data,
  enroll: async (programId) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/enroll`)).data,
  requestPermission: async (programId) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/request-approval`)).data,
  approvePermission: async (programId, studentUserId) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/approve-permission`, { studentUserId })).data,
  complete: async (programId, score) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/complete`, { score })).data,
  completeWithProject: async (programId, payload) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/complete`, payload)).data,
  issueProviderCertificate: async (programId, studentUserId, customCertificateCode, certificateUrl) =>
    (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/issue-provider-certificate`, { studentUserId, customCertificateCode, certificateUrl })).data,
};
