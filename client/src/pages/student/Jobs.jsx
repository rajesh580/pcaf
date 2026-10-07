import React, { useEffect, useState } from 'react';
import { jobService } from '../../services/jobService';
import { studentService } from '../../services/studentService';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [student, setStudent] = useState(null);
  const [evalModal, setEvalModal] = useState(null);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    studentService.getProfile().then((res) => setStudent(res.student));
    loadJobs();
  }, [search]);

  const loadJobs = () => {
    jobService.getAllJobs({ search: search || undefined })
      .then((res) => setJobs(res.jobs || []));
  };

  const handleEvaluate = async (job) => {
    if (!student) return;
    try {
      const res = await jobService.evaluateStudent(job.id, student);
      setEvalModal(res.evaluation);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async (job) => {
    try {
      const res = await jobService.applyForJob(job.id, student);
      setMsg(res.message);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Job application failed.');
      setTimeout(() => setMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Full-Time Placement & Direct Hiring Jobs</h1>
          <p className="text-sm text-slate-500">Explore full-time opportunities with leading industry partners</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by role, company, or skill..."
          className="text-xs border border-slate-300 rounded-lg px-3 py-2 w-64 bg-white"
        />
      </div>

      {msg && <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-lg border border-emerald-200">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase">{job.companyName}</span>
                <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
              </div>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-200">
                {job.salaryPackage}
              </span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2">{job.description}</p>

            <div className="text-xs text-slate-500 space-y-1">
              <div><strong>Location:</strong> {job.location} ({job.workMode}) | <strong>Experience:</strong> {job.experience}</div>
              <div><strong>Eligibility:</strong> CGPA ≥ {job.minimumCgpa} | Allowed: {(job.departments || []).join(', ')}</div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(job.requiredSkills || []).map((s) => (
                <span key={s.name} className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] px-2 py-0.5 rounded">
                  {s.name} ({s.minLevel})
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => handleEvaluate(job)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Check My Compatibility
              </button>
              <button
                onClick={() => handleApply(job)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
              >
                Apply for Position
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Compatibility Modal */}
      {evalModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Job Placement Match Report</h3>
              <button onClick={() => setEvalModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-xs uppercase font-medium text-slate-500">Overall Match Score</span>
              <span className="text-xl font-bold text-indigo-600">{evalModal.matchScoreFormatted || `${evalModal.matchScore}%`}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-800 uppercase text-[11px]">Criteria Evaluation</h4>
              {Object.entries(evalModal.criteriaDetails || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-700 capitalize">{key}</span>
                  <span className={val.met ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>{val.status}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEvalModal(null)}
              className="w-full bg-slate-800 text-white text-xs font-medium py-2 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
