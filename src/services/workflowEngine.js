const { evaluateSkillMatch } = require('./skillMatchingEngine');

/**
 * Executes the complete AI Skill Matching Engine workflow:
 * 1. Checks academic, branch, and graduation prerequisites
 * 2. Scores skills against company requirements
 * 3. Splits outcome into Path 1 (Direct Eligibility Route) or Path 2 (Skill Gap & Upskilling Route)
 */
function processDualRouteMatching(student, opportunity, availableTrainingPrograms = []) {
  const evaluation = evaluateSkillMatch(student, opportunity);

  if (evaluation.isEligible && evaluation.matchScore >= 70 && evaluation.skillGaps.length === 0) {
    // PATH 1: Direct Eligibility Route
    return {
      route: 'PATH_1_DIRECT_ELIGIBILITY',
      message: 'Student meets all skill and eligibility criteria. Ready for application and selection.',
      isEligible: true,
      matchScore: evaluation.matchScore,
      strongSkills: evaluation.strongSkills,
      action: {
        canApplyImmediately: true,
        recommendedOpportunity: {
          id: opportunity.id,
          title: opportunity.title,
          company: opportunity.companyName,
          type: opportunity.type
        }
      }
    };
  }

  // PATH 2: Skill-Gap & Upskilling Route
  const recommendedTrainings = [];
  evaluation.skillGaps.forEach((gap) => {
    const matchedProgram = availableTrainingPrograms.find(
      (p) => (p.skillTarget || p.name || '').toLowerCase() === gap.name.toLowerCase()
    );

    if (matchedProgram) {
      recommendedTrainings.push({
        programId: matchedProgram.id,
        title: matchedProgram.title,
        skill: gap.name,
        targetLevel: gap.requiredLevel,
        provider: matchedProgram.provider,
        duration: matchedProgram.durationWeeks ? `${matchedProgram.durationWeeks} weeks` : 'Self-paced'
      });
    } else {
      recommendedTrainings.push({
        title: `${gap.name} Acceleration Program`,
        skill: gap.name,
        targetLevel: gap.requiredLevel,
        provider: 'Skill Hub Verified Partner',
        duration: '4-6 weeks'
      });
    }
  });

  return {
    route: 'PATH_2_SKILL_GAP_UPSKILLING',
    message: 'Skill gap or prerequisite mismatch detected. Student directed to Skill Hub enhancement.',
    isEligible: evaluation.isEligible,
    matchScore: evaluation.matchScore,
    strongSkills: evaluation.strongSkills,
    skillGaps: evaluation.skillGaps,
    criteriaDetails: evaluation.criteriaDetails,
    action: {
      canApplyImmediately: false,
      recommendedTrainings,
      nextStep: 'Enroll in recommended programs. Upon completion, profile will auto re-enter Path 1.'
    }
  };
}

module.exports = { processDualRouteMatching };
