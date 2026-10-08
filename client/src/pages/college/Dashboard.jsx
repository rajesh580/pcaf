import React, { useEffect, useState } from 'react';
import { collegeService } from '../../services/collegeService';
import {
  Building,
  Users,
  TrendingUp,
  DollarSign,
  Award,
  BarChart3,
  GraduationCap,
  Sparkles,
  ArrowRight,
  School
} from 'lucide-react';

export default function CollegeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collegeService.getPlacementStats()
      .then((res) => setData(res))
      .catch((err) => console.warn('College dashboard metrics error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.collegeKpis || {};
  const depts = data?.departmentWiseAnalysis || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading institutional placement data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <School className="w-3.5 h-3.5" /> Institution Command Center
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {data?.collegeName || 'College Administration'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Institutional performance metrics, placement success ratios, and branch monitoring
          </p>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Enrolled</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-display">{kpis.totalStudents ?? 0}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Active student profiles</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Placement Rate</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3 font-display">{kpis.placementPercentage ?? '0%'}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Campus drive conversion</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Package</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-3 font-display">{kpis.averagePackage ?? 'Not tracked'}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Mean CTC offered</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Highest Package</span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-3 font-display">{kpis.highestPackage ?? 'Not tracked'}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Peak offer milestone</p>
        </div>
      </div>

      {/* Department-wise Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Department-wise Placement Performance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time breakdown by academic branch</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6 font-bold">Academic Branch</th>
                <th className="py-3.5 px-6 font-bold">Placement Success Rate</th>
                <th className="py-3.5 px-6 font-bold">Progress Meter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {depts.map((d) => {
                const numericRate = parseInt(d.placementRate) || 0;
                return (
                  <tr key={d.department} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>{d.department}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {d.placementRate}
                    </td>
                    <td className="py-4 px-6 min-w-[200px]">
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
      </div>
    </div>
  );
}
