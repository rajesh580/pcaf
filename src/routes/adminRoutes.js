const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const { ROLES } = require('../config/rolesAndPermissions');
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Managed in-memory registries for administrative actions
let colleges = [];
let companies = [];
let opportunities = [];
let auditLogs = [
  {
    id: 'log_init',
    action: 'PLATFORM_INITIALIZED',
    targetId: 'SYSTEM',
    performedBy: 'admin@mail.com',
    timestamp: new Date().toISOString()
  }
];
let platformNotifications = [];

/**
 * 1. Super Admin Dashboard Analytics (Computed live from database and real entities)
 */
router.get('/dashboard', authenticate, checkPermission('REPORT_VIEW_ALL'), async (req, res) => {
  try {
    const [totalUsers, totalStudents, verifiedUsers, activeOpportunities] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.opportunity.count().catch(() => opportunities.filter(o => o.status === 'ACTIVE').length)
    ]);

    const approvedColleges = colleges.filter(c => c.status === 'APPROVED').length;
    const approvedCompanies = companies.filter(c => c.status === 'APPROVED').length;

    res.json({
      kpis: {
        totalColleges: approvedColleges,
        totalCompanies: approvedCompanies,
        totalStudents,
        totalUsers,
        activeStudents: verifiedUsers,
        opportunities: activeOpportunities,
        placementPercentage: totalStudents > 0 ? '0%' : '0%'
      },
      platformHealth: 'OPERATIONAL',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute dashboard metrics: ' + error.message });
  }
});

/**
 * 2. Super Admin & College Admin: List registered platform users
 */
