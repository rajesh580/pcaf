import React, { useEffect, useState } from 'react';
import { trainingService } from '../../services/trainingService';
import { authService } from '../../services/authService';
import { CheckCircle2, ShieldCheck, Clock, Award } from 'lucide-react';

const initial = { title: '', domain: '', skillsCovered: '', mode: 'ONLINE', durationWeeks: 4, format: '', assessmentType: '' };

export default function SkillProviderDashboard() {
  const isProvider = authService.getCurrentUser()?.role === 'SKILL_PROVIDER';
  const [form, setForm] = useState(initial);
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState('');

  const load = async () => {
    try {
      const catalog = await trainingService.list();
      if (isProvider) {
        const providerData = await trainingService.providerEnrollments();
        const ownIds = new Set((providerData.programs || []).map((program) => program.id));
        setPrograms((catalog.programs || []).filter((program) => ownIds.has(program.id)));
        setEnrollments(providerData.enrollments || []);
      } else {
        setPrograms(catalog.programs || []);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load provider data.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publish = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await trainingService.publish({
        ...form,
        durationWeeks: Number(form.durationWeeks),
        skillsCovered: form.skillsCovered.split(',').map((skill) => skill.trim()).filter(Boolean)
      });
      setMessage(result.message);
      setForm(initial);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not publish program.');
    } finally {
      setSaving(false);
    }
  };

  const handleGrantPermission = async (programId, studentUserId) => {
    setActionBusy(`${programId}-${studentUserId}`);
    setError('');
    setMessage('');
    try {
      const res = await trainingService.approvePermission(programId, studentUserId);
      setMessage(res.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to grant exam permission.');
    } finally {
      setActionBusy('');
    }
  };

  const completed = enrollments.filter((enrollment) => enrollment.status === 'COMPLETED').length;
  const pendingClearance = enrollments.filter((e) => e.status === 'AWAITING_APPROVAL').length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Learning Partner</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Skill Provider Workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Publish programs, review student progress, and grant exam permissions for capstone projects.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-xs font-bold text-emerald-700">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Published Programs', programs.length],
          ['Student Enrollments', enrollments.length],
          ['Pending Exam Clearance', pendingClearance],
          ['Completed Certifications', completed]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {isProvider && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Publish a Training Program</h2>
          <form onSubmit={publish} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Program Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs"
                placeholder="e.g. AWS Cloud Architecture Masterclass"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Domain
              <input
                required
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="Cloud Computing"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700 md:col-span-2">
              Skills Covered (comma separated)
              <input
                required
                value={form.skillsCovered}
                onChange={(e) => setForm({ ...form, skillsCovered: e.target.value })}
                placeholder="AWS, Docker, Kubernetes, Terraform"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Delivery Mode
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs"
              >
                <option>ONLINE</option>
                <option>HYBRID</option>
                <option>OFFLINE</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Duration (weeks)
              <input
                required
                type="number"
                min="1"
                max="104"
                value={form.durationWeeks}
                onChange={(e) => setForm({ ...form, durationWeeks: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Program Format
              <input
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                placeholder="Live interactive sessions and lab projects"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Assessment Description
              <input
                value={form.assessmentType}
                onChange={(e) => setForm({ ...form, assessmentType: e.target.value })}
                placeholder="Capstone project review + proctored assessment"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs"
              />
            </label>
            <div className="md:col-span-2">
              <button
                disabled={saving}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition shadow-sm disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish Program'}
              </button>
            </div>
          </form>
        </section>
      )}

      {isProvider && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base">Student Enrollments & Exam Clearances</h2>
            <span className="text-xs text-slate-500 font-medium">{enrollments.length} Records</span>
          </div>

          {enrollments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Program</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Enrolled On</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{item.user.name || 'Student'}</p>
                        <p className="text-[11px] text-slate-400">{item.user.email}</p>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{item.programTitle}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'APPROVED_FOR_EXAM'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'AWAITING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.status === 'COMPLETED'
                            ? `Completed · ${item.score}%`
                            : item.status === 'APPROVED_FOR_EXAM'
                            ? 'Cleared for Exam'
                            : item.status === 'AWAITING_APPROVAL'
                            ? 'Pending Permission'
                            : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(item.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {item.status !== 'COMPLETED' && (
                          <button
                            disabled={actionBusy === `${item.programId}-${item.user.id}` || item.status === 'APPROVED_FOR_EXAM'}
                            onClick={() => handleGrantPermission(item.programId, item.user.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                              item.status === 'APPROVED_FOR_EXAM'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {item.status === 'APPROVED_FOR_EXAM' ? 'Permission Granted' : 'Approve Clearance'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-8 text-center text-xs text-slate-500">No student enrollments registered yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
