const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');

const router = express.Router();

/**
 * Section 14: Internship-to-Placement Conversion Repository
 * Tracks:
 * - Internship Attendance %
 * - Performance Rating (1-5)
 * - Mentor Feedback & Notes
 * - Project Completion %
 * - Skill Improvement
 * - Final Evaluation (ELIGIBLE vs NOT_ELIGIBLE)
 * - PPO Recommendation (PPO / Full-time Job Offer rollout)
 */
let internTrackingRecords = [];

/**
 * 1. Get Internship Tracking Records for a Company
 */
router.get('/company', authenticate, checkPermission('APPLICATION_VIEW'), (req, res) => {
  const companyId = req.user.companyId || 'comp_1';
  const records = internTrackingRecords.filter((r) => r.companyId === companyId);
  res.json({ total: records.length, interns: records });
});

/**
 * 2. Get Intern Evaluation & PPO Status (for Student or College Admin)
 */
router.get('/student/:studentId', authenticate, (req, res) => {
  const record = internTrackingRecords.find((r) => r.studentId === req.params.studentId);
  if (!record) return res.status(404).json({ error: 'No active internship tracking record found.' });
  res.json({ trackingRecord: record });
});

/**
 * 3. Log Mentor Feedback & Track Milestone Progress
 */
router.post('/:id/feedback', authenticate, checkPermission('APPLICATION_UPDATE'), (req, res) => {
  const { notes, attendancePercentage, performanceScore, projectCompletionPercentage } = req.body;
  const record = internTrackingRecords.find((r) => r.id === req.params.id);

  if (!record) return res.status(404).json({ error: 'Tracking record not found.' });

  if (notes) {
    record.mentorFeedback.push({
      date: new Date().toISOString().split('T')[0],
      notes
    });
  }

  if (attendancePercentage !== undefined) record.attendancePercentage = parseFloat(attendancePercentage);
  if (performanceScore !== undefined) record.performanceScore = parseFloat(performanceScore);
  if (projectCompletionPercentage !== undefined) {
    record.projectCompletion.completionPercentage = parseFloat(projectCompletionPercentage);
  }

  res.json({ message: 'Mentor feedback and performance updated', record });
});

/**
 * 4. Record Skill Improvements during Internship
 */
router.post('/:id/skill-improvement', authenticate, checkPermission('APPLICATION_UPDATE'), (req, res) => {
  const { skill, beforeLevel, afterLevel } = req.body;
  const record = internTrackingRecords.find((r) => r.id === req.params.id);

  if (!record) return res.status(404).json({ error: 'Tracking record not found.' });
  if (!skill || !beforeLevel || !afterLevel) {
    return res.status(400).json({ error: 'skill, beforeLevel, and afterLevel are required.' });
  }

  record.skillImprovement.push({
    skill,
    before: beforeLevel.toUpperCase(),
    after: afterLevel.toUpperCase()
  });

  res.json({ message: 'Skill improvement registered', skillImprovement: record.skillImprovement });
});

/**
 * 5. Conduct Final Evaluation (ELIGIBLE vs NOT_ELIGIBLE)
 */
router.post('/:id/final-evaluation', authenticate, checkPermission('APPLICATION_UPDATE'), (req, res) => {
  const { verdict, overallRemarks } = req.body;
  const record = internTrackingRecords.find((r) => r.id === req.params.id);

  if (!record) return res.status(404).json({ error: 'Tracking record not found.' });
  if (!['ELIGIBLE', 'NOT_ELIGIBLE'].includes(verdict)) {
    return res.status(400).json({ error: "Verdict must be either 'ELIGIBLE' or 'NOT_ELIGIBLE'." });
  }

  record.finalEvaluation = {
    evaluatedAt: new Date().toISOString(),
    verdict,
    overallRemarks: overallRemarks || ''
  };

  res.json({
    message: `Final evaluation completed. Student is marked as ${verdict} for PPO rollout.`,
    finalEvaluation: record.finalEvaluation
  });
});

/**
 * 6. Roll out PPO / Full-Time Placement Offer
 * (Only available if student is evaluated as ELIGIBLE)
 */
router.post('/:id/ppo-offer', authenticate, checkPermission('OFFER_ISSUE'), (req, res) => {
  const { jobTitle, salaryPackage, joiningDate, offerLetterUrl } = req.body;
  const record = internTrackingRecords.find((r) => r.id === req.params.id);

  if (!record) return res.status(404).json({ error: 'Tracking record not found.' });

  if (record.finalEvaluation?.verdict !== 'ELIGIBLE') {
    return res.status(400).json({
      error: 'Cannot extend PPO. Student must first receive an ELIGIBLE final evaluation verdict.'
    });
  }

  if (!jobTitle || !salaryPackage || !joiningDate) {
    return res.status(400).json({ error: 'jobTitle, salaryPackage, and joiningDate are mandatory.' });
  }

  record.ppoDetails = {
    offered: true,
    offeredAt: new Date().toISOString(),
    jobTitle,
    salaryPackage,
    joiningDate,
    status: 'OFFER_EXTENDED',
    offerLetterUrl: offerLetterUrl || null
  };

  res.status(201).json({
    message: `Pre-Placement Offer (PPO) issued to ${record.studentName} for position ${jobTitle}!`,
    ppoDetails: record.ppoDetails
  });
});

/**
 * 7. Student Response to PPO (Accept or Decline)
 */
router.patch('/:id/ppo-response', authenticate, (req, res) => {
  const { response } = req.body; // 'ACCEPT' or 'DECLINE'
  const record = internTrackingRecords.find((r) => r.id === req.params.id);

  if (!record || !record.ppoDetails?.offered) {
    return res.status(404).json({ error: 'No active PPO offer found for this record.' });
  }

  if (!['ACCEPT', 'DECLINE'].includes(response)) {
    return res.status(400).json({ error: "Response must be 'ACCEPT' or 'DECLINE'." });
  }

  record.ppoDetails.status = response === 'ACCEPT' ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED';

  res.json({
    message: `PPO Offer has been ${record.ppoDetails.status}.`,
    ppoDetails: record.ppoDetails
  });
});

module.exports = router;
