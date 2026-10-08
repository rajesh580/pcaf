const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();

/**
 * Search and Filter Students (Section 24)
 * Filter by minimum CGPA, skills, department, graduation year
 */
router.get('/students/search', authenticate, authorize('COMPANY_ADMIN', 'COMPANY_RECRUITER', 'COLLEGE_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { minCgpa, department, skill, graduationYear, search } = req.query;
    const parsedCgpa = minCgpa ? Number(minCgpa) : null;
    const parsedGraduationYear = graduationYear ? Number(graduationYear) : null;
    if (parsedCgpa !== null && (!Number.isFinite(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10)) {
      return res.status(400).json({ error: 'Minimum CGPA must be between 0 and 10.' });
    }
    if (parsedGraduationYear !== null && (!Number.isInteger(parsedGraduationYear) || parsedGraduationYear < 2000 || parsedGraduationYear > 2100)) {
      return res.status(400).json({ error: 'Enter a valid graduation year.' });
    }

    const where = {
      ...(parsedCgpa !== null && { cgpa: { gte: parsedCgpa } }),
      ...(parsedGraduationYear !== null && { graduationYear: parsedGraduationYear }),
      ...(department && { department: { OR: [
        { name: { contains: String(department), mode: 'insensitive' } },
        { code: { contains: String(department), mode: 'insensitive' } },
      ] } }),
      ...(skill && { skills: { some: { skill: { name: { contains: String(skill), mode: 'insensitive' } } } } }),
      ...(search && { OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { department: { name: { contains: String(search), mode: 'insensitive' } } },
        { college: { name: { contains: String(search), mode: 'insensitive' } } },
        { skills: { some: { skill: { name: { contains: String(search), mode: 'insensitive' } } } } },
      ] }),
    };

    const records = await prisma.student.findMany({
      where,
      include: {
        college: { select: { name: true, code: true } },
        department: { select: { name: true, code: true } },
        skills: { include: { skill: { select: { name: true } } } },
      },
      orderBy: [{ cgpa: 'desc' }, { name: 'asc' }],
      take: 100,
    });

    res.json({
      total: records.length,
      students: records.map((student) => ({
        id: student.id,
        name: student.name,
        college: student.college?.name || 'College not listed',
        collegeCode: student.college?.code || '',
        department: student.department?.name || 'Department not listed',
        departmentCode: student.department?.code || '',
        cgpa: student.cgpa,
        graduationYear: student.graduationYear,
        skills: student.skills.map(({ skill: studentSkill, level }) => ({ name: studentSkill.name, level })),
        githubUrl: student.githubUrl,
        linkedinUrl: student.linkedinUrl,
      })),
    });
  } catch (error) {
    console.error('Candidate search failed:', error);
    res.status(500).json({ error: 'Could not search student profiles.' });
  }
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
