import React, { useEffect, useState } from 'react';
import { trainingService } from '../../services/trainingService';
import { authService } from '../../services/authService';

const initial = { title: '', domain: '', skillsCovered: '', mode: 'ONLINE', durationWeeks: 4, format: '', assessmentType: '' };

export default function SkillProviderDashboard() {
  const isProvider = authService.getCurrentUser()?.role === 'SKILL_PROVIDER';
  const [form, setForm] = useState(initial);
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

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
    } catch (err) { setError(err.response?.data?.error || 'Could not load provider data.'); }
  };

  useEffect(() => { load(); }, []);

  const publish = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const result = await trainingService.publish({ ...form, durationWeeks: Number(form.durationWeeks), skillsCovered: form.skillsCovered.split(',').map((skill) => skill.trim()).filter(Boolean) });
      setMessage(result.message); setForm(initial); await load();
    } catch (err) { setError(err.response?.data?.error || 'Could not publish program.'); }
    finally { setSaving(false); }
  };

  const completed = enrollments.filter((enrollment) => enrollment.status === 'COMPLETED').length;
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Learning partner</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Skill provider workspace</h1><p className="mt-1 text-sm text-slate-500">Publish programs, map them to practical skills, and follow student enrollment and completion.</p></header>
    {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
    {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{[['Published programs', programs.length], ['Student enrollments', enrollments.length], ['Completions', completed]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>)}</div>
    {isProvider && <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Publish a program</h2><form onSubmit={publish} className="mt-4 grid gap-4 md:grid-cols-2">
      <label className="text-xs font-semibold text-slate-700">Program title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
      <label className="text-xs font-semibold text-slate-700">Domain<input required value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="Cloud computing" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
      <label className="text-xs font-semibold text-slate-700 md:col-span-2">Skills covered, comma separated<input required value={form.skillsCovered} onChange={(e) => setForm({ ...form, skillsCovered: e.target.value })} placeholder="AWS, Docker, Kubernetes" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
      <label className="text-xs font-semibold text-slate-700">Delivery mode<select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"><option>ONLINE</option><option>HYBRID</option><option>OFFLINE</option></select></label>
      <label className="text-xs font-semibold text-slate-700">Duration (weeks)<input required type="number" min="1" max="104" value={form.durationWeeks} onChange={(e) => setForm({ ...form, durationWeeks: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
      <label className="text-xs font-semibold text-slate-700">Program format<input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} placeholder="Live sessions and project labs" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
      <label className="text-xs font-semibold text-slate-700">Assessment description<input value={form.assessmentType} onChange={(e) => setForm({ ...form, assessmentType: e.target.value })} placeholder="Project review and final assessment" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
      <div className="md:col-span-2"><button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Publishing…' : 'Publish program'}</button></div>
    </form></section>}
    {!isProvider && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">Browse partner programs and use their skill coverage to guide your students. Program publishing and enrollment records are available to skill provider accounts.</p>}
    {isProvider && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b px-5 py-4"><h2 className="font-semibold text-slate-900">Student enrollments</h2></div>{enrollments.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Program</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Enrolled</th></tr></thead><tbody className="divide-y divide-slate-100">{enrollments.map((item) => <tr key={item.id}><td className="px-4 py-3"><p className="font-medium">{item.user.name || 'Student'}</p><p className="text-xs text-slate-500">{item.user.email}</p></td><td className="px-4 py-3">{item.programTitle}</td><td className="px-4 py-3">{item.status === 'COMPLETED' ? `Completed · ${item.score}%` : 'In progress'}</td><td className="px-4 py-3">{new Date(item.enrolledAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-slate-500">Your programs do not have student enrollments yet.</p>}</section>}
    {!isProvider && <section className="grid gap-4 md:grid-cols-2">{programs.map((program) => <article key={program.id} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase text-blue-600">{program.domain} · {program.mode}</p><h2 className="mt-1 font-semibold text-slate-900">{program.title}</h2><p className="mt-2 text-sm text-slate-500">{program.provider} · {program.durationWeeks} weeks</p><div className="mt-3 flex flex-wrap gap-1.5">{program.skillsCovered.map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{skill}</span>)}</div></article>)}</section>}
  </div>;
}
