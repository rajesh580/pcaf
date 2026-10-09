import api from './api';

export const trainingService = {
  list: async (filters = {}) => (await api.get('/skill-enhancement', { params: filters })).data,
  details: async (programId) => (await api.get(`/skill-enhancement/${encodeURIComponent(programId)}/details`)).data,
  enrollments: async () => (await api.get('/skill-enhancement/enrollments/mine')).data,
  providerEnrollments: async () => (await api.get('/skill-enhancement/provider/enrollments')).data,
  publish: async (program) => (await api.post('/skill-enhancement/publish', program)).data,
  updateAssignments: async (programId, payload) => (await api.put(`/skill-enhancement/${encodeURIComponent(programId)}/update-assignments`, payload)).data,
  saveQuizQuestions: async (programId, quizQuestions) => (await api.put(`/skill-enhancement/${encodeURIComponent(programId)}/save-quiz-questions`, { quizQuestions })).data,
  assignStudentTask: async (programId, payload) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/assign-student-task`, payload)).data,
  enroll: async (programId) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/enroll`)).data,
  requestPermission: async (programId) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/request-approval`)).data,
  approvePermission: async (programId, studentUserId) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/approve-permission`, { studentUserId })).data,
  submitAssignment: async (programId, payload) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/submit-assignment`, payload)).data,
  gradeStudent: async (programId, payload) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/grade-student`, payload)).data,
  complete: async (programId, score) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/complete`, { score })).data,
  completeWithProject: async (programId, payload) => (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/complete`, payload)).data,
  issueProviderCertificate: async (programId, studentUserId, customCertificateCode, certificateUrl) =>
    (await api.post(`/skill-enhancement/${encodeURIComponent(programId)}/issue-provider-certificate`, { studentUserId, customCertificateCode, certificateUrl })).data,
};
