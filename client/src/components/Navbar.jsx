import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import NotificationsDrawer from './NotificationsDrawer';
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  FileText,
  BookOpen,
  BarChart3,
  User,
  FileCheck,
  Building2,
  Building,
  Users,
  Radio,
  ShieldAlert,
  Search,
  Settings,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Award,
  ChevronRight,
  Menu,
  X,
  Target
} from 'lucide-react';

const roleLinks = {
  STUDENT: [
    ['/dashboard/student', 'Overview', LayoutDashboard],
    ['/student/internships', 'Internships', GraduationCap],
    ['/student/jobs', 'Placement Jobs', Briefcase],
    ['/student/applications', 'Applications', FileText],
    ['/student/skill-match', 'Skill Gap Match', Target],
    ['/student/training', 'Training Programs', BookOpen],
    ['/student/report', 'Career Report', BarChart3],
    ['/student/ppo-tracker', 'PPO Offer Tracker', Award],
    ['/student/profile', 'My Profile', User],
    ['/student/standardized-resume', 'ATS Resume Builder', FileCheck],
  ],
  COLLEGE_ADMIN: [
    ['/dashboard/college', 'Overview', LayoutDashboard],
    ['/college/students', 'Enrolled Students', Users],
    ['/college/departments', 'Departments', Building],
    ['/college/reports', 'Analytics & Reports', BarChart3]
  ],
  DEPARTMENT_ADMIN: [
    ['/dashboard/college', 'Overview', LayoutDashboard],
    ['/college/students', 'Enrolled Students', Users],
    ['/college/departments', 'Departments', Building],
    ['/college/reports', 'Analytics & Reports', BarChart3]
  ],
  FACULTY_COORDINATOR: [
    ['/dashboard/college', 'Overview', LayoutDashboard],
    ['/college/students', 'Enrolled Students', Users],
    ['/college/departments', 'Departments', Building],
    ['/college/reports', 'Analytics & Reports', BarChart3]
  ],
  COMPANY_ADMIN: [
    ['/dashboard/company', 'Overview', LayoutDashboard],
    ['/company/recruitment', 'Recruitment Portal', Briefcase],
    ['/company/recruitment?tab=candidates', 'Talent Search', Search],
    ['/company/reports', 'Hiring Analytics', BarChart3]
  ],
  COMPANY_RECRUITER: [
    ['/dashboard/company', 'Overview', LayoutDashboard],
    ['/company/recruitment', 'Recruitment Portal', Briefcase],
    ['/company/recruitment?tab=candidates', 'Talent Search', Search],
    ['/company/reports', 'Hiring Analytics', BarChart3]
  ],
  SKILL_PROVIDER: [
    ['/dashboard/skill-provider', 'Programs & Enrollments', BookOpen]
  ],
  MENTOR: [
    ['/dashboard/skill-provider', 'Skill Hub', Sparkles]
  ],
  SUPER_ADMIN: [
    ['/dashboard/admin?tab=overview', 'Overview', LayoutDashboard],
    ['/dashboard/admin?tab=users', 'User Directory', Users],
    ['/dashboard/admin?tab=students', 'Student Profiles', GraduationCap],
    ['/dashboard/admin?tab=colleges', 'Colleges', Building],
    ['/dashboard/admin?tab=companies', 'Industry Partners', Building2],
    ['/dashboard/admin?tab=broadcast', 'System Broadcast', Radio],
    ['/dashboard/admin?tab=audit', 'Audit Logs', ShieldAlert],
  ],
  PLATFORM_ADMIN: [
    ['/dashboard/admin?tab=overview', 'Overview', LayoutDashboard],
    ['/dashboard/admin?tab=users', 'User Directory', Users],
    ['/dashboard/admin?tab=students', 'Student Profiles', GraduationCap],
    ['/dashboard/admin?tab=colleges', 'Colleges', Building],
    ['/dashboard/admin?tab=companies', 'Industry Partners', Building2],
    ['/dashboard/admin?tab=broadcast', 'System Broadcast', Radio],
    ['/dashboard/admin?tab=audit', 'Audit Logs', ShieldAlert],
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

  const links = roleLinks[user?.role] || [['/', 'Dashboard', LayoutDashboard]];
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
      <button 
        className="mobile-menu-toggle" 
        type="button" 
        onClick={() => setMobileOpen((open) => !open)} 
        aria-expanded={mobileOpen} 
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        <span>PFAC</span>
      </button>

      {mobileOpen && <button className="mobile-nav-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <aside className={`pfac-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="flex items-center justify-between pr-2 border-b border-slate-800/60 pb-1">
          <Link to={user ? links[0][0] : '/'} className="pfac-brand border-b-0 mb-0">
            <div className="pfac-brand-mark">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <strong>PFAC PORTAL</strong>
              <small>Academia & Industry Hub</small>
            </div>
          </Link>
          {user && <NotificationsDrawer />}
        </div>

        {user ? (
          <>
            <div className="sidebar-section-label">Main Menu</div>
            <nav className="sidebar-navigation" aria-label="Main navigation">
              {links.map(([to, label, IconComponent]) => {
                const isActive = activeLink(to);
                return (
                  <Link 
                    key={to} 
                    to={to} 
                    className={`sidebar-link ${isActive ? 'is-active' : ''}`} 
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="sidebar-link-icon">
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <span>{label}</span>
                    {isActive && <span className="sidebar-active-mark" />}
                  </Link>
                );
              })}
            </nav>

            <div className="sidebar-bottom">
              <div className="sidebar-section-label">Account & Tools</div>
              <Link to="/search" className={`sidebar-link ${location.pathname === '/search' ? 'is-active' : ''}`}>
                <span className="sidebar-link-icon"><Search className="w-4 h-4" /></span>
                <span>Global Search</span>
              </Link>
              <Link to="/settings" className={`sidebar-link ${location.pathname === '/settings' ? 'is-active' : ''}`}>
                <span className="sidebar-link-icon"><Settings className="w-4 h-4" /></span>
                <span>Settings</span>
              </Link>
              <button type="button" className="sidebar-link theme-switch" onClick={toggleTheme}>
                <span className="sidebar-link-icon">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                </span>
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <div className="sidebar-user">
                <span className="sidebar-avatar">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="" />
                  ) : (
                    (user.name || user.email || 'U').trim().slice(0, 1).toUpperCase()
                  )}
                </span>
                <span className="sidebar-user-copy">
                  <strong>{user.name || 'User Account'}</strong>
                  <small>{entity || roleLabel(user.role)}</small>
                </span>
                <button 
                  type="button" 
                  onClick={handleLogout} 
                  className="sidebar-logout" 
                  title="Log out" 
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="sidebar-auth-links p-4 space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              Bridging academia and industry for skill mapping, internships & placements.
            </p>
            <Link 
              to="/login" 
              className="flex items-center justify-between p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition"
            >
              <span>Sign In</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/register" 
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
            >
              <span>Create Account</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="sidebar-footer">
          <span className="sidebar-footer-dot" />
          <span>PFAC Platform v2.4</span>
        </div>
      </aside>
    </>
  );
}
