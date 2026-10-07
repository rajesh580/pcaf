import React, { useEffect, useState } from 'react';
import { skillMatchService } from '../../services/skillMatchService';
import { studentService } from '../../services/studentService';
import { internshipService } from '../../services/internshipService';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    studentService.getProfile().then((res) => {
      if (res.student) {
        skillMatchService.getRecommendedOpportunities(res.student)
          .then((rec) => setRecommendations(rec.recommendations || []))
          .finally(() => setLoading(false));
      }
    });
  }, []);

  const handleApply = async (opp) => {
    try {
      const res = await internshipService.applyForInternship({
        internshipId: opp.id,
        internshipTitle: opp.title,
        companyName: opp.companyName,
        matchScore: opp.matchScore || 85
      });
      setMsg(res.message);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to apply.');
      setTimeout(() => setMsg(''), 4000);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Generating personalized AI recommendations...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Personalized Opportunity Recommendations</h1>
        <p className="text-sm text-slate-500">Ranked by the AI Skill Matching Engine based on your verified skills and academic record</p>
      </div>

      {msg && <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-lg border border-emerald-200">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((item) => {
          const opp = item.opportunity;
          return (
            <div key={opp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase">{opp.companyName}</span>
                  <h3 className="text-lg font-bold text-slate-900">{opp.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-slate-400 block">Match Score</span>
                  <span className="text-lg font-bold text-emerald-600">{item.matchScore}%</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                <div><strong>Eligibility:</strong> {item.isEligible ? '✓ Fully Eligible' : '⚠ Academic Prerequisite Mismatch'}</div>
                <div><strong>Strong Skills:</strong> {(item.strongSkills || []).map((s) => s.name).join(', ') || 'Aligned'}</div>
                {item.skillGaps?.length > 0 && (
                  <div className="text-amber-700"><strong>Skill Gaps:</strong> {item.skillGaps.map((g) => g.name).join(', ')}</div>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-slate-500">{opp.duration || 'Full-time'} • {opp.stipend || opp.salary}</span>
                <button
                  onClick={() => handleApply(opp)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
                >
                  Apply with 1-Click
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
