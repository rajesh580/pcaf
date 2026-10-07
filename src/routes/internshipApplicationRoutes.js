const express = require('express');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');
const { APPLICATION_STATUSES, isValidTransition } = require('../config/applicationLifecycle');

const router = express.Router();

// Mock store for Internship Applications
let applications = [];

// In-app notifications store
let studentNotifications = [];

/**
 * Helper to record notification
 */
function notifyStudent(studentId, title, message, type = 'STATUS_UPDATE') {
  studentNotifications.unshift({
    id: `notif_${Date.now()}`,
    studentId,
    title,
    message,
    type,
    isRead: false,
    timestamp: new Date().toISOString()
  });
}

/**
 * 1. Step 4: Apply for Internship
 * Candidate submits verified academic profile and resume
 */
router.post('/apply', authenticate, authorize('STUDENT'), (req, res) => {
  const { internshipId, internshipTitle, companyName, studentProfile, matchScore } = req.body;

  if (!internshipId) {
    return res.status(400).json({ error: 'internshipId is required.' });
  }

  // Prevent duplicate application
  const existing = applications.find(
    (a) => a.internshipId === internshipId && a.studentId === req.user.id && a.status !== APPLICATION_STATUSES.WITHDRAWN
  );
  if (existing) {
    return res.status(409).json({ error: 'You have already applied for this internship opportunity.' });
  }

  const newApp = {
    id: `app_${Date.now()}`,
    internshipId,
    internshipTitle: internshipTitle || 'Internship Opportunity',
    companyName: companyName || 'Partner Organization',
    studentId: req.user.id || 'std_1',
    studentName: req.user.name || 'Student Candidate',
    studentEmail: req.user.email,
    status: APPLICATION_STATUSES.APPLIED,
    matchScore: matchScore || 85,
    appliedAt: new Date().toISOString(),
    statusTimeline: [
      {
        status: APPLICATION_STATUSES.APPLIED,
        timestamp: new Date().toISOString(),
        notes: 'Application received and recorded.'
      }
    ],
    selectionRoundDetails: null,
    offerLetterUrl: null
  };

  applications.push(newApp);

  notifyStudent(
    newApp.studentId,
    'Application Submitted',
    `Your application for ${newApp.internshipTitle} at ${newApp.companyName} was submitted successfully.`
  );

  return res.status(201).json({
    message: 'Application submitted successfully!',
    application: newApp
  });
});

/**
 * 2. Step 5: Application Tracking ("My Applications")
 * Real-time tracking board across all submitted roles for the student
 */
router.get('/my-applications', authenticate, authorize('STUDENT'), (req, res) => {
  const studentId = req.user.id || 'std_1';
  const myApps = applications.filter((a) => a.studentId === studentId);
  return res.json({ total: myApps.length, applications: myApps });
});

/**
 * 3. Withdraw Application
 * Allows student to revoke submission
 */
router.post('/:id/withdraw', authenticate, authorize('STUDENT'), (req, res) => {
  const app = applications.find((a) => a.id === req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  if (app.status === APPLICATION_STATUSES.INTERNSHIP_COMPLETED || app.status === APPLICATION_STATUSES.WITHDRAWN) {
    return res.status(400).json({ error: `Cannot withdraw application in status ${app.status}` });
  }

  app.status = APPLICATION_STATUSES.WITHDRAWN;
  app.statusTimeline.push({
    status: APPLICATION_STATUSES.WITHDRAWN,
    timestamp: new Date().toISOString(),
    notes: 'Application withdrawn by student.'
  });

  notifyStudent(
    app.studentId,
    'Application Withdrawn',
    `You have successfully withdrawn your application for ${app.internshipTitle}.`
  );

  return res.json({ message: 'Application withdrawn successfully.', application: app });
});

/**
 * 4. Step 6: Get Student In-App Notifications
 */
router.get('/notifications', authenticate, authorize('STUDENT'), (req, res) => {
  const studentId = req.user.id || 'std_1';
  const myNotifs = studentNotifications.filter((n) => n.studentId === studentId);
  return res.json({ total: myNotifs.length, notifications: myNotifs });
});

/**
 * 5. Step 7 & State Progression: Recruiter Updates Application Status
 * Transitions application through:
 * Shortlisted -> Assessment -> Technical Interview -> HR Interview -> Selected -> Internship Started -> Internship Completed
 */
router.patch('/:id/status', authenticate, checkPermission('APPLICATION_UPDATE'), (req, res) => {
  const { nextStatus, notes, roundDetails, offerLetterUrl } = req.body;
  const app = applications.find((a) => a.id === req.params.id);

  if (!app) return res.status(404).json({ error: 'Application not found.' });

  if (!Object.values(APPLICATION_STATUSES).includes(nextStatus)) {
    return res.status(400).json({ error: `Invalid status. Valid values: ${Object.values(APPLICATION_STATUSES).join(', ')}` });
  }

  // Validate state machine rule
  if (!isValidTransition(app.status, nextStatus)) {
    return res.status(400).json({
      error: `Illegal state transition from ${app.status} to ${nextStatus}.`,
      allowedNextStatuses: VALID_TRANSITIONS[app.status]
    });
  }

  app.status = nextStatus;
  app.statusTimeline.push({
    status: nextStatus,
    timestamp: new Date().toISOString(),
    notes: notes || `Moved to ${nextStatus}`
  });

  if (roundDetails) {
    app.selectionRoundDetails = roundDetails;
  }

  if (nextStatus === APPLICATION_STATUSES.SELECTED && offerLetterUrl) {
    app.offerLetterUrl = offerLetterUrl;
  }

  // Dispatch alert to candidate
  notifyStudent(
    app.studentId,
    `Application Status Update: ${nextStatus}`,
    `Your application for ${app.internshipTitle} is now marked as ${nextStatus}. ${notes || ''}`
  );

  return res.json({
    message: `Application status transitioned to ${nextStatus}`,
    application: app
  });
});

/**
 * 6. Step 7 & 8: View Selection Round Logistics & Final Results
 */
router.get('/:id/round-details', authenticate, (req, res) => {
  const app = applications.find((a) => a.id === req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  return res.json({
    status: app.status,
    selectionRoundDetails: app.selectionRoundDetails,
    offerLetterUrl: app.offerLetterUrl,
    timeline: app.statusTimeline
  });
});

router.getApplicationsCountForUser = (userId) => {
  return applications.filter((a) => a.studentId === userId && a.status !== APPLICATION_STATUSES.WITHDRAWN).length;
};

module.exports = router;
