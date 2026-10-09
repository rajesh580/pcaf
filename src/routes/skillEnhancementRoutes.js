const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();
const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const modes = ['ONLINE', 'OFFLINE', 'HYBRID'];
const mapProgram = (program) => ({ ...program, skillsCovered: program.skillsCovered || [] });

async function getProgram(id) {
  const saved = await prisma.trainingProgram.findUnique({ where: { id } });
  return saved ? mapProgram(saved) : null;
}

router.get('/', async (req, res) => {
  try {
    const { domain, mode, search } = req.query;
    const saved = await prisma.trainingProgram.findMany({ orderBy: { createdAt: 'desc' } });
    
    let programs = saved.map(mapProgram);

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
  const { title, domain, skillsCovered = [], mode = 'ONLINE', format, durationWeeks = 4, assessmentType, assignmentDetails, testInstructions } = req.body;
  const duration = Number(durationWeeks);
  if (typeof title !== 'string' || !title.trim() || typeof domain !== 'string' || !domain.trim() || !Array.isArray(skillsCovered) || !skillsCovered.length || !skillsCovered.every((skill) => typeof skill === 'string' && skill.trim())) return res.status(400).json({ error: 'Title, domain, and a list of skillsCovered are required.' });
  if (!modes.includes(mode) || !Number.isInteger(duration) || duration < 1 || duration > 104) return res.status(400).json({ error: 'Choose a valid mode and a duration from 1 to 104 weeks.' });
  try {
    const program = await prisma.trainingProgram.create({ data: {
      title: title.trim(), domain: domain.trim(), skillsCovered: [...new Set(skillsCovered.map((skill) => skill.trim()))], mode,
      format: typeof format === 'string' && format.trim() ? format.trim() : 'Live sessions + hands-on projects',
      durationWeeks: duration, provider: req.user.name || req.user.email, providerUserId: req.user.id,
      assessmentType: typeof assessmentType === 'string' && assessmentType.trim() ? assessmentType.trim() : 'Assessment + project submission',
      assignmentDetails: typeof assignmentDetails === 'string' && assignmentDetails.trim() ? assignmentDetails.trim() : null,
      testInstructions: typeof testInstructions === 'string' && testInstructions.trim() ? testInstructions.trim() : null
    } });
    res.status(201).json({ message: 'Program published successfully with assignments & test instructions.', program });
  } catch (error) {
    console.error('Training publication failed:', error);
    res.status(500).json({ error: 'Could not publish this program.' });
  }
});

router.put('/:id/update-assignments', authenticate, checkPermission('SKILL_PROGRAM_PUBLISH'), async (req, res) => {
  const { assignmentDetails, testInstructions } = req.body;
  try {
    const program = await prisma.trainingProgram.findFirst({
      where: { id: req.params.id, providerUserId: req.user.id }
    });
    if (!program) return res.status(404).json({ error: 'Program not found or access denied.' });

    const updated = await prisma.trainingProgram.update({
      where: { id: program.id },
      data: {
        assignmentDetails: typeof assignmentDetails === 'string' ? assignmentDetails.trim() : program.assignmentDetails,
        testInstructions: typeof testInstructions === 'string' ? testInstructions.trim() : program.testInstructions
      }
    });

    res.json({ message: 'Assignments and test instructions updated successfully.', program: updated });
  } catch (error) {
    console.error('Assignment update failed:', error);
    res.status(500).json({ error: 'Could not update assignments.' });
  }
});

router.put('/:id/save-quiz-questions', authenticate, checkPermission('SKILL_PROGRAM_PUBLISH'), async (req, res) => {
  const { quizQuestions } = req.body;
  if (!Array.isArray(quizQuestions)) return res.status(400).json({ error: 'quizQuestions must be an array of questions.' });
  try {
    const program = await prisma.trainingProgram.findFirst({
      where: { id: req.params.id, providerUserId: req.user.id }
    });
    if (!program) return res.status(404).json({ error: 'Program not found or access denied.' });

    const updated = await prisma.trainingProgram.update({
      where: { id: program.id },
      data: { quizQuestions }
    });

    res.json({ message: `Saved ${quizQuestions.length} Google-Form style quiz questions for ${program.title}.`, program: updated });
  } catch (error) {
    console.error('Quiz save failed:', error);
    res.status(500).json({ error: 'Could not save quiz questions.' });
  }
});

router.post('/:id/assign-student-task', authenticate, checkPermission('SKILL_PROGRAM_PUBLISH'), async (req, res) => {
  const { studentUserId, customAssignmentTitle, customAssignmentDetails, customAssignmentDeadline } = req.body;
  if (!studentUserId || !customAssignmentTitle) return res.status(400).json({ error: 'studentUserId and customAssignmentTitle are required.' });
  try {
    const program = await prisma.trainingProgram.findFirst({
      where: { id: req.params.id, providerUserId: req.user.id }
    });
    if (!program) return res.status(404).json({ error: 'Program not found or access denied.' });

    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: studentUserId, programId: program.id } }
    });
    if (!enrollment) return res.status(404).json({ error: 'Student enrollment not found.' });

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: {
        customAssignmentTitle: customAssignmentTitle.trim(),
        customAssignmentDetails: typeof customAssignmentDetails === 'string' ? customAssignmentDetails.trim() : null,
        customAssignmentDeadline: customAssignmentDeadline ? new Date(customAssignmentDeadline) : null
      }
    });

    res.json({ message: `Individual assignment "${customAssignmentTitle}" assigned to student successfully.`, enrollment: updated });
  } catch (error) {
    console.error('Assign student task failed:', error);
    res.status(500).json({ error: 'Could not assign task to student.' });
  }
});

