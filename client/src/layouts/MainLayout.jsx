import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { authService } from '../services/authService';
import { Home, ChevronRight, ArrowLeft, Bell, Sparkles, Clock } from 'lucide-react';

const pageNames = {
  '/dashboard/student': 'Student Cockpit',
  '/dashboard/college': 'College Administration',
  '/dashboard/company': 'Industry Partner Portal',
  '/dashboard/admin': 'Platform Governance',
  '/company/recruitment': 'Recruitment Hub',
  '/company/reports': 'Hiring Analytics',
  '/college/departments': 'Academic Departments',
  '/college/reports': 'Placement & Academic Reports',
  '/student/applications': 'My Applications',
  '/student/jobs': 'Placement Job Drive',
  '/student/internships': 'Internship Opportunities',
  '/student/profile': 'My Professional Profile',
  '/student/training': 'Skill Upgrading & Training',
  '/student/report': 'Career & Skill Report',
  '/student/standardized-resume': 'ATS Standardized Resume',
  '/student/skill-match': 'Skill Gap Analysis',
  '/settings': 'Account Settings',
  '/search': 'Portal Search',
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const routing = authService.getDashboardRouting();
  const isAuthPage = ['/login', '/register', '/verify-email', '/forgot-password'].includes(location.pathname);
  const isDashboardRoot = ['/dashboard/student', '/dashboard/college', '/dashboard/company', '/dashboard/admin', '/'].includes(location.pathname);
  
  const title = pageNames[location.pathname] || 
    location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) || 
    'Workspace';
    
  const breadcrumbs = location.pathname.split('/').filter(Boolean).slice(-2).map((part) => part.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()));

  return (
    <div className={`app-frame ${isAuthPage ? 'auth-frame' : ''}`}>
      <Navbar />
      <div className="workspace-shell">
        <header className="workspace-topbar">
          <div className="topbar-heading">
            <div className="topbar-eyebrow">
              {user ? (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-500" /> PFAC WORKSPACE
                </span>
              ) : (
                'WELCOME TO PFAC'
              )}
            </div>
            <h1>{isAuthPage ? 'Academia & Industry Collaboration' : title}</h1>
            {!isAuthPage && (
              <nav className="topbar-breadcrumbs" aria-label="Breadcrumb">
                <Link to={routing?.dashboardRoute || '/'} className="flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                {breadcrumbs.map((part, index) => (
                  <React.Fragment key={`${part}-${index}`}>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span className={index === breadcrumbs.length - 1 ? 'current' : ''}>{part}</span>
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>

          {!isAuthPage && user && (
            <div className="topbar-actions">
              {!isDashboardRoot && (
                <button type="button" onClick={() => navigate(-1)} className="topbar-back">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
              <div className="topbar-date">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Academic & Career Portal</span>
              </div>
            </div>
          )}
        </header>

        <main className="workspace-main">
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
          <footer className="workspace-footer">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">PFAC</span>
              <span>· Academia & Industry Synergy</span>
            </div>
            <div>Bridging Skill Gaps · Empowering Future Careers</div>
          </footer>
        </main>
      </div>
    </div>
  );
}
