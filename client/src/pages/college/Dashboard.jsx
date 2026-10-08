import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  School,
  Building2,
  FileSpreadsheet
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
    <div className="space-y-6">
      {/* Executive Header Banner matching Admin Dashboard */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              Live College Portal
            </span>
            <span className="text-xs font-mono text-slate-400">Institutional System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {data?.collegeName || 'College Administration & Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Institutional performance metrics, placement success ratios, branch monitoring, and enrolled student rosters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            to="/college/students"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-sm shadow-blue-500/20 space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Enrolled Students</span>
          </Link>
          <Link
            to="/college/reports"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & Reports</span>
          </Link>
        </div>
      </div>

      {/* Metric KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Registered Students</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalStudents ?? 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Active student profiles</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Placement Success Rate</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{kpis.placementPercentage ?? '0%'}</div>
          <p className="text-[11px] text-slate-400 mt-1">Campus drive conversion</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Average CTC Package</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{kpis.averagePackage ?? 'Not tracked'}</div>
          <p className="text-[11px] text-slate-400 mt-1">Mean salary offered</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Highest CTC Package</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.highestPackage ?? 'Not tracked'}</div>
          <p className="text-[11px] text-slate-400 mt-1">Peak campus offer</p>
        </div>
      </div>

      {/* Department-wise Placement Performance Table matching Admin style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800">Department Placement Performance</h3>
            <p className="text-xs text-slate-500">Live metrics breakdown by academic department</p>
          </div>
          <Link to="/college/departments" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            <span>Manage Departments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase">
              <tr>
                <th className="py-3 px-4">Academic Department</th>
                <th className="py-3 px-4">Placement Success Rate</th>
                <th className="py-3 px-4">Progress Meter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {depts.map((d) => {
                const numericRate = parseInt(d.placementRate) || 0;
                return (
                  <tr key={d.department} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>{d.department}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-600">
                      {d.placementRate}
                    </td>
                    <td className="py-3 px-4 min-w-[200px]">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500" 
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
