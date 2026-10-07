/**
 * Section 18: Standard Skill Enhancement Programs Catalog
 * Curated domain coverage across technical, soft-skills, and career readiness.
 */
const ENHANCEMENT_PROGRAMS_CATALOG = [
  {
    id: 'enh_1',
    title: 'Python Full Stack Mastery',
    domain: 'Python Full Stack',
    skillsCovered: ['Python', 'Django', 'REST API', 'PostgreSQL', 'HTML/CSS'],
    mode: 'ONLINE',
    format: 'Live sessions + Hands-on real-world projects',
    durationWeeks: 8,
    provider: 'Global Tech Academy',
    hasCertificate: true,
    assessmentType: 'Timed Test + Capstone Project'
  },
  {
    id: 'enh_2',
    title: 'Modern React & Front-End Architecture',
    domain: 'React Development',
    skillsCovered: ['React', 'JavaScript', 'TypeScript', 'Redux', 'Tailwind CSS'],
    mode: 'HYBRID',
    format: 'Interactive workshops + Live code reviews',
    durationWeeks: 6,
    provider: 'Frontend Pro Labs',
    hasCertificate: true,
    assessmentType: 'Production Web App Submission'
  },
  {
    id: 'enh_3',
    title: 'Applied AI & Machine Learning Engineering',
    domain: 'AI/ML',
    skillsCovered: ['Machine Learning', 'Deep Learning', 'PyTorch', 'Computer Vision', 'NLP'],
    mode: 'ONLINE',
    format: 'Industry-expert mentorship + Kaggle challenge build',
    durationWeeks: 10,
    provider: 'Deep Learning Institute',
    hasCertificate: true,
    assessmentType: 'ML Pipeline Evaluation & Defense'
  },
  {
    id: 'enh_4',
    title: 'Data Science & Predictive Analytics Bootcamp',
    domain: 'Data Science',
    skillsCovered: ['Python', 'Data Science', 'Pandas', 'SQL', 'Tableau'],
    mode: 'ONLINE',
    format: 'Case studies + Real business dataset analysis',
    durationWeeks: 8,
    provider: 'Analytics Hub',
    hasCertificate: true,
    assessmentType: 'Data Dashboard & Model Presentation'
  },
  {
    id: 'enh_5',
    title: 'Cybersecurity Analyst & Threat Hunting',
    domain: 'Cybersecurity',
    skillsCovered: ['Cybersecurity', 'Network Security', 'Ethical Hacking', 'Linux'],
    mode: 'OFFLINE',
    format: 'Lab simulations + CTF (Capture The Flag)',
    durationWeeks: 8,
    provider: 'SecureNet Academy',
    hasCertificate: true,
    assessmentType: 'CTF Challenge Scorecard'
  },
  {
    id: 'enh_6',
    title: 'Cloud Computing with AWS & Microservices',
    domain: 'Cloud Computing',
    skillsCovered: ['AWS', 'Cloud Computing', 'Docker', 'Kubernetes', 'Serverless'],
    mode: 'ONLINE',
    format: 'Cloud sandbox environments + Architecture drills',
    durationWeeks: 6,
    provider: 'Cloud Native Foundation',
    hasCertificate: true,
    assessmentType: 'AWS Architecture Deployment Exam'
  },
  {
    id: 'enh_7',
    title: 'DevOps & Continuous Integration / Delivery',
    domain: 'DevOps',
    skillsCovered: ['DevOps', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Terraform'],
    mode: 'ONLINE',
    format: 'Hands-on pipeline automation labs',
    durationWeeks: 6,
    provider: 'DevOps Guild',
    hasCertificate: true,
    assessmentType: 'Automated CI/CD Pipeline Verification'
  },
  {
    id: 'enh_8',
    title: 'Internet of Things (IoT) & Embedded Edge Systems',
    domain: 'IoT',
    skillsCovered: ['IoT', 'Embedded C', 'Raspberry Pi', 'MQTT', 'Sensors'],
    mode: 'OFFLINE',
    format: 'Hardware lab workbench sessions',
    durationWeeks: 6,
    provider: 'IoT Innovations Lab',
    hasCertificate: true,
    assessmentType: 'Working Hardware Prototype Demo'
  },
  {
    id: 'enh_9',
    title: 'Corporate Communication & Business Etiquette',
    domain: 'Communication Skills',
    skillsCovered: ['Communication Skills', 'Email Etiquette', 'Presentations', 'Stakeholder Pitching'],
    mode: 'HYBRID',
    format: 'Role-playing drills + Public speaking feedback',
    durationWeeks: 3,
    provider: 'Corporate Readiness Cell',
    hasCertificate: true,
    assessmentType: 'Executive Presentation Delivery'
  },
  {
    id: 'enh_10',
    title: 'Quantitative Aptitude & Logical Reasoning Mastery',
    domain: 'Aptitude',
    skillsCovered: ['Aptitude', 'Data Interpretation', 'Logical Reasoning', 'Speed Math'],
    mode: 'ONLINE',
    format: 'Daily timed mock drills & diagnostic analytics',
    durationWeeks: 4,
    provider: 'Placement Prep Academy',
    hasCertificate: true,
    assessmentType: 'Comprehensive Proctored Aptitude Test'
  },
  {
    id: 'enh_11',
    title: 'Technical & HR Interview Preparation Intensive',
    domain: 'Interview Preparation',
    skillsCovered: ['Interview Preparation', 'Mock Technical Interviews', 'System Design', 'HR Scenarios'],
    mode: 'HYBRID',
    format: '1-on-1 Mock interviews with Tech Leads & HR Managers',
    durationWeeks: 4,
    provider: 'Career Launchpad',
    hasCertificate: true,
    assessmentType: 'Mock Panel Scorecard & Readiness Clearance'
  }
];

module.exports = { ENHANCEMENT_PROGRAMS_CATALOG };
