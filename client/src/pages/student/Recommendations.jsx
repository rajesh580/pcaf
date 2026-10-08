import React, { useEffect, useState } from 'react';
import { skillMatchService } from '../../services/skillMatchService';
import { studentService } from '../../services/studentService';
import { internshipService } from '../../services/internshipService';
import { jobService } from '../../services/jobService';
import ResumeChoice from '../../components/ResumeChoice';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [student, setStudent] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [resumeType, setResumeType] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    studentService.getProfile().then((res) => {
      if (res.student) {
        setStudent(res.student);
        skillMatchService.getRecommendedOpportunities(res.student)
          .then((rec) => setRecommendations(rec.recommendations || []))
          .finally(() => setLoading(false));
      }
    });
  }, []);

  const openApplication = (opp) => {
    setSelectedOpportunity(opp);
    setResumeType('');
    setApplyError('');
  };

  const handleApply = async () => {
    if (!selectedOpportunity) return;
    if (!['UPLOADED', 'GENERATED'].includes(resumeType)) {
      setApplyError('Choose which resume to send with this application.');
      return;
    }
    if (resumeType === 'UPLOADED' && !student?.resumeUrl) {
      setApplyError('Upload a resume first, or choose your generated profile resume.');
      return;
    }
    setApplying(true);
    setApplyError('');
    try {
      const opp = selectedOpportunity;
      const res = opp.type === 'JOB'
        ? await jobService.applyForJob(opp.id, student, resumeType)
        : await internshipService.applyForInternship({ internshipId: opp.id, resumeType });
      setMsg(res.message);
      setSelectedOpportunity(null);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setApplyError(err.response?.data?.error || 'Failed to submit your application.');
    } finally {
      setApplying(false);
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
                <span className="text-xs text-slate-500">{opp.type === 'INTERNSHIP' ? (opp.duration || 'Internship') : (opp.employmentType || 'Full-time')} • {opp.stipend || opp.salaryPackage || 'Compensation not listed'}</span>
                <button
                  onClick={() => openApplication(opp)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
                >
                  Apply
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="recommendation-apply-title" className="my-6 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 bg-slate-900 px-6 py-5 text-white">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Application review</p><h2 id="recommendation-apply-title" className="mt-1 text-lg font-bold text-white">{selectedOpportunity.title}</h2><p className="mt-1 text-xs text-slate-300">{selectedOpportunity.companyName}</p></div>
              <button type="button" onClick={() => setSelectedOpportunity(null)} className="rounded-lg px-2 py-1 text-xl text-slate-300 hover:bg-slate-800" aria-label="Close application">×</button>
            </header>
            <div className="space-y-4 p-5 sm:p-6">
              {applyError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{applyError}</p>}
              <ResumeChoice student={student} value={resumeType} onChange={setResumeType} />
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setSelectedOpportunity(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="button" disabled={applying || !resumeType || (resumeType === 'UPLOADED' && !student?.resumeUrl)} onClick={handleApply} className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{applying ? 'Submitting…' : 'Submit application'}</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
