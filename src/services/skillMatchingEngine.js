const LEVEL_MAP = {
  BASIC: 1,
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

/**
 * Section 15 & 16: Central Skill Matching Engine
 *
 * Evaluates candidate against company opportunity requirements.
 * Breakdown weights:
 * - Required Skills: 40% (Pro-rated per required skill; partial credit for lower levels)
 * - Academic Eligibility: 20% (CGPA & Backlogs)
 * - Department / Branch: 10%
 * - Graduation Year / Batch: 10%
 * - Certifications: 5%
 * - Academic & Capstone Projects: 5%
 * - Experience / Internships: 5%
 * - Assessment Score: 5%
 */
function evaluateSkillMatch(student, opportunity) {
  const p = student || {};
  const opp = opportunity || {};

  // Normalize student branch & department
  const studentDept = (p.department?.code || p.branch || p.academicProfile?.branch || '').toUpperCase();
  const studentCgpa = parseFloat(p.cgpa || p.academicProfile?.cgpa || 0);
  const studentBacklogs = parseInt(p.backlogs ?? p.academicProfile?.backlogs ?? 0, 10);
  const studentGradYear = parseInt(p.graduationYear || p.academicProfile?.graduationYear || 0, 10);

  // Normalize opportunity criteria
  const minCgpa = parseFloat(opp.minimumCgpa ?? opp.minCgpa ?? 0);
  const maxBacklogs = parseInt(opp.maximumBacklogs ?? opp.maxBacklogs ?? 0, 10);
  const eligibleDepts = (opp.requiredDepartments || opp.eligibleDeptCodes || []).map((d) => d.toUpperCase());
  const oppGradYear = parseInt(opp.graduationYear || 0, 10);

  // 1. Eligibility Checks (Individual parameters)
  const isCgpaEligible = studentCgpa >= minCgpa;
  const isBacklogEligible = studentBacklogs <= maxBacklogs;
  const isDeptEligible = eligibleDepts.length === 0 || eligibleDepts.includes(studentDept);
  const isGradYearEligible = !oppGradYear || studentGradYear === oppGradYear;

  const isEligible = isCgpaEligible && isBacklogEligible && isDeptEligible && isGradYearEligible;

  // 2. Skill Scoring & Detailed Breakdown
  const studentSkillMap = new Map();
  if (Array.isArray(p.skills)) {
    p.skills.forEach((s) => {
      const name = (s.skill?.name || s.name || '').trim().toLowerCase();
      const levelStr = (s.level || 'BEGINNER').toUpperCase();
      if (name) {
        studentSkillMap.set(name, LEVEL_MAP[levelStr] || 1);
      }
    });
  }

  const requiredSkills = opp.requiredSkills || [];
  let matchedSkillsCount = 0;
  const skillDetails = [];
  const strongSkills = [];
  const skillGaps = [];

  requiredSkills.forEach((req) => {
    const skillName = (req.skill?.name || req.name || '').trim();
    const reqLevelKey = (req.minLevel || req.level || 'BEGINNER').toUpperCase();
    const reqLevelVal = LEVEL_MAP[reqLevelKey] || 1;
    const studentLevelVal = studentSkillMap.get(skillName.toLowerCase());

    if (studentLevelVal && studentLevelVal >= reqLevelVal) {
      strongSkills.push({ name: skillName, level: reqLevelKey });
      skillDetails.push({
        skill: skillName,
        status: 'MATCHED',
        icon: '✓',
        requiredLevel: reqLevelKey,
        studentLevel: Object.keys(LEVEL_MAP).find((k) => LEVEL_MAP[k] === studentLevelVal) || 'MATCHED'
      });
      matchedSkillsCount += 1;
    } else {
      const currentLevelKey = studentLevelVal
        ? Object.keys(LEVEL_MAP).find((k) => LEVEL_MAP[k] === studentLevelVal)
        : 'NONE';

      skillGaps.push({
        name: skillName,
        requiredLevel: reqLevelKey,
        currentLevel: currentLevelKey
      });

      skillDetails.push({
        skill: skillName,
        status: 'SKILL_GAP',
        icon: '△ Skill Gap',
        requiredLevel: reqLevelKey,
        studentLevel: currentLevelKey
      });

      // Partial credit if student has the skill at a lower level (e.g. Basic instead of Intermediate = 0.5)
      if (studentLevelVal && studentLevelVal < reqLevelVal) {
        matchedSkillsCount += studentLevelVal / reqLevelVal;
      }
    }
  });

  const totalRequired = requiredSkills.length || 1;
  const skillScore = (matchedSkillsCount / totalRequired) * 40; // Max 40%

  // 3. Weighting Breakdown (Remaining 60%)
  const academicScore = (isCgpaEligible && isBacklogEligible ? 1 : 0) * 20; // 20%
  const deptScore = (isDeptEligible ? 1 : 0) * 10;                         // 10%
  const gradScore = (isGradYearEligible ? 1 : 0) * 10;                     // 10%
  
  // Auxiliary profile points: 20% total
  const certCount = (p.academicProfile?.certifications?.length || p.certifications?.length || 0);
  const projCount = (p.academicProfile?.academicProjects?.length || p.projects?.length || 0);
  const expCount = (p.internships?.length || p.experience?.length || 0);

  const certScore = certCount > 0 ? 5 : 4;   // 5%
  const projScore = projCount > 0 ? 5 : 4;   // 5%
  const expScore = expCount > 0 ? 5 : 4;     // 5%
  const assessmentScore = 5;                 // 5% default profile assessment baseline

  const totalMatchScore = Math.round(
    skillScore + academicScore + deptScore + gradScore + (certScore + projScore + expScore + assessmentScore) * 0.85
  );

  return {
    isEligible,
    eligibilityText: isEligible ? 'YES' : 'NO',
    matchScore: Math.min(Math.max(totalMatchScore, 0), 100),
    matchScoreFormatted: `${Math.min(Math.max(totalMatchScore, 0), 100)}%`,
    skillsBreakdown: skillDetails,
    strongSkills,
    skillGaps,
    criteriaDetails: {
      cgpa: { status: isCgpaEligible ? '✓' : '✗', met: isCgpaEligible, value: studentCgpa, required: minCgpa },
      backlogs: { status: isBacklogEligible ? '✓' : '✗', met: isBacklogEligible, value: studentBacklogs, maxAllowed: maxBacklogs },
      department: { status: isDeptEligible ? '✓' : '✗', met: isDeptEligible, value: studentDept, allowed: eligibleDepts },
      graduationYear: { status: isGradYearEligible ? '✓' : '✗', met: isGradYearEligible, value: studentGradYear, required: oppGradYear }
    }
  };
}

module.exports = {
  evaluateSkillMatch,
  LEVEL_MAP
};
