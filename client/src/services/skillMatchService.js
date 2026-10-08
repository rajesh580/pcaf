import api from './api';

export const skillMatchService = {
  evaluateMatch: async (student, opportunity) => {
    const res = await api.post('/matching/evaluate', { student, opportunity });
    return res.data;
  },

  runDualRouteWorkflow: async (student, opportunity, availableTrainings = []) => {
    const res = await api.post('/matching/workflow', { student, opportunity, availableTrainings });
    return res.data;
  },

  performSkillGapAnalysis: async (student, opportunity, availableTrainings = []) => {
    const res = await api.post('/matching/gap-analysis', { student, opportunity, availableTrainings });
    return res.data;
  },

  analyzeMySkillGaps: async (target) => {
    const res = await api.post('/matching/gap-analysis/mine', target);
    return res.data;
  },

  getRecommendedOpportunities: async (student) => {
    const res = await api.post('/opportunities/recommended', { student });
    return res.data;
  },

  getRecommendedProgramsByGaps: async (skillGaps) => {
    const res = await api.post('/skill-enhancement/recommend-by-gaps', { skillGaps });
    return res.data;
  },

  completeTrainingAndRecalculate: async (programId, student, targetJobRequirement, testScore) => {
    const res = await api.post(`/skill-enhancement/${programId}/complete-and-recalculate`, {
      student,
      targetJobRequirement,
      testScore
    });
    return res.data;
  }
};
