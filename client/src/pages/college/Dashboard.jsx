import React, { useEffect, useState } from 'react';
import { collegeService } from '../../services/collegeService';

export default function CollegeDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    collegeService.getPlacementStats()
      .then((res) => setData(res))
      .catch((err) => console.warn('College dashboard metrics error:', err.message));
  }, []);

  const kpis = data?.collegeKpis || {};
  const depts = data?.departmentWiseAnalysis || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{data?.collegeName || 'College Administration'}</h1>
        <p className="text-sm text-slate-500">Institutional performance, placement ratios, and branch monitoring</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Total Students</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalStudents || 2850}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Placement %</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{kpis.placementPercentage || '54%'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Average CTC</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{kpis.averagePackage || '₹7.2 LPA'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Highest CTC</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{kpis.highestPackage || '₹24 LPA'}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
          Department-wise Placement Analysis (Section 20)
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Academic Branch</th>
              <th className="py-3 px-4">Placement Success Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {depts.map((d) => (
              <tr key={d.department}>
                <td className="py-3 px-4 font-semibold text-slate-800">{d.department}</td>
                <td className="py-3 px-4 font-bold text-blue-600">{d.placementRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
