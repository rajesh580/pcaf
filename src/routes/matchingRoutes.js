const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');

const router = express.Router();

router.post('/gap-analysis/mine', authenticate, authorize('STUDENT'), async (req, res) => {
  try {
    const studentRecord = await require('../prisma').student.findUnique({
      where: { userId: req.user.id },
      include: { department: true, skills: { include: { skill: true } }, certifications: true, projects: true }
    });
    if (!studentRecord) return res.status(404).json({ error: 'Student profile not found.' });
    const { title = 'Target role', requiredSkills = [], minimumCgpa = 0, maximumBacklogs = 100, graduationYear = 0, requiredDepartments = [] } = req.body;
    if (typeof title !== 'string' || !title.trim() || !Array.isArray(requiredSkills) || !requiredSkills.length || !requiredSkills.every((skill) => typeof skill === 'string' && skill.trim())) {
      return res.status(400).json({ error: 'A target title and at least one required skill are needed.' });
    }
    if (!Array.isArray(requiredDepartments) || !requiredDepartments.every((department) => typeof department === 'string')) {
      return res.status(400).json({ error: 'requiredDepartments must be a list of department codes.' });
    }
    const numeric = [Number(minimumCgpa), Number(maximumBacklogs), Number(graduationYear)];
    if (numeric.some((value) => !Number.isFinite(value)) || numeric[0] < 0 || numeric[0] > 10 || numeric[1] < 0 || numeric[2] < 0) {
      return res.status(400).json({ error: 'Check the CGPA, backlog, and graduation year requirements.' });
    }
    const student = {
      ...studentRecord,
      skills: studentRecord.skills.map(({ skill, level, evidenceUrl }) => ({ name: skill.name, level, evidenceUrl })),
      academicProfile: { certifications: studentRecord.certifications, academicProjects: studentRecord.projects }
    };
    const opportunity = {
      title: title.trim(), minCgpa: numeric[0], maxBacklogs: numeric[1], graduationYear: numeric[2],
      eligibleDeptCodes: requiredDepartments.map((department) => department.trim().toUpperCase()).filter(Boolean),
      requiredSkills: [...new Set(requiredSkills.map((skill) => skill.trim()))].map((name) => ({ name, minLevel: 'INTERMEDIATE' }))
    };
    const { ENHANCEMENT_PROGRAMS_CATALOG } = require('../config/enhancementCatalog');
    const availableTrainings = ENHANCEMENT_PROGRAMS_CATALOG.flatMap((program) => program.skillsCovered.map((skillTarget) => ({ skillTarget, title: program.title, provider: program.provider })));
    return res.json(performSkillGapAnalysis(student, opportunity, availableTrainings));
  } catch (error) {
    console.error('Personal skill gap analysis failed:', error);
    return res.status(500).json({ error: 'Could not analyze your skill profile.' });
  }
});

/**
 * Perform Skill Matching between student profile and opportunity
 */
router.post('/evaluate', authenticate, (req, res) => {
  try {
    const { student, opportunity } = req.body;
    if (!student || !opportunity) {
      return res.status(400).json({ error: 'Both student and opportunity profiles are required.' });
    }

    const result = evaluateSkillMatch(student, opportunity);
    return res.json({
      status: 'success',
      evaluation: result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Complete AI Skill Matching Engine Dual-Route Workflow
 * Evaluates inputs and branches into:
 * - Path 1: Direct Eligibility Route (Immediate application & selection pipeline)
 * - Path 2: Skill-Gap & Upskilling Route (Recommends training and auto re-entry on completion)
 */
const { processDualRouteMatching } = require('../services/workflowEngine');

router.post('/workflow', authenticate, (req, res) => {
  try {
    const { student, opportunity, availableTrainings = [] } = req.body;
    if (!student || !opportunity) {
      return res.status(400).json({ error: 'Both student and opportunity payloads are required.' });
    }

    const workflowResult = processDualRouteMatching(student, opportunity, availableTrainings);
    return res.json(workflowResult);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const { performSkillGapAnalysis } = require('../services/skillGapAnalysisService');

/**
 * Skill Gap Analysis & Recommended Training Programs (Section 17)
 * Returns Strong Skills, Skill Gaps, Actionable Recommendations,
 * and Potential Match After Training.
 */
router.post('/gap-analysis', authenticate, (req, res) => {
  try {
    const { student, opportunity, availableTrainings = [] } = req.body;
    if (!student || !opportunity) {
      return res.status(400).json({ error: 'Both student and opportunity payloads are required.' });
    }

    const gapReport = performSkillGapAnalysis(student, opportunity, availableTrainings);
    return res.json(gapReport);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
