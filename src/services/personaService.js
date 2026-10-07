/**
 * Maps the 10 detailed granular roles to the 5 Primary Dashboard Personas:
 * 1. STUDENT
 * 2. COLLEGE (College Admin, Department Admin, Faculty/Placement Coordinator)
 * 3. COMPANY (Company Admin, Company Recruiter)
 * 4. SKILL_PROVIDER (Skill Provider, Mentor)
 * 5. ADMIN (Super Admin, Platform Admin)
 */
function getPersonaDashboard(role) {
  switch (role) {
    case 'STUDENT':
      return {
        persona: 'STUDENT',
        dashboardRoute: '/dashboard/student',
        portalName: 'Student Career & Skill Portal',
        capabilities: [
          'Profile & Skills Management',
          'Browse & Apply for Internships & Jobs',
          'Track Applications',
          'Personalized Recommendations',
          'View Skill Gap & Training Programs'
        ]
      };

    case 'COLLEGE_ADMIN':
    case 'DEPARTMENT_ADMIN':
    case 'FACULTY_COORDINATOR':
      return {
        persona: 'COLLEGE',
        dashboardRoute: '/dashboard/college',
        portalName: 'College & Department Administration',
        capabilities: [
          'Manage Departments & Branches',
          'Manage & Verify Students',
          'Oversee Internships & Placements',
          'Coordinate Industry Interactions',
          'View Reports & Placement Analytics'
        ]
      };

    case 'COMPANY_ADMIN':
    case 'COMPANY_RECRUITER':
      return {
        persona: 'COMPANY',
        dashboardRoute: '/dashboard/company',
        portalName: 'Company Recruitment & Talent Suite',
        capabilities: [
          'Maintain Company Profile',
          'Post Internships & Jobs',
          'Manage Received Applications',
          'Conduct Shortlisting & Interviews',
          'Track Overall Hiring Pipeline & PPOs'
        ]
      };

    case 'SKILL_PROVIDER':
    case 'MENTOR':
      return {
        persona: 'SKILL_PROVIDER',
        dashboardRoute: '/dashboard/skill-provider',
        portalName: 'Skill Hub & Mentorship Engine',
        capabilities: [
          'Publish Skill Enhancement Programs',
          'Map Industry-Relevant Skills',
          'Track Student Coursework & Certifications',
          'Verify Upgraded Skills for Re-entry'
        ]
      };

    case 'SUPER_ADMIN':
    case 'PLATFORM_ADMIN':
    default:
      return {
        persona: 'ADMIN',
        dashboardRoute: '/dashboard/admin',
        portalName: 'Central Platform Administration',
        capabilities: [
          'Full Platform Administration',
          'Manage Users & Roles',
          'Oversee Colleges & Companies (Approvals)',
          'Monitor Platform Activities & Audit Logs',
          'System Configurations & Analytics'
        ]
      };
  }
}

module.exports = { getPersonaDashboard };
