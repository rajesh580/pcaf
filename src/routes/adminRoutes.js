const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate, checkPermission } = require('../middleware/auth');
const { ROLES } = require('../config/rolesAndPermissions');
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const { cacheCloudinaryResume } = require('../services/resumeAssetService');

const router = express.Router();

// Administrative audit history is currently process-local.
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
    const [totalUsers, totalStudents, activeStudents, activeOpportunities, totalColleges, totalCompanies, selectedApplications] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true, isVerified: true } }),
      prisma.opportunity.count({ where: { status: 'ACTIVE', deadline: { gte: new Date() } } }),
      prisma.college.count(),
      prisma.company.count(),
      prisma.application.count({ where: { status: { in: ['SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'] } } })
    ]);

    res.json({
      kpis: {
        totalColleges,
        totalCompanies,
        totalStudents,
        totalUsers,
        activeStudents,
        opportunities: activeOpportunities,
        placementPercentage: totalStudents > 0 ? `${Math.round((selectedApplications / totalStudents) * 100)}%` : '0%'
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

    const currentYear = new Date().getFullYear();
    const adminSemester = req.body.semester !== undefined ? Number(req.body.semester) : 1;
    const adminCgpa = req.body.cgpa !== undefined ? parseFloat(req.body.cgpa) : 0.0;
    const adminAdmissionYear = req.body.admissionYear ? Number(req.body.admissionYear) : currentYear;
    const adminGraduationYear = req.body.graduationYear ? Number(req.body.graduationYear) : (currentYear + 4);

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
              usn: req.body.usn || `USN${Date.now().toString().slice(-6)}`,
              admissionYear: adminAdmissionYear,
              graduationYear: adminGraduationYear,
              semester: adminSemester,
              cgpa: adminCgpa,
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
        photoUrl: true,
        studentProfile: {
          select: {
            id: true,
            usn: true,
            cgpa: true,
            semester: true,
            admissionYear: true,
            graduationYear: true,
            backlogs: true,
            resumeUrl: true,
            githubUrl: true,
            linkedinUrl: true,
            department: { select: { code: true, name: true } },
            college: { select: { name: true, code: true } },
            skills: { select: { level: true, skill: { select: { name: true, category: true } } } },
            certifications: { select: { name: true } },
            projects: { select: { title: true } },
            applications: {
              select: {
                status: true,
                createdAt: true,
                opportunity: { select: { title: true, type: true, company: { select: { name: true } } } },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
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

router.get('/students/:studentUserId/resume', authenticate, checkPermission('STUDENT_ALL_VIEW'), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.params.studentUserId },
      select: {
        resumeUrl: true,
        collegeId: true,
        departmentId: true,
        college: { select: { adminUserId: true } },
        department: { select: { code: true } },
      },
    });
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });

    const globalAdmin = ['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role);
    const collegeAdmin = req.user.role === 'COLLEGE_ADMIN'
      && (student.collegeId === req.user.collegeId || student.college?.adminUserId === req.user.id);
    const departmentAdmin = ['DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR'].includes(req.user.role)
      && ((req.user.departmentId && (student.departmentId === req.user.departmentId || student.department?.code === String(req.user.departmentId).toUpperCase()))
        || (!req.user.departmentId && req.user.collegeId === student.collegeId));
    if (!globalAdmin && !collegeAdmin && !departmentAdmin) return res.status(403).json({ error: 'You cannot view this student resume.' });
    if (!student.resumeUrl) return res.status(404).json({ error: 'No resume is linked to this student profile.' });

    // Handle local file stored on disk
    if (student.resumeUrl.startsWith('/uploads/')) {
      const localFilePath = path.join(__dirname, '../..', student.resumeUrl);
      if (fs.existsSync(localFilePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="student-resume.pdf"');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-store');
        return fs.createReadStream(localFilePath).pipe(res);
      }
    }

    const cached = await cacheCloudinaryResume(student.resumeUrl);
    if (cached.extension !== '.pdf') return res.status(415).json({ error: 'This resume is not a PDF and cannot be previewed inline.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="student-resume.pdf"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    return fs.createReadStream(cached.filePath).pipe(res);
  } catch (error) {
    if (error instanceof TypeError) return res.status(400).json({ error: 'The linked resume URL is invalid.' });
    console.error('Admin student resume lookup failed:', error);
    res.status(502).json({ error: error.message || 'Could not load this student resume.' });
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

/**
 * College-specific administration portal for platform administrators.
 */
router.get('/colleges/:id', authenticate, checkPermission('COLLEGE_MANAGE'), async (req, res) => {
  try {
    const userFields = {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
    };

    const college = await prisma.college.findUnique({
      where: { id: req.params.id },
      include: {
        adminUser: { select: userFields },
        users: {
          select: {
            ...userFields,
            department: { select: { id: true, name: true, code: true } },
          },
        },
        departments: {
          include: {
            users: { select: userFields },
            students: { select: { id: true } },
          },
          orderBy: { name: 'asc' },
        },
        students: {
          include: {
            user: { select: userFields },
            department: { select: { id: true, name: true, code: true } },
            applications: { select: { status: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!college) return res.status(404).json({ error: 'College not found.' });

    const peopleById = new Map();
    const addPerson = (person, department = null) => {
      if (!person) return;
      const previous = peopleById.get(person.id);
      peopleById.set(person.id, {
        ...previous,
        ...person,
        department: department || person.department || previous?.department || null,
      });
    };

    college.users.forEach((user) => addPerson(user));
    addPerson(college.adminUser);
    college.departments.forEach((department) => {
      department.users.forEach((user) => addPerson(user, { id: department.id, name: department.name, code: department.code }));
    });
    college.students.forEach((student) => addPerson(student.user, student.department));

    const people = Array.from(peopleById.values()).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
    const totalApplications = college.students.reduce((total, student) => total + student.applications.length, 0);
    const placedStudents = college.students.filter((student) =>
      student.applications.some((application) => ['SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'].includes(application.status))
    ).length;

    res.json({
      college: {
        id: college.id,
        name: college.name,
        code: college.code,
        university: college.university,
        accreditation: college.accreditation,
        address: college.address,
        website: college.website,
        createdAt: college.createdAt,
        people,
        departments: college.departments.map((department) => ({
          id: department.id,
          name: department.name,
          code: department.code,
          userCount: department.users.length,
          studentCount: department.students.length,
        })),
        students: college.students.map((student) => ({
          id: student.id,
          name: student.name,
          usn: student.usn,
          email: student.user?.email || '',
          isActive: student.user?.isActive !== false,
          department: student.department,
          semester: student.semester,
          cgpa: student.cgpa,
          applications: student.applications.length,
        })),
        stats: {
          totalUsers: people.length,
          activeUsers: people.filter((person) => person.isActive !== false).length,
          totalStudents: college.students.length,
          totalDepartments: college.departments.length,
          totalApplications,
          placedStudents,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load the college portal: ' + error.message });
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
router.get('/companies', authenticate, checkPermission('COMPANY_MANAGE'), async (req, res) => {
  try {
    const records = await prisma.company.findMany({
      include: {
        recruiters: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        },
        opportunities: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ companies: records.map((company) => ({ ...company, status: company.verificationStatus || (company.isVerified ? 'APPROVED' : 'PENDING_VERIFICATION') })) });
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve companies.' }); }
});

router.post('/companies', authenticate, checkPermission('COMPANY_MANAGE'), async (req, res) => {
  const { name, website } = req.body;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Company name is required' });
  try {
    const created = await prisma.company.create({ data: { name: name.trim(), website: website || '', isVerified: true, verificationStatus: 'APPROVED' } });
    res.status(201).json({ message: 'Company registered successfully', company: { ...created, status: 'APPROVED' } });
  } catch (error) { res.status(400).json({ error: 'Failed to register company. Check the company name and try again.' }); }
});

router.get('/companies/:id', authenticate, checkPermission('COMPANY_MANAGE'), async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        recruiters: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        opportunities: {
          include: {
            applications: {
              select: {
                id: true,
                status: true,
                matchScore: true,
                createdAt: true,
                student: {
                  select: {
                    id: true,
                    name: true,
                    usn: true,
                    cgpa: true,
                    department: { select: { code: true, name: true } },
                    college: { select: { name: true, code: true } }
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Also fetch any users explicitly assigned recruiterAtId = id
    const additionalUsers = await prisma.user.findMany({
      where: { recruiterAtId: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const recruiterMap = new Map();
    company.recruiters.forEach(u => recruiterMap.set(u.id, u));
    additionalUsers.forEach(u => recruiterMap.set(u.id, u));
    const allUsers = Array.from(recruiterMap.values());

    const totalApplications = company.opportunities.reduce((acc, opp) => acc + opp.applications.length, 0);
    const selectedApplications = company.opportunities.reduce((acc, opp) => {
      return acc + opp.applications.filter(a => ['SELECTED', 'JOINED', 'COMPLETED', 'INTERNSHIP_COMPLETED'].includes(a.status)).length;
    }, 0);

    res.json({
      company: {
        ...company,
        status: company.verificationStatus || (company.isVerified ? 'APPROVED' : 'PENDING_VERIFICATION'),
        recruiters: allUsers,
        stats: {
          totalRecruiters: allUsers.length,
          totalOpportunities: company.opportunities.length,
          totalApplications,
          selectedApplications
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve company details: ' + error.message });
  }
});

router.put('/companies/:id', authenticate, checkPermission('COMPANY_MANAGE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, website, status } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Company name is required' });

    const updateData = {
      name: name.trim(),
      website: website !== undefined ? website.trim() : ''
    };
    if (status && ['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING_VERIFICATION'].includes(status)) {
      updateData.verificationStatus = status;
      updateData.isVerified = status === 'APPROVED';
    }

    const updated = await prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        recruiters: {
          select: { id: true, name: true, email: true, role: true, isActive: true, isVerified: true, createdAt: true }
        },
        opportunities: {
          select: { id: true, title: true, type: true, status: true }
        }
      }
    });

    res.json({
      message: 'Company details updated successfully',
      company: { ...updated, status: updated.verificationStatus || (updated.isVerified ? 'APPROVED' : 'PENDING_VERIFICATION') }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company details: ' + error.message });
  }
});

router.delete('/companies/:id', authenticate, checkPermission('COMPANY_MANAGE'), async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id }, include: { recruiters: true, opportunities: true } });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (company.recruiters.length || company.opportunities.length) return res.status(409).json({ error: 'This company has linked recruiters or opportunities. Deactivate it instead of deleting it.' });
    await prisma.company.delete({ where: { id: company.id } });
    res.json({ message: 'Company removed successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to remove company.' }); }
});

router.patch('/companies/:id/status', authenticate, checkPermission('COMPANY_VERIFY'), async (req, res) => {
  const { status } = req.body;
  if (!['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING_VERIFICATION'].includes(status)) return res.status(400).json({ error: 'Invalid company status.' });
  try {
    const updated = await prisma.company.update({ where: { id: req.params.id }, data: { verificationStatus: status, isVerified: status === 'APPROVED' } });
    auditLogs.unshift({ id: `log_${Date.now()}`, action: `COMPANY_${status}`, targetId: updated.id, performedBy: req.user.email, timestamp: new Date().toISOString() });
    res.json({ message: `Company status updated to ${status}`, company: { ...updated, status } });
  } catch (error) { res.status(error.code === 'P2025' ? 404 : 500).json({ error: error.code === 'P2025' ? 'Company not found.' : 'Could not update company status.' }); }
});

/**
 * 8. Super Admin: Broadcast Notifications
 */
router.get('/notifications', authenticate, checkPermission('USER_CREATE'), (req, res) => {
  const { centralNotifications } = require('./notificationRoutes');
  const broadcasts = centralNotifications.filter((n) => n.recipientId === 'broadcast' || n.event === 'SYSTEM_BROADCAST');
  res.json({ total: broadcasts.length, notifications: broadcasts });
});

router.post('/notifications', authenticate, checkPermission('USER_CREATE'), (req, res) => {
  const { title, message, targetAudience = 'ALL' } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

  const { sendNotification } = require('./notificationRoutes');
  const { NOTIFICATION_CHANNELS } = require('../config/notificationsTaxonomy');

  const audienceRoleMap = {
    STUDENTS: 'STUDENT',
    COLLEGES: 'COLLEGE_ADMIN',
    COMPANIES: 'COMPANY_ADMIN',
  };

  const recipientRole = audienceRoleMap[targetAudience] || undefined;

  const notification = sendNotification({
    recipientId: 'broadcast',
    recipientRole,
    event: 'SYSTEM_BROADCAST',
    data: { title, message },
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
  });

  notification.targetAudience = targetAudience;
  notification.createdBy = req.user.email;

  platformNotifications.unshift(notification);
  res.status(201).json({ message: 'Platform broadcast notification created and dispatched successfully', notification });
});

/**
 * 9. Super Admin: Audit Logs
 */
router.get('/audit-logs', authenticate, checkPermission('AUDIT_LOG_VIEW'), (req, res) => {
  res.json({ total: auditLogs.length, auditLogs });
});

module.exports = router;
