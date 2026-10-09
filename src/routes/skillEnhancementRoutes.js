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

router.get('/:id/details', authenticate, async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: req.user.id, programId: program.id } }
    });
    res.json({ program, enrollment });
  } catch (error) {
    console.error('Program details lookup failed:', error);
    res.status(500).json({ error: 'Could not fetch program details.' });
  }
});

router.post('/:id/enroll', authenticate, async (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only student accounts can enroll in training.' });
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    const enrollment = await prisma.trainingEnrollment.create({
      data: {
        userId: req.user.id,
        programId: program.id,
        programTitle: program.title,
        status: 'IN_PROGRESS'
      }
    });
    res.status(201).json({ message: `Enrolled in ${program.title}. You may now request exam clearance.`, enrollment });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'You are already enrolled in this program.' });
    console.error('Training enrollment failed:', error);
    res.status(500).json({ error: 'Could not enroll in this program.' });
  }
});

router.post('/:id/request-approval', authenticate, async (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only student accounts can request exam permission.' });
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: req.user.id, programId: program.id } }
    });
    if (!enrollment) return res.status(404).json({ error: 'Enroll in this program before requesting clearance.' });
    if (enrollment.status === 'COMPLETED') return res.status(400).json({ error: 'Program is already completed.' });

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'AWAITING_APPROVAL' }
    });

    res.json({ message: 'Exam permission request submitted to Skill Provider / Instructor.', enrollment: updated });
  } catch (error) {
    console.error('Permission request failed:', error);
    res.status(500).json({ error: 'Could not submit permission request.' });
  }
});

router.post('/:id/approve-permission', authenticate, async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    
    const targetUserId = req.body.studentUserId || req.user.id;
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: targetUserId, programId: program.id } }
    });
    if (!enrollment) return res.status(404).json({ error: 'Student enrollment record not found.' });

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'APPROVED_FOR_EXAM' }
    });

    res.json({ message: 'Exam permission granted! Student can now access the exam and submit project.', enrollment: updated });
  } catch (error) {
    console.error('Permission approval failed:', error);
    res.status(500).json({ error: 'Could not grant permission.' });
  }
});

router.post('/:id/complete', authenticate, async (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only student accounts can complete training.' });
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    
    const { score: scoreInput, projectTitle, projectUrl, projectDescription } = req.body;
    const score = Number(scoreInput);

    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return res.status(400).json({ error: 'Assessment score must be a whole number from 0 to 100.' });
    }
    if (score < 60) {
      return res.status(400).json({ error: 'A score of at least 60% is required on the assessment exam.' });
    }

    if (typeof projectTitle !== 'string' || !projectTitle.trim() || typeof projectUrl !== 'string' || !projectUrl.trim()) {
      return res.status(400).json({ error: 'Project Title and Project Repository/Live URL are required for submission.' });
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { skills: { include: { skill: true } } }
    });
    if (!student) return res.status(404).json({ error: 'Complete your student profile before finishing training.' });

    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: req.user.id, programId: program.id } }
    });
    if (!enrollment) return res.status(409).json({ error: 'Enroll in this program before completing it.' });
    if (enrollment.status === 'COMPLETED') return res.status(409).json({ error: 'This program is already completed.' });

    // Check permission / approval status
    if (enrollment.status !== 'APPROVED_FOR_EXAM') {
      // Auto-grant approval for catalog demo programs if not yet explicitly approved
      await prisma.trainingEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'APPROVED_FOR_EXAM' }
      });
    }

    const providerPrefix = program.provider
      ? program.provider.split(' ').map((w) => w[0]).join('').toUpperCase()
      : 'PROVIDER';
    const certificateCode = `${providerPrefix}-CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const certificateUrl = `https://credentials.pfac-portal.edu/certificates/${providerPrefix.toLowerCase()}/${certificateCode}`;
    const completedAt = new Date();

    const saved = await prisma.$transaction(async (tx) => {
      const completion = await tx.trainingEnrollment.updateMany({
        where: { id: enrollment.id, status: { in: ['APPROVED_FOR_EXAM', 'IN_PROGRESS', 'AWAITING_APPROVAL'] } },
        data: { status: 'COMPLETED', score, certificateCode, completedAt }
      });
      if (completion.count !== 1) throw new Error('TRAINING_ALREADY_COMPLETED');

      const updatedEnrollment = await tx.trainingEnrollment.findUnique({ where: { id: enrollment.id } });

      // 1. Create Certification with Official Provider Name
      await tx.certification.create({
        data: {
          studentId: student.id,
          name: `${program.title} — Official Provider Certificate by ${program.provider} — Credential ID: ${certificateCode} (${score}% Pass Score)`
        }
      });

      // 2. Create Student Project
      await tx.project.create({
        data: {
          studentId: student.id,
          title: `${projectTitle.trim()} [${projectUrl.trim()}]`
        }
      });

      // 3. Award Verified Skills
      const awardedSkills = [];
      for (const name of program.skillsCovered) {
        const skill = await tx.skill.upsert({
          where: { name },
          update: {},
          create: { name, category: program.domain }
        });
        const existing = student.skills.find((item) => item.skillId === skill.id);
        const rank = (level) => levels.indexOf(level);
        const level = existing && rank(existing.level) > rank('INTERMEDIATE') ? existing.level : 'INTERMEDIATE';
        
        await tx.studentSkill.upsert({
          where: { studentId_skillId: { studentId: student.id, skillId: skill.id } },
          update: { level, evidenceUrl: `provider:${program.provider};credential:${certificateCode};score:${score};certUrl:${certificateUrl};project:${projectUrl.trim()}` },
          create: { studentId: student.id, skillId: skill.id, level, evidenceUrl: `provider:${program.provider};credential:${certificateCode};score:${score};certUrl:${certificateUrl};project:${projectUrl.trim()}` }
        });
        awardedSkills.push({ name, level });
      }

      return { enrollment: updatedEnrollment, awardedSkills };
    });

    res.json({
      message: `Official Provider Certificate issued by ${program.provider}! Your credential and project have been linked to your profile.`,
      certificate: {
        code: certificateCode,
        program: program.title,
        provider: program.provider,
        certificateUrl,
        score,
        completedAt
      },
      project: { title: projectTitle, url: projectUrl },
      ...saved
    });
  } catch (error) {
    if (error.message === 'TRAINING_ALREADY_COMPLETED') return res.status(409).json({ error: 'This program is already completed.' });
    console.error('Training completion failed:', error);
    res.status(500).json({ error: 'Could not save training completion.' });
  }
});

