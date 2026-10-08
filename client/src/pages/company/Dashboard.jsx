import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import {
  Briefcase,
  GraduationCap,
  Users,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
  BarChart2,
  Search,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';

const formatStatus = (status = '') => status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function CompanyDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await companyService.getDashboardMetrics();
      setData(result);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Company dashboard could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const kpis = data?.kpis || {};
  const statusCounts = useMemo(() => Object.fromEntries((data?.applicationsByStatus || []).map((item) => [item.status, item.count])), [data]);
  const interviews = (statusCounts.TECHNICAL_INTERVIEW || 0) + (statusCounts.HR_INTERVIEW || 0) + (statusCounts.INTERVIEW || 0);
  
  const stages = [
    { label: 'New', count: statusCounts.APPLIED || 0, color: 'bg-blue-600' },
    { label: 'In Review', count: statusCounts.UNDER_REVIEW || 0, color: 'bg-amber-600' },
    { label: 'Shortlisted', count: statusCounts.SHORTLISTED || 0, color: 'bg-indigo-600' },
    { label: 'Interview', count: interviews, color: 'bg-purple-600' },
    { label: 'Selected', count: kpis.selected || 0, color: 'bg-emerald-600' },
  ];
  const maxStage = Math.max(1, ...stages.map((stage) => stage.count));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" /> Industry Partner Command
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {data?.companyName || 'Company Workspace'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track open campus drives, review candidate match ratings, and manage hiring pipelines.
          </p>
        </div>
        <button 
          type="button" 
          onClick={loadDashboard} 
          disabled={loading} 
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing…' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-800 dark:text-rose-300 font-semibold">
          {error}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          ['Active Internships', kpis.activeInternships ?? 0, GraduationCap, 'text-purple-600 bg-purple-50 dark:bg-purple-950/40'],
          ['Active Jobs', kpis.activeJobs ?? 0, Briefcase, 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'],
          ['Applications', kpis.applications ?? 0, Users, 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'],
          ['Shortlisted', kpis.shortlisted ?? 0, UserCheck, 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'],
          ['Interviews', kpis.interviews ?? 0, Sparkles, 'text-teal-600 bg-teal-50 dark:bg-teal-950/40'],
          ['Selected', kpis.selected ?? 0, CheckCircle2, 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'],
        ].map(([label, value, IconComp, colorClass]) => (
          <div key={label} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
              <div className={`p-2 rounded-xl ${colorClass}`}>
                <IconComp className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white font-display">{loading && !data ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline & Quick Actions */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        {/* Pipeline Bar Chart */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Recruitment Pipeline Stages
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Live breakdown of candidates across review stages</p>
            </div>
            <Link to="/company/recruitment?tab=applications" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Review Candidates →
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {stages.map((stage) => (
              <div key={stage.label} className="grid grid-cols-[100px_minmax(0,1fr)_40px] items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{stage.label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div 
                    className={`h-full rounded-full ${stage.color} transition-all duration-500`} 
                    style={{ width: `${Math.max(stage.count ? 6 : 0, (stage.count / maxStage) * 100)}%` }} 
                  />
                </div>
                <span className="text-right text-xs font-bold text-slate-800 dark:text-slate-200">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Quick Actions
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Common recruiting tasks</p>
            </div>
            <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
              {kpis.activeOpenings || 0} Openings
            </span>
          </div>
          <div className="mt-5 space-y-2.5">
            {(data?.quickActions || []).map((action) => (
              <Link 
                key={action.label} 
                to={action.route} 
                className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700/80 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
              >
                <span>{action.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Openings Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Your Openings
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Recent jobs and internship postings</p>
          </div>
          <Link to="/company/recruitment?tab=openings" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Manage All Openings →
          </Link>
        </div>

        {(data?.opportunities || []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Position</th>
                  <th className="px-6 py-3.5 font-bold">Type</th>
                  <th className="px-6 py-3.5 font-bold">Applicants</th>
                  <th className="px-6 py-3.5 font-bold">Deadline</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.opportunities.map((opening) => (
                  <tr key={opening.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{opening.title}</td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">
                      {opening.type === 'JOB' ? 'Full-time' : 'Internship'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400 font-semibold">{opening.applicationCount}</td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">{new Date(opening.deadline).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${opening.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {formatStatus(opening.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No active openings yet</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Publish a job or internship to start building your candidate pipeline.</p>
            <Link to="/company/recruitment?tab=post-internship" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" /> Create Opening
            </Link>
          </div>
        )}
      </div>

      {/* Recent Applicants */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Recent Applicants
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Latest candidate submissions</p>
          </div>
          <Link to="/company/recruitment?tab=applications" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Open Pipeline →
          </Link>
        </div>
        {(data?.recentApplications || []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Candidate</th>
                  <th className="px-6 py-3.5 font-bold">Position</th>
                  <th className="px-6 py-3.5 font-bold">Match Score</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{application.candidateName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{application.college}{application.department ? ` · ${application.department}` : ''}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300 font-medium">{application.opportunityTitle}</td>
                    <td className="px-6 py-3.5 font-bold text-blue-600 dark:text-blue-400">{application.matchScore}%</td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">{formatStatus(application.status)}</td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">{new Date(application.appliedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            New candidate applications will appear here automatically.
          </div>
        )}
      </div>
    </div>
  );
}
