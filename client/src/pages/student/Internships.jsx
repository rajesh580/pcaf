import React, { useEffect, useState } from 'react';
import { internshipService } from '../../services/internshipService';
import { studentService } from '../../services/studentService';

export default function Internships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [evalModal, setEvalModal] = useState(null);
  const [filterMode, setFilterMode] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    studentService.getProfile().then((res) => setStudent(res.student));
    loadInternships();
  }, [filterMode]);

  const loadInternships = () => {
    internshipService.getAllInternships({ mode: filterMode || undefined })
      .then((res) => setInternships(res.internships || []))
      .finally(() => setLoading(false));
  };

  const handleEvaluate = async (internship) => {
    if (!student) return;
    try {
      const res = await internshipService.evaluateStudent(internship.id, student);
      setEvalModal(res.evaluation);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async (internship) => {
    try {
      const res = await internshipService.applyForInternship({
        internshipId: internship.id,
        internshipTitle: internship.title,
        companyName: internship.companyName,
        matchScore: 90
      });
      setMsg(res.message);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Application failed.');
      setTimeout(() => setMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Internship Opportunities</h1>
          <p className="text-sm text-slate-500">Discover and apply for curated internships matching your skills</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All Modes</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {msg && <div className="bg-blue-50 text-blue-800 text-sm p-3.5 rounded-lg border border-blue-200">{msg}</div>}

      {/* Internship Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {internships.map((opp) => (
          <div key={opp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase">{opp.companyName}</span>
                <h3 className="text-lg font-bold text-slate-900">{opp.title}</h3>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                {opp.mode}
              </span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2">{opp.description}</p>

            <div className="text-xs text-slate-500 space-y-1">
              <div><strong>Stipend:</strong> {opp.stipend} | <strong>Duration:</strong> {opp.duration}</div>
              <div><strong>Eligibility:</strong> CGPA ≥ {opp.minimumCgpa || opp.minCgpa} | Batch: {opp.graduationYear}</div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(opp.requiredSkills || []).map((s) => (
                <span key={s.name} className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] px-2 py-0.5 rounded">
                  {s.name} ({s.minLevel || 'Basic'})
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => handleEvaluate(opp)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Check My Eligibility
              </button>
              <button
                onClick={() => handleApply(opp)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
              >
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Eligibility Modal */}
      {evalModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Eligibility & Skill Match Result</h3>
              <button onClick={() => setEvalModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-xs uppercase font-medium text-slate-500">Eligibility Verdict</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${evalModal.isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {evalModal.eligibilityText || (evalModal.isEligible ? 'YES' : 'NO')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-xs uppercase font-medium text-slate-500">Overall Match Score</span>
              <span className="text-lg font-bold text-blue-600">{evalModal.matchScoreFormatted || `${evalModal.matchScore}%`}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-800 uppercase text-[11px]">Skills Status</h4>
              {(evalModal.skillsBreakdown || []).map((s) => (
                <div key={s.skill} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-700">{s.skill}</span>
                  <span className={s.status === 'MATCHED' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {s.icon}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEvalModal(null)}
              className="w-full bg-slate-800 text-white text-xs font-medium py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
