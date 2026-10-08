const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();
const percent = (numerator, denominator) => denominator ? `${Math.round((numerator / denominator) * 100)}%` : '0%';

router.get('/student-report', authenticate, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: {
        college: true, department: true,
        skills: { include: { skill: true } }, certifications: true, projects: true,
        applications: { include: { opportunity: { include: { company: true } } }, orderBy: { createdAt: 'desc' } }
      }
    });
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });
    const selected = student.applications.filter((application) => ['SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'].includes(application.status));
    res.json({
      reportTitle: 'Student Career & Skill Evaluation Report',
      student: { name: student.name, email: req.user.email, usn: student.usn, college: student.college.name, department: student.department.name, graduationYear: student.graduationYear, cgpa: student.cgpa, backlogs: student.backlogs },
      applications: student.applications.map((application) => ({ id: application.id, opportunity: application.opportunity.title, company: application.opportunity.company.name, type: application.opportunity.type, status: application.status, matchScore: application.matchScore, appliedAt: application.createdAt })),
      totals: { applications: student.applications.length, selected: selected.length, skills: student.skills.length, certifications: student.certifications.length, projects: student.projects.length },
      skillProfile: student.skills.map(({ skill, level, evidenceUrl }) => ({ name: skill.name, category: skill.category, level, evidenceUrl })),
      certifications: student.certifications,
      projects: student.projects,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Student report failed:', error);
    res.status(500).json({ error: 'Could not generate the student report.' });
  }
});

router.get('/college-report', authenticate, checkPermission('REPORT_VIEW_COLLEGE'), async (req, res) => {
  try {
    let collegeId = req.user.collegeId;
    if (!collegeId) collegeId = (await prisma.college.findFirst({ where: { adminUserId: req.user.id }, select: { id: true } }))?.id;
    if (!collegeId && ['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
      collegeId = req.query.collegeId || (await prisma.college.findFirst({ select: { id: true } }))?.id;
    }
    if (!collegeId) return res.status(404).json({ error: 'No college is associated with this account.' });

    const college = await prisma.college.findUnique({
      where: { id: collegeId },
      include: {
        departments: {
          include: {
            students: {
              include: {
                applications: true,
                skills: { include: { skill: true } }
              }
            }
          }
        }
      }
    });
    if (!college) return res.status(404).json({ error: 'College not found.' });
    if (!['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role) && req.user.collegeId !== college.id && college.adminUserId !== req.user.id) {
      return res.status(403).json({ error: 'You cannot view reports for this college.' });
    }

    const students = college.departments.flatMap((department) => department.students);
    const studentIds = students.map((student) => student.id);
    const applications = studentIds.length ? await prisma.application.findMany({ where: { studentId: { in: studentIds } }, include: { opportunity: { include: { company: true } } } }) : [];
    const selected = applications.filter((application) => ['SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'].includes(application.status));
    const departmentWisePlacement = college.departments.map((department) => {
      const deptStudentIds = department.students.map((student) => student.id);
      const deptApplications = applications.filter((application) => deptStudentIds.includes(application.studentId));
      const deptSelected = new Set(selected.filter((application) => deptStudentIds.includes(application.studentId)).map((application) => application.studentId));
      return { department: department.name, code: department.code, total: department.students.length, placed: deptSelected.size, applications: deptApplications.length, percentage: percent(deptSelected.size, department.students.length) };
    });
    const companyCounts = new Map();
    applications.forEach((application) => {
      const name = application.opportunity.company.name;
      companyCounts.set(name, (companyCounts.get(name) || 0) + 1);
    });
    const skillCounts = new Map();
    students.forEach((student) => student.skills.forEach(({ skill }) => skillCounts.set(skill.name, (skillCounts.get(skill.name) || 0) + 1)));
    const opportunities = await prisma.opportunity.findMany({ where: { applications: { some: { studentId: { in: studentIds } } } }, include: { applications: true } });
    const finishedInternships = applications.filter((application) => application.opportunity.type === 'INTERNSHIP' && application.status === 'COMPLETED').length;
    const placedStudentCount = new Set(selected.map((application) => application.studentId)).size;

    res.json({
      reportTitle: 'Institutional Placement & Industry Engagement Report', college: college.name,
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      totals: { students: students.length, applications: applications.length, selected: placedStudentCount, opportunities: opportunities.length },
      departmentWisePlacement,
      companyWisePlacement: [...companyCounts.entries()].map(([company, count]) => ({ company, applications: count })).sort((a, b) => b.applications - a.applications),
      internshipStatistics: { totalInternshipsCompleted: finishedInternships, activeOngoingInternships: opportunities.filter((opportunity) => opportunity.type === 'INTERNSHIP').length, paidInternshipRatio: 'Not tracked' },
      placementPackageStatistics: { highestPackage: 'Not tracked', averagePackage: 'Not tracked', medianPackage: 'Not tracked' },
      internshipToJobConversionRate: 'Not tracked',
      skillDistributionAcrossStudents: [...skillCounts.entries()].map(([skill, studentsWithSkill]) => ({ skill, students: studentsWithSkill })).sort((a, b) => b.students - a.students),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('College report failed:', error);
    res.status(500).json({ error: 'Could not generate the college report.' });
  }
});

router.get('/company-report', authenticate, async (req, res) => {
  if (!['COMPANY_ADMIN', 'COMPANY_RECRUITER'].includes(req.user.role)) return res.status(403).json({ error: 'Company accounts only.' });
  if (!req.user.recruiterAtId) return res.status(404).json({ error: 'No company is associated with this account.' });
  try {
    const opportunities = await prisma.opportunity.findMany({ where: { companyId: req.user.recruiterAtId }, include: { company: true, applications: { include: { student: { include: { department: true } } } } } });
    const applications = opportunities.flatMap((opportunity) => opportunity.applications.map((application) => ({ ...application, opportunity })));
    const shortlisted = applications.filter((application) => ['SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'JOINED', 'COMPLETED'].includes(application.status));
    const selected = applications.filter((application) => ['SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'].includes(application.status));
    const departmentCounts = new Map();
    applications.forEach((application) => { const name = application.student.department.name; departmentCounts.set(name, (departmentCounts.get(name) || 0) + 1); });
    const interviews = applications.filter((application) => application.status === 'INTERVIEW').length;
    res.json({
      reportTitle: 'Corporate Talent Acquisition Report', company: opportunities[0]?.company?.name || 'Company Recruitment',
      applicationsReceived: applications.length,
      shortlistingSummary: { shortlisted: shortlisted.length, shortlistRate: percent(shortlisted.length, applications.length) },
      selectionRatio: { interviewsConducted: interviews, finalOffersMade: selected.length, conversionRate: percent(selected.length, applications.length) },
      departmentWiseApplicants: [...departmentCounts.entries()].map(([department, applicants]) => ({ department, applicants })).sort((a, b) => b.applicants - a.applicants),
      opportunities: opportunities.map((opportunity) => ({ id: opportunity.id, title: opportunity.title, type: opportunity.type, applications: opportunity.applications.length })),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Company report failed:', error);
    res.status(500).json({ error: 'Could not generate the company report.' });
  }
});

module.exports = router;
