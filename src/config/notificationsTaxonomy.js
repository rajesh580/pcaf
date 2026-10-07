/**
 * Section 23: Notification Taxonomy and Templates
 * Covers:
 * - Student Notification Events (8 Types)
 * - Company Notification Events (4 Types)
 * - College Notification Events (5 Types)
 */

const NOTIFICATION_CHANNELS = {
  EMAIL: 'EMAIL',
  IN_APP: 'IN_APP',
  SMS_WHATSAPP: 'SMS_WHATSAPP' // Configured as extensible future integration
};

const NOTIFICATION_EVENTS = {
  // 1. Student Events
  STUDENT_NEW_MATCHING_INTERNSHIP: 'STUDENT_NEW_MATCHING_INTERNSHIP',
  STUDENT_NEW_MATCHING_JOB: 'STUDENT_NEW_MATCHING_JOB',
  STUDENT_APPLICATION_SHORTLISTED: 'STUDENT_APPLICATION_SHORTLISTED',
  STUDENT_INTERVIEW_SCHEDULED: 'STUDENT_INTERVIEW_SCHEDULED',
  STUDENT_APPLICATION_REJECTED: 'STUDENT_APPLICATION_REJECTED',
  STUDENT_SKILL_GAP_IDENTIFIED: 'STUDENT_SKILL_GAP_IDENTIFIED',
  STUDENT_TRAINING_RECOMMENDATION: 'STUDENT_TRAINING_RECOMMENDATION',
  STUDENT_SELECTION_CONFIRMATION: 'STUDENT_SELECTION_CONFIRMATION',

  // 2. Company Events
  COMPANY_NEW_APPLICATION: 'COMPANY_NEW_APPLICATION',
  COMPANY_NEW_ELIGIBLE_STUDENT: 'COMPANY_NEW_ELIGIBLE_STUDENT',
  COMPANY_INTERVIEW_REMINDER: 'COMPANY_INTERVIEW_REMINDER',
  COMPANY_APPLICATION_DEADLINE: 'COMPANY_APPLICATION_DEADLINE',

  // 3. College Events
  COLLEGE_NEW_COMPANY_REGISTRATION: 'COLLEGE_NEW_COMPANY_REGISTRATION',
  COLLEGE_NEW_OPPORTUNITY: 'COLLEGE_NEW_OPPORTUNITY',
  COLLEGE_STUDENT_SELECTION: 'COLLEGE_STUDENT_SELECTION',
  COLLEGE_INTERNSHIP_COMPLETION: 'COLLEGE_INTERNSHIP_COMPLETION',
  COLLEGE_PLACEMENT_STATISTICS: 'COLLEGE_PLACEMENT_STATISTICS'
};

const NOTIFICATION_TEMPLATES = {
  // Student Templates
  [NOTIFICATION_EVENTS.STUDENT_NEW_MATCHING_INTERNSHIP]: (data) => ({
    title: 'New Matching Internship Found!',
    body: `A new internship "${data.title}" at ${data.company} matches ${data.matchScore}% of your skill profile.`
  }),
  [NOTIFICATION_EVENTS.STUDENT_NEW_MATCHING_JOB]: (data) => ({
    title: 'New Matching Job Opportunity!',
    body: `A full-time position "${data.title}" at ${data.company} (${data.package}) matches ${data.matchScore}% of your skills.`
  }),
  [NOTIFICATION_EVENTS.STUDENT_APPLICATION_SHORTLISTED]: (data) => ({
    title: 'Application Shortlisted 🎉',
    body: `Congratulations! Your application for "${data.title}" at ${data.company} has been shortlisted for the next round.`
  }),
  [NOTIFICATION_EVENTS.STUDENT_INTERVIEW_SCHEDULED]: (data) => ({
    title: 'Interview Scheduled 🗓️',
    body: `Your interview for "${data.title}" is scheduled on ${data.time}. Round: ${data.round}.`
  }),
  [NOTIFICATION_EVENTS.STUDENT_APPLICATION_REJECTED]: (data) => ({
    title: 'Application Status Update',
    body: `Thank you for applying to "${data.title}" at ${data.company}. The team has decided not to move forward at this time.`
  }),
  [NOTIFICATION_EVENTS.STUDENT_SKILL_GAP_IDENTIFIED]: (data) => ({
    title: 'Skill Gap Identified ⚠',
    body: `To increase your match score for "${data.title}", we identified gaps in: ${data.gaps.join(', ')}.`
  }),
  [NOTIFICATION_EVENTS.STUDENT_TRAINING_RECOMMENDATION]: (data) => ({
    title: 'Recommended Training Program',
    body: `Enroll in "${data.courseName}" to bridge your skill gap and boost your match score to ${data.potentialScore}%.`
  }),
  [NOTIFICATION_EVENTS.STUDENT_SELECTION_CONFIRMATION]: (data) => ({
    title: 'Selection Confirmation & Offer! 🚀',
    body: `Congratulations! You have been selected for "${data.title}" at ${data.company}. Your offer letter is ready.`
  }),

  // Company Templates
  [NOTIFICATION_EVENTS.COMPANY_NEW_APPLICATION]: (data) => ({
    title: 'New Candidate Application Received',
    body: `${data.studentName} (${data.branch}, CGPA ${data.cgpa}) applied for "${data.title}". Match Score: ${data.matchScore}%.`
  }),
  [NOTIFICATION_EVENTS.COMPANY_NEW_ELIGIBLE_STUDENT]: (data) => ({
    title: 'New Eligible Candidate Discovered',
    body: `A student matching ${data.matchScore}% for "${data.title}" was identified in the college talent pool.`
  }),
  [NOTIFICATION_EVENTS.COMPANY_INTERVIEW_REMINDER]: (data) => ({
    title: 'Interview Reminder',
    body: `Reminder: You have an upcoming interview with ${data.studentName} at ${data.time} for "${data.title}".`
  }),
  [NOTIFICATION_EVENTS.COMPANY_APPLICATION_DEADLINE]: (data) => ({
    title: 'Application Deadline Approaching',
    body: `The application deadline for "${data.title}" will close in 24 hours. Current applications: ${data.applicantCount}.`
  }),

  // College Templates
  [NOTIFICATION_EVENTS.COLLEGE_NEW_COMPANY_REGISTRATION]: (data) => ({
    title: 'New Industry Partner Registered',
    body: `${data.companyName} has joined the platform and is ready to hire from your institution.`
  }),
  [NOTIFICATION_EVENTS.COLLEGE_NEW_OPPORTUNITY]: (data) => ({
    title: 'New Campus Opportunity Published',
    body: `${data.companyName} published "${data.title}" open for batches: ${data.batches.join(', ')}.`
  }),
  [NOTIFICATION_EVENTS.COLLEGE_STUDENT_SELECTION]: (data) => ({
    title: 'Student Placement Success! 🎓',
    body: `${data.studentName} (${data.dept}) has been selected at ${data.companyName} for package ${data.package}.`
  }),
  [NOTIFICATION_EVENTS.COLLEGE_INTERNSHIP_COMPLETION]: (data) => ({
    title: 'Internship Term Completed',
    body: `${data.studentName} has successfully completed a ${data.duration} internship at ${data.companyName}.`
  }),
  [NOTIFICATION_EVENTS.COLLEGE_PLACEMENT_STATISTICS]: (data) => ({
    title: 'Monthly Placement Analytics Summary',
    body: `Current Placement Rate: ${data.rate}%. Total Students Placed: ${data.placedCount}. Average CTC: ${data.avgCtc}.`
  })
};

module.exports = {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  NOTIFICATION_TEMPLATES
};
