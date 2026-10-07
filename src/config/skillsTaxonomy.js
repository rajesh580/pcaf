/**
 * Standard Hierarchical Technical Skills Taxonomy (Section 8)
 */
const TECHNICAL_SKILLS_TAXONOMY = {
  Programming: ['Python', 'Java', 'C', 'C++', 'JavaScript', 'TypeScript', 'Go', 'Rust'],
  WebDevelopment: ['React', 'Node.js', 'Django', 'REST API', 'Express.js', 'Next.js', 'Vue.js', 'HTML/CSS'],
  AIML: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Generative AI', 'TensorFlow', 'PyTorch'],
  Database: ['MySQL', 'PostgreSQL', 'MongoDB', 'SQL', 'Redis', 'Firebase'],
  DevOpsCloud: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'CI/CD'],
};

const VALID_SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const VALID_EVIDENCE_TYPES = [
  'CERTIFICATION',
  'PROJECT',
  'INTERNSHIP',
  'ASSESSMENT_SCORE',
  'TRAINING_COMPLETED',
  'GITHUB_PROJECT_LINK',
];

module.exports = {
  TECHNICAL_SKILLS_TAXONOMY,
  VALID_SKILL_LEVELS,
  VALID_EVIDENCE_TYPES,
};
