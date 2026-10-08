import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { skillMatchService } from '../../services/skillMatchService';

const fieldClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

export default function SkillMatch() {
  const [target, setTarget] = useState({ title: '', requiredSkills: '', minimumCgpa: '', maximumBacklogs: '', graduationYear: '', requiredDepartments: '' });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const result = await skillMatchService.analyzeMySkillGaps({
        title: target.title.trim() || 'Target role',
        requiredSkills: target.requiredSkills.split(',').map((value) => value.trim()).filter(Boolean),
        minimumCgpa: target.minimumCgpa || 0,
        maximumBacklogs: target.maximumBacklogs === '' ? 100 : target.maximumBacklogs,
        graduationYear: target.graduationYear || 0,
        requiredDepartments: target.requiredDepartments.split(',').map((value) => value.trim()).filter(Boolean)
      });
      setAnalysis(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis could not be completed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Career intelligence</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Skill match & gap analysis</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">Compare your saved skills and academic profile with a target role. Your profile is loaded from your account; only the role requirements are entered here.</p>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
      <form onSubmit={analyze} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700">Target role title<input className={fieldClass} value={target.title} onChange={(e) => setTarget({ ...target, title: e.target.value })} placeholder="e.g. Backend Developer" /></label>
        <label className="text-xs font-semibold text-slate-700">Required skills, comma separated<input required className={fieldClass} value={target.requiredSkills} onChange={(e) => setTarget({ ...target, requiredSkills: e.target.value })} placeholder="Node.js, PostgreSQL, Docker" /></label>
        <label className="text-xs font-semibold text-slate-700">Minimum CGPA<input type="number" min="0" max="10" step="0.1" className={fieldClass} value={target.minimumCgpa} onChange={(e) => setTarget({ ...target, minimumCgpa: e.target.value })} placeholder="No minimum" /></label>
        <label className="text-xs font-semibold text-slate-700">Maximum active backlogs<input type="number" min="0" step="1" className={fieldClass} value={target.maximumBacklogs} onChange={(e) => setTarget({ ...target, maximumBacklogs: e.target.value })} placeholder="No limit" /></label>
        <label className="text-xs font-semibold text-slate-700">Graduation year<input type="number" min="2000" max="2100" className={fieldClass} value={target.graduationYear} onChange={(e) => setTarget({ ...target, graduationYear: e.target.value })} placeholder="Any year" /></label>
        <label className="text-xs font-semibold text-slate-700">Eligible department codes<input className={fieldClass} value={target.requiredDepartments} onChange={(e) => setTarget({ ...target, requiredDepartments: e.target.value })} placeholder="CSE, ISE, AIML (optional)" /></label>
        <div className="md:col-span-2"><button disabled={loading} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Analyzing profile…' : 'Analyze my match'}</button></div>
      </form>

      {analysis && <section className="space-y-4" aria-live="polite">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-medium uppercase text-slate-500">Target role</p><p className="mt-2 text-lg font-bold text-slate-900">{analysis.targetRole}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-medium uppercase text-slate-500">Current match</p><p className="mt-2 text-3xl font-bold text-amber-600">{analysis.matchScoreFormatted}</p></div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-xs font-medium uppercase text-emerald-800">Potential after gaps addressed</p><p className="mt-2 text-3xl font-bold text-emerald-700">{analysis.potentialMatchFormatted}</p></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Strong skills</h2>{analysis.strongSkills.length ? <ul className="mt-3 flex flex-wrap gap-2">{analysis.strongSkills.map((skill) => <li key={skill} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">{skill}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No required skills meet the target level yet.</p>}</div>
          <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Skill gaps</h2>{analysis.skillGaps.length ? <ul className="mt-3 flex flex-wrap gap-2">{analysis.skillGaps.map((skill) => <li key={skill} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">{skill}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Your saved skills meet all listed skill requirements.</p>}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-slate-900">Recommended next steps</h2><Link to="/student/training" className="text-sm font-semibold text-blue-700 hover:underline">Browse training programs</Link></div>{analysis.recommendations.length ? <div className="mt-3 divide-y divide-slate-100">{analysis.recommendations.map((item) => <div key={`${item.step}-${item.skill}`} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="text-sm font-semibold text-slate-800">{item.title}</p><p className="text-xs text-slate-500">{item.skill} · {item.provider}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{item.type}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No skill gaps were found for this target.</p>}<p className="mt-3 text-xs text-slate-500">{analysis.summaryText}</p></div>
      </section>}
    </div>
  );
}
