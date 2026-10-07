import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService.getDashboardMetrics()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading student metrics...</div>;

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data?.welcomeMessage || 'Welcome, Student'}</h1>
          <p className="text-sm text-slate-500">Your personalized academic and career progression cockpit</p>
        </div>
        <Link
          to="/student/standardized-resume"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
        >
          View Standardized Resume
        </Link>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Profile Completion</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{m.profileCompletion ?? '0%'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Skill Match Score</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{m.skillMatchScore ?? '0%'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Applications</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{m.applications ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Interviews Scheduled</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{m.interviews ?? 0}</div>
        </div>
      </div>

      {/* Intelligence & Upskilling Indicator */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-amber-900 text-sm">Active Skill Gaps Identified: {m.skillGaps ?? 0}</h3>
          <p className="text-xs text-amber-700 mt-0.5">
            You have {m.recommendedCourses ?? 0} recommended courses available to upgrade your profile and boost match scores.
          </p>
        </div>
        <Link
          to="/student/skill-match"
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition"
        >
          Skill Gap Analysis
        </Link>
      </div>

      {/* Quick Actions (Section 21) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/student/profile" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-200/80 transition">
            Complete Profile
          </Link>
          <Link to="/student/skills" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-200/80 transition">
            Update Skills
          </Link>
          <Link to="/student/resume" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-200/80 transition">
            Upload Resume
          </Link>
          <Link to="/student/internships" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-200/80 transition">
            Find Internship
          </Link>
          <Link to="/student/jobs" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-200/80 transition">
            Find Jobs
          </Link>
          <Link to="/student/recommendations" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-200/80 transition">
            View Recommendations
          </Link>
          <Link to="/student/applications" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-200/80 transition">
            View Applications
          </Link>
          <Link to="/student/skill-match" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-center text-xs font-medium text-slate-700 border border-slate-200/80 transition">
            Skill Gap Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}
