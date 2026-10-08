const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');
const { generateStandardizedResume } = require('../services/resumeGeneratorService');
const { TECHNICAL_SKILLS_TAXONOMY, VALID_SKILL_LEVELS, VALID_EVIDENCE_TYPES } = require('../config/skillsTaxonomy');

const router = express.Router();

/**
 * 0. Get Standardized Generated Resume (Section 9) - Generated strictly from Student's DB records
 */
router.get('/standardized-resume', authenticate, async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.user.id },
      include: {
        college: true,
        department: true,
        skills: { include: { skill: true } },
        certifications: true,
        projects: true
      }
    });

    if (!student) {
      return res.status(404).send('<h2>No student profile found. Please complete your profile first.</h2>');
    }

    const mappedProfile = {
      name: student.name,
      email: req.user.email,
      college: student.college?.name || 'Registered College',
      department: student.department?.name || 'Engineering',
      graduationYear: student.graduationYear || 2027,
      cgpa: student.cgpa || 0,
      resumeUrl: student.resumeUrl || null,
      skills: student.skills.map((s) => ({
        name: s.skill?.name || 'Skill',
        level: s.level || 'BEGINNER'
      })),
      certifications: student.certifications || [],
      projects: student.projects || [],
      academicProfile: {
        degree: 'B.E. / B.Tech',
        branch: student.department?.code || '',
        cgpa: student.cgpa || 0,
        semester: student.semester || 1,
        backlogs: student.backlogs || 0
      }
    };

    const htmlResume = generateStandardizedResume(mappedProfile);
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlResume);
  } catch (error) {
    res.status(500).send('<h2>Error generating resume: ' + error.message + '</h2>');
  }
});

/**
 * 1. Get Complete Profile from Neon DB
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.user.id },
      include: {
        college: true,
        department: true,
        skills: { include: { skill: true } },
        certifications: true,
        projects: true
      }
    });

    if (!student) {
      return res.json({ student: null });
    }

    res.json({
      student: {
        id: student.id,
        name: student.name,
        email: req.user.email,
        usn: student.usn,
        college: student.college?.name || '',
        department: student.department?.name || '',
        resumeUrl: student.resumeUrl || '',
        admissionYear: student.admissionYear,
        graduationYear: student.graduationYear,
        semester: student.semester,
        cgpa: student.cgpa,
        backlogs: student.backlogs,
        academicProfile: {
          degree: 'B.E. / B.Tech',
          branch: student.department?.code || '',
          semester: student.semester || 1,
          cgpa: student.cgpa || 0,
          tenthPercentage: 0,
          twelfthOrDiplomaPercentage: 0,
          backlogs: student.backlogs || 0,
          academicProjects: student.projects || [],
          certifications: student.certifications || []
        },
        skills: student.skills.map(s => ({
          id: s.id,
          name: s.skill?.name || '',
          level: s.level,
          evidenceUrl: s.evidenceUrl || ''
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile: ' + error.message });
  }
});

/**
 * 2. Update Academic Profile in Neon DB
 */
router.put('/academic-profile', authenticate, async (req, res) => {
  try {
    const { degree, branch, semester, cgpa, tenthPercentage, twelfthOrDiplomaPercentage, backlogs } = req.body;

    const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student record not found' });

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        semester: semester !== undefined ? parseInt(semester, 10) : student.semester,
        cgpa: cgpa !== undefined ? parseFloat(cgpa) : student.cgpa,
        backlogs: backlogs !== undefined ? parseInt(backlogs, 10) : student.backlogs
      }
    });

    res.json({
      message: 'Academic profile updated successfully in database',
      academicProfile: {
        degree: degree || 'B.E.',
        branch: branch || '',
        semester: updated.semester,
        cgpa: updated.cgpa,
        tenthPercentage: tenthPercentage || 0,
        twelfthOrDiplomaPercentage: twelfthOrDiplomaPercentage || 0,
        backlogs: updated.backlogs
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update academic profile: ' + error.message });
  }
});

/**
 * 3. Add Academic Project in Neon DB
 */
