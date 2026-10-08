import React, { useEffect, useState } from 'react';
import { internshipService } from '../../services/internshipService';
import { studentService } from '../../services/studentService';
import api from '../../services/api';
import ResumeChoice from '../../components/ResumeChoice';
import {
  GraduationCap,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Plus,
  X,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function Internships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [evalModal, setEvalModal] = useState(null);

  // Application Confirmation Modal State
  const [applyModalOpp, setApplyModalOpp] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeType, setResumeType] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [addingSkill, setAddingSkill] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const [filterMode, setFilterMode] = useState('');
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

  const handleOpenApplyModal = (opp) => {
    setApplyModalOpp(opp);
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
    if (!applyModalOpp || !student) return;
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
      await internshipService.applyForInternship({
        internshipId: applyModalOpp.id,
        internshipTitle: applyModalOpp.title,
        companyName: applyModalOpp.companyName,
        matchScore: 90,
        resumeType,
      });
      setMsg(`Application for "${applyModalOpp.title}" at ${applyModalOpp.companyName} submitted successfully!`);
      setApplyModalOpp(null);
      setTimeout(() => setMsg(''), 5000);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Internship application failed.');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            Internship Opportunities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Discover and apply for curated practical internships matching your skills
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="">All Work Modes</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONLINE">Online (Remote)</option>
            <option value="OFFLINE">Offline (On-Site)</option>
          </select>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Internship Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {internships.map((opp) => (
          <div 
            key={opp.id} 
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5" />
                    {opp.companyName}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mt-0.5">
                    {opp.title}
                  </h3>
                </div>
                <span className="text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg font-semibold border border-purple-200 dark:border-purple-800">
                  {opp.mode}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {opp.description || 'Hands-on practical internship opportunity.'}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Stipend: {opp.stipend || 'Unpaid'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Duration: {opp.duration || '3 Months'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{opp.location || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>CGPA: ≥ {opp.minimumCgpa || opp.minCgpa || 6.0}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(opp.requiredSkills || []).map((s) => (
                  <span 
                    key={s.name} 
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium px-2.5 py-0.5 rounded-md"
                  >
                    {s.name} ({s.minLevel || 'Basic'})
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => handleEvaluate(opp)}
                className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Check Eligibility
              </button>
              <button
                onClick={() => handleOpenApplyModal(opp)}
                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 1. Eligibility Modal */}
      {evalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Eligibility Result
              </h3>
              <button onClick={() => setEvalModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-950/40 p-4 rounded-xl border border-purple-100 dark:border-purple-900">
              <span className="text-xs uppercase font-bold tracking-wider text-purple-700 dark:text-purple-300">Eligibility Verdict</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-lg ${evalModal.isEligible ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'}`}>
                {evalModal.eligibilityText || (evalModal.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs uppercase font-medium text-slate-500">Overall Match Score</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400 font-display">
                {evalModal.matchScoreFormatted || `${evalModal.matchScore}%`}
              </span>
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

      {/* 2. Application Confirmation Modal */}
      {applyModalOpp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950 px-2.5 py-0.5 rounded-md border border-purple-800">
                  Internship Application Confirmation
                </span>
                <h3 className="text-lg font-bold text-white font-display mt-1">{applyModalOpp.title}</h3>
                <p className="text-xs text-slate-300">{applyModalOpp.companyName} • Stipend: {applyModalOpp.stipend || 'Unpaid'}</p>
              </div>
              <button
                onClick={() => setApplyModalOpp(null)}
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
                  <FileText className="w-4 h-4 text-purple-600" />
                  Step 1: Confirm Resume Document to Submit
                </h4>

                {student?.resumeUrl ? (
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Linked Resume Document</p>
                        <p className="text-[11px] text-emerald-600 font-medium">Ready for recruiter review</p>
                      </div>
                    </div>
                    <a
                      href="/student/resume"
                      className="text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 px-3 py-1 rounded-lg font-semibold transition"
                    >
                      View Resume ↗
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
                    No uploaded resume is linked. You can upload one here or select your generated profile resume below.
                  </div>
                )}

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Upload & Link New Resume (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 flex-1"
                    />
                    <button
                      type="button"
                      disabled={!resumeFile || uploadingResume}
                      onClick={handleUploadNewResumeInModal}
                      className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition shrink-0 flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingResume ? 'Uploading...' : 'Upload'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <ResumeChoice student={student} value={resumeType} onChange={setResumeType} />

              {/* Step 2: Skill Match */}
              {(() => {
                const reqSkills = applyModalOpp.requiredSkills || [];
                const studentSkillNames = (student?.skills || []).map(s => s.name.toLowerCase());
                const matchingSkills = reqSkills.filter(s => studentSkillNames.includes(s.name.toLowerCase()));
                const missingSkills = reqSkills.filter(s => !studentSkillNames.includes(s.name.toLowerCase()));

                return (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Step 2: Skill Compatibility & Suggestions
                    </h4>

                    <div>
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-1.5">
                        Matching Skills in Profile ({matchingSkills.length}/{reqSkills.length})
                      </p>
                      {matchingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {matchingSkills.map((s) => (
                            <span key={s.name} className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs px-2.5 py-1 rounded-md font-semibold">
                              ✓ {s.name} ({s.minLevel || 'Basic'})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No matching skills found on your profile.</p>
                      )}
                    </div>

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
                                <span className="text-[10px] text-slate-500 ml-2">Req: {s.minLevel || 'Basic'}</span>
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

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setApplyModalOpp(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingApp || !['UPLOADED', 'GENERATED'].includes(resumeType) || (resumeType === 'UPLOADED' && !student?.resumeUrl)}
                onClick={handleConfirmApplicationSubmit}
                className="px-5 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
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
