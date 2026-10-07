import React, { useEffect, useState } from 'react';
import { collegeService } from '../../services/collegeService';

export default function CollegeReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collegeService.getComprehensiveReport()
      .then((res) => setReport(res))
      .catch((err) => console.warn('College reports error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading comprehensive placement reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{report?.reportTitle || 'Institutional Placement Report'}</h1>
          <p className="text-sm text-slate-500">Academic Year: {report?.academicYear || '2026-2027'} • {report?.college}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          Print / Export PDF
        </button>
      </div>

      {/* Package Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs uppercase font-medium text-slate-500">Highest Salary Package</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{report?.placementPackageStatistics?.highestPackage ?? '—'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs uppercase font-medium text-slate-500">Average Placement Package</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{report?.placementPackageStatistics?.averagePackage ?? '—'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs uppercase font-medium text-slate-500">Internship to PPO Conversion</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{report?.internshipToJobConversionRate ?? '0%'}</div>
        </div>
      </div>

      {/* Department-wise Placement Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">Department-wise Hiring Statistics</div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Branch</th>
              <th className="py-3 px-4">Total Cohort</th>
              <th className="py-3 px-4">Students Placed</th>
              <th className="py-3 px-4">Placement %</th>
              <th className="py-3 px-4">Average CTC</th>
              <th className="py-3 px-4">Highest CTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(report?.departmentWisePlacement || []).map((row) => (
              <tr key={row.department}>
                <td className="py-3 px-4 font-bold text-slate-900">{row.department}</td>
                <td className="py-3 px-4 text-slate-700">{row.total}</td>
                <td className="py-3 px-4 font-semibold text-emerald-600">{row.placed}</td>
                <td className="py-3 px-4 font-bold text-blue-600">{row.percentage}</td>
                <td className="py-3 px-4 text-slate-700">{row.avgCtc}</td>
                <td className="py-3 px-4 font-bold text-indigo-600">{row.highestCtc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
