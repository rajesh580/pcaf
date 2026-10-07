const express = require('express');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');

const router = express.Router();

/**
 * In-memory repository of Internships
 */
let internships = [];

let internshipApplications = [];

/**
 * 1. Create Internship Opportunity (Section 10)
 * Allows Company Admins & Recruiters to specify all 19 defined parameters
 */
router.post('/', authenticate, checkPermission('OPPORTUNITY_CREATE'), (req, res) => {
  try {
    const {
      title,
      description,
      internshipType = 'INTERNSHIP_ONLY',
      mode = 'HYBRID',
      location,
      duration,
      startDate,
      endDate,
      stipend,
      numberOfPositions = 1,
      requiredDegree = 'B.E. / B.Tech',
      requiredDepartments = [],
      minimumCgpa = 0.0,
      maximumBacklogs = 0,
      graduationYear,
      requiredSkills = [],
      preferredSkills = [],
      selectionProcess = [],
      applicationDeadline
    } = req.body;

    // Validate mandatory fields
    if (!title || !duration || !graduationYear || !requiredSkills.length || !applicationDeadline) {
      return res.status(400).json({
        error: 'Mandatory fields missing: title, duration, graduationYear, requiredSkills, and applicationDeadline are required.'
      });
    }

    const newInternship = {
      id: `intern_${Date.now()}`,
      companyId: req.user.companyId || 'comp_1',
      companyName: req.user.companyName || 'Registered Partner Company',
      title,
      description: description || '',
      internshipType, // 'INTERNSHIP_ONLY' or 'INTERNSHIP_PPO'
      mode, // 'ONLINE', 'OFFLINE', 'HYBRID'
      location: location || (mode === 'ONLINE' ? 'Remote' : 'Bangalore, India'),
      duration,
      startDate: startDate || null,
      endDate: endDate || null,
      stipend: stipend || 'Unpaid / Performance Stipend',
      numberOfPositions: parseInt(numberOfPositions, 10),
      requiredDegree,
      requiredDepartments,
      minimumCgpa: parseFloat(minimumCgpa),
      maximumBacklogs: parseInt(maximumBacklogs, 10),
      graduationYear: parseInt(graduationYear, 10),
      requiredSkills, // e.g. [{ name: 'Python', minLevel: 'INTERMEDIATE' }, ...]
      preferredSkills,
      selectionProcess: selectionProcess.length ? selectionProcess : ['Skill Match Review', 'Interview', 'Selection'],
      applicationDeadline,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    internships.push(newInternship);

    return res.status(201).json({
      message: 'Internship opportunity published successfully',
      internship: newInternship
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Get All Active Internships (with filters: mode, department, minCgpa)
 */
router.get('/', authenticate, (req, res) => {
  const { mode, department, graduationYear } = req.query;

  let filtered = internships.filter((i) => i.status === 'ACTIVE');

  if (mode) filtered = filtered.filter((i) => i.mode.toUpperCase() === mode.toUpperCase());
  if (graduationYear) filtered = filtered.filter((i) => i.graduationYear === parseInt(graduationYear, 10));
  if (department) {
    filtered = filtered.filter((i) =>
      i.requiredDepartments.length === 0 || i.requiredDepartments.includes(department.toUpperCase())
    );
  }

  res.json({ total: filtered.length, internships: filtered });
});

/**
 * 3. Get Internship by ID
 */
router.get('/:id', authenticate, (req, res) => {
  const item = internships.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Internship opportunity not found' });
  res.json({ internship: item });
});

/**
 * 4. Evaluate Student Eligibility against an Internship (Section 10 example validation)
 */
router.post('/:id/evaluate-student', authenticate, (req, res) => {
  const item = internships.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Internship opportunity not found' });

  const { student } = req.body;
  if (!student) return res.status(400).json({ error: 'Student profile payload required' });

  // Map internship fields to matching engine format
  const mappedOpp = {
    minCgpa: item.minimumCgpa,
    maxBacklogs: item.maximumBacklogs,
    eligibleDeptCodes: item.requiredDepartments,
    graduationYear: item.graduationYear,
    requiredSkills: item.requiredSkills
  };

  const evaluation = evaluateSkillMatch(student, mappedOpp);
  res.json({
    internshipId: item.id,
    title: item.title,
    evaluation
  });
});

module.exports = router;
