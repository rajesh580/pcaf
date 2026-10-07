/**
 * Section 11: Application Lifecycle Status Progression
 * [ Applied ] ──► [ Under Review ] ──► [ Shortlisted ] ──► [ Assessment ] ──► 
 * [ Technical Interview ] ──► [ HR Interview ] ──► [ Selected ] ──► 
 * [ Internship Started ] ──► [ Internship Completed ]
 * Terminal states: [ Rejected ], [ Withdrawn ]
 */

const APPLICATION_STATUSES = {
  APPLIED: 'APPLIED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  SHORTLISTED: 'SHORTLISTED',
  ASSESSMENT: 'ASSESSMENT',
  TECHNICAL_INTERVIEW: 'TECHNICAL_INTERVIEW',
  HR_INTERVIEW: 'HR_INTERVIEW',
  SELECTED: 'SELECTED',
  INTERNSHIP_STARTED: 'INTERNSHIP_STARTED',
  INTERNSHIP_COMPLETED: 'INTERNSHIP_COMPLETED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
};

// Allowed transitions for state progression
const VALID_TRANSITIONS = {
  APPLIED: ['UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  UNDER_REVIEW: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['ASSESSMENT', 'TECHNICAL_INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  ASSESSMENT: ['TECHNICAL_INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  TECHNICAL_INTERVIEW: ['HR_INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'],
  HR_INTERVIEW: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
  SELECTED: ['INTERNSHIP_STARTED', 'WITHDRAWN'],
  INTERNSHIP_STARTED: ['INTERNSHIP_COMPLETED'],
  INTERNSHIP_COMPLETED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

function isValidTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

module.exports = {
  APPLICATION_STATUSES,
  VALID_TRANSITIONS,
  isValidTransition,
};
