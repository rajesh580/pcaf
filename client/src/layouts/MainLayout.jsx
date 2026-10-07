import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { authService } from '../services/authService';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const routing = authService.getDashboardRouting();

  const isAuthPage = ['/login', '/register', '/verify-email', '/forgot-password'].includes(location.pathname);
  const isDashboardRoot = ['/dashboard/student', '/dashboard/college', '/dashboard/company', '/dashboard/admin', '/'].includes(location.pathname);

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return [{ label: 'Home', path: '/' }];

    let currentPath = '';
    return parts.map((part) => {
      currentPath += `/${part}`;
      const formatted = part
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { label: formatted, path: currentPath };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Navbar />

      {/* Navigation Subbar with Back Button & Breadcrumbs */}
      {!isAuthPage && user && (
        <div className="bg-white border-b border-slate-200/80 shadow-xs">
          <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              {/* Universal Back Button */}
              {!isDashboardRoot && (
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition border border-slate-200"
                  title="Go back to previous page"
                >
                  <span className="text-sm font-bold">←</span> Back
                </button>
              )}

              {/* Breadcrumb Path */}
              <nav className="flex items-center space-x-1.5 text-slate-500 font-medium">
                <Link to={routing?.dashboardRoute || '/'} className="hover:text-blue-600 transition">
                  Dashboard
                </Link>
                {breadcrumbs.map((b, idx) => (
                  <React.Fragment key={b.path}>
                    <span className="text-slate-300">/</span>
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="text-slate-900 font-semibold">{b.label}</span>
                    ) : (
                      <Link to={b.path} className="hover:text-blue-600 transition">
                        {b.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Dashboard shortcut link if not already on dashboard */}
            {!isDashboardRoot && (
              <Link
                to={routing?.dashboardRoute || '/dashboard'}
                className="hidden sm:inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition"
              >
                Return to Main Dashboard →
              </Link>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Portal for Academia–Industry Collaboration for Skill Mapping, Internships & Placement &copy; 2026
      </footer>
    </div>
  );
}
