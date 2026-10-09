const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { authenticate, revokeToken, checkPermission } = require('../middleware/auth');
const { ROLES, ROLE_PERMISSIONS_MAP } = require('../config/rolesAndPermissions');
const { getPersonaDashboard } = require('../services/personaService');

const router = express.Router();

let loginHistory = [];
let passwordResetTokens = new Map();

/**
 * 1. User Registration (Persists to Neon PostgreSQL via Prisma)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, collegeId, usn, departmentId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!collegeId) {
      return res.status(400).json({ error: 'Please select your registered college' });
    }

    // Verify college exists
    const college = await prisma.college.findUnique({
      where: { id: collegeId },
      include: { departments: true }
    });

    if (!college) {
      return res.status(404).json({ error: 'Selected college was not found' });
    }

    // Check if user already exists in Neon database
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email address is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Pick or create default department for college
    let deptId = departmentId;
    if (!deptId) {
      if (college.departments && college.departments.length > 0) {
        deptId = college.departments[0].id;
      } else {
        const newDept = await prisma.department.create({
          data: {
            name: 'General Engineering',
            code: 'ENGG',
            collegeId: college.id
          }
        });
        deptId = newDept.id;
      }
    }

    const generatedUsn = usn || `USN${Date.now().toString().slice(-6)}`;
    const currentYear = new Date().getFullYear();
    const reqSemester = req.body.semester !== undefined ? Number(req.body.semester) : 1;
    const reqCgpa = req.body.cgpa !== undefined ? parseFloat(req.body.cgpa) : 0.0;
    const reqAdmissionYear = req.body.admissionYear ? Number(req.body.admissionYear) : currentYear;
    const reqGraduationYear = req.body.graduationYear ? Number(req.body.graduationYear) : (currentYear + 4);

    // Save student user and connected student profile in Neon PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || '',
        passwordHash,
        role: 'STUDENT', // Only students can self-register
        isActive: true,
        isVerified: false,
        studentProfile: {
          create: {
            name: name || 'Student Candidate',
            usn: generatedUsn,
            admissionYear: reqAdmissionYear,
            graduationYear: reqGraduationYear,
            semester: reqSemester,
            cgpa: reqCgpa,
            collegeId: college.id,
            departmentId: deptId
          }
        }
      },
      include: {
        studentProfile: {
          include: { college: true }
        }
      }
    });

    // Create 24h verification token
    const verificationToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, purpose: 'email_verification' },
      process.env.JWT_SECRET || 'super_secret_jwt_key_pfac_portal_2026_dev_secure',
      { expiresIn: '24h' }
    );

    // Attempt email dispatch via Gmail SMTP
    let emailSent = false;
    try {
      await sendVerificationEmail(newUser.email, verificationToken);
      emailSent = true;
    } catch (mailErr) {
      console.warn('Email dispatch notice:', mailErr.message);
    }

    return res.status(201).json({
      message: 'Registration successful! A verification email has been sent to your registered email address. Please click the link in your email to verify your account before logging in.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive,
        isVerified: newUser.isVerified,
      },
      emailSent
    });
  } catch (error) {
    console.error('Registration DB Error:', error);
    return res.status(500).json({ error: 'Failed to create user in database: ' + error.message });
  }
});

/**
 * 2. Email Verification (Updates Neon database)
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Verification token is required' });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_pfac_portal_2026_dev_secure'
    );

    if (decoded.purpose !== 'email_verification') {
      return res.status(400).json({ error: 'Invalid token purpose' });
    }

    const updatedUser = await prisma.user.update({
      where: { email: decoded.email.toLowerCase() },
      data: { isVerified: true },
    });

    return res.json({
      message: 'Email verified successfully. Account is now active in database!',
      email: updatedUser.email,
      isVerified: updatedUser.isVerified,
    });
  } catch (error) {
    return res.status(400).json({ error: 'Verification link is invalid or expired' });
  }
});

/**
 * 3. User Login (Authenticates against Neon PostgreSQL)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown client';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Lookup user in database with full entity relations
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        college: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        recruiterAt: { select: { id: true, name: true, website: true, isVerified: true } },
        studentProfile: {
          include: {
            college: { select: { id: true, name: true, code: true } },
            department: { select: { id: true, name: true, code: true } }
          }
        },
        collegeAdmin: { select: { id: true, name: true, code: true } }
      }
    });

    const logAttempt = (status, reason = null) => {
      loginHistory.unshift({
        id: `log_${Date.now()}`,
        userId: user ? user.id : null,
        email,
        ipAddress,
        userAgent,
        status,
        reason,
        timestamp: new Date().toISOString(),
      });
    };

    if (!user) {
      logAttempt('FAILED', 'User not found in database');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      logAttempt('BLOCKED', 'Account inactive or suspended');
      return res.status(403).json({ error: 'Account is deactivated or suspended. Contact administrator.' });
    }

    if (['COMPANY_ADMIN', 'COMPANY_RECRUITER'].includes(user.role) && user.recruiterAt && !user.recruiterAt.isVerified) {
      logAttempt('BLOCKED', 'Company account is not approved');
      return res.status(403).json({ error: 'This company account is awaiting approval or has been suspended. Contact the platform administrator.' });
    }

    if (!user.isVerified) {
      logAttempt('BLOCKED', 'Account email not verified');
      return res.status(403).json({
        error: 'Please verify your email first before logging in. Check your inbox for the verification link.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logAttempt('FAILED', 'Incorrect password');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Resolve associated entities for role
    let resolvedCollegeId = user.collegeId || user.studentProfile?.collegeId || user.collegeAdmin?.id || null;
    let resolvedDeptId = user.departmentId || user.studentProfile?.departmentId || null;
    let resolvedCompanyId = user.recruiterAtId || null;

    let resolvedCollege = user.college || user.studentProfile?.college || user.collegeAdmin || null;
    let resolvedDepartment = user.department || user.studentProfile?.department || null;
    let resolvedCompany = user.recruiterAt || null;

    // Fallbacks to ensure every role has its required entity assigned
    if (!resolvedCollegeId && ['COLLEGE_ADMIN', 'DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT'].includes(user.role)) {
      const defaultCollege = await prisma.college.findFirst({
        include: { departments: true }
      }).catch(() => null);
      if (defaultCollege) {
        resolvedCollegeId = defaultCollege.id;
        resolvedCollege = { id: defaultCollege.id, name: defaultCollege.name, code: defaultCollege.code };
        if (!resolvedDeptId && defaultCollege.departments?.length > 0) {
          const dept = defaultCollege.departments[0];
          resolvedDeptId = dept.id;
          resolvedDepartment = { id: dept.id, name: dept.name, code: dept.code };
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { collegeId: resolvedCollegeId, ...(resolvedDeptId && { departmentId: resolvedDeptId }) }
        }).catch(() => null);
      }
    }

    if (!resolvedCompanyId && ['COMPANY_ADMIN', 'COMPANY_RECRUITER'].includes(user.role)) {
      let defaultCompany = await prisma.company.findFirst().catch(() => null);
      if (!defaultCompany) {
        defaultCompany = await prisma.company.create({
          data: { name: 'Global Tech Corp', website: 'https://techcorp.example.com', isVerified: true }
        }).catch(() => null);
      }
      if (defaultCompany) {
        resolvedCompanyId = defaultCompany.id;
        resolvedCompany = { id: defaultCompany.id, name: defaultCompany.name, website: defaultCompany.website };
        await prisma.user.update({
          where: { id: user.id },
          data: { recruiterAtId: resolvedCompanyId }
        }).catch(() => null);
      }
    }

    // Generate JWT access token with role entity bindings
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || '',
        collegeId: resolvedCollegeId,
        departmentId: resolvedDeptId,
        recruiterAtId: resolvedCompanyId,
      },
      process.env.JWT_SECRET || 'super_secret_jwt_key_pfac_portal_2026_dev_secure',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET || 'super_refresh_jwt_key_pfac_portal_2026_dev_secure',
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );

    const personaRouting = getPersonaDashboard(user.role);
    logAttempt('SUCCESS');

    return res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl || null,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        collegeId: resolvedCollegeId,
        departmentId: resolvedDeptId,
        recruiterAtId: resolvedCompanyId,
        college: resolvedCollege,
        department: resolvedDepartment,
        company: resolvedCompany,
        permissions: ROLE_PERMISSIONS_MAP[user.role] || [],
      },
      routing: personaRouting,
    });
  } catch (error) {
    console.error('Login DB Error:', error);
    return res.status(500).json({ error: 'Authentication database error: ' + error.message });
  }
});

/**
 * 4. User Logout (Revoke active session token)
 */
