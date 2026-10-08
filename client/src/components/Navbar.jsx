import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const roleLinks = {
  STUDENT: [
    ['/dashboard/student', 'Overview', 'OV'], ['/student/internships', 'Internships', 'IN'],
    ['/student/jobs', 'Placement jobs', 'JB'], ['/student/applications', 'Applications', 'AP'],
    ['/student/training', 'Training', 'TR'], ['/student/report', 'Career report', 'CR'],
    ['/student/profile', 'My profile', 'PR'], ['/student/standardized-resume', 'ATS resume', 'CV'],
  ],
  COLLEGE_ADMIN: [['/dashboard/college', 'Overview', 'OV'], ['/college/departments', 'Departments', 'DP'], ['/college/reports', 'Reports', 'RP']],
  DEPARTMENT_ADMIN: [['/dashboard/college', 'Overview', 'OV'], ['/college/departments', 'Departments', 'DP'], ['/college/reports', 'Reports', 'RP']],
  FACULTY_COORDINATOR: [['/dashboard/college', 'Overview', 'OV'], ['/college/departments', 'Departments', 'DP'], ['/college/reports', 'Reports', 'RP']],
  COMPANY_ADMIN: [['/dashboard/company', 'Overview', 'OV'], ['/company/recruitment', 'Recruitment', 'RC'], ['/company/recruitment?tab=candidates', 'Talent search', 'TS'], ['/company/reports', 'Reports', 'RP']],
  COMPANY_RECRUITER: [['/dashboard/company', 'Overview', 'OV'], ['/company/recruitment', 'Recruitment', 'RC'], ['/company/recruitment?tab=candidates', 'Talent search', 'TS'], ['/company/reports', 'Reports', 'RP']],
  SKILL_PROVIDER: [['/dashboard/skill-provider', 'Programs & enrollments', 'PE']],
  MENTOR: [['/dashboard/skill-provider', 'Skill hub', 'SH']],
  SUPER_ADMIN: [
    ['/dashboard/admin?tab=overview', 'Overview', 'OV'],
    ['/dashboard/admin?tab=users', 'User Directory', 'US'],
    ['/dashboard/admin?tab=students', 'Student Profiles', 'ST'],
    ['/dashboard/admin?tab=colleges', 'Colleges', 'CL'],
    ['/dashboard/admin?tab=companies', 'Industry Partners', 'CP'],
    ['/dashboard/admin?tab=broadcast', 'System Broadcast', 'BC'],
    ['/dashboard/admin?tab=audit', 'Audit Logs', 'AU'],
  ],
  PLATFORM_ADMIN: [
    ['/dashboard/admin?tab=overview', 'Overview', 'OV'],
    ['/dashboard/admin?tab=users', 'User Directory', 'US'],
    ['/dashboard/admin?tab=students', 'Student Profiles', 'ST'],
    ['/dashboard/admin?tab=colleges', 'Colleges', 'CL'],
    ['/dashboard/admin?tab=companies', 'Industry Partners', 'CP'],
    ['/dashboard/admin?tab=broadcast', 'System Broadcast', 'BC'],
    ['/dashboard/admin?tab=audit', 'Audit Logs', 'AU'],
  ],
};

const roleLabel = (role = '') => role.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const refreshUser = () => setUser(authService.getCurrentUser());
    window.addEventListener('pfac-profile-updated', refreshUser);
    window.addEventListener('storage', refreshUser);
    return () => {
      window.removeEventListener('pfac-profile-updated', refreshUser);
      window.removeEventListener('storage', refreshUser);
    };
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('pfac_theme', nextTheme);
    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const links = roleLinks[user?.role] || [['/', 'Dashboard', 'OV']];
  const entity = user?.company?.name || user?.recruiterAt?.name || user?.college?.name || user?.college?.code;
  const activeLink = (to) => {
    const [path, query] = to.split('?');
    if (path !== location.pathname) return false;
    if (query) return location.search === `?${query}`;
    if (path === '/company/recruitment') return !location.search || location.search === '?tab=post-internship';
    return true;
  };

  return (
    <>
      <button className="mobile-menu-toggle" type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}>
        <span>{mobileOpen ? '×' : '☰'}</span><span>PFAC</span>
      </button>
      {mobileOpen && <button className="mobile-nav-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`pfac-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <Link to={user ? links[0][0] : '/'} className="pfac-brand">
          <span className="pfac-brand-mark">P</span>
          <span><strong>PFAC</strong><small>Campus to career</small></span>
        </Link>

        {user ? <>
          <div className="sidebar-section-label">WORKSPACE</div>
          <nav className="sidebar-navigation" aria-label="Main navigation">
            {links.map(([to, label, icon]) => (
              <Link key={to} to={to} className={`sidebar-link ${activeLink(to) ? 'is-active' : ''}`} aria-current={activeLink(to) ? 'page' : undefined}>
                <span className="sidebar-link-icon">{icon}</span><span>{label}</span>{activeLink(to) && <span className="sidebar-active-mark" />}
              </Link>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-section-label">ACCOUNT</div>
            <Link to="/search" className={`sidebar-link ${location.pathname === '/search' ? 'is-active' : ''}`}><span className="sidebar-link-icon">⌕</span><span>Search portal</span></Link>
            <Link to="/settings" className={`sidebar-link ${location.pathname === '/settings' ? 'is-active' : ''}`}><span className="sidebar-link-icon">⚙</span><span>Settings</span></Link>
            <button type="button" className="sidebar-link theme-switch" onClick={toggleTheme}><span className="sidebar-link-icon">{theme === 'dark' ? '☼' : '◐'}</span><span>{theme === 'dark' ? 'Light appearance' : 'Dark appearance'}</span></button>
            <div className="sidebar-user">
              <span className="sidebar-avatar">{user.photoUrl ? <img src={user.photoUrl} alt="" /> : (user.name || user.email || 'U').trim().slice(0, 1).toUpperCase()}</span>
              <span className="sidebar-user-copy"><strong>{user.name || 'Account'}</strong><small>{entity || roleLabel(user.role)}</small></span>
              <button type="button" onClick={handleLogout} className="sidebar-logout" title="Log out" aria-label="Log out">↗</button>
            </div>
          </div>
        </> : <div className="sidebar-auth-links"><p>Build stronger pathways from campus to career.</p><Link to="/login">Sign in <span>→</span></Link><Link to="/register">Create an account <span>→</span></Link></div>}

        <div className="sidebar-footer"><span className="sidebar-footer-dot" /> Academia + industry, in one place</div>
      </aside>
    </>
  );
}