router.get('/users', authenticate, checkPermission('USER_VIEW'), async (req, res) => {
  try {
    let whereClause = {};

    // Scoping for College Admin and Department Admin
    if (req.user.role === 'COLLEGE_ADMIN') {
      const adminCollege = await prisma.college.findFirst({
        where: { OR: [{ adminUserId: req.user.id }, { id: req.user.collegeId || '' }] }
      });
      if (adminCollege) {
        whereClause.collegeId = adminCollege.id;
      }
    } else if (req.user.role === 'DEPARTMENT_ADMIN') {
      let collegeId = req.user.collegeId;
      if (!collegeId && req.user.departmentId) {
        const dept = await prisma.department.findFirst({
          where: { OR: [{ id: req.user.departmentId }, { code: req.user.departmentId.toUpperCase() }] }
        }).catch(() => null);
        if (dept) collegeId = dept.collegeId;
      }
      if (collegeId) {
        whereClause.collegeId = collegeId;
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        collegeId: true,
        departmentId: true,
        college: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ total: users.length, users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users: ' + error.message });
  }
});

/**
 * 3. Add new user directly into Neon DB (Supports College Admin & Dept Admin assignment)
 */
router.post('/users', authenticate, checkPermission('USER_CREATE'), async (req, res) => {
  try {
    const { email, password, role = 'STUDENT', name, isActive = true, collegeId, departmentId, companyId, companyName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedRole = role.toUpperCase();
    if (!Object.values(ROLES).includes(normalizedRole)) {
      return res.status(400).json({
        error: `Invalid role specified. Supported roles: ${Object.values(ROLES).join(', ')}`
      });
    }

    let assignedCollegeId = collegeId || null;
    let assignedDeptId = null;
    let assignedCompanyId = companyId || req.user.recruiterAtId || null;

    // Scoping check for College Admin
    if (req.user.role === 'COLLEGE_ADMIN') {
      const adminCollege = await prisma.college.findFirst({
        where: { OR: [{ adminUserId: req.user.id }, { id: req.user.collegeId || '' }] }
      });
      if (!adminCollege) {
        return res.status(403).json({ error: 'Your College Admin account is not linked to any registered college.' });
      }
      assignedCollegeId = adminCollege.id;

      // College Admin can create Department Admin, Faculty Coordinator, or Student
      if (!['DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT'].includes(normalizedRole)) {
        return res.status(403).json({ error: 'College Admins can only provision Department Admins, Faculty Coordinators, or Students.' });
      }
    }

    // Scoping check for Company Admin
    if (req.user.role === 'COMPANY_ADMIN') {
      if (req.user.recruiterAtId) {
        assignedCompanyId = req.user.recruiterAtId;
      }
      if (normalizedRole !== 'COMPANY_RECRUITER') {
        return res.status(403).json({ error: 'Company Admins can only provision Company Recruiters.' });
      }
    }

    // Resolve company for company roles
    if (['COMPANY_ADMIN', 'COMPANY_RECRUITER'].includes(normalizedRole)) {
      if (assignedCompanyId && typeof assignedCompanyId === 'string') {
        let comp = await prisma.company.findUnique({ where: { id: assignedCompanyId.trim() } }).catch(() => null);
        if (!comp) {
          comp = await prisma.company.findFirst({ where: { name: { equals: assignedCompanyId.trim(), mode: 'insensitive' } } }).catch(() => null);
        }
        if (comp) assignedCompanyId = comp.id;
      }

      if (!assignedCompanyId && companyName) {
        let comp = await prisma.company.findFirst({ where: { name: { equals: companyName.trim(), mode: 'insensitive' } } }).catch(() => null);
        if (!comp) {
          comp = await prisma.company.create({
            data: { name: companyName.trim(), website: '', isVerified: true }
          }).catch(() => null);
        }
        if (comp) assignedCompanyId = comp.id;
      }

      if (!assignedCompanyId) {
        let defaultComp = await prisma.company.findFirst().catch(() => null);
        if (!defaultComp) {
          defaultComp = await prisma.company.create({
            data: { name: 'Global Tech Corp', website: 'https://techcorp.example.com', isVerified: true }
          }).catch(() => null);
        }
        if (defaultComp) assignedCompanyId = defaultComp.id;
      }
    }

    // Safely resolve departmentId to a valid Department UUID in DB
    if (departmentId && typeof departmentId === 'string' && departmentId.trim() !== '') {
      let dept = await prisma.department.findUnique({ where: { id: departmentId.trim() } }).catch(() => null);
      if (!dept && assignedCollegeId) {
        dept = await prisma.department.findFirst({
          where: { code: departmentId.trim().toUpperCase(), collegeId: assignedCollegeId }
        }).catch(() => null);
      }
      if (!dept) {
        dept = await prisma.department.findFirst({
          where: { code: departmentId.trim().toUpperCase() }
        }).catch(() => null);
      }
      // If department record does not exist in DB yet, auto-create it
      if (!dept) {
        let collegeIdForDept = assignedCollegeId;
        if (!collegeIdForDept) {
          const defaultCollege = await prisma.college.findFirst();
          collegeIdForDept = defaultCollege?.id;
        }
        if (collegeIdForDept) {
          dept = await prisma.department.create({
            data: {
              name: `${departmentId.trim().toUpperCase()} Department`,
              code: departmentId.trim().toUpperCase(),
              collegeId: collegeIdForDept
            }
          }).catch(() => null);
        }
      }
      assignedDeptId = dept ? dept.id : null;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email address is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || '',
        passwordHash,
        role: normalizedRole,
        isActive: Boolean(isActive),
        isVerified: true,
        collegeId: assignedCollegeId,
        departmentId: assignedDeptId,
        recruiterAtId: assignedCompanyId,
        ...(normalizedRole === 'STUDENT' && assignedCollegeId && assignedDeptId && {
          studentProfile: {
            create: {
              name: name || email.split('@')[0],
              usn: `USN${Date.now().toString().slice(-6)}`,
              admissionYear: 2023,
              graduationYear: 2027,
              semester: 6,
              cgpa: 7.5,
              collegeId: assignedCollegeId,
              departmentId: assignedDeptId
            }
          }
        })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        collegeId: true,
        departmentId: true,
        recruiterAtId: true,
        college: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        recruiterAt: { select: { id: true, name: true, website: true } }
      }
    });

    // If role is COLLEGE_ADMIN and collegeId is specified, link College.adminUserId
    if (normalizedRole === 'COLLEGE_ADMIN' && assignedCollegeId) {
      await prisma.college.update({
        where: { id: assignedCollegeId },
        data: { adminUserId: newUser.id }
      }).catch(() => null);
    }

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      action: `USER_CREATED_${normalizedRole}`,
      targetId: newUser.id,
      performedBy: req.user.email,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: `User created successfully with role ${normalizedRole}`,
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user in database: ' + error.message });
  }
});

/**
 * 4. Super Admin: Delete user from Neon DB
 */
router.delete('/users/:id', authenticate, (req, res, next) => {
  if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_ADMIN') {
    return next();
  }
  return checkPermission('USER_DELETE')(req, res, next);
}, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { studentProfile: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cascade delete student related data if user has a student profile
    if (user.studentProfile) {
      const studentId = user.studentProfile.id;
      await prisma.$transaction([
        prisma.studentSkill.deleteMany({ where: { studentId } }),
        prisma.application.deleteMany({ where: { studentId } }),
        prisma.certification.deleteMany({ where: { studentId } }),
        prisma.project.deleteMany({ where: { studentId } }),
        prisma.student.delete({ where: { id: studentId } }),
        prisma.user.delete({ where: { id } })
      ]);
    } else {
      // Disconnect if college admin
      await prisma.college.updateMany({
        where: { adminUserId: id },
        data: { adminUserId: null }
      });
      await prisma.user.delete({ where: { id } });
    }

    auditLogs.unshift({
      id: `log_${Date.now()}`,
      action: `USER_DELETED_${user.role}`,
      targetId: id,
      performedBy: req.user.email,
      timestamp: new Date().toISOString()
    });

    res.json({ message: `User ${user.email} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user: ' + error.message });
  }
});

/**
 * 5. Super Admin: View all students (Profiles and Student Accounts)
 */
router.get('/students', authenticate, checkPermission('STUDENT_ALL_VIEW'), async (req, res) => {
  try {
    let whereClause = { role: 'STUDENT' };

    if (req.user.role === 'COLLEGE_ADMIN') {
      let collegeId = req.user.collegeId;
      if (!collegeId) {
        const adminCollege = await prisma.college.findFirst({
          where: { OR: [{ adminUserId: req.user.id }, { id: req.user.collegeId || '' }] }
        });
        if (adminCollege) collegeId = adminCollege.id;
      }
      if (collegeId) {
        whereClause.OR = [
          { collegeId: collegeId },
          { studentProfile: { collegeId: collegeId } }
        ];
      }
    } else if (req.user.role === 'DEPARTMENT_ADMIN' || req.user.role === 'FACULTY_COORDINATOR') {
      let deptIdOrCode = req.user.departmentId;
      if (deptIdOrCode) {
        whereClause.OR = [
          { departmentId: deptIdOrCode },
          { studentProfile: { departmentId: deptIdOrCode } },
          { studentProfile: { department: { code: deptIdOrCode.toUpperCase() } } }
        ];
      } else if (req.user.collegeId) {
        whereClause.OR = [
          { collegeId: req.user.collegeId },
          { studentProfile: { collegeId: req.user.collegeId } }
        ];
      }
    }

    const studentUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        studentProfile: {
          select: {
            id: true,
            usn: true,
            cgpa: true,
            semester: true,
            graduationYear: true,
            resumeUrl: true,
            department: { select: { code: true, name: true } },
            college: { select: { name: true, code: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ total: studentUsers.length, students: studentUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students: ' + error.message });
  }
});

/**
 * 6. Super Admin: Colleges registry & deletion (Directly connected to PostgreSQL DB)
 */
router.get('/colleges', authenticate, async (req, res) => {
  try {
    const list = await prisma.college.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = list.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      status: 'APPROVED',
      registrationDate: c.createdAt.toISOString().split('T')[0]
    }));
    res.json({ colleges: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve colleges: ' + err.message });
  }
});

router.post('/colleges', authenticate, checkPermission('COLLEGE_MANAGE'), async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'College name and code are required' });

    const newCollege = await prisma.college.create({
      data: {
        name,
        code: code.toUpperCase(),
        university: 'State University'
      }
    });

    res.status(201).json({
      message: 'College added successfully to database',
      college: {
        id: newCollege.id,
        name: newCollege.name,
        code: newCollege.code,
        status: 'APPROVED',
        registrationDate: newCollege.createdAt.toISOString().split('T')[0]
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add college: ' + err.message });
  }
});

router.delete('/colleges/:id', authenticate, checkPermission('COLLEGE_MANAGE'), async (req, res) => {
  try {
    const { id } = req.params;
    // Remove related departments first
    await prisma.department.deleteMany({ where: { collegeId: id } });
    await prisma.college.delete({ where: { id } });
    res.json({ message: 'College removed successfully from database' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete college: ' + err.message });
  }
});

/**
 * 7. Super Admin: Companies registry & deletion
 */
router.get('/companies', authenticate, (req, res) => {
  res.json({ companies });
});

router.post('/companies', authenticate, checkPermission('COMPANY_MANAGE') || checkPermission('COMPANY_VERIFY'), (req, res) => {
  const { name, website } = req.body;
  if (!name) return res.status(400).json({ error: 'Company name is required' });

  const newComp = {
    id: `comp_${Date.now()}`,
    name,
    website: website || '',
    verified: true,
    status: 'APPROVED',
    registrationDate: new Date().toISOString().split('T')[0]
  };
  companies.unshift(newComp);
  res.status(201).json({ message: 'Company registered successfully', company: newComp });
});

router.delete('/companies/:id', authenticate, checkPermission('COMPANY_MANAGE') || checkPermission('COMPANY_VERIFY'), (req, res) => {
  const index = companies.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Company not found' });
  companies.splice(index, 1);
  res.json({ message: 'Company removed successfully' });
});

router.patch('/companies/:id/status', authenticate, checkPermission('COMPANY_VERIFY'), (req, res) => {
  const { status } = req.body;
  const company = companies.find((c) => c.id === req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  company.status = status;
  company.verified = status === 'APPROVED';
  auditLogs.unshift({
    id: `log_${Date.now()}`,
    action: `COMPANY_${status}`,
    targetId: company.id,
    performedBy: req.user.email,
    timestamp: new Date().toISOString()
  });

  res.json({ message: `Company status updated to ${status}`, company });
});

/**
 * 8. Super Admin: Broadcast Notifications
 */
router.post('/notifications', authenticate, checkPermission('USER_CREATE'), (req, res) => {
  const { title, message, targetAudience = 'ALL' } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

  const notification = {
    id: `notif_${Date.now()}`,
    title,
    message,
    targetAudience,
    createdAt: new Date().toISOString(),
    createdBy: req.user.email
  };

  platformNotifications.unshift(notification);
  res.status(201).json({ message: 'Platform broadcast notification created', notification });
});

/**
 * 9. Super Admin: Audit Logs
 */
router.get('/audit-logs', authenticate, checkPermission('AUDIT_LOG_VIEW'), (req, res) => {
  res.json({ total: auditLogs.length, auditLogs });
});

module.exports = router;
