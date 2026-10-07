const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');

const router = express.Router();

let enrolledStudents = [];

/**
 * Search and Filter Students (Section 24)
 * Filter by minimum CGPA, skills, department, graduation year
 */
router.get('/students/search', authenticate, authorize('COMPANY_ADMIN', 'COMPANY_RECRUITER', 'COLLEGE_ADMIN', 'SUPER_ADMIN'), (req, res) => {
  const { minCgpa, department, skill, graduationYear } = req.query;

  let results = [...enrolledStudents];

  if (minCgpa) results = results.filter((s) => s.cgpa >= parseFloat(minCgpa));
  if (department) results = results.filter((s) => s.department.toLowerCase() === department.toLowerCase());
  if (graduationYear) results = results.filter((s) => s.graduationYear === parseInt(graduationYear, 10));
  if (skill) {
    results = results.filter((s) =>
      s.skills.some((sk) => sk.toLowerCase().includes(skill.toLowerCase()))
    );
  }

  res.json({ total: results.length, students: results });
});

/**
 * College Department Analytics & Placement Monitoring (Section 6 & 20)
 */
router.get('/college/stats', authenticate, authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), (req, res) => {
  res.json({
    collegeName: 'Ramaiah Institute of Technology',
    departments: [
      { name: 'Computer Science', totalStudents: 240, placed: 180, activeInterns: 210, conversionRate: '85%' },
      { name: 'Information Science', totalStudents: 180, placed: 130, activeInterns: 155, conversionRate: '80%' },
      { name: 'AI & Machine Learning', totalStudents: 120, placed: 95, activeInterns: 110, conversionRate: '88%' }
    ],
    overallPlacementRate: '81.5%',
    activeCompanyPartners: 48
  });
});

module.exports = router;
