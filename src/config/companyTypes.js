/**
 * Section 13: Configurable Company Types
 * Supports single and multi-category corporate memberships.
 */

const COMPANY_TYPES = {
  INTERNSHIP_PROVIDER: 'INTERNSHIP_PROVIDER',               // 1. Internship Provider
  INTERNSHIP_PLUS_PLACEMENT: 'INTERNSHIP_PLUS_PLACEMENT',   // 2. Internship + Placement (PPO)
  DIRECT_HIRING: 'DIRECT_HIRING',                           // 3. Direct Hiring (Full-time jobs only)
  SKILL_ENHANCEMENT_PROVIDER: 'SKILL_ENHANCEMENT_PROVIDER', // 4. Skill Enhancement Provider
  TRAINING_PLUS_HIRING: 'TRAINING_PLUS_HIRING',             // 5. Training + Hiring
  CONSULTING_INDUSTRY_PARTNER: 'CONSULTING_INDUSTRY_PARTNER'// 6. Consulting / Industry Partner
};

const COMPANY_TYPE_METADATA = {
  [COMPANY_TYPES.INTERNSHIP_PROVIDER]: {
    label: 'Internship Provider',
    canPostInternships: true,
    canPostJobs: false,
    canPublishTraining: false,
  },
  [COMPANY_TYPES.INTERNSHIP_PLUS_PLACEMENT]: {
    label: 'Internship + Placement',
    canPostInternships: true,
    canPostJobs: true,
    canPublishTraining: false,
  },
  [COMPANY_TYPES.DIRECT_HIRING]: {
    label: 'Direct Hiring',
    canPostInternships: false,
    canPostJobs: true,
    canPublishTraining: false,
  },
  [COMPANY_TYPES.SKILL_ENHANCEMENT_PROVIDER]: {
    label: 'Skill Enhancement Provider',
    canPostInternships: false,
    canPostJobs: false,
    canPublishTraining: true,
  },
  [COMPANY_TYPES.TRAINING_PLUS_HIRING]: {
    label: 'Training + Hiring',
    canPostInternships: true,
    canPostJobs: true,
    canPublishTraining: true,
  },
  [COMPANY_TYPES.CONSULTING_INDUSTRY_PARTNER]: {
    label: 'Consulting / Industry Partner',
    canPostInternships: true,
    canPostJobs: true,
    canPublishTraining: true,
  },
};

/**
 * Checks if a company with assigned categories has permission for a specific activity
 */
function companyHasCapability(companyTypes = [], capabilityKey) {
  return companyTypes.some((type) => {
    const meta = COMPANY_TYPE_METADATA[type];
    return meta && meta[capabilityKey] === true;
  });
}

module.exports = {
  COMPANY_TYPES,
  COMPANY_TYPE_METADATA,
  companyHasCapability,
};
