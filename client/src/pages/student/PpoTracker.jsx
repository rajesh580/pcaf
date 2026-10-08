import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Award,
  CheckCircle2,
  Clock,
  Briefcase,
  TrendingUp,
  FileCheck2,
  XCircle,
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
  UserCheck
} from 'lucide-react';

export default function StudentPpoTracker() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    // Get current user student ID or fetch student profile first
    api.get('/students/profile')
      .then((res) => {
        const studentId = res.data.student?.id;
        if (!studentId) {
          setError('Student profile not found.');
          setLoading(false);
          return;
        }
        return api.get(`/ppo-conversion/student/${studentId}`);
      })
      .then((res) => {
        if (res?.data?.trackingRecord) {
          setRecord(res.data.trackingRecord);
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          // No record yet
          setRecord(null);
        } else {
          setError(err.response?.data?.error || 'Could not load PPO tracking details.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePpoResponse = async (responseType) => {
    if (!record) return;
    setResponding(true);
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.patch(`/ppo-conversion/${record.id}/ppo-response`, { response: responseType });
      setActionMsg(res.data.message);
      setRecord((prev) => ({
        ...prev,
        ppoDetails: res.data.ppoDetails
      }));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to submit response.');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium">Fetching Internship Evaluation & PPO Conversion Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Placement Conversion Hub
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pre-Placement Offer (PPO) Tracker</h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Track your ongoing internship milestones, mentor performance evaluations, skill progress, and final PPO job offers.
          </p>
        </div>

        {record?.ppoDetails?.offered && (
          <div className="shrink-0 bg-emerald-950/80 border border-emerald-500/40 p-4 rounded-xl text-right">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">Offer Status</span>
            <span className="text-lg font-extrabold text-white">
              {record.ppoDetails.status === 'OFFER_ACCEPTED' ? '✓ Accepted' : record.ppoDetails.status === 'OFFER_DECLINED' ? '✕ Declined' : '🎉 PPO Extended'}
            </span>
          </div>
        )}
      </div>

      {actionMsg && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {actionError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {!record ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Active Internship Evaluation Record</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            When you join an approved industry internship, your host company manager will log attendance, mentor reviews, and project milestones here for PPO eligibility.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attendance</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                {record.attendancePercentage}%
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Performance Rating</span>
              <p className="text-2xl font-bold text-amber-500 font-display">
                {record.performanceScore} / 5.0
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Project Completion</span>
              <p className="text-2xl font-bold text-blue-600 font-display">
                {record.projectCompletion?.completionPercentage || 0}%
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Evaluation Verdict</span>
              <p className={`text-sm font-bold font-display ${record.finalEvaluation?.verdict === 'ELIGIBLE' ? 'text-emerald-600' : record.finalEvaluation?.verdict === 'NOT_ELIGIBLE' ? 'text-rose-600' : 'text-amber-600'}`}>
                {record.finalEvaluation?.verdict || 'Evaluation Pending'}
              </p>
            </div>
          </div>

          {/* PPO Formal Offer Card (if extended) */}
          {record.ppoDetails?.offered && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-2xl border border-indigo-500/30 text-white shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-900/60 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">Pre-Placement Offer (PPO) Document</h3>
                    <p className="text-xs text-indigo-300">Issued by {record.companyName || 'Host Company'}</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${record.ppoDetails.status === 'OFFER_ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : record.ppoDetails.status === 'OFFER_DECLINED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                  {record.ppoDetails.status.replaceAll('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Offered Role Title</span>
                  <p className="text-base font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    {record.ppoDetails.jobTitle}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Annual CTC Package</span>
                  <p className="text-base font-bold text-amber-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    {record.ppoDetails.salaryPackage}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Tentative Joining Date</span>
                  <p className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    {new Date(record.ppoDetails.joiningDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action buttons if status is OFFER_EXTENDED */}
              {record.ppoDetails.status === 'OFFER_EXTENDED' && (
                <div className="pt-4 border-t border-indigo-900/60 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() => handlePpoResponse('DECLINE')}
                    className="px-5 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition disabled:opacity-50"
                  >
                    Decline PPO Offer
                  </button>
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() => handlePpoResponse('ACCEPT')}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{responding ? 'Submitting Response...' : 'Accept PPO Placement Offer'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mentor Feedback & Skill Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feedback History */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Mentor Evaluation Logs
              </h3>

              {record.mentorFeedback?.length ? (
                <div className="space-y-3">
                  {record.mentorFeedback.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Milestone Review</span>
                        <span>{item.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No mentor feedback logs recorded yet.</p>
              )}
            </div>

            {/* Skill Improvement */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Verified Skill Gains
              </h3>

              {record.skillImprovement?.length ? (
                <div className="space-y-3">
                  {record.skillImprovement.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.skill}</span>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]">{item.before}</span>
                        <span className="text-emerald-600 font-bold">→</span>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-bold">{item.after}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No skill level improvements recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
