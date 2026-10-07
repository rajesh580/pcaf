const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');

const router = express.Router();

/**
 * In-memory repository of Jobs
 */
let jobs = [];

let jobApplications = [];

/**
 * 1. Publish Job Opportunity (Section 12)
 * Company specifies all 16 parameters:
 * Title, description, location, workMode, salaryPackage, employmentType,
 * departments, graduationYear, minimumCgpa, backlogCriteria,
 * requiredSkills, preferredSkills, experience, deadline, positions, selectionProcess.
 */
router.post('/', authenticate, checkPermission('OPPORTUNITY_CREATE'), (req, res) => {
  try {
    const {
      title,
      description,
      location,
      workMode = 'HYBRID',
      salaryPackage,
      employmentType = 'FULL_TIME',
      departments = [],
      graduationYear,
      minimumCgpa = 6.0,
      backlogCriteria = { maxActiveBacklogs: 0 },
      requiredSkills = [],
      preferredSkills = [],
      experience = 'Fresher',
      applicationDeadline,
      numberOfPositions = 1,
      selectionProcess = []
    } = req.body;

    if (!title || !salaryPackage || !graduationYear || !requiredSkills.length || !applicationDeadline) {
      return res.status(400).json({
        error: 'Mandatory fields missing: title, salaryPackage, graduationYear, requiredSkills, and applicationDeadline are required.'
      });
    }

    const newJob = {
      id: `job_${Date.now()}`,
      companyId: req.user.companyId || 'comp_1',
      companyName: req.user.companyName || 'Registered Partner Company',
      title,
      description: description || '',
      location: location || (workMode === 'ONLINE' ? 'Remote' : 'Bangalore, India'),
      workMode,
      salaryPackage,
      employmentType,
      departments,
      graduationYear: parseInt(graduationYear, 10),
      minimumCgpa: parseFloat(minimumCgpa),
      backlogCriteria,
      requiredSkills,
      preferredSkills,
      experience,
      applicationDeadline,
      numberOfPositions: parseInt(numberOfPositions, 10),
      selectionProcess: selectionProcess.length ? selectionProcess : ['Skill Review', 'Coding Round', 'Technical Interview', 'HR'],
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    jobs.push(newJob);

    return res.status(201).json({
      message: 'Full-time job opportunity published successfully',
      job: newJob
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Get All Active Jobs (with filters: salary, workMode, department, batch)
 */
router.get('/', authenticate, (req, res) => {
  const { workMode, department, graduationYear, search } = req.query;

  let filtered = jobs.filter((j) => j.status === 'ACTIVE');

  if (workMode) filtered = filtered.filter((j) => j.workMode.toUpperCase() === workMode.toUpperCase());
  if (graduationYear) filtered = filtered.filter((j) => j.graduationYear === parseInt(graduationYear, 10));
  if (department) {
    filtered = filtered.filter((j) =>
      j.departments.length === 0 || j.departments.includes(department.toUpperCase())
    );
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter((j) =>
      j.title.toLowerCase().includes(term) ||
      j.companyName.toLowerCase().includes(term) ||
      j.requiredSkills.some((s) => s.name.toLowerCase().includes(term))
    );
  }

  res.json({ total: filtered.length, jobs: filtered });
});

/**
 * 3. Get Job Details by ID
 */
router.get('/:id', authenticate, (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job posting not found.' });
  res.json({ job });
});

/**
 * 4. Evaluate Student Against Job (Software Engineer verification example)
 */
router.post('/:id/evaluate-student', authenticate, (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job posting not found.' });

  const { student } = req.body;
  if (!student) return res.status(400).json({ error: 'Student profile payload required.' });

  const mappedOpp = {
    minCgpa: job.minimumCgpa,
    maxBacklogs: job.backlogCriteria?.maxActiveBacklogs ?? 0,
    eligibleDeptCodes: job.departments,
    graduationYear: job.graduationYear,
    requiredSkills: job.requiredSkills
  };

  const evaluation = evaluateSkillMatch(student, mappedOpp);
  res.json({
    jobId: job.id,
    title: job.title,
    evaluation
  });
});

/**
 * 5. Student Applies for Job Placement
 */
router.post('/:id/apply', authenticate, (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job posting not found.' });

  const { student } = req.body;
  const studentId = req.user.id || 'std_1';

  // Prevent duplicate application
  const existing = jobApplications.find((a) => a.jobId === job.id && a.studentId === studentId);
  if (existing) {
    return res.status(409).json({ error: 'You have already applied for this job position.' });
  }

  const mappedOpp = {
    minCgpa: job.minimumCgpa,
    maxBacklogs: job.backlogCriteria?.maxActiveBacklogs ?? 0,
    eligibleDeptCodes: job.departments,
    graduationYear: job.graduationYear,
    requiredSkills: job.requiredSkills
  };

  const evaluation = student ? evaluateSkillMatch(student, mappedOpp) : { matchScore: 85, isEligible: true };

  const application = {
    id: `job_app_${Date.now()}`,
    jobId: job.id,
    jobTitle: job.title,
    companyName: job.companyName,
    studentId,
    studentName: req.user.name || 'Student Candidate',
    status: 'APPLIED',
    matchScore: evaluation.matchScore,
    isEligible: evaluation.isEligible,
    appliedAt: new Date().toISOString()
  };

  jobApplications.push(application);

  res.status(201).json({
    message: 'Job application submitted successfully!',
    application
  });
});

module.exports = router;
