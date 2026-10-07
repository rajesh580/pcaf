const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');

const router = express.Router();

let opportunities = [];

let applications = [];

/**
 * Publish Internship/Job Opportunity (Section 10 & 12)
 * Company Admin & Recruiters
 */
router.post('/', authenticate, authorize('COMPANY_ADMIN', 'COMPANY_RECRUITER'), (req, res) => {
  const {
    title,
    type = 'INTERNSHIP',
    workMode = 'HYBRID',
    minCgpa = 6.0,
    maxBacklogs = 0,
    graduationYear,
    eligibleDeptCodes = [],
    requiredSkills = [],
    stipend,
    salary,
    duration,
    deadline
  } = req.body;

  if (!title || !graduationYear || !requiredSkills.length) {
    return res.status(400).json({ error: 'Title, graduationYear, and requiredSkills are mandatory' });
  }

  const newOpp = {
    id: `opp_${Date.now()}`,
    companyName: req.user.companyName || 'Registered Partner Company',
    title,
    type,
    workMode,
    minCgpa: parseFloat(minCgpa),
    maxBacklogs: parseInt(maxBacklogs, 10),
    graduationYear: parseInt(graduationYear, 10),
    eligibleDeptCodes,
    requiredSkills,
    stipend,
    salary,
    duration,
    deadline: deadline || new Date(Date.now() + 30 * 86400000).toISOString()
  };

  opportunities.push(newOpp);
  res.status(201).json({ message: 'Opportunity published successfully', opportunity: newOpp });
});

/**
 * Get all available opportunities
 */
router.get('/', authenticate, (req, res) => {
  res.json({ opportunities });
});

/**
 * Get Personalized Recommendations for Student (Section 10, 15, 21)
 * Evaluates all opportunities against student profile and ranks by match score
 */
router.post('/recommended', authenticate, authorize('STUDENT'), (req, res) => {
  const { student } = req.body;
  if (!student) return res.status(400).json({ error: 'Student profile payload required' });

  const evaluated = opportunities.map((opp) => {
    const evaluation = evaluateSkillMatch(student, opp);
    return {
      opportunity: opp,
      ...evaluation
    };
  });

  // Sort by highest match score
  evaluated.sort((a, b) => b.matchScore - a.matchScore);

  res.json({ recommendations: evaluated });
});

/**
 * Student Applies to an Opportunity (Section 11)
 */
router.post('/:id/apply', authenticate, authorize('STUDENT'), (req, res) => {
  const { student } = req.body;
  const opp = opportunities.find((o) => o.id === req.params.id);

  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  const evalResult = student ? evaluateSkillMatch(student, opp) : { matchScore: 75, isEligible: true };

  const application = {
    id: `app_${Date.now()}`,
    opportunityId: opp.id,
    studentId: req.user.id || 'std_1',
    status: 'APPLIED',
    matchScore: evalResult.matchScore,
    isEligible: evalResult.isEligible,
    appliedAt: new Date().toISOString()
  };

  applications.push(application);
  res.status(201).json({ message: 'Applied successfully', application });
});

module.exports = router;