router.get('/provider/enrollments', authenticate, checkPermission('SKILL_PROGRAM_PUBLISH'), async (req, res) => {
  try {
    const programs = await prisma.trainingProgram.findMany({ where: { providerUserId: req.user.id } });
    const programIds = programs.map((program) => program.id);
    const enrollments = programIds.length ? await prisma.trainingEnrollment.findMany({
      where: { programId: { in: programIds } },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { enrolledAt: 'desc' }
    }) : [];
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
    const programs = saved.map(mapProgram).filter((program) => program.skillsCovered.some((skill) => normalizedGaps.includes(skill.toLowerCase())));
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

router.post('/:id/approve-permission', authenticate, checkPermission('SKILL_PROGRAM_PUBLISH'), async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    
    if (program.providerUserId && program.providerUserId !== req.user.id && !['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only the Skill Provider who published this program can grant exam clearance.' });
    }

    const { studentUserId } = req.body;
    if (!studentUserId) return res.status(400).json({ error: 'studentUserId is required to grant clearance.' });

    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: studentUserId, programId: program.id } }
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
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only student accounts can submit training assessment.' });
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });
    
    const { score: scoreInput, projectTitle, projectUrl } = req.body;
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
      where: { userId: req.user.id }
    });
    if (!student) return res.status(404).json({ error: 'Complete your student profile before submitting.' });

    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: req.user.id, programId: program.id } }
    });
    if (!enrollment) return res.status(409).json({ error: 'Enroll in this program before completing it.' });

    // Enforce permission / clearance status
    if (enrollment.status !== 'APPROVED_FOR_EXAM' && enrollment.status !== 'IN_PROGRESS' && enrollment.status !== 'AWAITING_APPROVAL') {
      return res.status(403).json({ error: 'Exam clearance has not been granted by your Skill Provider yet. Contact your instructor.' });
    }

    // Record student test score and project deliverable awaiting Skill Provider evaluation & certificate issuance
    const updatedEnrollment = await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: {
        testMarks: score,
        projectTitle: projectTitle.trim(),
        projectUrl: projectUrl.trim(),
        status: 'AWAITING_APPROVAL'
      }
    });

    res.json({
      message: `Exam (${score}%) and project deliverables submitted successfully! Your Skill Provider (${program.provider}) will evaluate your work, assign final marks, and issue your official certificate.`,
      enrollment: updatedEnrollment,
      project: { title: projectTitle, url: projectUrl }
    });
  } catch (error) {
    console.error('Training submission failed:', error);
    res.status(500).json({ error: 'Could not submit training assessment.' });
  }
});

