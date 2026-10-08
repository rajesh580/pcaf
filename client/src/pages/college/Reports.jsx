import React, { useEffect, useState } from 'react';
import { collegeService } from '../../services/collegeService';
import {
  FileText,
  Printer,
  Award,
  DollarSign,
  TrendingUp,
  BarChart3,
  GraduationCap,
  Briefcase,
  Building2,
  CheckCircle2
} from 'lucide-react';

export default function CollegeReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collegeService.getComprehensiveReport()
      .then((res) => setReport(res))
      .catch((err) => console.warn('College reports error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Generating institutional placement report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Report Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" /> Official Analytics Report
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {report?.reportTitle || 'Institutional Placement Report'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Academic Year: {report?.academicYear || '2026-2027'} • {report?.college}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Package Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Highest Package</span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-3 font-display">
            {report?.placementPackageStatistics?.highestPackage ?? '—'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Peak offer across all departments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Package</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-3 font-display">
            {report?.placementPackageStatistics?.averagePackage ?? '—'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Institutional CTC mean</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PPO Conversion</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3 font-display">
            {report?.internshipToJobConversionRate ?? '0%'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Internship to full-time conversion</p>
        </div>
      </div>

      {/* Department-wise Placement Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Department-wise Hiring Statistics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cohort size, placed students, and placement success ratios</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6 font-bold">Academic Branch</th>
                <th className="py-3.5 px-6 font-bold">Total Cohort</th>
                <th className="py-3.5 px-6 font-bold">Students Placed</th>
                <th className="py-3.5 px-6 font-bold">Placement %</th>
                <th className="py-3.5 px-6 font-bold">Applications</th>
                <th className="py-3.5 px-6 font-bold">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(report?.departmentWisePlacement || []).map((row) => {
                const numericRate = parseInt(row.percentage) || 0;
                return (
                  <tr key={row.department} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>{row.department}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-semibold">{row.total}</td>
                    <td className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400 text-sm">{row.placed}</td>
                    <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-sm">{row.percentage}</td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-semibold">{row.applications ?? 0}</td>
                    <td className="py-4 px-6 min-w-[180px]">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(numericRate, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(report?.departmentWisePlacement || []).length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            No department placement records are available for this college yet.
          </div>
        )}
      </div>
    </div>
  );
}