router.post('/logout', authenticate, (req, res) => {
  if (req.token) {
    revokeToken(req.token);
  }
  return res.json({ message: 'Successfully logged out. Session invalidated.' });
});

/**
 * 5. Forgot Password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.json({ message: 'If this email exists in our records, a reset link has been dispatched.' });
    }

    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'password_reset' },
      process.env.JWT_SECRET || 'super_secret_jwt_key_pfac_portal_2026_dev_secure',
      { expiresIn: '1h' }
    );

    passwordResetTokens.set(resetToken, { email: user.email, expiresAt: Date.now() + 3600000 });

    let emailSent = false;
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      emailSent = true;
    } catch (err) {
      console.warn('Password reset mail error:', err.message);
    }

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    return res.json({
      message: 'If this email exists in our records, a reset link has been dispatched.',
      resetUrl,
      resetToken,
      emailSent
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Server error processing password reset request.' });
  }
});

/**
 * 6. Reset Password with Token (Updates passwordHash in Neon DB)
 */
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_pfac_portal_2026_dev_secure'
    );

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token purpose' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: decoded.email.toLowerCase() },
      data: { passwordHash },
    });

    passwordResetTokens.delete(token);

    return res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (error) {
    return res.status(400).json({ error: 'Reset link is invalid or has expired' });
  }
});

