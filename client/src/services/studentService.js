import api from './api';

export const studentService = {
  getProfile: async () => {
    const res = await api.get('/students/profile');
    return res.data;
  },

  updateAcademicProfile: async (academicData) => {
    const res = await api.put('/students/academic-profile', academicData);
    return res.data;
  },

  updateCareerProfile: async (careerData) => {
    const res = await api.put('/students/career-profile', careerData);
    return res.data;
  },

  addOrUpdateSkill: async (skillData) => {
    const res = await api.post('/students/skills', skillData);
    return res.data;
  },

  addProject: async (projectData) => {
    const res = await api.post('/students/projects', projectData);
    return res.data;
  },

  addCertification: async (certData) => {
    const res = await api.post('/students/certifications', certData);
    return res.data;
  },

  getStandardizedResumeHtml: async () => {
    const res = await api.get('/students/standardized-resume');
    return res.data;
  },

  getDashboardMetrics: async () => {
    const res = await api.get('/dashboards/student');
    return res.data;
  }
};
