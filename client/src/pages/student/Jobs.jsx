import React, { useEffect, useState } from 'react';
import { jobService } from '../../services/jobService';
import { studentService } from '../../services/studentService';
import api from '../../services/api';
import ResumeChoice from '../../components/ResumeChoice';
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  DollarSign,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Plus,
  Sparkles,
  X,
  ArrowRight
} from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [student, setStudent] = useState(null);
  const [evalModal, setEvalModal] = useState(null);

  // Application Confirmation Modal State
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeType, setResumeType] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [addingSkill, setAddingSkill] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  const [modalError, setModalError] = useState('');

  const loadStudentProfile = async () => {
    const res = await studentService.getProfile();
    setStudent(res.student);
    return res.student;
  };

  useEffect(() => {
    loadStudentProfile();
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

  const handleOpenApplyModal = (job) => {
    setApplyModalJob(job);
    setModalMsg('');
    setModalError('');
    setResumeFile(null);
    setResumeType('');
  };

  const handleUploadNewResumeInModal = async () => {
    if (!resumeFile) return;
    setUploadingResume(true);
    setModalMsg('');
    setModalError('');
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      await api.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setModalMsg('New resume uploaded and linked successfully!');
      await loadStudentProfile();
      setResumeFile(null);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Resume upload failed.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleQuickAddSuggestedSkill = async (skillName) => {
    setAddingSkill(skillName);
    setModalMsg('');
    setModalError('');
    try {
      await studentService.addOrUpdateSkill({
        name: skillName,
        level: 'INTERMEDIATE'
      });
      setModalMsg(`Skill '${skillName}' added to your profile!`);
      loadStudentProfile();
    } catch (err) {
      setModalError(err.response?.data?.error || `Failed to add skill '${skillName}'`);
    } finally {
      setAddingSkill('');
    }
  };

  const handleConfirmApplicationSubmit = async () => {
    if (!applyModalJob || !student) return;
    if (!['UPLOADED', 'GENERATED'].includes(resumeType)) {
      setModalError('Choose which resume you want to send with this application.');
      return;
    }
    if (resumeType === 'UPLOADED' && !student.resumeUrl) {
      setModalError('Upload a resume first, or select your generated profile resume.');
      return;
    }

    setSubmittingApp(true);
    setModalMsg('');
    setModalError('');
    try {
      await jobService.applyForJob(applyModalJob.id, student, resumeType);
      setMsg(`Application for "${applyModalJob.title}" at ${applyModalJob.companyName} submitted successfully!`);
      setApplyModalJob(null);
      setTimeout(() => setMsg(''), 5000);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Job application failed.');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Full-Time Placement Drives
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore active full-time job openings with top corporate partners
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, or skill..."
            className="pl-9 pr-4 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {jobs.map((job) => (
          <div 
            key={job.id} 
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5" />
                    {job.companyName}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mt-0.5">
                    {job.title}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <DollarSign className="w-3.5 h-3.5" />
                  {job.salaryPackage || 'Industry Standard'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {job.description || 'Full-time software engineering and technical position.'}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{job.location || 'Bangalore'} ({job.workMode || 'HYBRID'})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>CGPA Cutoff: ≥ {job.minimumCgpa || 6.0}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(job.requiredSkills || []).map((s) => (
                  <span 
                    key={s.name} 
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium px-2.5 py-0.5 rounded-md"
                  >
                    {s.name} ({s.minLevel})
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => handleEvaluate(job)}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Check Match Rating
              </button>
              <button
                onClick={() => handleOpenApplyModal(job)}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 1. Compatibility Modal */}
      {evalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Job Placement Match Report
              </h3>
              <button onClick={() => setEvalModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-700 dark:text-blue-300">Overall Match Rating</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-display">
                {evalModal.matchScoreFormatted || `${evalModal.matchScore}%`}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px]">Criteria Breakdown</h4>
              {Object.entries(evalModal.criteriaDetails || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 capitalize">{key}</span>
                  <span className={val.met ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 font-bold'}>
                    {val.status}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEvalModal(null)}
              className="w-full bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 2. Interactive Application Confirmation Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded-md border border-blue-800">
                  Job Application Confirmation
                </span>
                <h3 className="text-lg font-bold text-white font-display mt-1">{applyModalJob.title}</h3>
                <p className="text-xs text-slate-300">{applyModalJob.companyName} • {applyModalJob.location || 'Bangalore'}</p>
              </div>
              <button
                onClick={() => setApplyModalJob(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {modalMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{modalMsg}</span>
                </div>
              )}
              {modalError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Step 1: Resume Verification */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Step 1: Confirm Resume Document to Submit
                </h4>

                {student?.resumeUrl ? (
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Linked Resume Document</p>
                        <p className="text-[11px] text-emerald-600 font-medium">Ready for recruiter review</p>
                      </div>
                    </div>
                    <a
                      href="/student/resume"
                      className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-3 py-1 rounded-lg font-semibold transition"
                    >
                      View Resume ↗
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
                    No uploaded resume is linked. You can upload one here or select your generated profile resume below.
                  </div>
                )}

                {/* Upload New Resume */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Upload & Link New Resume (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 flex-1"
                    />
                    <button
                      type="button"
                      disabled={!resumeFile || uploadingResume}
                      onClick={handleUploadNewResumeInModal}
                      className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition shrink-0 flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingResume ? 'Uploading...' : 'Upload'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <ResumeChoice student={student} value={resumeType} onChange={setResumeType} />

              {/* Step 2: Skill Compatibility */}
              {(() => {
                const reqSkills = applyModalJob.requiredSkills || [];
                const studentSkillNames = (student?.skills || []).map(s => s.name.toLowerCase());
                const matchingSkills = reqSkills.filter(s => studentSkillNames.includes(s.name.toLowerCase()));
                const missingSkills = reqSkills.filter(s => !studentSkillNames.includes(s.name.toLowerCase()));

                return (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Step 2: Skill Compatibility & Suggestions
                    </h4>

                    {/* Matching Skills */}
                    <div>
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-1.5">
                        Matching Skills in Profile ({matchingSkills.length}/{reqSkills.length})
                      </p>
                      {matchingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {matchingSkills.map((s) => (
                            <span 
                              key={s.name} 
                              className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs px-2.5 py-1 rounded-md font-semibold"
                            >
                              ✓ {s.name} ({s.minLevel})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No matching skills found on your profile.</p>
                      )}
                    </div>

                    {/* Missing Skills */}
                    {missingSkills.length > 0 && (
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase mb-1.5">
                          Suggested Skills to Add ({missingSkills.length})
                        </p>
                        <div className="space-y-1.5">
                          {missingSkills.map((s) => (
                            <div key={s.name} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                                <span className="text-[10px] text-slate-500 ml-2">Req: {s.minLevel}</span>
                              </div>
                              <button
                                type="button"
                                disabled={addingSkill === s.name}
                                onClick={() => handleQuickAddSuggestedSkill(s.name)}
                                className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>{addingSkill === s.name ? 'Adding...' : 'Add'}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setApplyModalJob(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingApp || !['UPLOADED', 'GENERATED'].includes(resumeType) || (resumeType === 'UPLOADED' && !student?.resumeUrl)}
                onClick={handleConfirmApplicationSubmit}
                className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingApp ? 'Submitting...' : 'Confirm & Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
