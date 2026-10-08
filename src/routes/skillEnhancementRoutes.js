const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');
const { ENHANCEMENT_PROGRAMS_CATALOG } = require('../config/enhancementCatalog');

const router = express.Router();
const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const modes = ['ONLINE', 'OFFLINE', 'HYBRID'];
const mapProgram = (program) => ({ ...program, skillsCovered: program.skillsCovered || [] });

async function getProgram(id) {
  const catalogProgram = ENHANCEMENT_PROGRAMS_CATALOG.find((item) => item.id === id);
  if (catalogProgram) return catalogProgram;
  const saved = await prisma.trainingProgram.findUnique({ where: { id } });
  return saved ? mapProgram(saved) : null;
}

router.get('/', async (req, res) => {
  try {
    const { domain, mode, search } = req.query;
    const saved = await prisma.trainingProgram.findMany({ orderBy: { createdAt: 'desc' } });
    let programs = [...ENHANCEMENT_PROGRAMS_CATALOG, ...saved.map(mapProgram)];
    if (domain) programs = programs.filter((p) => p.domain.toLowerCase().includes(String(domain).toLowerCase()));
    if (mode) programs = programs.filter((p) => p.mode.toUpperCase() === String(mode).toUpperCase());
    if (search) {
      const term = String(search).trim().toLowerCase();
      programs = programs.filter((p) => p.title.toLowerCase().includes(term) || p.domain.toLowerCase().includes(term) || p.skillsCovered.some((skill) => skill.toLowerCase().includes(term)));
    }
    res.json({ total: programs.length, programs });
  } catch (error) {
    console.error('Training catalog lookup failed:', error);
    res.status(500).json({ error: 'Could not load the training catalog.' });
  }
});

router.post('/publish', authenticate, checkPermission('SKILL_PROGRAM_PUBLISH'), async (req, res) => {
  const { title, domain, skillsCovered = [], mode = 'ONLINE', format, durationWeeks = 4, assessmentType } = req.body;
  const duration = Number(durationWeeks);
  if (typeof title !== 'string' || !title.trim() || typeof domain !== 'string' || !domain.trim() || !Array.isArray(skillsCovered) || !skillsCovered.length || !skillsCovered.every((skill) => typeof skill === 'string' && skill.trim())) return res.status(400).json({ error: 'Title, domain, and a list of skillsCovered are required.' });
  if (!modes.includes(mode) || !Number.isInteger(duration) || duration < 1 || duration > 104) return res.status(400).json({ error: 'Choose a valid mode and a duration from 1 to 104 weeks.' });
  try {
    const program = await prisma.trainingProgram.create({ data: {
      title: title.trim(), domain: domain.trim(), skillsCovered: [...new Set(skillsCovered.map((skill) => skill.trim()))], mode,
      format: typeof format === 'string' && format.trim() ? format.trim() : 'Live sessions + hands-on projects',
      durationWeeks: duration, provider: req.user.name || req.user.email, providerUserId: req.user.id,
      assessmentType: typeof assessmentType === 'string' && assessmentType.trim() ? assessmentType.trim() : 'Assessment + project submission'
    } });
    res.status(201).json({ message: 'Program published successfully.', program });
  } catch (error) {
    console.error('Training publication failed:', error);
    res.status(500).json({ error: 'Could not publish this program.' });
  }
});

router.get('/provider/enrollments', authenticate, checkPermission('SKILL_PROGRAM_PUBLISH'), async (req, res) => {
  try {
    const programs = await prisma.trainingProgram.findMany({ where: { providerUserId: req.user.id }, select: { id: true, title: true } });
    const enrollments = programs.length ? await prisma.trainingEnrollment.findMany({ where: { programId: { in: programs.map((program) => program.id) } }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { enrolledAt: 'desc' } }) : [];
    res.json({ programs, enrollments });
  } catch (error) {
    console.error('Provider enrollment lookup failed:', error);
    res.status(500).json({ error: 'Could not load enrollment records.' });
  }
});

