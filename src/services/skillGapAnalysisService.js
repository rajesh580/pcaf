const { evaluateSkillMatch } = require('./skillMatchingEngine');

/**
 * Section 17: Skill Gap Analysis Engine
 * Explains the precise reasons for match score, highlights strong skills,
 * identifies deficient/missing skill gaps, recommends targeted trainings/projects,
 * and calculates the "Potential Match After Training" projection.
 */
function performSkillGapAnalysis(student, targetRoleRequirement, availableTrainings = []) {
  const currentEvaluation = evaluateSkillMatch(student, targetRoleRequirement);

  const strongSkills = currentEvaluation.strongSkills.map((s) => s.name);
  const skillGaps = currentEvaluation.skillGaps.map((g) => g.name);

  // Generate actionable recommendations for each identified gap
  const recommendations = [];
  skillGaps.forEach((gapSkill, index) => {
    const matchedProgram = availableTrainings.find(
      (t) => (t.skillTarget || t.skillName || t.name || '').toLowerCase() === gapSkill.toLowerCase()
    );

    if (matchedProgram) {
      recommendations.push({
        step: index + 1,
        title: matchedProgram.title,
        skill: gapSkill,
        type: 'TRAINING',
        provider: matchedProgram.provider || 'Skill Hub Academy',
      });
    } else {
      // Intelligently classify whether training or capstone project is recommended
      const actionType = gapSkill.toLowerCase().includes('api') || gapSkill.toLowerCase().includes('project')
        ? 'PROJECT'
        : 'TRAINING';

      recommendations.push({
        step: index + 1,
        title: actionType === 'PROJECT' ? `${gapSkill} Project Implementation` : `${gapSkill} Training`,
        skill: gapSkill,
        type: actionType,
        provider: 'Skill Hub Partner Module',
      });
    }
  });

  // Calculate "Potential Match After Training"
  // Simulates student profile having fulfilled the target skill requirements
  const simulatedStudent = JSON.parse(JSON.stringify(student));
  const simulatedSkillsMap = new Map();

  (simulatedStudent.skills || []).forEach((s) => {
    simulatedSkillsMap.set((s.skill?.name || s.name).toLowerCase(), s);
  });

  (targetRoleRequirement.requiredSkills || []).forEach((req) => {
    const key = (req.skill?.name || req.name).toLowerCase();
    const existing = simulatedSkillsMap.get(key);
    if (existing) {
      existing.level = req.minLevel || req.level || 'INTERMEDIATE';
    } else {
      simulatedStudent.skills.push({
        name: req.skill?.name || req.name,
        level: req.minLevel || req.level || 'INTERMEDIATE',
      });
    }
  });

  const potentialEvaluation = evaluateSkillMatch(simulatedStudent, targetRoleRequirement);

  return {
    studentName: student.name || 'Student Candidate',
    targetRole: targetRoleRequirement.title || 'Target Role',
    matchScore: currentEvaluation.matchScore,
    matchScoreFormatted: `${currentEvaluation.matchScore}%`,
    strongSkills,
    skillGaps,
    recommendationList: recommendations.map((r) => `${r.step}. ${r.title}`),
    recommendations,
    potentialMatchScore: Math.min(potentialEvaluation.matchScore, 95),
    potentialMatchFormatted: `${Math.min(potentialEvaluation.matchScore, 95)}%`,
    summaryText: `Completing recommended training can increase match score from ${currentEvaluation.matchScore}% to ${Math.min(potentialEvaluation.matchScore, 95)}%.`
  };
}

module.exports = { performSkillGapAnalysis };
