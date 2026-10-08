const express = require('express');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');
const { createOpportunity, mapOpportunity, applyStudentToOpportunity } = require('../services/opportunityRepository');

const router = express.Router();
const requirement = { company: true, requiredSkills: { include: { skill: true } } };

router.post('/', authenticate, checkPermission('OPPORTUNITY_CREATE'), async (req, res) => {
  const type = req.body.type === 'JOB' ? 'JOB' : req.body.type === 'INTERNSHIP' ? 'INTERNSHIP' : null;
  if (!type) return res.status(400).json({ error: 'type must be INTERNSHIP or JOB.' });
  try {
    const opportunity = await createOpportunity({ user: req.user, type, data: req.body });
    res.status(201).json({ message: 'Opportunity published successfully.', opportunity });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const records = await prisma.opportunity.findMany({ where: { status: 'ACTIVE', deadline: { gte: new Date() } }, include: requirement, orderBy: { createdAt: 'desc' } });
    const opportunities = records.map(mapOpportunity);
    res.json({ total: opportunities.length, opportunities });
  } catch (error) { res.status(500).json({ error: 'Could not load opportunities.' }); }
});

router.post('/recommended', authenticate, authorize('STUDENT'), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id }, include: { department: true, skills: { include: { skill: true } }, certifications: true, projects: true } });
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });
    const candidate = { ...student, skills: student.skills.map(({ skill, level }) => ({ name: skill.name, level })) };
    const records = await prisma.opportunity.findMany({ where: { status: 'ACTIVE', deadline: { gte: new Date() } }, include: requirement, orderBy: { createdAt: 'desc' } });
    const recommendations = records.map((record) => ({ opportunity: mapOpportunity(record), ...evaluateSkillMatch(candidate, record) })).sort((a, b) => b.matchScore - a.matchScore);
    res.json({ recommendations });
  } catch (error) {
    console.error('Opportunity recommendations failed:', error);
    res.status(500).json({ error: 'Could not generate opportunity recommendations.' });
  }
});

router.post('/:id/apply', authenticate, authorize('STUDENT'), async (req, res) => {
  try {
    const record = await prisma.opportunity.findUnique({ where: { id: req.params.id }, select: { type: true } });
    if (!record) return res.status(404).json({ error: 'Opportunity not found.' });
    const result = await applyStudentToOpportunity(req.user.id, req.params.id, record.type, req.body.resumeType);
    res.status(201).json({ message: 'Application submitted successfully.', application: result.application });
  } catch (error) {
    const status = error.message.includes('already applied') ? 409 : error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
