import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/companyService';

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
    { label: 'In review', count: statusCounts.UNDER_REVIEW || 0, color: 'bg-amber-600' },
    { label: 'Shortlisted', count: statusCounts.SHORTLISTED || 0, color: 'bg-sky-700' },
    { label: 'Interview', count: interviews, color: 'bg-orange-600' },
    { label: 'Selected', count: kpis.selected || 0, color: 'bg-emerald-700' },
  ];
  const maxStage = Math.max(1, ...stages.map((stage) => stage.count));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Recruitment workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{data?.companyName || 'Company dashboard'}</h1>
          <p className="mt-1 text-sm text-slate-500">Track open roles, review applicants, and find new candidates.</p>
        </div>
        <button type="button" onClick={loadDashboard} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">
          {loading ? 'Refreshing…' : 'Refresh data'}
        </button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          ['Active internships', kpis.activeInternships ?? 0],
          ['Active jobs', kpis.activeJobs ?? 0],
          ['Total applications', kpis.applications ?? 0],
          ['Shortlisted', kpis.shortlisted ?? 0],
          ['Interviews', kpis.interviews ?? 0],
          ['Selected', kpis.selected ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
            <p className="mt-2 text-2xl font-bold text-slate-900">{loading && !data ? '—' : value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,.8fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="font-bold text-slate-900">Hiring pipeline</h2><p className="mt-1 text-xs text-slate-500">Applicants at each review stage</p></div>
            <Link to="/company/recruitment?tab=applications" className="text-xs font-semibold text-blue-600 hover:underline">Review applications</Link>
          </div>
          <div className="mt-5 space-y-4">
            {stages.map((stage) => (
              <div key={stage.label} className="grid grid-cols-[82px_minmax(0,1fr)_36px] items-center gap-3">
                <span className="text-xs font-medium text-slate-600">{stage.label}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${stage.color} transition-[width] duration-500`} style={{ width: `${Math.max(stage.count ? 6 : 0, stage.count / maxStage * 100)}%` }} /></div>
                <span className="text-right text-xs font-bold text-slate-800">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">Quick actions</h2><p className="mt-1 text-xs text-slate-500">Common recruiting tasks</p></div><span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">{kpis.activeOpenings || 0} open roles</span></div>
          <div className="mt-4 grid gap-2">
            {(data?.quickActions || []).map((action) => (
              <Link key={action.label} to={action.route} className="group flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50/60">
                <span>{action.label}</span><span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-700" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div><h2 className="font-bold text-slate-900">Your openings</h2><p className="mt-1 text-xs text-slate-500">Recent jobs and internship postings</p></div>
          <Link to="/company/recruitment?tab=openings" className="text-xs font-semibold text-blue-600 hover:underline">Manage openings</Link>
        </div>
        {(data?.opportunities || []).length ? (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Position</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Applicants</th><th className="px-5 py-3">Deadline</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{data.opportunities.map((opening) => <tr key={opening.id}><td className="px-5 py-3 font-semibold text-slate-800">{opening.title}</td><td className="px-5 py-3 text-slate-600">{opening.type === 'JOB' ? 'Full-time role' : 'Internship'}</td><td className="px-5 py-3 text-slate-600">{opening.applicationCount}</td><td className="px-5 py-3 text-slate-500">{new Date(opening.deadline).toLocaleDateString()}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${opening.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : opening.status === 'PAUSED' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{formatStatus(opening.status)}</span></td></tr>)}</tbody></table></div>
        ) : <div className="px-5 py-9 text-center"><p className="text-sm font-semibold text-slate-700">No openings yet</p><p className="mt-1 text-xs text-slate-500">Publish a job or internship to start building your pipeline.</p><Link to="/company/recruitment?tab=post-internship" className="mt-3 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">Create an opening</Link></div>}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Recent applicants</h2><p className="mt-1 text-xs text-slate-500">Latest applications across your openings</p></div><Link to="/company/recruitment?tab=applications" className="text-xs font-semibold text-blue-600 hover:underline">Open pipeline</Link></div>
        {(data?.recentApplications || []).length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Candidate</th><th className="px-5 py-3">Position</th><th className="px-5 py-3">Match</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Applied</th></tr></thead><tbody className="divide-y divide-slate-100">{data.recentApplications.map((application) => <tr key={application.id}><td className="px-5 py-3"><p className="font-semibold text-slate-800">{application.candidateName}</p><p className="text-xs text-slate-500">{application.college}{application.department ? ` · ${application.department}` : ''}</p></td><td className="px-5 py-3">{application.opportunityTitle}</td><td className="px-5 py-3 font-semibold text-blue-600">{application.matchScore}%</td><td className="px-5 py-3">{formatStatus(application.status)}</td><td className="px-5 py-3 text-xs text-slate-500">{new Date(application.appliedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <div className="px-5 py-8 text-center text-sm text-slate-500">New applications will appear here.</div>}
      </section>
    </div>
  );
}
