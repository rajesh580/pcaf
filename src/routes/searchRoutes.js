const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Mock records for centralized multi-entity search
const catalog = {
  companies: [],
  jobs: [],
  internships: [],
  skillPrograms: [],
  students: [],
  placementRecords: []
};

/**
 * 1. Student Search: Companies, Jobs, Internships, Skill Programs
 */
router.get('/student-search', authenticate, (req, res) => {
  const { query, entity = 'ALL' } = req.query;
  const q = (query || '').toLowerCase();

  const results = {};

  if (entity === 'ALL' || entity === 'COMPANIES') {
    results.companies = catalog.companies.filter((c) => !q || c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q));
  }
  if (entity === 'ALL' || entity === 'JOBS') {
    results.jobs = catalog.jobs.filter((j) => !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.skills.some((s) => s.toLowerCase().includes(q)));
  }
  if (entity === 'ALL' || entity === 'INTERNSHIPS') {
    results.internships = catalog.internships.filter((i) => !q || i.title.toLowerCase().includes(q) || i.company.toLowerCase().includes(q) || i.skills.some((s) => s.toLowerCase().includes(q)));
  }
  if (entity === 'ALL' || entity === 'SKILL_PROGRAMS') {
    results.skillPrograms = catalog.skillPrograms.filter((p) => !q || p.title.toLowerCase().includes(q) || p.skills.some((s) => s.toLowerCase().includes(q)));
  }

  res.json({ query, results });
});

/**
 * 2. Company Search: Students, Skills, Departments, Colleges, CGPA, Batch, Certifications
 */
router.get('/company-search', authenticate, (req, res) => {
  const { skill, department, college, minCgpa, graduationYear, certification, search } = req.query;

  let filtered = [...catalog.students];

  if (minCgpa) filtered = filtered.filter((s) => s.cgpa >= parseFloat(minCgpa));
  if (department) filtered = filtered.filter((s) => s.department.toLowerCase() === department.toLowerCase());
  if (college) filtered = filtered.filter((s) => s.college.toLowerCase().includes(college.toLowerCase()));
  if (graduationYear) filtered = filtered.filter((s) => s.graduationYear === parseInt(graduationYear, 10));

  if (skill) {
    filtered = filtered.filter((s) => s.skills.some((sk) => sk.toLowerCase().includes(skill.toLowerCase())));
  }
  if (certification) {
    filtered = filtered.filter((s) => s.certifications.some((c) => c.toLowerCase().includes(certification.toLowerCase())));
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      s.usn.toLowerCase().includes(term) ||
      s.skills.some((sk) => sk.toLowerCase().includes(term))
    );
  }

  res.json({ total: filtered.length, candidates: filtered });
});

/**
 * 3. College Search: Companies, Opportunities, Students, Placement Records
 */
router.get('/college-search', authenticate, (req, res) => {
  const { query, entity = 'ALL' } = req.query;
  const q = (query || '').toLowerCase();

  const results = {};

  if (entity === 'ALL' || entity === 'COMPANIES') {
    results.companies = catalog.companies.filter((c) => !q || c.name.toLowerCase().includes(q));
  }
  if (entity === 'ALL' || entity === 'OPPORTUNITIES') {
    results.opportunities = [
      ...catalog.jobs.map((j) => ({ ...j, type: 'JOB' })),
      ...catalog.internships.map((i) => ({ ...i, type: 'INTERNSHIP' }))
    ].filter((o) => !q || o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q));
  }
  if (entity === 'ALL' || entity === 'STUDENTS') {
    results.students = catalog.students.filter((s) => !q || s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q));
  }
  if (entity === 'ALL' || entity === 'PLACEMENT_RECORDS') {
    results.placementRecords = catalog.placementRecords.filter((r) => !q || r.studentName.toLowerCase().includes(q) || r.company.toLowerCase().includes(q));
  }

  res.json({ query, results });
});

module.exports = router;
