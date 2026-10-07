import React, { useEffect, useState } from 'react';
import { companyService } from '../../services/companyService';

export default function CompanyDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    companyService.getDashboardMetrics()
      .then((res) => setData(res))
      .catch((err) => console.warn('Company dashboard error:', err.message));
  }, []);

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data?.companyName || 'Company Recruitment Dashboard'}</h1>
          <p className="text-sm text-slate-500">Corporate recruitment funnel, intern conversion, and candidate pipeline</p>
        </div>
      </div>

      {/* 7 KPIs from Section 19 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Active Internships</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{kpis.activeInternships ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Active Jobs</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{kpis.activeJobs ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Applications</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{kpis.applications ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Shortlisted</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{kpis.shortlisted ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Interviews Conducted</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{kpis.interviews ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Final Selections</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{kpis.selected ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2">
          <span className="text-xs font-medium text-slate-500 uppercase">Internship to PPO Conversions</span>
          <div className="text-2xl font-bold text-teal-600 mt-1">{kpis.internshipConversions ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
