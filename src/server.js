require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const studentRoutes = require('./routes/studentRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const companyRoutes = require('./routes/companyRoutes');
const companySuiteRoutes = require('./routes/companySuiteRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const internshipApplicationRoutes = require('./routes/internshipApplicationRoutes');
const jobRoutes = require('./routes/jobRoutes');
const ppoConversionRoutes = require('./routes/ppoConversionRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const skillHubRoutes = require('./routes/skillHubRoutes');
const skillEnhancementRoutes = require('./routes/skillEnhancementRoutes');
const { router: notificationRoutes } = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Portal for Academia & Industry Collaboration API',
    timestamp: new Date().toISOString(),
  });
});

// Modular Routes (Pillar A, B, C, Super Admin & Core Engine)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/college', collegeRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/company-suite', companySuiteRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/internship-applications', internshipApplicationRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ppo-conversion', ppoConversionRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/skill-hub', skillHubRoutes);
app.use('/api/skill-enhancement', skillEnhancementRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// Serve uploaded static assets (resumes, documents)
const uploadsPath = path.join(__dirname, '../uploads');
// Resume cache files are served only through authenticated preview endpoints.
app.use('/uploads/resumes', (req, res) => res.status(404).end());
app.use('/uploads', express.static(uploadsPath));

// Serve React production build if available
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(clientBuildPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  return res.json({
    message: 'Portal for Academia & Industry Collaboration Backend Running.',
    endpoints: '/api/auth, /api/dashboards, /api/matching, /api/students, etc.',
    frontendDevServer: 'Run npm start from root to boot both React and Express concurrently.'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const prisma = require('./prisma');
const bcrypt = require('bcryptjs');

async function seedSuperAdmin() {
  try {
    const adminEmail = 'admin@mail.com';
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true
      },
      create: {
        email: adminEmail,
        name: 'Platform Super Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true
      }
    });
    console.log(`[SEED] Ensured Super Admin user: ${adminEmail}`);
  } catch (err) {
    console.warn('[SEED] Super Admin check warning:', err.message);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await seedSuperAdmin();
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