router.post('/projects', authenticate, async (req, res) => {
  try {
    const { title, techStack, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Project title is required' });

    const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const newProject = await prisma.project.create({
      data: {
        title: `${title}${techStack ? ` (${techStack})` : ''}`,
        studentId: student.id
      }
    });

    res.status(201).json({ message: 'Project added to database', project: newProject });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save project: ' + error.message });
  }
});

/**
 * 4. Add Certification in Neon DB
 */
router.post('/certifications', authenticate, async (req, res) => {
  try {
    const { name, issuer, issueDate } = req.body;
    if (!name) return res.status(400).json({ error: 'Certification name is required' });

    const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const newCert = await prisma.certification.create({
      data: {
        name: `${name}${issuer ? ` - ${issuer}` : ''}`,
        studentId: student.id
      }
    });

    res.status(201).json({ message: 'Certification added to database', certification: newCert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save certification: ' + error.message });
  }
});

/**
 * 5. Add / Update / Delete Technical Skills in Neon DB
 */
router.post('/skills', authenticate, async (req, res) => {
  try {
    const { name, level = 'INTERMEDIATE', evidenceUrl } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Skill name is required' });

    const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Upsert skill in Skill table
    const skillRecord = await prisma.skill.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim(), category: 'Technical' }
    });

    const levelUpper = (level || 'INTERMEDIATE').toUpperCase();
    const validLevel = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(levelUpper) ? levelUpper : 'INTERMEDIATE';

    // Upsert student skill
    await prisma.studentSkill.upsert({
      where: {
        studentId_skillId: {
          studentId: student.id,
          skillId: skillRecord.id
        }
      },
      update: { level: validLevel, evidenceUrl: evidenceUrl || null },
      create: {
        studentId: student.id,
        skillId: skillRecord.id,
        level: validLevel,
        evidenceUrl: evidenceUrl || null
      }
    });

    const updatedSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: { skill: true }
    });

    res.json({
      message: `Skill '${name.trim()}' saved to database`,
      skills: updatedSkills.map(s => ({ id: s.id, name: s.skill?.name || '', level: s.level, evidenceUrl: s.evidenceUrl || '' }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save skill: ' + error.message });
  }
});

router.put('/skills/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, evidenceUrl } = req.body;

    const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const existingSkill = await prisma.studentSkill.findFirst({
      where: {
        studentId: student.id,
        OR: [
          { id: id },
          { skillId: id },
          { skill: { name: { equals: id, mode: 'insensitive' } } }
        ]
      }
    });
    if (!existingSkill) return res.status(404).json({ error: 'Skill record not found' });

    let skillId = existingSkill.skillId;
    if (name && name.trim()) {
      const newSkillRecord = await prisma.skill.upsert({
        where: { name: name.trim() },
        update: {},
        create: { name: name.trim(), category: 'Technical' }
      });
      skillId = newSkillRecord.id;
    }

    const levelUpper = (level || existingSkill.level).toUpperCase();
    const validLevel = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(levelUpper) ? levelUpper : existingSkill.level;

    await prisma.studentSkill.update({
      where: { id: existingSkill.id },
      data: {
        skillId,
        level: validLevel,
        evidenceUrl: evidenceUrl !== undefined ? (evidenceUrl || null) : existingSkill.evidenceUrl
      }
    });

    const updatedSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: { skill: true }
    });

    res.json({
      message: 'Skill updated successfully',
      skills: updatedSkills.map(s => ({ id: s.id, name: s.skill?.name || '', level: s.level, evidenceUrl: s.evidenceUrl || '' }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update skill: ' + error.message });
  }
});

router.delete('/skills/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const existingSkill = await prisma.studentSkill.findFirst({
      where: {
        studentId: student.id,
        OR: [
          { id: id },
          { skillId: id },
          { skill: { name: { equals: id, mode: 'insensitive' } } }
        ]
      }
    });
    if (!existingSkill) return res.status(404).json({ error: 'Skill record not found' });

    await prisma.studentSkill.delete({ where: { id: existingSkill.id } });

    const updatedSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: { skill: true }
    });

    res.json({
      message: 'Skill removed successfully',
      skills: updatedSkills.map(s => ({ id: s.id, name: s.skill?.name || '', level: s.level, evidenceUrl: s.evidenceUrl || '' }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete skill: ' + error.message });
  }
});

/**
 * 6. Get Standard Skills Taxonomy
 */
router.get('/skills-taxonomy', (req, res) => {
  res.json({
    taxonomy: TECHNICAL_SKILLS_TAXONOMY,
    levels: VALID_SKILL_LEVELS,
    evidenceTypes: VALID_EVIDENCE_TYPES
  });
});

module.exports = router;
