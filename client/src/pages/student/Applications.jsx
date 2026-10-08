import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { internshipService } from '../../services/internshipService';

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
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ASSESSMENT':
      case 'TECHNICAL_INTERVIEW':
      case 'HR_INTERVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SHORTLISTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'REJECTED':
      case 'WITHDRAWN':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Tracking Dashboard (Section 11)</h1>
        <p className="text-sm text-slate-500">Track your submissions, interview invitations, and status progressions in real time</p>
      </div>

      {msg && <div className="bg-blue-50 text-blue-800 text-sm p-3.5 rounded-lg border border-blue-200">{msg}</div>}

      {apps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            📄
          </div>
          <h3 className="text-lg font-bold text-slate-800">No applications submitted yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            You haven't applied to any internships or job openings yet. Explore verified opportunities matching your skills and start applying.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/student/internships"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition"
            >
              Browse Internships
            </Link>
            <Link
              to="/student/jobs"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-lg transition border border-slate-200"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Role & Company</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Actions / Logistics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => (
                <tr key={a.id}>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{a.internshipTitle}</div>
                    <div className="text-xs text-slate-500">{a.companyName}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">
                    {a.matchScore}%
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadge(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 space-x-3 text-xs">
                    {a.selectionRoundDetails && (
                      <button
                        onClick={() => setRoundModal(a)}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        View Test/Interview Link
                      </button>
                    )}
                    {a.status !== 'WITHDRAWN' && a.status !== 'INTERNSHIP_COMPLETED' && (
                      <button
                        onClick={() => handleWithdraw(a.id)}
                        className="text-red-500 hover:underline"
                      >
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Round Details Modal */}
      {roundModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Selection Round Logistics</h3>
              <button onClick={() => setRoundModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div><strong>Round:</strong> {roundModal.selectionRoundDetails.roundName}</div>
              <div><strong>Scheduled Time:</strong> {new Date(roundModal.selectionRoundDetails.scheduledAt).toLocaleString()}</div>
              <div><strong>Instructions:</strong> {roundModal.selectionRoundDetails.instructions}</div>
            </div>

            <a
              href={roundModal.selectionRoundDetails.platformUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-lg transition"
            >
              Enter Test / Interview Room
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