router.post('/recommend-by-gaps', authenticate, (req, res) => {
  const { skillGaps = [] } = req.body;
  if (!Array.isArray(skillGaps)) return res.status(400).json({ error: 'skillGaps must be a list.' });
  const normalizedGaps = skillGaps.map((gap) => typeof gap === 'string' ? gap : gap?.name).filter((name) => typeof name === 'string').map((name) => name.trim().toLowerCase());
  prisma.trainingProgram.findMany().then((saved) => {
    const programs = [...ENHANCEMENT_PROGRAMS_CATALOG, ...saved.map(mapProgram)].filter((program) => program.skillsCovered.some((skill) => normalizedGaps.includes(skill.toLowerCase())));
    res.json({ identifiedGapsCount: normalizedGaps.length, recommendedCount: programs.length, programs });
  }).catch((error) => {
    console.error('Training recommendations failed:', error);
    res.status(500).json({ error: 'Could not recommend training programs.' });
  });
});

router.get('/enrollments/mine', authenticate, async (req, res) => {
  try {
    const enrollments = await prisma.trainingEnrollment.findMany({ where: { userId: req.user.id }, orderBy: { enrolledAt: 'desc' } });
    res.json({ enrollments });
  } catch (error) {
    console.error('Training enrollment lookup failed:', error);
    res.status(500).json({ error: 'Could not load your training enrollments.' });
  }
});

router.post('/:id/enroll', authenticate, async (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only student accounts can enroll in training.' });
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    const enrollment = await prisma.trainingEnrollment.create({ data: { userId: req.user.id, programId: program.id, programTitle: program.title } });
    res.status(201).json({ message: `Enrolled in ${program.title}.`, enrollment });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'You are already enrolled in this program.' });
    console.error('Training enrollment failed:', error);
    res.status(500).json({ error: 'Could not enroll in this program.' });
  }
});

router.post('/:id/complete', authenticate, async (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only student accounts can complete training.' });
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    const score = Number(req.body.score);
    if (!Number.isInteger(score) || score < 0 || score > 100) return res.status(400).json({ error: 'Assessment score must be a whole number from 0 to 100.' });
    if (score < 60) return res.status(400).json({ error: 'A score of at least 60 is required to complete this program.' });
    const student = await prisma.student.findUnique({ where: { userId: req.user.id }, include: { skills: { include: { skill: true } } } });
    if (!student) return res.status(404).json({ error: 'Complete your student profile before finishing training.' });
    const enrollment = await prisma.trainingEnrollment.findUnique({ where: { userId_programId: { userId: req.user.id, programId: program.id } } });
    if (!enrollment) return res.status(409).json({ error: 'Enroll in this program before completing it.' });
    if (enrollment.status === 'COMPLETED') return res.status(409).json({ error: 'This program is already completed.' });

    const certificateCode = `PFAC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const completedAt = new Date();
    const saved = await prisma.$transaction(async (tx) => {
      const completion = await tx.trainingEnrollment.updateMany({ where: { id: enrollment.id, status: 'IN_PROGRESS' }, data: { status: 'COMPLETED', score, certificateCode, completedAt } });
      if (completion.count !== 1) throw new Error('TRAINING_ALREADY_COMPLETED');
      const updatedEnrollment = await tx.trainingEnrollment.findUnique({ where: { id: enrollment.id } });
      await tx.certification.create({ data: { studentId: student.id, name: `${program.title} — ${program.provider} — ${certificateCode} (${score}%)` } });
      const awardedSkills = [];
      for (const name of program.skillsCovered) {
        const skill = await tx.skill.upsert({ where: { name }, update: {}, create: { name, category: program.domain } });
        const existing = student.skills.find((item) => item.skillId === skill.id);
        const rank = (level) => levels.indexOf(level);
        const level = existing && rank(existing.level) > rank('INTERMEDIATE') ? existing.level : 'INTERMEDIATE';
        await tx.studentSkill.upsert({
          where: { studentId_skillId: { studentId: student.id, skillId: skill.id } },
          update: { level, evidenceUrl: `credential:${certificateCode};score:${score}` },
          create: { studentId: student.id, skillId: skill.id, level, evidenceUrl: `credential:${certificateCode};score:${score}` }
        });
        awardedSkills.push({ name, level });
      }
      return { enrollment: updatedEnrollment, awardedSkills };
    });
    res.json({ message: 'Training completed. Your skills and certification have been added to your profile.', certificate: { code: certificateCode, program: program.title, provider: program.provider, score, completedAt }, ...saved });
  } catch (error) {
    if (error.message === 'TRAINING_ALREADY_COMPLETED') return res.status(409).json({ error: 'This program is already completed.' });
    console.error('Training completion failed:', error);
    res.status(500).json({ error: 'Could not save training completion.' });
  }
});

module.exports = router;