router.post('/:id/submit-assignment', authenticate, async (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only student accounts can submit assignments.' });
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });

    const { assignmentSubmission, projectTitle, projectUrl } = req.body;
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: req.user.id, programId: program.id } }
    });
    if (!enrollment) return res.status(404).json({ error: 'Enroll in this program before submitting.' });

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: {
        assignmentSubmission: typeof assignmentSubmission === 'string' ? assignmentSubmission.trim() : enrollment.assignmentSubmission,
        projectTitle: typeof projectTitle === 'string' ? projectTitle.trim() : enrollment.projectTitle,
        projectUrl: typeof projectUrl === 'string' ? projectUrl.trim() : enrollment.projectUrl,
        status: enrollment.status === 'IN_PROGRESS' ? 'AWAITING_APPROVAL' : enrollment.status
      }
    });

    res.json({ message: 'Assignment and project submission received. Sent to Skill Provider for grading.', enrollment: updated });
  } catch (error) {
    console.error('Assignment submission failed:', error);
    res.status(500).json({ error: 'Could not submit assignment.' });
  }
});

router.post('/:id/grade-student', authenticate, checkPermission('SKILL_PROGRAM_PUBLISH'), async (req, res) => {
  try {
    const program = await getProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found.' });

    const { studentUserId, testMarks, assignmentMarks, projectMarks, feedback, customCertificateCode } = req.body;
    if (!studentUserId) return res.status(400).json({ error: 'studentUserId is required.' });

    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { userId_programId: { userId: studentUserId, programId: program.id } }
    });
    if (!enrollment) return res.status(404).json({ error: 'Student enrollment record not found.' });

    const tMarks = testMarks !== undefined && testMarks !== null && testMarks !== '' ? Number(testMarks) : enrollment.testMarks;
    const aMarks = assignmentMarks !== undefined && assignmentMarks !== null && assignmentMarks !== '' ? Number(assignmentMarks) : enrollment.assignmentMarks;
    const pMarks = projectMarks !== undefined && projectMarks !== null && projectMarks !== '' ? Number(projectMarks) : enrollment.projectMarks;

    const markComponents = [tMarks, aMarks, pMarks].filter((m) => typeof m === 'number' && !isNaN(m));
    const calculatedScore = markComponents.length
      ? Math.round(markComponents.reduce((acc, m) => acc + m, 0) / markComponents.length)
      : (req.body.score ? Number(req.body.score) : (enrollment.score || 85));

    const providerPrefix = program.provider ? program.provider.split(' ').map((w) => w[0]).join('').toUpperCase() : 'PROVIDER';
    const certCode = customCertificateCode || enrollment.certificateCode || `${providerPrefix}-CERT-${Date.now().toString(36).toUpperCase()}`;
    const certUrl = `https://credentials.pfac-portal.edu/certificates/${providerPrefix.toLowerCase()}/${certCode}`;
    const completedAt = new Date();

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'COMPLETED',
        testMarks: tMarks,
        assignmentMarks: aMarks,
        projectMarks: pMarks,
        score: calculatedScore,
        feedback: typeof feedback === 'string' ? feedback.trim() : enrollment.feedback,
        certificateCode: certCode,
        completedAt
      }
    });

    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { skills: { include: { skill: true } } }
    });

    if (student) {
      await prisma.certification.create({
        data: {
          studentId: student.id,
          name: `${program.title} — Official Provider Certificate issued by ${program.provider} (${certCode}) [Score: ${calculatedScore}%]`
        }
      });

      if (enrollment.projectTitle || enrollment.projectUrl) {
        await prisma.project.create({
          data: {
            studentId: student.id,
            title: `${enrollment.projectTitle || 'Capstone Project'} [${enrollment.projectUrl || 'Submission'}]`
          }
        });
      }

      for (const name of program.skillsCovered) {
        const skill = await prisma.skill.upsert({
          where: { name },
          update: {},
          create: { name, category: program.domain }
        });
        await prisma.studentSkill.upsert({
          where: { studentId_skillId: { studentId: student.id, skillId: skill.id } },
          update: { level: 'ADVANCED', evidenceUrl: `provider:${program.provider};credential:${certCode};score:${calculatedScore};certUrl:${certUrl}` },
          create: { studentId: student.id, skillId: skill.id, level: 'ADVANCED', evidenceUrl: `provider:${program.provider};credential:${certCode};score:${calculatedScore};certUrl:${certUrl}` }
        });
      }
    }

    res.json({
      message: `Graded successfully! Final Score (${calculatedScore}%) and Official Certificate (${certCode}) issued to student.`,
      enrollment: updated
    });
  } catch (error) {
    console.error('Student grading failed:', error);
    res.status(500).json({ error: 'Could not submit student marks.' });
  }
});

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
