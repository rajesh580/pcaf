const express = require('express');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');
const { applyStudentToOpportunity } = require('../services/opportunityRepository');
const { APPLICATION_STATUSES, VALID_TRANSITIONS, isValidTransition } = require('../config/applicationLifecycle');

const router = express.Router();
const includeDetails = {
  student: {
    include: {
      user: true,
      college: true,
      department: true,
      skills: { include: { skill: true } },
      certifications: true,
      projects: true,
    },
  },
  opportunity: { include: { company: true } },
};
const mapApplication = (application) => {
  const rawSelectionDetails = application.selectionRoundDetails && typeof application.selectionRoundDetails === 'object' && !Array.isArray(application.selectionRoundDetails)
    ? application.selectionRoundDetails
    : {};
  const { submittedResume, ...selectionDetails } = rawSelectionDetails;
  return {
  ...application,
  selectionRoundDetails: {
    ...selectionDetails,
    ...(submittedResume?.type ? { submittedResume: { type: submittedResume.type } } : {}),
  },
  internshipId: application.opportunityId,
  internshipTitle: application.opportunity.title,
  companyName: application.opportunity.company.name,
  studentId: application.student.userId,
  studentName: application.student.name,
  studentEmail: application.student.user.email,
  studentCollege: application.student.college?.name || '',
  studentDepartment: application.student.department?.name || '',
  studentCgpa: application.student.cgpa,
  studentGraduationYear: application.student.graduationYear,
  studentSkills: (application.student.skills || []).map(({ skill, level }) => ({ name: skill.name, level })),
  studentCertifications: (application.student.certifications || []).map(({ name, issuer }) => ({ name, issuer })),
  studentProjects: (application.student.projects || []).map(({ title }) => title),
  appliedAt: application.createdAt,
  statusTimeline: Array.isArray(application.statusTimeline) ? application.statusTimeline : [],
  submittedResumeType: submittedResume?.type || null,
  opportunityType: application.opportunity.type
  };
};

router.post('/apply', authenticate, authorize('STUDENT'), async (req, res) => {
    const { internshipId, resumeType } = req.body;
  if (!internshipId) return res.status(400).json({ error: 'internshipId is required.' });
  try {
    const { application } = await applyStudentToOpportunity(req.user.id, internshipId, 'INTERNSHIP', resumeType);
    res.status(201).json({ message: 'Application submitted successfully.', application: mapApplication(application) });
  } catch (error) {
    const status = error.message.includes('already applied') ? 409 : error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

router.get('/my-applications', authenticate, authorize('STUDENT'), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id }, select: { id: true } });
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });
    const applications = await prisma.application.findMany({ where: { studentId: student.id }, include: includeDetails, orderBy: { createdAt: 'desc' } });
    res.json({ total: applications.length, applications: applications.map(mapApplication) });
  } catch (error) {
    console.error('Application list failed:', error);
    res.status(500).json({ error: 'Could not load applications.' });
  }
});

router.post('/:id/withdraw', authenticate, authorize('STUDENT'), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id }, select: { id: true } });
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });
    const application = await prisma.application.findFirst({ where: { id: req.params.id, studentId: student.id }, include: includeDetails });
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    if (!isValidTransition(application.status, APPLICATION_STATUSES.WITHDRAWN)) return res.status(400).json({ error: `Cannot withdraw an application in ${application.status} status.` });
    const timeline = [...(Array.isArray(application.statusTimeline) ? application.statusTimeline : []), { status: 'WITHDRAWN', timestamp: new Date().toISOString(), notes: 'Application withdrawn by student.' }];
    const updated = await prisma.application.update({ where: { id: application.id }, data: { status: 'WITHDRAWN', statusTimeline: timeline }, include: includeDetails });
    res.json({ message: 'Application withdrawn successfully.', application: mapApplication(updated) });
  } catch (error) {
    console.error('Application withdrawal failed:', error);
    res.status(500).json({ error: 'Could not withdraw this application.' });
  }
});

router.get('/notifications', authenticate, authorize('STUDENT'), async (req, res) => {
  res.json({ total: 0, notifications: [], note: 'Application notifications are not persisted in this version.' });
});

router.get('/company-applications', authenticate, checkPermission('APPLICATION_VIEW'), async (req, res) => {
  if (!['COMPANY_ADMIN', 'COMPANY_RECRUITER'].includes(req.user.role) || !req.user.recruiterAtId) return res.status(403).json({ error: 'A linked company account is required.' });
  try {
    const applications = await prisma.application.findMany({ where: { opportunity: { companyId: req.user.recruiterAtId } }, include: includeDetails, orderBy: { createdAt: 'desc' } });
    res.json({ total: applications.length, applications: applications.map(mapApplication) });
  } catch (error) {
    console.error('Company application list failed:', error);
    res.status(500).json({ error: 'Could not load company applications.' });
  }
});

router.patch('/:id/status', authenticate, checkPermission('APPLICATION_UPDATE'), async (req, res) => {
  const { nextStatus, notes, roundDetails, offerLetterUrl } = req.body;
  if (!Object.values(APPLICATION_STATUSES).includes(nextStatus)) return res.status(400).json({ error: `Invalid status. Valid values: ${Object.values(APPLICATION_STATUSES).join(', ')}` });
  try {
    const application = await prisma.application.findUnique({ where: { id: req.params.id }, include: includeDetails });
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    if (['COMPANY_ADMIN', 'COMPANY_RECRUITER'].includes(req.user.role) && application.opportunity.companyId !== req.user.recruiterAtId) return res.status(403).json({ error: 'This application belongs to another company.' });
    if (!isValidTransition(application.status, nextStatus)) return res.status(400).json({ error: `Illegal state transition from ${application.status} to ${nextStatus}.`, allowedNextStatuses: VALID_TRANSITIONS[application.status] || [] });
    const timeline = [...(Array.isArray(application.statusTimeline) ? application.statusTimeline : []), { status: nextStatus, timestamp: new Date().toISOString(), notes: notes || `Moved to ${nextStatus}` }];
    const selectionDetails = application.selectionRoundDetails && typeof application.selectionRoundDetails === 'object' && !Array.isArray(application.selectionRoundDetails) ? application.selectionRoundDetails : {};
    const updated = await prisma.application.update({ where: { id: application.id }, data: { status: nextStatus, statusTimeline: timeline, ...(roundDetails && { selectionRoundDetails: { ...selectionDetails, ...roundDetails } }), ...(offerLetterUrl && nextStatus === 'SELECTED' && { offerLetterUrl }) }, include: includeDetails });
    res.json({ message: `Application status transitioned to ${nextStatus}.`, application: mapApplication(updated) });
  } catch (error) {
    console.error('Application status update failed:', error);
    res.status(500).json({ error: 'Could not update application status.' });
  }
});

router.get('/:id/round-details', authenticate, async (req, res) => {
  try {
    const application = await prisma.application.findUnique({ where: { id: req.params.id }, include: includeDetails });
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    const isStudent = req.user.id === application.student.userId;
    const isCompany = req.user.recruiterAtId === application.opportunity.companyId;
    if (!isStudent && !isCompany && !['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'You cannot view this application.' });
    res.json({ status: application.status, selectionRoundDetails: application.selectionRoundDetails, offerLetterUrl: application.offerLetterUrl, timeline: application.statusTimeline });
  } catch (error) { res.status(500).json({ error: 'Could not load application details.' }); }
});

module.exports = router;