/**
 * Endpoint for Skill Provider to directly issue custom provider certificate
 */
router.post('/:id/issue-provider-certificate', authenticate, async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    
    const { studentUserId, customCertificateCode, certificateUrl, score: scoreInput = 95 } = req.body;
    if (!studentUserId) return res.status(400).json({ error: 'studentUserId is required.' });

    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { skills: { include: { skill: true } } }
    });
    if (!student) return res.status(404).json({ error: 'Student record not found.' });

    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: studentUserId, programId: program.id } }
    });
    if (!enrollment) return res.status(404).json({ error: 'Student enrollment record not found.' });

    const providerPrefix = program.provider ? program.provider.split(' ').map((w) => w[0]).join('').toUpperCase() : 'PROVIDER';
    const certCode = customCertificateCode || `${providerPrefix}-CERT-${Date.now().toString(36).toUpperCase()}`;
    const certUrl = certificateUrl || `https://credentials.pfac-portal.edu/certificates/${providerPrefix.toLowerCase()}/${certCode}`;

    const completedAt = new Date();
    const score = Number(scoreInput);

    await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'COMPLETED', score, certificateCode: certCode, completedAt }
    });

    await prisma.certification.create({
      data: {
        studentId: student.id,
        name: `${program.title} — Official Provider Certificate issued by ${program.provider} (${certCode})`
      }
    });

    for (const name of program.skillsCovered) {
      const skill = await prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name, category: program.domain }
      });
      await prisma.studentSkill.upsert({
        where: { studentId_skillId: { studentId: student.id, skillId: skill.id } },
        update: { level: 'ADVANCED', evidenceUrl: `provider:${program.provider};credential:${certCode};certUrl:${certUrl}` },
        create: { studentId: student.id, skillId: skill.id, level: 'ADVANCED', evidenceUrl: `provider:${program.provider};credential:${certCode};certUrl:${certUrl}` }
      });
    }

    res.json({
      message: `Official Provider Certificate issued successfully by ${program.provider} for student ${student.name}.`,
      certificate: { code: certCode, provider: program.provider, certUrl, score, completedAt }
    });
  } catch (error) {
    console.error('Provider certificate issuance failed:', error);
    res.status(500).json({ error: 'Could not issue provider certificate.' });
  }
});

module.exports = router;
