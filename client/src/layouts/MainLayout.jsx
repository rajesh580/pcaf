import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { authService } from '../services/authService';

const pageNames = {
  '/dashboard/student': 'Student overview',
  '/dashboard/college': 'College overview',
  '/dashboard/company': 'Company overview',
  '/dashboard/admin': 'Administration',
  '/company/recruitment': 'Recruitment workspace',
  '/company/reports': 'Company reports',
  '/college/departments': 'Departments',
  '/college/reports': 'College reports',
  '/student/applications': 'My applications',
  '/student/jobs': 'Placement jobs',
  '/student/internships': 'Internships',
  '/student/profile': 'My profile',
  '/student/training': 'Training',
  '/student/report': 'Career report',
  '/student/standardized-resume': 'ATS resume',
  '/settings': 'Account settings',
  '/search': 'Search portal',
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const routing = authService.getDashboardRouting();
  const isAuthPage = ['/login', '/register', '/verify-email', '/forgot-password'].includes(location.pathname);
  const isDashboardRoot = ['/dashboard/student', '/dashboard/college', '/dashboard/company', '/dashboard/admin', '/'].includes(location.pathname);
  const title = pageNames[location.pathname] || location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Workspace';
  const breadcrumbs = location.pathname.split('/').filter(Boolean).slice(-2).map((part) => part.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()));

  return (
    <div className={`app-frame ${isAuthPage ? 'auth-frame' : ''}`}>
      <Navbar />
      <div className="workspace-shell">
        <header className="workspace-topbar">
          <div className="topbar-heading">
            <div className="topbar-eyebrow">{user ? 'PFAC WORKSPACE' : 'WELCOME TO PFAC'}</div>
            <h1>{isAuthPage ? 'Your next step starts here' : title}</h1>
            {!isAuthPage && <div className="topbar-breadcrumbs"><Link to={routing?.dashboardRoute || '/'}>Home</Link>{breadcrumbs.map((part, index) => <React.Fragment key={`${part}-${index}`}><span>/</span><span className={index === breadcrumbs.length - 1 ? 'current' : ''}>{part}</span></React.Fragment>)}</div>}
          </div>
          {!isAuthPage && user && <div className="topbar-actions">{!isDashboardRoot && <button type="button" onClick={() => navigate(-1)} className="topbar-back"><span>←</span> Back</button>}<span className="topbar-date">ACADEMIC & CAREER PORTAL</span></div>}
        </header>
        <main className="workspace-main">
          <div key={location.pathname} className="page-transition"><Outlet /></div>
          <footer className="workspace-footer"><span>PFAC · Academia + Industry</span><span>Learning today. Building tomorrow.</span></footer>
        </main>
      </div>
    </div>
  );
}
