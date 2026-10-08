import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import {
  FileText,
  Target,
  Briefcase,
  GraduationCap,
  Sparkles,
  TrendingUp,
  ArrowRight,
  UserCheck,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Compass
} from 'lucide-react';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService.getDashboardMetrics()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading student metrics & insights...</p>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-md border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Career Cockpit
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white">
              {data?.welcomeMessage || 'Welcome back, Student'}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Track your academic progress, match skills with industry demands, and apply for top internship and placement opportunities.
            </p>
          </div>
          <Link
            to="/student/standardized-resume"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition transform hover:-translate-y-0.5"
          >
            <FileCheck className="w-4 h-4" />
            <span>Standardized ATS Resume</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Profile Completion</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-display">{m.profileCompletion ?? '0%'}</div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: m.profileCompletion || '0%' }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Skill Match Score</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3 font-display">{m.skillMatchScore ?? '0%'}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Matches industry benchmarks
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Applications</span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-display">{m.applications ?? 0}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Active recruitment drives</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interviews</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-3 font-display">{m.interviews ?? 0}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Scheduled shortlists</p>
        </div>
      </div>

      {/* Intelligence & Upskilling Indicator */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Active Skill Gaps Identified: <span className="text-amber-600 font-bold">{m.skillGaps ?? 0}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              You have {m.recommendedCourses ?? 0} recommended training programs available to bridge your skill gaps and elevate placement match ratings.
            </p>
          </div>
        </div>
        <Link
          to="/student/skill-match"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition shrink-0"
        >
          <span>Skill Gap Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Student Workspace Actions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quick access to essential portal features and career tools</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { to: '/student/profile', label: 'Complete Profile', icon: UserCheck, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
            { to: '/student/skills', label: 'Update Skills', icon: Award, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
            { to: '/student/resume', label: 'Upload Resume', icon: FileText, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
            { to: '/student/internships', label: 'Find Internships', icon: GraduationCap, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
            { to: '/student/jobs', label: 'Placement Jobs', icon: Briefcase, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40' },
            { to: '/student/recommendations', label: 'AI Matches', icon: Sparkles, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
            { to: '/student/applications', label: 'Applications', icon: CheckCircle2, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
            { to: '/student/skill-match', label: 'Skill Gap', icon: Target, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
            { to: '/student/report', label: 'Career Report', icon: Compass, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
            { to: '/student/training', label: 'Trainings', icon: BookOpen, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <Link
                key={idx}
                to={item.to}
                className="group p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl transition duration-200 flex flex-col items-center text-center space-y-2 hover:shadow-md"
              >
                <div className={`p-2.5 rounded-xl ${item.color} group-hover:scale-110 transition duration-200`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
