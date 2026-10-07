const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Mock store for Skill Hub Programs (Pillar C)
let skillPrograms = [];

let enrollments = [];

/**
 * Skill Provider: Publish a new Skill Enhancement Program
 */
router.post('/programs', authenticate, authorize('SKILL_PROVIDER', 'SUPER_ADMIN'), (req, res) => {
  const { title, skillTarget, targetLevel = 'INTERMEDIATE', provider, mode = 'ONLINE', durationWeeks, description } = req.body;

  if (!title || !skillTarget) {
    return res.status(400).json({ error: 'Title and target skill are required.' });
  }

  const newProgram = {
    id: `prog_${Date.now()}`,
    title,
    skillTarget,
    targetLevel,
    provider: provider || req.user.email || 'Partner Skill Hub',
    mode,
    durationWeeks: durationWeeks || 4,
    description: description || '',
    enrolledStudentIds: []
  };

  skillPrograms.push(newProgram);
  res.status(201).json({ message: 'Program published successfully', program: newProgram });
});

/**
 * Get all available skill enhancement programs
 */
router.get('/programs', (req, res) => {
  res.json({ programs: skillPrograms });
});

/**
 * Student enrolls in a skill enhancement program (Path 2: Upskilling Route)
 */
router.post('/programs/:id/enroll', authenticate, authorize('STUDENT'), (req, res) => {
  const program = skillPrograms.find((p) => p.id === req.params.id);
  if (!program) return res.status(404).json({ error: 'Program not found' });

  const studentId = req.user.id || 'std_1';
  if (!program.enrolledStudentIds.includes(studentId)) {
    program.enrolledStudentIds.push(studentId);
  }

  const enrollment = {
    id: `enr_${Date.now()}`,
    programId: program.id,
    studentId,
    status: 'IN_PROGRESS',
    enrolledAt: new Date().toISOString()
  };

  enrollments.push(enrollment);
  res.status(201).json({
    message: `Enrolled in ${program.title}. Complete coursework to upgrade your verified skill profile!`,
    enrollment
  });
});

/**
 * Complete Program & Upgrade Verified Skills (Path 2 Re-entry)
 * Upgrades the student's profile skill level and enables re-entry into opportunity pipeline
 */
router.post('/programs/:id/complete', authenticate, authorize('SKILL_PROVIDER', 'SUPER_ADMIN', 'STUDENT'), (req, res) => {
  const { student, certificateUrl } = req.body;
  const program = skillPrograms.find((p) => p.id === req.params.id);

  if (!program) return res.status(404).json({ error: 'Program not found' });

  // Update enrollment status
  const existingEnrollment = enrollments.find((e) => e.programId === program.id);
  if (existingEnrollment) {
    existingEnrollment.status = 'COMPLETED';
    existingEnrollment.completedAt = new Date().toISOString();
  }

  // Upgrade student's skill in profile
  let updatedSkills = student?.skills || [];
  const targetSkillIndex = updatedSkills.findIndex(
    (s) => (s.skill?.name || s.name || '').toLowerCase() === program.skillTarget.toLowerCase()
  );

  if (targetSkillIndex >= 0) {
    updatedSkills[targetSkillIndex].level = program.targetLevel;
    updatedSkills[targetSkillIndex].evidenceUrl = certificateUrl || 'https://skillhub.portal/verify/cert_' + Date.now();
  } else {
    updatedSkills.push({
      id: `sk_${Date.now()}`,
      name: program.skillTarget,
      level: program.targetLevel,
      evidenceUrl: certificateUrl || 'https://skillhub.portal/verify/cert_' + Date.now()
    });
  }

  res.json({
    message: `Skill training completed! '${program.skillTarget}' upgraded to ${program.targetLevel}. Profile is now re-evaluated for opportunity matching.`,
    updatedSkill: {
      name: program.skillTarget,
      newLevel: program.targetLevel,
      certificateUrl
    },
    updatedSkills
  });
});

module.exports = router;
