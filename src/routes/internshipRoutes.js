const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const { createOpportunity, findOpportunity, listOpportunities } = require('../services/opportunityRepository');
const prisma = require('../prisma');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');

const router = express.Router();

router.post('/', authenticate, checkPermission('OPPORTUNITY_CREATE'), async (req, res) => {
  try {
    const { title, duration, graduationYear, requiredSkills, applicationDeadline } = req.body;
    if (!title || !duration || !graduationYear || !requiredSkills?.length || !applicationDeadline) return res.status(400).json({ error: 'Title, duration, graduation year, required skills, and deadline are required.' });
    const internship = await createOpportunity({ user: req.user, type: 'INTERNSHIP', data: req.body });
    res.status(201).json({ message: 'Internship opportunity published successfully.', internship });
  } catch (error) {
    res.status(error.message.includes('linked to a company') ? 403 : 400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const internships = await listOpportunities('INTERNSHIP', req.query);
    res.json({ total: internships.length, internships });
  } catch (error) { res.status(500).json({ error: 'Could not load internships.' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const internship = await findOpportunity(req.params.id, 'INTERNSHIP');
    if (!internship) return res.status(404).json({ error: 'Internship opportunity not found.' });
    res.json({ internship });
  } catch (error) { res.status(500).json({ error: 'Could not load this internship.' }); }
});

router.post('/:id/evaluate-student', authenticate, async (req, res) => {
  try {
    const internship = await findOpportunity(req.params.id, 'INTERNSHIP');
    if (!internship) return res.status(404).json({ error: 'Internship opportunity not found.' });
    const targetUserId = req.user.role === 'STUDENT' ? req.user.id : req.body.studentId;
    if (!targetUserId || !['STUDENT', 'COMPANY_ADMIN', 'COMPANY_RECRUITER', 'SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'This account cannot evaluate student matches.' });
    const student = await prisma.student.findUnique({ where: { userId: targetUserId }, include: { department: true, skills: { include: { skill: true } }, certifications: true, projects: true } });
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });
    const evaluation = evaluateSkillMatch({ ...student, skills: student.skills.map(({ skill, level }) => ({ name: skill.name, level })) }, internship);
    res.json({ internshipId: internship.id, title: internship.title, evaluation });
  } catch (error) { res.status(500).json({ error: 'Could not evaluate this student.' }); }
});

module.exports = router;
