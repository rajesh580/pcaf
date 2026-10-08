import React, { useEffect, useMemo, useState } from 'react';
import { trainingService } from '../../services/trainingService';

export default function StudentTraining() {
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [scoreByProgram, setScoreByProgram] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [programResult, enrollmentResult] = await Promise.all([
        trainingService.list({ search, mode: mode || undefined }), trainingService.enrollments()
      ]);
      setPrograms(programResult.programs || []);
      setEnrollments(enrollmentResult.enrollments || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Training programs could not be loaded.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, mode]);

  const enrollmentByProgram = useMemo(() => new Map(enrollments.map((item) => [item.programId, item])), [enrollments]);
  const act = async (id, operation) => {
    setBusy(id); setMessage(''); setError('');
    try {
      const result = await operation();
      setMessage(result.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'That action could not be completed.');
    } finally { setBusy(''); }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Skill development</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Training programs</h1>
        <p className="mt-1 text-sm text-slate-500">Build skills that employers ask for. Completed programs add a certificate and skill evidence to your profile.</p>
      </header>

      {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <label className="sr-only" htmlFor="training-search">Search programs or skills</label>
          <input id="training-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search programs or skills" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <label className="sr-only" htmlFor="training-mode">Delivery mode</label>
          <select id="training-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All delivery modes</option><option value="ONLINE">Online</option><option value="HYBRID">Hybrid</option><option value="OFFLINE">In person</option>
          </select>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-slate-900">Available programs</h2><span className="text-xs text-slate-500">{programs.length} programs</span></div>
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading programs…</p> : programs.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No programs match your search.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {programs.map((program) => {
              const enrollment = enrollmentByProgram.get(program.id);
              const isBusy = busy === program.id;
              return <article key={program.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{program.domain}</p><h3 className="mt-1 text-lg font-bold text-slate-900">{program.title}</h3></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{program.mode}</span></div>
                <p className="mt-3 text-sm text-slate-600">{program.format}</p>
                <p className="mt-2 text-xs text-slate-500">{program.provider} · {program.durationWeeks} weeks</p>
                <div className="mt-4 flex flex-wrap gap-1.5">{program.skillsCovered.map((skill) => <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">{skill}</span>)}</div>
                <div className="mt-auto pt-5">
                  {enrollment?.status === 'COMPLETED' ? <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800"><strong>Completed · {enrollment.score}%</strong><br />Certificate {enrollment.certificateCode}</div> : !enrollment ? <button disabled={isBusy} onClick={() => act(program.id, () => trainingService.enroll(program.id))} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isBusy ? 'Enrolling…' : 'Enroll'}</button> : <div className="space-y-2 rounded-lg bg-amber-50 p-3">
                    <div className="flex items-center justify-between text-xs"><strong className="text-amber-900">Assessment</strong><span className="text-amber-800">Pass mark: 60%</span></div>
                    <label className="sr-only" htmlFor={`score-${program.id}`}>Assessment score percentage</label>
                    <div className="flex gap-2"><input id={`score-${program.id}`} type="number" min="0" max="100" step="1" value={scoreByProgram[program.id] || ''} onChange={(e) => setScoreByProgram({ ...scoreByProgram, [program.id]: e.target.value })} placeholder="Score %" className="w-28 rounded-md border border-amber-200 px-2 py-1.5 text-sm" /><button disabled={isBusy || scoreByProgram[program.id] === ''} onClick={() => act(program.id, () => trainingService.complete(program.id, Number(scoreByProgram[program.id])))} className="flex-1 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50">{isBusy ? 'Saving…' : 'Submit assessment'}</button></div>
                    <p className="text-xs text-amber-800">{program.assessmentType}</p>
                  </div>}
                </div>
              </article>;
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-slate-900">My learning record</h2><span className="text-xs text-slate-500">Saved to your account</span></div>
        {enrollments.length === 0 ? <p className="text-sm text-slate-500">You have not enrolled in a program yet.</p> : <div className="divide-y divide-slate-100">{enrollments.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="text-sm font-medium text-slate-800">{item.programTitle}</p><p className="text-xs text-slate-500">Enrolled {new Date(item.enrolledAt).toLocaleDateString()}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status === 'COMPLETED' ? `Completed · ${item.score}%` : 'In progress'}</span></div>)}</div>}
      </section>
    </div>
  );
}
