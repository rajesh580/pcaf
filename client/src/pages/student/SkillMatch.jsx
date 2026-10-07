import React, { useState } from 'react';
import { skillMatchService } from '../../services/skillMatchService';

export default function SkillMatch() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDemoAnalysis = async () => {
    setLoading(true);
    // Runs Section 17 Full Stack Developer Evaluation
    const student = {
      name: 'Rahul Sharma',
      cgpa: 8.1,
      backlogs: 0,
      department: { code: 'CSE' },
      graduationYear: 2027,
      skills: [
        { name: 'JavaScript', level: 'INTERMEDIATE' },
        { name: 'React', level: 'INTERMEDIATE' },
        { name: 'HTML/CSS', level: 'INTERMEDIATE' },
        { name: 'Git', level: 'INTERMEDIATE' }
      ]
    };

    const targetJob = {
      title: 'Full Stack Developer',
      minCgpa: 7.0,
      maxBacklogs: 0,
      eligibleDeptCodes: ['CSE', 'ISE', 'AIML'],
      graduationYear: 2027,
      requiredSkills: [
        { name: 'JavaScript', minLevel: 'INTERMEDIATE' },
        { name: 'React', minLevel: 'INTERMEDIATE' },
        { name: 'HTML/CSS', minLevel: 'INTERMEDIATE' },
        { name: 'Git', minLevel: 'INTERMEDIATE' },
        { name: 'Node.js', minLevel: 'INTERMEDIATE' },
        { name: 'MongoDB', minLevel: 'INTERMEDIATE' },
        { name: 'REST API', minLevel: 'INTERMEDIATE' },
        { name: 'Docker', minLevel: 'INTERMEDIATE' }
      ]
    };

    try {
      const res = await skillMatchService.performSkillGapAnalysis(student, targetJob);
      setAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Skill Match & Gap Analysis Engine</h1>
          <p className="text-sm text-slate-500">Intelligent compatibility evaluation with targeted upskilling recommendations</p>
        </div>
        <button
          onClick={runDemoAnalysis}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition"
        >
          {loading ? 'Evaluating Vectors...' : 'Analyze Match: Full Stack Developer'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-5">
          {/* Header Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs uppercase font-medium text-slate-500">Target Role</span>
              <div className="text-lg font-bold text-slate-900 mt-1">{analysis.targetRole}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs uppercase font-medium text-slate-500">Current Match Score</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{analysis.matchScoreFormatted}</div>
            </div>
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
              <span className="text-xs uppercase font-medium text-emerald-800">Potential Match After Training</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{analysis.potentialMatchFormatted}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strong Skills */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center">
                ✓ Strong Skills Matched
              </h3>
              <ul className="space-y-2">
                {analysis.strongSkills.map((s) => (
                  <li key={s} className="flex items-center text-sm text-slate-700 font-medium">
                    <span className="text-emerald-500 mr-2 font-bold">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Skill Gaps */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center">
                ⚠ Skill Gaps Identified
              </h3>
              <ul className="space-y-2">
                {analysis.skillGaps.map((g) => (
                  <li key={g} className="flex items-center text-sm text-slate-700 font-medium">
                    <span className="text-amber-500 mr-2 font-bold">⚠</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Actionable Training Recommendations (Bridge the Gap)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.recommendations.map((r) => (
                <div key={r.step} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-blue-600">{r.step}. {r.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.provider}</div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                    {r.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
