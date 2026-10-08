const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');
const { ENHANCEMENT_PROGRAMS_CATALOG } = require('../config/enhancementCatalog');

const router = express.Router();
const percent = (n, d) => d ? `${Math.round((n / d) * 100)}%` : '0%';

router.get('/college', authenticate, checkPermission('REPORT_VIEW_COLLEGE'), async (req, res) => {
  try {
    let collegeId = req.user.collegeId;
    if (!collegeId) collegeId = (await prisma.college.findFirst({ where: { adminUserId: req.user.id }, select: { id: true } }))?.id;
    if (!collegeId && ['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) collegeId = (await prisma.college.findFirst({ select: { id: true } }))?.id;
    if (!collegeId) return res.status(404).json({ error: 'No college is associated with this account.' });
    const college = await prisma.college.findUnique({ where: { id: collegeId }, include: { departments: { include: { students: { include: { applications: true } } } } } });
    if (!college) return res.status(404).json({ error: 'College not found.' });
    const students = college.departments.flatMap((department) => department.students);
    const ids = students.map((student) => student.id);
    const selected = students.filter((student) => student.applications.some((application) => ['SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'].includes(application.status)));
    const [internships, jobs] = await Promise.all([
      prisma.opportunity.count({ where: { type: 'INTERNSHIP' } }), prisma.opportunity.count({ where: { type: 'JOB' } })
    ]);
    res.json({
      collegeName: college.name,
      collegeKpis: {
        totalStudents: students.length,
        registeredStudents: await prisma.user.count({ where: { role: 'STUDENT', studentProfile: { collegeId } } }),
        activeInternships: internships, jobOpportunities: jobs, studentsPlaced: selected.length,
        studentsInternships: students.filter((student) => student.applications.some((application) => ['COMPLETED', 'INTERNSHIP_COMPLETED'].includes(application.status))).length,
        placementPercentage: percent(selected.length, students.length), averagePackage: 'Not tracked', highestPackage: 'Not tracked'
      },
      departmentWiseAnalysis: college.departments.map((department) => {
        const placed = department.students.filter((student) => student.applications.some((application) => ['SELECTED', 'JOINED', 'COMPLETED'].includes(application.status))).length;
        return { department: department.name, code: department.code, students: department.students.length, placed, placementPercentage: percent(placed, department.students.length) };
      }),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('College dashboard failed:', error);
    res.status(500).json({ error: 'Could not load college metrics.' });
  }
});

router.get('/student', authenticate, async (req, res) => {
  try {
    const profile = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { skills: { include: { skill: true } }, applications: { include: { opportunity: true } }, certifications: true, projects: true }
    });
    if (!profile) return res.status(404).json({ error: 'Student profile not found.' });
    const candidate = { ...profile, skills: profile.skills.map(({ skill, level }) => ({ name: skill.name, level })) };
    const opportunities = await prisma.opportunity.findMany({ where: { deadline: { gte: new Date() } }, include: { requiredSkills: { include: { skill: true } } } });
    const ranked = opportunities.map((opportunity) => ({ opportunity, ...evaluateSkillMatch(candidate, opportunity) })).sort((a, b) => b.matchScore - a.matchScore);
    const applications = profile.applications;
    const profileFields = [profile.name, profile.usn, profile.resumeUrl, profile.githubUrl, profile.linkedinUrl, profile.cgpa > 0, profile.skills.length > 0, profile.projects.length > 0, profile.certifications.length > 0];
    const strongest = ranked[0];
    const skillGaps = strongest?.skillGaps?.length || 0;
    const programCount = ENHANCEMENT_PROGRAMS_CATALOG.filter((program) => strongest?.skillGaps?.some((gap) => program.skillsCovered.some((skill) => skill.toLowerCase() === gap.name.toLowerCase()))).length;
    res.json({
      welcomeMessage: `Welcome, ${profile.name || req.user.name || 'Student'}`,
      metrics: {
        profileCompletion: percent(profileFields.filter(Boolean).length, profileFields.length),
        skillMatchScore: strongest ? `${strongest.matchScore}%` : '0%',
        recommendedInternships: ranked.filter(({ opportunity }) => opportunity.type === 'INTERNSHIP').length,
        recommendedJobs: ranked.filter(({ opportunity }) => opportunity.type === 'JOB').length,
        applications: applications.filter((application) => application.status !== 'WITHDRAWN').length,
        shortlisted: applications.filter((application) => ['SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'].includes(application.status)).length,
        interviews: applications.filter((application) => application.status === 'INTERVIEW').length,
        skillGaps, recommendedCourses: programCount
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Student dashboard failed:', error);
    res.status(500).json({ error: 'Could not load student metrics.' });
  }
});

module.exports = router;
