const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { evaluateSkillMatch } = require('../services/skillMatchingEngine');

const router = express.Router();

/**
 * Perform Skill Matching between student profile and opportunity
 */
router.post('/evaluate', authenticate, (req, res) => {
  try {
    const { student, opportunity } = req.body;
    if (!student || !opportunity) {
      return res.status(400).json({ error: 'Both student and opportunity profiles are required.' });
    }

    const result = evaluateSkillMatch(student, opportunity);
    return res.json({
      status: 'success',
      evaluation: result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Complete AI Skill Matching Engine Dual-Route Workflow
 * Evaluates inputs and branches into:
 * - Path 1: Direct Eligibility Route (Immediate application & selection pipeline)
 * - Path 2: Skill-Gap & Upskilling Route (Recommends training and auto re-entry on completion)
 */
const { processDualRouteMatching } = require('../services/workflowEngine');

router.post('/workflow', authenticate, (req, res) => {
  try {
    const { student, opportunity, availableTrainings = [] } = req.body;
    if (!student || !opportunity) {
      return res.status(400).json({ error: 'Both student and opportunity payloads are required.' });
    }

    const workflowResult = processDualRouteMatching(student, opportunity, availableTrainings);
    return res.json(workflowResult);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const { performSkillGapAnalysis } = require('../services/skillGapAnalysisService');

/**
 * Skill Gap Analysis & Recommended Training Programs (Section 17)
 * Returns Strong Skills, Skill Gaps, Actionable Recommendations,
 * and Potential Match After Training.
 */
router.post('/gap-analysis', authenticate, (req, res) => {
  try {
    const { student, opportunity, availableTrainings = [] } = req.body;
    if (!student || !opportunity) {
      return res.status(400).json({ error: 'Both student and opportunity payloads are required.' });
    }

    const gapReport = performSkillGapAnalysis(student, opportunity, availableTrainings);
    return res.json(gapReport);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
