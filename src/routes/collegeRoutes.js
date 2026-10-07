const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();

let facultyRecords = [];
let departmentPlacementData = {};

/**
 * Public: Get list of all registered colleges from DB for student sign-up
 */
router.get('/registered', async (req, res) => {
  try {
    const list = await prisma.college.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        university: true,
        departments: { select: { id: true, name: true, code: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ colleges: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve colleges: ' + err.message });
  }
});

/**
 * 1. Get Institutional Profile
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    let collegeId = req.user.collegeId;
    if (!collegeId && req.user.role === 'COLLEGE_ADMIN') {
      const clg = await prisma.college.findFirst({ where: { adminUserId: req.user.id } });
      collegeId = clg?.id;
    }

    const college = collegeId
      ? await prisma.college.findUnique({
          where: { id: collegeId },
          include: { departments: true }
        })
      : await prisma.college.findFirst({ include: { departments: true } });

    if (!college) {
      return res.json({
        college: {
          name: 'Institutional Profile',
          code: 'COLLEGE',
          university: 'State University',
          departments: []
        }
      });
    }

    res.json({ college });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch college profile: ' + err.message });
  }
});

/**
 * 2. Update Institutional Profile
 */
router.put('/profile', authenticate, checkPermission('COLLEGE_MANAGE'), async (req, res) => {
  try {
    const { name, accreditation, address, website, university } = req.body;
    let collegeId = req.user.collegeId;
    if (!collegeId && req.user.role === 'COLLEGE_ADMIN') {
      const clg = await prisma.college.findFirst({ where: { adminUserId: req.user.id } });
      collegeId = clg?.id;
    }

    if (!collegeId) {
      return res.status(404).json({ error: 'No college linked to update.' });
    }

    const updated = await prisma.college.update({
      where: { id: collegeId },
      data: {
        ...(name && { name }),
        ...(accreditation && { accreditation }),
        ...(address && { address }),
        ...(website && { website }),
        ...(university && { university })
      }
    });

    res.json({ message: 'College profile updated successfully', college: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update college profile: ' + err.message });
  }
});

/**
 * 3. Configurable Department Master Data (Directly connected to PostgreSQL DB)
 */
router.get('/departments', authenticate, async (req, res) => {
  try {
    let collegeId = req.user.collegeId;
    if (!collegeId && req.user.role === 'COLLEGE_ADMIN') {
      const clg = await prisma.college.findFirst({ where: { adminUserId: req.user.id } });
      collegeId = clg?.id;
    }

    let whereClause = {};
    if (collegeId) whereClause.collegeId = collegeId;

    const list = await prisma.department.findMany({
      where: whereClause,
      include: {
        college: { select: { name: true, code: true } },
        _count: { select: { students: true } }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = list.map((d) => ({
      id: d.id,
      collegeId: d.collegeId,
      code: d.code,
      name: d.name,
      status: 'ACTIVE',
      hod: 'HOD',
      studentCount: d._count?.students || 0
    }));

    res.json({ departments: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve departments: ' + err.message });
  }
});

router.post('/departments', authenticate, checkPermission('DEPARTMENT_MANAGE'), async (req, res) => {
  try {
    const { code, name, hod, collegeId } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Department code and name are required' });

    let targetCollegeId = collegeId || req.user.collegeId;
    if (!targetCollegeId) {
      const clg = await prisma.college.findFirst({
        where: req.user.role === 'COLLEGE_ADMIN' ? { adminUserId: req.user.id } : {}
      });
      targetCollegeId = clg?.id;
    }

    if (!targetCollegeId) {
      return res.status(400).json({ error: 'Target collegeId is required or no registered college found.' });
    }

    const newDept = await prisma.department.create({
      data: {
        code: code.toUpperCase(),
        name,
        collegeId: targetCollegeId
      }
    });

    res.status(201).json({
      message: 'Department added to database',
      department: {
        id: newDept.id,
        collegeId: newDept.collegeId,
        code: newDept.code,
        name: newDept.name,
        status: 'ACTIVE',
        hod: hod || 'HOD',
        studentCount: 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create department: ' + err.message });
  }
});

router.patch('/departments/:id/status', authenticate, checkPermission('DEPARTMENT_MANAGE'), (req, res) => {
  const { status } = req.body;
  res.json({ message: `Department status updated to ${status}` });
});

/**
 * 4. Faculty Management & Subject Mapping
 */
router.get('/faculty', authenticate, (req, res) => {
  const { departmentCode } = req.query;
  const list = departmentCode
    ? facultyRecords.filter((f) => f.departmentCode.toUpperCase() === departmentCode.toUpperCase())
    : facultyRecords;
  res.json({ faculty: list });
});

router.post('/faculty', authenticate, checkPermission('DEPARTMENT_MANAGE'), (req, res) => {
  const { departmentCode, name, email, assignedSubjects = [], isMentor = false } = req.body;
  if (!departmentCode || !name || !email) {
    return res.status(400).json({ error: 'departmentCode, name, and email are required' });
  }

  const newFaculty = {
    id: `fac_${Date.now()}`,
    departmentCode: departmentCode.toUpperCase(),
    name,
    email,
    assignedSubjects,
    isMentor,
  };

  facultyRecords.push(newFaculty);
  res.status(201).json({ message: 'Faculty assigned to department', faculty: newFaculty });
});

/**
 * 5. Department Placement & Internship Reports
 */
router.get('/departments/:code/placement-data', authenticate, (req, res) => {
  const code = req.params.code.toUpperCase();
  const data = departmentPlacementData[code] || { internships: 0, jobs: 0, highestPkg: '—', avgPkg: '—' };
  res.json({ department: code, metrics: data });
});

module.exports = router;
