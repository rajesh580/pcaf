const express = require('express');
const { authenticate, checkPermission, authorize } = require('../middleware/auth');
const { createOpportunity, findOpportunity, listOpportunities, applyStudentToOpportunity } = require('../services/opportunityRepository');
const prisma = require('../prisma');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');

const router = express.Router();

router.post('/', authenticate, checkPermission('OPPORTUNITY_CREATE'), async (req, res) => {
  try {
    const { title, salaryPackage, graduationYear, requiredSkills, applicationDeadline } = req.body;
    if (!title || !salaryPackage || !graduationYear || !requiredSkills?.length || !applicationDeadline) return res.status(400).json({ error: 'Title, salary package, graduation year, required skills, and deadline are required.' });
    const job = await createOpportunity({ user: req.user, type: 'JOB', data: req.body });
    res.status(201).json({ message: 'Job opportunity published successfully.', job });
  } catch (error) {
    res.status(error.message.includes('linked to a company') ? 403 : 400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const jobs = await listOpportunities('JOB', req.query);
    res.json({ total: jobs.length, jobs });
  } catch (error) { res.status(500).json({ error: 'Could not load jobs.' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await findOpportunity(req.params.id, 'JOB');
    if (!job) return res.status(404).json({ error: 'Job posting not found.' });
    res.json({ job });
  } catch (error) { res.status(500).json({ error: 'Could not load this job.' }); }
});

router.post('/:id/evaluate-student', authenticate, async (req, res) => {
  try {
    const job = await findOpportunity(req.params.id, 'JOB');
    if (!job) return res.status(404).json({ error: 'Job posting not found.' });
    const targetUserId = req.user.role === 'STUDENT' ? req.user.id : req.body.studentId;
    if (!targetUserId || !['STUDENT', 'COMPANY_ADMIN', 'COMPANY_RECRUITER', 'SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'This account cannot evaluate student matches.' });
    const student = await prisma.student.findUnique({ where: { userId: targetUserId }, include: { department: true, skills: { include: { skill: true } }, certifications: true, projects: true } });
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });
    const evaluation = evaluateSkillMatch({ ...student, skills: student.skills.map(({ skill, level }) => ({ name: skill.name, level })) }, job);
    res.json({ jobId: job.id, title: job.title, evaluation });
  } catch (error) { res.status(500).json({ error: 'Could not evaluate this student.' }); }
});

router.post('/:id/apply', authenticate, authorize('STUDENT'), async (req, res) => {
  try {
    const result = await applyStudentToOpportunity(req.user.id, req.params.id, 'JOB', req.body.resumeType);
    res.status(201).json({ message: 'Job application submitted successfully.', application: { ...result.application, jobId: result.application.opportunityId, jobTitle: result.application.opportunity.title, companyName: result.application.opportunity.company.name, appliedAt: result.application.createdAt } });
  } catch (error) {
    const status = error.message.includes('already applied') ? 409 : error.message.includes('not found') ? 404 : error.message.includes('profile') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
