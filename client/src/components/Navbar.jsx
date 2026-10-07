import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const routing = authService.getDashboardRouting();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'STUDENT':
        return [
          { to: '/dashboard/student', label: 'Dashboard' },
          { to: '/student/internships', label: 'Internships' },
          { to: '/student/jobs', label: 'Jobs' },
          { to: '/student/applications', label: 'My Applications' },
          { to: '/student/profile', label: 'Profile' },
          { to: '/student/standardized-resume', label: 'ATS Resume' },
        ];
      case 'COLLEGE_ADMIN':
      case 'DEPARTMENT_ADMIN':
      case 'FACULTY_COORDINATOR':
        return [
          { to: '/dashboard/college', label: 'Dashboard' },
          { to: '/college/departments', label: 'Departments' },
          { to: '/college/reports', label: 'Reports' },
        ];
      case 'COMPANY_ADMIN':
      case 'COMPANY_RECRUITER':
        return [
          { to: '/dashboard/company', label: 'Dashboard' },
          { to: '/company/recruitment', label: 'Recruitment & Offers' },
        ];
      case 'SUPER_ADMIN':
      case 'PLATFORM_ADMIN':
        return [
          { to: '/dashboard/admin', label: 'Super Admin Console' },
        ];
      default:
        return [{ to: routing?.dashboardRoute || '/dashboard', label: 'Dashboard' }];
    }
  };

  const getEntityLabel = () => {
    if (!user) return null;
    if (['COMPANY_ADMIN', 'COMPANY_RECRUITER'].includes(user.role)) {
      const companyName = user.company?.name || user.recruiterAt?.name || 'Partner Company';
      return `🏢 ${companyName}`;
    }
    if (['DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR'].includes(user.role)) {
      const collegeCode = user.college?.code || user.college?.name || 'College';
      const deptCode = user.department?.code || user.departmentId || 'Dept';
      return `🏫 ${collegeCode} (${deptCode})`;
    }
    if (user.role === 'COLLEGE_ADMIN') {
      const collegeName = user.college?.name || user.college?.code || 'College Admin';
      return `🏫 ${collegeName}`;
    }
    if (user.role === 'STUDENT') {
      const collegeCode = user.college?.code || 'College';
      const deptCode = user.department?.code || 'Student';
      return `🎓 ${collegeCode} • ${deptCode}`;
    }
    return null;
  };

  const entityLabel = getEntityLabel();
  const navLinks = getNavLinks();

  return (
    <nav className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap justify-between items-center gap-4">
        {/* Brand logo & main title */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-xl font-bold tracking-tight text-blue-400 hover:text-blue-300 transition">
            PFAC Portal
          </Link>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md border border-slate-700/60 hidden sm:inline-block">
            Academia–Industry Platform
          </span>
        </div>

        {/* Role Navigation Bar Items */}
        {user && (
          <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700/50">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side Profile & Controls */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <Link
                to="/search"
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-md transition flex items-center gap-1 ${
                  location.pathname === '/search'
                    ? 'bg-slate-800 text-blue-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🔍</span> Search
              </Link>
              {entityLabel && (
                <span className="text-xs font-semibold bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded border border-emerald-800/60 hidden md:inline-block">
                  {entityLabel}
                </span>
              )}
              <span className="text-xs font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800/60 hidden md:inline-block">
                {user.role}
              </span>
              <span className="text-xs font-medium text-slate-200 hidden lg:inline-block">{user.name || user.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs bg-rose-700/80 hover:bg-rose-600 text-white px-3 py-1.5 rounded-md transition font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="space-x-2">
              <Link to="/login" className="text-xs text-slate-300 hover:text-white px-3 py-1.5">
                Login
              </Link>
              <Link
                to="/register"
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-md font-semibold transition shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
