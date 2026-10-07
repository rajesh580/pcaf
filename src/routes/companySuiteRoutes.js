const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();

/**
 * Section 19: Company Dashboard Live Metrics
 */
router.get('/metrics', authenticate, checkPermission('OPPORTUNITY_VIEW'), async (req, res) => {
  try {
    const [totalOpp, totalApps] = await Promise.all([
      prisma.opportunity.count().catch(() => 0),
      prisma.application.count().catch(() => 0)
    ]);

    res.json({
      companyName: req.user.name || 'Corporate Partner',
      kpis: {
        activeInternships: totalOpp,
        activeJobs: 0,
        applications: totalApps,
        shortlisted: 0,
        interviews: 0,
        selected: 0,
        internshipConversions: 0
      },
      quickActions: [
        { label: 'Create Internship', action: 'POST /api/internships' },
        { label: 'Create Job', action: 'POST /api/jobs' },
        { label: 'View Matched Students', action: 'GET /api/collaboration/students/search' },
        { label: 'Manage Applications', action: 'GET /api/internship-applications/my-applications' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve company metrics: ' + error.message });
  }
});

module.exports = router;
