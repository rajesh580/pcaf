const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const { ENHANCEMENT_PROGRAMS_CATALOG } = require('../config/enhancementCatalog');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');

const router = express.Router();

let programs = [...ENHANCEMENT_PROGRAMS_CATALOG];
let enrollments = [];

/**
 * 1. Get All Skill Enhancement Programs (with search & domain filters)
 */
router.get('/', (req, res) => {
  const { domain, mode, search } = req.query;

  let filtered = [...programs];
  if (domain) filtered = filtered.filter((p) => p.domain.toLowerCase().includes(domain.toLowerCase()));
  if (mode) filtered = filtered.filter((p) => p.mode.toUpperCase() === mode.toUpperCase());
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter((p) =>
      p.title.toLowerCase().includes(term) ||
      p.skillsCovered.some((s) => s.toLowerCase().includes(term))
    );
  }

  res.json({ total: filtered.length, programs: filtered });
});

/**
 * 2. Publish New Skill Development Program (by partner companies or training orgs)
 */
router.post('/publish', authenticate, checkPermission('SKILL_PROGRAM_PUBLISH'), (req, res) => {
  const {
    title, domain, skillsCovered = [], mode = 'ONLINE',
    format, durationWeeks = 4, assessmentType
  } = req.body;

  if (!title || !domain || !skillsCovered.length) {
    return res.status(400).json({ error: 'Title, domain, and skillsCovered are required.' });
  }

  const newProgram = {
    id: `enh_${Date.now()}`,
    title,
    domain,
    skillsCovered,
    mode,
    format: format || 'Live Interactive Sessions + On-Demand Labs',
    durationWeeks: parseInt(durationWeeks, 10),
    provider: req.user.name || req.user.email || 'Partner Skill Academy',
    hasCertificate: true,
    assessmentType: assessmentType || 'Timed Online Test + Project Submission'
  };

  programs.push(newProgram);
  res.status(201).json({ message: 'Program published successfully', program: newProgram });
});

/**
 * 3. Recommend Programs strictly mapped to identified Skill Gaps
 */
router.post('/recommend-by-gaps', authenticate, (req, res) => {
  const { skillGaps = [] } = req.body;

  if (!skillGaps.length) {
    return res.json({ recommendedPrograms: [] });
  }

  const matchedPrograms = [];
  const normalizedGaps = skillGaps.map((g) => (typeof g === 'string' ? g : g.name).toLowerCase());

  programs.forEach((prog) => {
    const coversGap = prog.skillsCovered.some((s) => normalizedGaps.includes(s.toLowerCase()));
    if (coversGap) {
      matchedPrograms.push(prog);
    }
  });

  res.json({
    identifiedGapsCount: skillGaps.length,
    recommendedCount: matchedPrograms.length,
    programs: matchedPrograms
  });
});

/**
 * 4. Step 5 & 6: Student Enrolls in Recommended Program
 */
router.post('/:id/enroll', authenticate, (req, res) => {
  const prog = programs.find((p) => p.id === req.params.id);
  if (!prog) return res.status(404).json({ error: 'Program not found.' });

  const studentId = req.user.id || 'std_1';
  const enrollment = {
    id: `enr_${Date.now()}`,
    programId: prog.id,
    programTitle: prog.title,
    studentId,
    status: 'IN_PROGRESS',
    enrolledAt: new Date().toISOString(),
    completedAt: null,
    certificateUrl: null
  };

  enrollments.push(enrollment);

  res.status(201).json({
    message: `Enrolled successfully in ${prog.title}. Complete projects and evaluations to update your verified profile!`,
    enrollment
  });
});

/**
 * 5. Complete Assessment, Issue Certificate, Update Student Profile & Recalculate Match
 * (Executes Step 6 & 7 & Loop back to Recalculate Match)
 */
router.post('/:id/complete-and-recalculate', authenticate, (req, res) => {
  const { student, targetJobRequirement, testScore = 90 } = req.body;
  const prog = programs.find((p) => p.id === req.params.id);

  if (!prog) return res.status(404).json({ error: 'Program not found.' });
  if (!student) return res.status(400).json({ error: 'Student payload required.' });

  // 1. Issue verified certificate
  const certId = `CERT_${Date.now()}`;
  const certificateUrl = `https://res.cloudinary.com/sosxkeyo/raw/upload/pfac/certificates/${certId}.pdf`;

  // 2. Automatically update student profile with upgraded skills
  const updatedStudent = JSON.parse(JSON.stringify(student));
  prog.skillsCovered.forEach((coveredSkill) => {
    const existingIdx = updatedStudent.skills.findIndex(
      (s) => (s.name || s.skill?.name || '').toLowerCase() === coveredSkill.toLowerCase()
    );

    if (existingIdx >= 0) {
      updatedStudent.skills[existingIdx].level = 'INTERMEDIATE';
      updatedStudent.skills[existingIdx].evidence = {
        type: 'TRAINING_COMPLETED',
        url: certificateUrl,
        assessmentScore: testScore
      };
    } else {
      updatedStudent.skills.push({
        id: `sk_${Date.now()}_${coveredSkill}`,
        name: coveredSkill,
        level: 'INTERMEDIATE',
        evidence: {
          type: 'TRAINING_COMPLETED',
          url: certificateUrl,
          assessmentScore: testScore
        }
      });
    }
  });

  // 3. Recalculate Match against Job Requirement
  let recalculation = null;
  if (targetJobRequirement) {
    const oldScore = evaluateSkillMatch(student, targetJobRequirement);
    const newScore = evaluateSkillMatch(updatedStudent, targetJobRequirement);
    recalculation = {
      previousMatchScore: `${oldScore.matchScore}%`,
      newMatchScore: `${newScore.matchScore}%`,
      scoreDelta: `+${newScore.matchScore - oldScore.matchScore}%`,
      unlockedOpportunitiesNotification: `Your match score increased to ${newScore.matchScore}%! You are now eligible for direct shortlisting.`
    };
  }

  res.json({
    message: `Assessment cleared with score ${testScore}%! Verified certificate issued and profile updated.`,
    certificate: {
      certificateId: certId,
      certificateUrl,
      issuedTo: student.name || 'Student Candidate',
      program: prog.title
    },
    updatedSkills: updatedStudent.skills,
    recalculation
  });
});

module.exports = router;
