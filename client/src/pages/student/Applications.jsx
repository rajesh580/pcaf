import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { internshipService } from '../../services/internshipService';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  AlertCircle,
  Briefcase,
  GraduationCap,
  X,
  ChevronRight,
  Sparkles,
  Ban
} from 'lucide-react';

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roundModal, setRoundModal] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    internshipService.getMyApplications()
      .then((res) => setApps(res.applications || []))
      .catch((err) => console.warn('Student applications error:', err.message))
      .finally(() => setLoading(false));
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      const res = await internshipService.withdrawApplication(id);
      setMsg(res.message);
      loadApplications();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to withdraw.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SELECTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
      case 'ASSESSMENT':
      case 'TECHNICAL_INTERVIEW':
      case 'HR_INTERVIEW':
      case 'SHORTLISTED':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'REJECTED':
      case 'WITHDRAWN':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" /> Application Tracking
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            My Submissions & Status Progression
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track active internship and job applications, test invitations, and recruitment stage results
          </p>
        </div>

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Submissions</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-display">{apps.length}</span>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">No applications submitted yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You haven't applied to any internships or full-time placement openings yet. Browse top drives matching your skills.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/student/internships"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Browse Internships</span>
            </Link>
            <Link
              to="/student/jobs"
              className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs px-5 py-2.5 rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              <Briefcase className="w-4 h-4" />
              <span>Browse Jobs</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Role & Company</th>
                  <th className="py-3.5 px-6 font-bold">Match Score</th>
                  <th className="py-3.5 px-6 font-bold">Current Status</th>
                  <th className="py-3.5 px-6 font-bold text-right">Actions / Logistics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {apps.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white font-display text-sm">{a.internshipTitle}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{a.companyName}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-sm font-display">
                      {a.matchScore}%
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(a.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {a.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-3">
                      {a.selectionRoundDetails && (
                        <button
                          onClick={() => setRoundModal(a)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Logistics</span>
                        </button>
                      )}
                      {a.status !== 'WITHDRAWN' && a.status !== 'INTERNSHIP_COMPLETED' && (
                        <button
                          onClick={() => handleWithdraw(a.id)}
                          className="inline-flex items-center gap-1 text-xs text-rose-500 hover:underline font-semibold"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Withdraw</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Round Details Modal */}
      {roundModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Selection Round Logistics
              </h3>
              <button onClick={() => setRoundModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div><strong className="text-slate-900 dark:text-white">Round:</strong> {roundModal.selectionRoundDetails.roundName}</div>
              <div><strong className="text-slate-900 dark:text-white">Scheduled Time:</strong> {new Date(roundModal.selectionRoundDetails.scheduledAt).toLocaleString()}</div>
              <div><strong className="text-slate-900 dark:text-white">Instructions:</strong> {roundModal.selectionRoundDetails.instructions}</div>
            </div>

            <a
              href={roundModal.selectionRoundDetails.platformUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-xl transition shadow-md shadow-blue-600/20"
            >
              <span>Enter Test / Interview Room</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
