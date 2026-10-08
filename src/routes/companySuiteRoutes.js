const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');
const { generateStandardizedResume } = require('../services/resumeGeneratorService');
const { cacheCloudinaryResume } = require('../services/resumeAssetService');

const router = express.Router();

const companyRole = (req) => ['COMPANY_ADMIN', 'COMPANY_RECRUITER'].includes(req.user.role);

router.get('/candidate-resume/:applicationId', authenticate, checkPermission('STUDENT_PROFILE_VIEW'), async (req, res) => {
  if (!companyRole(req) || !req.user.recruiterAtId) return res.status(403).json({ error: 'A linked company account is required.' });
  try {
    const application = await prisma.application.findFirst({
      where: { id: req.params.applicationId, opportunity: { companyId: req.user.recruiterAtId } },
      include: {
        student: { include: { user: true, college: true, department: true, skills: { include: { skill: true } }, certifications: true, projects: true } },
      },
    });
    const selectedResume = application?.selectionRoundDetails?.submittedResume;
    if (selectedResume?.type === 'GENERATED' && selectedResume.html) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline; filename="generated-resume.html"');
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data: https:; font-src 'none'; form-action 'none'; base-uri 'none'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.send(selectedResume.html);
    }
    const resumeUrl = selectedResume?.type === 'UPLOADED' ? selectedResume.url : application?.student?.resumeUrl;
    if (!resumeUrl) return res.status(404).json({ error: 'No resume is available for this applicant.' });

    // Handle local file stored on server disk
    if (resumeUrl.startsWith('/uploads/')) {
      const localFilePath = path.join(__dirname, '../..', resumeUrl);
      if (fs.existsSync(localFilePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="candidate-resume.pdf"');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-store');
        return fs.createReadStream(localFilePath).pipe(res);
      }
    }

    const cached = await cacheCloudinaryResume(resumeUrl);
    if (cached.extension !== '.pdf') return res.status(415).json({ error: 'This applicant resume is not a PDF and cannot be previewed inline.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="candidate-resume.pdf"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    fs.createReadStream(cached.filePath).pipe(res);
  } catch (error) {
    if (error instanceof TypeError) return res.status(400).json({ error: 'The linked resume URL is invalid.' });
    console.error('Candidate resume lookup failed:', error);
    res.status(502).json({ error: error.message || 'Could not load this applicant resume.' });
  }
});

router.get('/opportunities', authenticate, checkPermission('OPPORTUNITY_VIEW'), async (req, res) => {
  if (!companyRole(req) || !req.user.recruiterAtId) return res.status(403).json({ error: 'A linked company account is required.' });
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { companyId: req.user.recruiterAtId },
      include: { _count: { select: { applications: true } } },
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
    });
    res.json({ opportunities: opportunities.map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      type: opportunity.type,
      status: opportunity.status,
      deadline: opportunity.deadline,
      createdAt: opportunity.createdAt,
      workMode: opportunity.workMode,
      location: opportunity.location,
      applicationCount: opportunity._count.applications,
    })) });
  } catch (error) {
    console.error('Company opportunity list failed:', error);
    res.status(500).json({ error: 'Could not load company openings.' });
  }
});

router.patch('/opportunities/:id/status', authenticate, checkPermission('OPPORTUNITY_CREATE'), async (req, res) => {
  if (!companyRole(req) || !req.user.recruiterAtId) return res.status(403).json({ error: 'A linked company account is required.' });
  const { status } = req.body;
  if (!['ACTIVE', 'PAUSED', 'CLOSED'].includes(status)) return res.status(400).json({ error: 'Choose Active, Paused, or Closed.' });
  try {
    const result = await prisma.opportunity.updateMany({
      where: { id: req.params.id, companyId: req.user.recruiterAtId },
      data: { status },
    });
    if (!result.count) return res.status(404).json({ error: 'Opening not found for this company.' });
    res.json({ message: `Opening marked ${status.toLowerCase()}.`, status });
  } catch (error) {
    console.error('Company opportunity status update failed:', error);
    res.status(500).json({ error: 'Could not update this opening.' });
  }
});

/**
 * Section 19: Company Dashboard Live Metrics
 */
router.get('/metrics', authenticate, checkPermission('OPPORTUNITY_VIEW'), async (req, res) => {
  try {
    if (!req.user.recruiterAtId) return res.status(404).json({ error: 'No company is associated with this account.' });
    const where = { companyId: req.user.recruiterAtId };
    const activeOpportunity = { ...where, status: 'ACTIVE', deadline: { gte: new Date() } };
    const [activeInternships, activeJobs, applications, shortlisted, interviews, selected, applicationsByStatus, opportunities, recentApplications] = await Promise.all([
      prisma.opportunity.count({ where: { ...activeOpportunity, type: 'INTERNSHIP' } }),
      prisma.opportunity.count({ where: { ...activeOpportunity, type: 'JOB' } }),
      prisma.application.count({ where: { opportunity: { companyId: req.user.recruiterAtId } } }),
      prisma.application.count({ where: { opportunity: { companyId: req.user.recruiterAtId }, status: { in: ['SHORTLISTED', 'ASSESSMENT', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'INTERVIEW', 'SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'] } } }),
      prisma.application.count({ where: { opportunity: { companyId: req.user.recruiterAtId }, status: { in: ['TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'INTERVIEW'] } } }),
      prisma.application.count({ where: { opportunity: { companyId: req.user.recruiterAtId }, status: { in: ['SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'] } } }),
      prisma.application.groupBy({ by: ['status'], where: { opportunity: { companyId: req.user.recruiterAtId } }, _count: { _all: true } }),
      prisma.opportunity.findMany({
        where,
        include: { _count: { select: { applications: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.application.findMany({
        where: { opportunity: { companyId: req.user.recruiterAtId } },
        include: {
          student: { select: { name: true, department: { select: { name: true, code: true } }, college: { select: { name: true } } } },
          opportunity: { select: { title: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);
    const company = await prisma.company.findUnique({ where: { id: req.user.recruiterAtId }, select: { name: true } });

    res.json({
      companyName: company?.name || 'Corporate Partner',
      kpis: {
        activeInternships,
        activeJobs,
        applications,
        shortlisted,
        interviews,
        selected,
        internshipConversions: 0,
        activeOpenings: activeInternships + activeJobs,
      },
      applicationsByStatus: applicationsByStatus.map((item) => ({ status: item.status, count: item._count._all })),
      opportunities: opportunities.map((opportunity) => ({
        id: opportunity.id,
        title: opportunity.title,
        type: opportunity.type,
        status: opportunity.status,
        deadline: opportunity.deadline,
        applicationCount: opportunity._count.applications,
      })),
      recentApplications: recentApplications.map((application) => ({
        id: application.id,
        candidateName: application.student.name,
        college: application.student.college?.name || '',
        department: application.student.department?.name || application.student.department?.code || '',
        opportunityTitle: application.opportunity.title,
        opportunityType: application.opportunity.type,
        matchScore: application.matchScore,
        status: application.status,
        appliedAt: application.createdAt,
      })),
      quickActions: [
        { label: 'Create Internship', route: '/company/recruitment?tab=post-internship' },
        { label: 'Create Job', route: '/company/recruitment?tab=post-job' },
        { label: 'Find Candidates', route: '/company/recruitment?tab=candidates' },
        { label: 'Review Applications', route: '/company/recruitment?tab=applications' },
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve company metrics: ' + error.message });
  }
});

module.exports = router;