/**
 * 7. Change Password
 */
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current password and new password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) return res.status(400).json({ error: 'Current password does not match' });

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return res.json({ message: 'Password changed successfully in database.' });
});

/**
 * 8. User Profile Management
 */
router.get('/profile', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { passwordHash, ...profile } = user;
  return res.json({ profile, permissions: ROLE_PERMISSIONS_MAP[user.role] || [] });
});

router.put('/profile', authenticate, async (req, res) => {
  const { name } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name: name || undefined },
  });

  const { passwordHash, ...profile } = user;
  return res.json({ message: 'Profile updated successfully in database', profile });
});

/**
 * 9. Account Activation / Deactivation (Admin action)
 */
router.patch('/users/:id/status', authenticate, checkPermission('USER_STATUS_TOGGLE'), async (req, res) => {
  const { isActive } = req.body;

  const targetUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: Boolean(isActive) },
  });

  return res.json({
    message: `Account status updated to ${targetUser.isActive ? 'ACTIVE' : 'INACTIVE'} in database`,
    user: { id: targetUser.id, email: targetUser.email, isActive: targetUser.isActive },
  });
});

/**
 * 10. Login History
 */
router.get('/login-history', authenticate, (req, res) => {
  if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.PLATFORM_ADMIN) {
    return res.json({ history: loginHistory });
  }

  const userLogs = loginHistory.filter((l) => l.userId === req.user.id || l.email === req.user.email);
  return res.json({ history: userLogs });
});

/**
 * 11. Permission & Role Registry
 */
router.get('/roles-and-permissions', authenticate, (req, res) => {
  return res.json({
    roles: Object.values(ROLES),
    rolePermissions: ROLE_PERMISSIONS_MAP,
  });
});

module.exports = router;
