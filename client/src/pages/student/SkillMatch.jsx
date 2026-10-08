import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { skillMatchService } from '../../services/skillMatchService';
import {
  Target,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Compass,
  Award,
  BookOpen
} from 'lucide-react';

const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition';

export default function SkillMatch() {
  const [target, setTarget] = useState({ title: '', requiredSkills: '', minimumCgpa: '', maximumBacklogs: '', graduationYear: '', requiredDepartments: '' });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jdText, setJdText] = useState('');
  const [parsingJd, setParsingJd] = useState(false);

  const parseJdText = () => {
    if (!jdText.trim()) return;
    setParsingJd(true);
    
    // Skill extraction dictionary
    const knownSkills = [
      'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
      'PostgreSQL', 'MongoDB', 'SQL', 'Docker', 'Kubernetes', 'AWS', 'Azure',
      'Machine Learning', 'Data Structures', 'Algorithms', 'System Design', 'Git',
      'REST API', 'GraphQL', 'Tailwind', 'HTML', 'CSS', 'C++', 'Golang', 'Flutter', 'React Native'
    ];

    const textUpper = jdText.toUpperCase();
    const extractedSkills = knownSkills.filter(s => textUpper.includes(s.toUpperCase()));

    // Try extracting CGPA
    const cgpaMatch = jdText.match(/cgpa\s*(?:of|>=|:>|:)?\s*([0-9]\.[0-9])/i) || jdText.match(/([0-9]\.[0-9])\s*cgpa/i);
    const minCgpa = cgpaMatch ? cgpaMatch[1] : target.minimumCgpa;

    // Try extracting Title
    const titleLines = jdText.split('\n').filter(l => l.trim().length > 3);
    const extractedTitle = titleLines[0] ? titleLines[0].slice(0, 50) : 'Target Role';

    setTarget(prev => ({
      ...prev,
      title: prev.title || extractedTitle,
      requiredSkills: Array.from(new Set([...(prev.requiredSkills ? prev.requiredSkills.split(',').map(s => s.trim()) : []), ...extractedSkills])).join(', '),
      minimumCgpa: minCgpa
    }));

    setParsingJd(false);
  };

  const analyze = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" /> Career Intelligence Engine
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Skill Match & Gap Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare your profile metrics with target job descriptions to identify missing skills and boost match scores
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Job Description Instant Extractor */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="text-sm font-bold tracking-wide">AI Instant Job Description (JD) Skill Extractor</h3>
          </div>
          <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold uppercase">Auto-Parser</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Paste job description text from LinkedIn, Naukri, or any company hiring portal below. The engine will automatically detect required tech stack & academic cutoffs for you!
        </p>
        <div className="space-y-3">
          <textarea
            rows={3}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste raw Job Description (JD) text here..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-xs text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={parseJdText}
              disabled={!jdText.trim() || parsingJd}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 text-white font-bold text-xs px-5 py-2.5 transition shadow-md shadow-purple-600/25 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{parsingJd ? 'Extracting Skills...' : 'Auto-Extract Skills & Fill Form'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Requirements Form */}
      <form onSubmit={analyze} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            Enter Target Job Requirements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Input the skills and criteria for your desired career role
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Target Role Title
            <input className={fieldClass} value={target.title} onChange={(e) => setTarget({ ...target, title: e.target.value })} placeholder="e.g. Full-Stack Software Engineer" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Required Skills (comma separated) <span className="text-rose-500">*</span>
            <input required className={fieldClass} value={target.requiredSkills} onChange={(e) => setTarget({ ...target, requiredSkills: e.target.value })} placeholder="Node.js, React, PostgreSQL, Docker" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Minimum CGPA Cutoff
            <input type="number" min="0" max="10" step="0.1" className={fieldClass} value={target.minimumCgpa} onChange={(e) => setTarget({ ...target, minimumCgpa: e.target.value })} placeholder="e.g. 7.5" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Maximum Allowed Backlogs
            <input type="number" min="0" step="1" className={fieldClass} value={target.maximumBacklogs} onChange={(e) => setTarget({ ...target, maximumBacklogs: e.target.value })} placeholder="e.g. 0" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Graduation Year
            <input type="number" min="2000" max="2100" className={fieldClass} value={target.graduationYear} onChange={(e) => setTarget({ ...target, graduationYear: e.target.value })} placeholder="e.g. 2026" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Eligible Department Codes
            <input className={fieldClass} value={target.requiredDepartments} onChange={(e) => setTarget({ ...target, requiredDepartments: e.target.value })} placeholder="CSE, ISE, AIML (optional)" />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            disabled={loading} 
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Analyzing Profile…' : 'Run Skill Match Analysis'}</span>
          </button>
        </div>
      </form>

      {/* Analysis Results */}
      {analysis && (
        <section className="space-y-6" aria-live="polite">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Target Role</span>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-display">{analysis.targetRole}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 p-6 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Current Match Score</span>
              <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400 font-display">{analysis.matchScoreFormatted}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-6 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Potential Match Score</span>
              <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-display">{analysis.potentialMatchFormatted}</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
              <h2 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Matching Strong Skills
              </h2>
              {analysis.strongSkills.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.strongSkills.map((skill) => (
                    <span key={skill} className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No required skills meet the target level yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
              <h2 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Identified Skill Gaps
              </h2>
              {analysis.skillGaps.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.skillGaps.map((skill) => (
                    <span key={skill} className="rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-semibold">
                      ! {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Your profile meets all required skills for this role.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Recommended Next Steps
              </h2>
              <Link to="/student/training" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                <span>Browse Training Programs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {analysis.recommendations.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {analysis.recommendations.map((item) => (
                  <div key={`${item.step}-${item.skill}`} className="flex flex-wrap items-center justify-between gap-2 py-3.5">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.skill} · {item.provider}</p>
                    </div>
                    <span className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No skill gaps were found for this target.</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              {analysis.summaryText}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
